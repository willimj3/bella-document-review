import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Document, Column, ExtractionResult, ExtractionResults, ChatMessage, ColumnType } from '../types';

interface AppState {
  // Project data
  projectName: string;
  documents: Document[];
  columns: Column[];
  extractionResults: ExtractionResults;
  chatHistory: ChatMessage[];

  // UI state
  selectedCell: { documentId: string; columnId: string } | null;
  selectedDocuments: string[];
  isExtracting: boolean;
  extractionProgress: { current: number; total: number };
  isChatOpen: boolean;
  isTemplateModalOpen: boolean;

  // API key
  apiKey: string;

  // Actions
  setProjectName: (name: string) => void;
  addDocuments: (docs: Document[]) => void;
  removeDocument: (id: string) => void;
  clearAllDocuments: () => void;

  addColumn: (name: string, prompt: string, type: ColumnType, options?: string[]) => void;
  updateColumn: (id: string, updates: Partial<Omit<Column, 'id'>>) => void;
  removeColumn: (id: string) => void;
  reorderColumns: (columns: Column[]) => void;

  setExtractionResult: (documentId: string, columnId: string, result: ExtractionResult) => void;
  updateExtractionResult: (documentId: string, columnId: string, updates: Partial<ExtractionResult>) => void;

  setSelectedCell: (cell: { documentId: string; columnId: string } | null) => void;
  toggleDocumentSelection: (docId: string) => void;
  selectAllDocuments: () => void;
  clearDocumentSelection: () => void;
  setIsExtracting: (value: boolean) => void;
  setExtractionProgress: (progress: { current: number; total: number }) => void;

  toggleChat: () => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  setTemplateModalOpen: (open: boolean) => void;
  applyTemplate: (columns: Omit<Column, 'id' | 'order'>[]) => void;

  setApiKey: (key: string) => void;

  // Clear all data
  clearProject: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  projectName: 'Untitled Project',
  documents: [],
  columns: [],
  extractionResults: {},
  chatHistory: [],

  selectedCell: null,
  selectedDocuments: [],
  isExtracting: false,
  extractionProgress: { current: 0, total: 0 },
  isChatOpen: false,
  isTemplateModalOpen: false,

  apiKey: '',

  // Actions
  setProjectName: (name) => set({ projectName: name }),

  addDocuments: (docs) => set((state) => ({
    documents: [...state.documents, ...docs],
    extractionResults: {
      ...state.extractionResults,
      ...Object.fromEntries(docs.map(doc => [doc.id, {}]))
    }
  })),

  removeDocument: (id) => set((state) => {
    const newResults = { ...state.extractionResults };
    delete newResults[id];
    return {
      documents: state.documents.filter(d => d.id !== id),
      extractionResults: newResults,
      selectedCell: state.selectedCell?.documentId === id ? null : state.selectedCell
    };
  }),

  clearAllDocuments: () => set({
    documents: [],
    extractionResults: {},
    selectedCell: null
  }),

  addColumn: (name, prompt, type, options) => set((state) => {
    const newColumn: Column = {
      id: uuidv4(),
      name,
      prompt,
      type,
      options,
      order: state.columns.length
    };
    return { columns: [...state.columns, newColumn] };
  }),

  updateColumn: (id, updates) => set((state) => ({
    columns: state.columns.map(col =>
      col.id === id ? { ...col, ...updates } : col
    )
  })),

  removeColumn: (id) => set((state) => {
    const newResults = { ...state.extractionResults };
    Object.keys(newResults).forEach(docId => {
      if (newResults[docId][id]) {
        const docResults = { ...newResults[docId] };
        delete docResults[id];
        newResults[docId] = docResults;
      }
    });
    return {
      columns: state.columns.filter(c => c.id !== id).map((col, idx) => ({ ...col, order: idx })),
      extractionResults: newResults,
      selectedCell: state.selectedCell?.columnId === id ? null : state.selectedCell
    };
  }),

  reorderColumns: (columns) => set({ columns }),

  setExtractionResult: (documentId, columnId, result) => set((state) => ({
    extractionResults: {
      ...state.extractionResults,
      [documentId]: {
        ...state.extractionResults[documentId],
        [columnId]: result
      }
    }
  })),

  updateExtractionResult: (documentId, columnId, updates) => set((state) => {
    const existing = state.extractionResults[documentId]?.[columnId];
    if (!existing) return state;
    return {
      extractionResults: {
        ...state.extractionResults,
        [documentId]: {
          ...state.extractionResults[documentId],
          [columnId]: { ...existing, ...updates }
        }
      }
    };
  }),

  setSelectedCell: (cell) => set({ selectedCell: cell }),
  toggleDocumentSelection: (docId) => set((state) => ({
    selectedDocuments: state.selectedDocuments.includes(docId)
      ? state.selectedDocuments.filter(id => id !== docId)
      : [...state.selectedDocuments, docId]
  })),
  selectAllDocuments: () => set((state) => ({
    selectedDocuments: state.documents.map(d => d.id)
  })),
  clearDocumentSelection: () => set({ selectedDocuments: [] }),
  setIsExtracting: (value) => set({ isExtracting: value }),
  setExtractionProgress: (progress) => set({ extractionProgress: progress }),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  addChatMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    }]
  })),

  clearChat: () => set({ chatHistory: [] }),

  setTemplateModalOpen: (open) => set({ isTemplateModalOpen: open }),

  applyTemplate: (templateColumns) => set((state) => {
    const newColumns: Column[] = templateColumns.map((col, idx) => ({
      ...col,
      id: uuidv4(),
      order: state.columns.length + idx
    }));
    return { columns: [...state.columns, ...newColumns] };
  }),

  setApiKey: (key) => set({ apiKey: key }),

  clearProject: () => set({
    documents: [],
    columns: [],
    extractionResults: {},
    chatHistory: [],
    selectedCell: null,
    selectedDocuments: [],
    isExtracting: false,
    extractionProgress: { current: 0, total: 0 }
  })
}));
