# Bella - AI Document Review Tool

AI-powered document extraction and review tool that helps you analyze contracts, agreements, and other documents at scale.

## Features

- **Multi-Document Upload** - Drag & drop PDFs, DOCX, and TXT files
- **Smart Extraction** - AI extracts key information using custom prompts
- **Template System** - Pre-built templates for NDAs, Employment Agreements, Leases, etc.
- **Quick Analyze** - Universal extraction for any document type
- **Data Analyst Chat** - Ask questions about your documents
- **Review Workflow** - Cell-level review with manual override capability
- **Confidence Scoring** - AI provides confidence levels and source quotes
- **CSV Export** - Export results for further analysis

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4
- **State**: Zustand
- **Tables**: TanStack Table (React Table v8)
- **Backend**: Express.js
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/willimj3/bella-document-review.git
   cd bella-document-review
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. Run both frontend and backend:
   ```bash
   npm run dev:all
   ```

5. Open http://localhost:5173

## Deployment

### Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variable:
   - `VITE_API_URL`: Your Railway backend URL (e.g., `https://your-app.railway.app`)
4. Deploy

### Backend (Railway)

1. Go to [railway.app](https://railway.app) and create new project from GitHub
2. Select this repository
3. Configure settings:
   - Start Command: `node server.js`
   - Port: `3001`
4. Add environment variables:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `PORT`: `3001`
5. Deploy

### Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | Backend (Railway) | Your Anthropic API key |
| `VITE_API_URL` | Frontend (Vercel) | Backend API URL |
| `PORT` | Backend (Railway) | Server port (default: 3001) |

## Project Structure

```
├── src/
│   ├── components/      # React components
│   ├── store/           # Zustand store
│   ├── utils/           # Extraction, export, parsing utilities
│   └── types/           # TypeScript types
├── server.js            # Express backend with Claude API
└── public/              # Static assets
```

## License

MIT
