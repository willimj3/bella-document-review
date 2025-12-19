import type { ExtractionResult, ColumnType } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function extractData(
  documentText: string,
  columnPrompt: string,
  columnType: ColumnType,
  options?: string[],
  maxRetries: number = 2
): Promise<ExtractionResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay between retries
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const response = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          columnPrompt,
          columnType,
          options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Extraction failed');
      }

      const data = await response.json();

      return {
        value: data.value || 'Not Found',
        confidence: data.confidence || 'Low',
        reasoning: data.reasoning || '',
        quote: data.quote || '',
        pageNumber: data.pageNumber || null,
        isManuallyEdited: false,
        isReviewed: false
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Extraction attempt ${attempt + 1} failed:`, lastError.message);

      // Don't retry on certain errors
      if (lastError.message.includes('Missing required fields')) {
        break;
      }
    }
  }

  throw lastError || new Error('Extraction failed after retries');
}

export async function runBulkExtraction(
  documents: { id: string; content: string }[],
  columns: { id: string; prompt: string; type: ColumnType; options?: string[] }[],
  existingResults: Record<string, Record<string, ExtractionResult>>,
  onProgress: (current: number, total: number) => void,
  onResult: (documentId: string, columnId: string, result: ExtractionResult) => void
): Promise<void> {
  // Build list of cells that need extraction (skip those that already have results)
  const cellsToExtract: { documentId: string; columnId: string; document: { id: string; content: string }; column: { id: string; prompt: string; type: ColumnType; options?: string[] } }[] = [];

  for (const doc of documents) {
    for (const col of columns) {
      const existingResult = existingResults[doc.id]?.[col.id];
      if (!existingResult || existingResult.value === '__loading__' || existingResult.value === '__error__') {
        cellsToExtract.push({ documentId: doc.id, columnId: col.id, document: doc, column: col });
      }
    }
  }

  const total = cellsToExtract.length;
  let current = 0;

  // Process in parallel with concurrency limit (reduced to avoid rate limits)
  const concurrencyLimit = 2;
  const queue = [...cellsToExtract];

  const processNext = async (): Promise<void> => {
    while (queue.length > 0) {
      const cell = queue.shift();
      if (!cell) break;

      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Mark as loading
        onResult(cell.documentId, cell.columnId, {
          value: '__loading__',
          confidence: 'Low',
          reasoning: '',
          quote: '',
          pageNumber: null,
          isManuallyEdited: false,
          isReviewed: false
        });

        const result = await extractData(
          cell.document.content,
          cell.column.prompt,
          cell.column.type,
          cell.column.options
        );

        onResult(cell.documentId, cell.columnId, result);
      } catch (error) {
        console.error(`Error extracting ${cell.documentId}/${cell.columnId}:`, error);
        onResult(cell.documentId, cell.columnId, {
          value: '__error__',
          confidence: 'Low',
          reasoning: String(error),
          quote: '',
          pageNumber: null,
          isManuallyEdited: false,
          isReviewed: false
        });
      }

      current++;
      onProgress(current, total);
    }
  };

  // Start concurrent workers
  const workers = Array(concurrencyLimit).fill(null).map(() => processNext());
  await Promise.all(workers);
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    return data.hasApiKey === true;
  } catch {
    return false;
  }
}
