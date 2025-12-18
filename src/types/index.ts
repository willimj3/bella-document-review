export type ColumnType = 'text' | 'date' | 'currency' | 'number' | 'boolean' | 'select';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface DocumentPage {
  number: number;
  text: string;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  pages: DocumentPage[];
  uploadedAt: string;
  fileSize: number;
  pageCount: number;
  fileType: 'pdf' | 'docx' | 'txt';
}

export interface Column {
  id: string;
  name: string;
  prompt: string;
  type: ColumnType;
  options?: string[];
  order: number;
}

export interface ExtractionResult {
  value: string;
  confidence: ConfidenceLevel;
  reasoning: string;
  quote: string;
  pageNumber: number | null;
  charStart?: number;
  charEnd?: number;
  isManuallyEdited: boolean;
  isReviewed: boolean;
  editedAt?: string;
  reviewedAt?: string;
  originalValue?: string;
}

export type ExtractionResults = {
  [documentId: string]: {
    [columnId: string]: ExtractionResult;
  };
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  columns: Column[];
  extractionResults: ExtractionResults;
  chatHistory: ChatMessage[];
}

export type CellState = 'empty' | 'loading' | 'populated' | 'error' | 'edited';

export interface Template {
  id: string;
  name: string;
  description: string;
  targetDocuments: string;
  columns: Omit<Column, 'id' | 'order'>[];
}
