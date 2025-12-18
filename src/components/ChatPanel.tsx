import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare, Trash2, FileText, ChevronDown, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../store/useStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Citation {
  documentName: string;
  documentId: string;
  excerpt?: string;
}

function parseCitations(content: string, documents: { id: string; name: string }[]): { text: string; citations: Citation[] } {
  // Look for document name mentions in the response
  const citations: Citation[] = [];
  let processedText = content;

  documents.forEach(doc => {
    const regex = new RegExp(`\\b${doc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(content)) {
      if (!citations.find(c => c.documentId === doc.id)) {
        citations.push({
          documentName: doc.name,
          documentId: doc.id
        });
      }
    }
  });

  return { text: processedText, citations };
}

export function ChatPanel() {
  const {
    isChatOpen,
    toggleChat,
    chatHistory,
    addChatMessage,
    clearChat,
    documents,
    columns,
    extractionResults,
    setSelectedCell,
    selectedDocuments
  } = useStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!isChatOpen) return null;

  const buildDataContext = () => {
    // Only include selected documents, or all if none selected
    const docsToInclude = selectedDocuments.length > 0
      ? documents.filter(d => selectedDocuments.includes(d.id))
      : documents;

    const documentNames = docsToInclude.map(d => d.name);
    const columnInfo = columns.map(c => `${c.name}: ${c.prompt}`);

    const resultsSummary: Record<string, Record<string, { value: string; confidence: string }>> = {};
    docsToInclude.forEach(doc => {
      resultsSummary[doc.name] = {};
      columns.forEach(col => {
        const result = extractionResults[doc.id]?.[col.id];
        if (result && result.value !== '__loading__' && result.value !== '__error__') {
          resultsSummary[doc.name][col.name] = {
            value: result.value,
            confidence: result.confidence
          };
        }
      });
    });

    const selectionNote = selectedDocuments.length > 0
      ? `\n\nNote: Only analyzing the ${docsToInclude.length} selected document(s). Do not reference any other documents.`
      : '';

    return `Documents: ${documentNames.join(', ')}

Columns and their extraction prompts:
${columnInfo.join('\n')}

Extraction Results:
${JSON.stringify(resultsSummary, null, 2)}${selectionNote}`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    addChatMessage({ role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const context = buildDataContext();

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
          history: chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Chat failed');
      }

      const data = await response.json();
      addChatMessage({ role: 'assistant', content: data.response });
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMessageExpanded = (msgId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
      } else {
        newSet.add(msgId);
      }
      return newSet;
    });
  };

  const handleCitationClick = (docId: string) => {
    // Navigate to the first column of the document
    if (columns.length > 0) {
      setSelectedCell({ documentId: docId, columnId: columns[0].id });
    }
    toggleChat();
  };

  const suggestedQuestions = [
    "What are the three most valuable contracts?",
    "Which documents have the longest terms?",
    "Summarize the key financial terms across all documents",
    "Are there any unusual clauses I should review?"
  ];

  return (
    <div className="w-[420px] border-l border-stone-200 bg-gradient-to-b from-stone-50 to-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Data Analyst</h3>
            <p className="text-xs text-gray-400">Ask questions about your data</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            disabled={chatHistory.length === 0}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={toggleChat}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl mb-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Analyze your extracted data</p>
            <p className="text-xs text-gray-400 mb-6">
              Ask questions to find insights across all your documents
            </p>

            {/* Suggested questions */}
            <div className="space-y-2 text-left">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">Try asking</p>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q)}
                  className="w-full text-left text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 p-2.5 rounded-lg border border-gray-100 hover:border-purple-200 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const { text, citations } = msg.role === 'assistant'
              ? parseCitations(msg.content, documents)
              : { text: msg.content, citations: [] };
            const isExpanded = expandedMessages.has(msg.id);
            const hasLongContent = msg.content.length > 400;

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5'
                      : 'bg-white border border-stone-200 shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="p-4">
                      <div className={`prose prose-sm prose-stone max-w-none ${!isExpanded && hasLongContent ? 'line-clamp-6' : ''}`}>
                        <ReactMarkdown
                          components={{
                            h2: ({ children }) => (
                              <h2 className="text-base font-semibold text-gray-800 mt-4 mb-2 first:mt-0">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">{children}</h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-sm text-gray-700 mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="text-sm text-gray-700 pl-4 mb-2 space-y-1">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm text-gray-700">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-gray-800">{children}</strong>
                            ),
                            code: ({ children }) => (
                              <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs font-mono text-purple-700">{children}</code>
                            ),
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                      </div>

                      {hasLongContent && (
                        <button
                          onClick={() => toggleMessageExpanded(msg.id)}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-2"
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}

                      {/* Citations */}
                      {citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-100">
                          <p className="text-xs text-gray-400 mb-2">Sources referenced:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {citations.map((citation, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleCitationClick(citation.documentId)}
                                className="inline-flex items-center gap-1 text-xs bg-stone-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 px-2 py-1 rounded-md transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{citation.documentName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-gray-500">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 p-4 bg-white">
        {documents.length === 0 ? (
          <p className="text-sm text-center text-gray-500">
            Upload documents to start chatting
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your data..."
              rows={1}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none disabled:opacity-50 text-sm bg-stone-50 focus:bg-white transition-colors"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
