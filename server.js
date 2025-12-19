import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Anthropic client with API key from environment
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Root health check (for Railway)
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'bella-api' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

// Extraction endpoint
app.post('/api/extract', async (req, res) => {
  try {
    const { documentText, columnPrompt, columnType, options } = req.body;

    if (!documentText || !columnPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const EXTRACTION_SYSTEM_PROMPT = `You are a legal document extraction engine. You will receive a document and a specific extraction query.

ALWAYS respond in this exact JSON format:
{
  "value": "The extracted answer (be concise)",
  "confidence": "High" | "Medium" | "Low",
  "reasoning": "Brief explanation of how you found this answer",
  "quote": "Exact verbatim text from the document supporting your answer",
  "page_number": <integer or null if not determinable>
}

Rules:
- If the information is not found, set value to "Not Found" and confidence to "Low"
- Quote must be VERBATIM text from the document
- Keep reasoning to 1-2 sentences
- For boolean questions, value must be "Yes", "No", or "Not Found"
- For currency, include the currency symbol and full amount
- For dates, use format "Month DD, YYYY"
- Do not include markdown formatting in the JSON response
- The response must be valid JSON only, no additional text`;

    let typeInstructions = '';
    switch (columnType) {
      case 'boolean':
        typeInstructions = 'The answer should be "Yes", "No", or "Not Found".';
        break;
      case 'date':
        typeInstructions = 'Format dates as "Month DD, YYYY" (e.g., "January 15, 2024").';
        break;
      case 'currency':
        typeInstructions = 'Include currency symbol and full amount (e.g., "$45,000.00").';
        break;
      case 'number':
        typeInstructions = 'Include units if applicable (e.g., "90 days", "100 units").';
        break;
      case 'select':
        if (options && options.length > 0) {
          typeInstructions = `The answer should be one of these options: ${options.join(', ')}. If none match exactly, choose the closest match or "Not Found".`;
        }
        break;
      default:
        typeInstructions = 'Provide a concise text answer.';
    }

    // Truncate document if too long
    const maxDocLength = 150000;
    const truncatedDoc = documentText.length > maxDocLength
      ? documentText.slice(0, maxDocLength) + '\n\n[Document truncated...]'
      : documentText;

    // Retry with exponential backoff for rate limits
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        response = await anthropic.messages.create({
          model: 'claude-opus-4-20250514',
          max_tokens: 1024,
          system: EXTRACTION_SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `Document:\n${truncatedDoc}\n\nExtraction Query: ${columnPrompt}\nExpected Type: ${columnType}\n${typeInstructions}`
          }]
        });
        break; // Success, exit retry loop
      } catch (apiError) {
        if (apiError.status === 429 && retries < maxRetries) {
          retries++;
          const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
          console.log(`Rate limited, waiting ${waitTime/1000}s before retry ${retries}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw apiError;
        }
      }
    }

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      value: parsed.value || 'Not Found',
      confidence: parsed.confidence || 'Low',
      reasoning: parsed.reasoning || '',
      quote: parsed.quote || '',
      pageNumber: parsed.page_number || null,
    });
  } catch (error) {
    console.error('Extraction error:', error);

    // Check for rate limiting
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limited by Anthropic API. Please wait a moment and try again.',
        retryAfter: error.headers?.['retry-after'] || 60
      });
    }

    // Check for auth errors
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.status(500).json({ error: error.message || 'Extraction failed' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const CHAT_SYSTEM_PROMPT = `You are a legal analyst assistant with access to a structured extraction table from document review.

When answering questions:
1. Reference specific documents by name
2. Cite the specific extracted values you're using
3. For aggregations, show your calculation
4. Flag any low-confidence extractions that affect your answer
5. If asked about something not in the data, say so clearly
6. Be concise but thorough
7. Use bullet points for clarity when appropriate`;

    const messages = [
      ...(history || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: `Data Context:\n${context}\n\nUser Question: ${message}`
      }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2048,
      system: CHAT_SYSTEM_PROMPT,
      messages
    });

    const content = response.content[0];
    if (content.type === 'text') {
      res.json({ response: content.text });
    } else {
      throw new Error('Unexpected response type');
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Key configured: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No - set ANTHROPIC_API_KEY in .env'}`);
});
