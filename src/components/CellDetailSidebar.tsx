import { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  Edit2,
  Eye,
  AlertCircle,
  Info,
  ChevronRight,
  Quote,
  Sparkles,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { extractData } from '../utils/extraction';

const confidenceConfig = {
  High: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Low: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

export function CellDetailSidebar() {
  const {
    selectedCell,
    setSelectedCell,
    documents,
    columns,
    extractionResults,
    updateExtractionResult,
    setExtractionResult
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  if (!selectedCell) return null;

  const document = documents.find(d => d.id === selectedCell.documentId);
  const column = columns.find(c => c.id === selectedCell.columnId);
  const result = extractionResults[selectedCell.documentId]?.[selectedCell.columnId];

  // Get all results for this document
  const allDocumentResults = extractionResults[selectedCell.documentId] || {};

  if (!document || !column) return null;

  const isLoading = result?.value === '__loading__';
  const isError = result?.value === '__error__';
  const hasResult = result && !isLoading && !isError;

  const handleStartEdit = () => {
    setEditValue(result?.value || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (result) {
      updateExtractionResult(selectedCell.documentId, selectedCell.columnId, {
        value: editValue,
        isManuallyEdited: true,
        originalValue: result.originalValue || result.value,
        editedAt: new Date().toISOString()
      });
    }
    setIsEditing(false);
  };

  const handleToggleReviewed = () => {
    if (result) {
      updateExtractionResult(selectedCell.documentId, selectedCell.columnId, {
        isReviewed: !result.isReviewed,
        reviewedAt: !result.isReviewed ? new Date().toISOString() : undefined
      });
    }
  };

  const handleViewInDocument = () => {
    if (result?.pageNumber) {
      alert(`The quote is found on page ${result.pageNumber}.\n\nDocument viewer integration coming soon.`);
    }
  };

  const handleRetry = async () => {
    if (!document || !column) return;

    setIsRetrying(true);

    // Set loading state
    setExtractionResult(selectedCell.documentId, selectedCell.columnId, {
      value: '__loading__',
      confidence: 'Low',
      reasoning: '',
      quote: '',
      pageNumber: null,
      isManuallyEdited: false,
      isReviewed: false
    });

    try {
      const newResult = await extractData(
        document.content,
        column.prompt,
        column.type,
        column.options
      );
      setExtractionResult(selectedCell.documentId, selectedCell.columnId, newResult);
    } catch (error) {
      console.error('Retry extraction failed:', error);
      setExtractionResult(selectedCell.documentId, selectedCell.columnId, {
        value: '__error__',
        confidence: 'Low',
        reasoning: String(error),
        quote: '',
        pageNumber: null,
        isManuallyEdited: false,
        isReviewed: false
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Count completed extractions for this document
  const completedExtractions = Object.values(allDocumentResults).filter(
    r => r && r.value !== '__loading__' && r.value !== '__error__'
  ).length;

  return (
    <div className="w-[400px] border-l border-stone-200 bg-gradient-to-b from-stone-50 to-white flex flex-col h-full">
      {/* Header with document name */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-stone-100 rounded-lg shrink-0">
            <FileText className="w-4 h-4 text-stone-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-800 truncate" title={document.name}>
              {document.name}
            </h3>
            <p className="text-xs text-gray-400">
              {completedExtractions}/{columns.length} fields extracted
            </p>
          </div>
        </div>
        <button
          onClick={() => setSelectedCell(null)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Selected Field Section */}
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected Field</span>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-xs font-medium text-blue-600">{column.name}</span>
          </div>

          {isLoading && (
            <div className="py-6 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">Extracting...</p>
            </div>
          )}

          {isError && (
            <div className="py-6 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-1">Extraction failed</p>
              {result?.reasoning && (
                <p className="text-xs text-gray-500 mb-3 px-4">{result.reasoning}</p>
              )}
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry Extraction'}
              </button>
            </div>
          )}

          {!hasResult && !isLoading && !isError && (
            <div className="py-6 text-center">
              <Info className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No result yet</p>
              <p className="text-xs text-gray-400 mt-1">Run analysis to extract</p>
            </div>
          )}

          {hasResult && (
            <div className="space-y-4">
              {/* Answer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Answer</span>
                  {!isEditing && (
                    <button
                      onClick={handleStartEdit}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    {column.type === 'boolean' ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Not Found">Not Found</option>
                      </select>
                    ) : column.type === 'select' && column.options ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      >
                        {column.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="Not Found">Not Found</option>
                      </select>
                    ) : (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-stone-200 rounded-lg text-sm text-gray-800">
                    {result.value}
                    {result.isManuallyEdited && (
                      <span className="ml-2 text-xs text-gray-400">(edited)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Confidence & Status Row */}
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${confidenceConfig[result.confidence].bg} ${confidenceConfig[result.confidence].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${confidenceConfig[result.confidence].dot}`} />
                  {result.confidence} confidence
                </div>
                {result.isReviewed && (
                  <div className="inline-flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Reviewed
                  </div>
                )}
              </div>

              {/* Source Quote */}
              {result.quote && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-gray-500">Source</span>
                    {result.pageNumber && (
                      <span className="text-xs text-gray-400 ml-auto">Page {result.pageNumber}</span>
                    )}
                  </div>
                  <blockquote className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-sm text-gray-700 italic">
                    "{result.quote}"
                  </blockquote>
                  {result.pageNumber && (
                    <button
                      onClick={handleViewInDocument}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View in document
                    </button>
                  )}
                </div>
              )}

              {/* AI Reasoning */}
              {result.reasoning && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-medium text-gray-500">AI Reasoning</span>
                  </div>
                  <p className="text-sm text-gray-600 bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                    {result.reasoning}
                  </p>
                </div>
              )}

              {/* Mark as Reviewed Button */}
              <button
                onClick={handleToggleReviewed}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  result.isReviewed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-stone-100 text-gray-700 hover:bg-stone-200'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${result.isReviewed ? '' : 'text-gray-400'}`} />
                {result.isReviewed ? 'Reviewed' : 'Mark as Reviewed'}
              </button>
            </div>
          )}
        </div>

        {/* Other Extractions for this Document */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              All Extractions
            </span>
          </div>
          <div className="space-y-2">
            {columns.map(col => {
              const colResult = allDocumentResults[col.id];
              const isCurrentColumn = col.id === selectedCell.columnId;
              const hasValue = colResult && colResult.value !== '__loading__' && colResult.value !== '__error__';

              return (
                <button
                  key={col.id}
                  onClick={() => setSelectedCell({ documentId: selectedCell.documentId, columnId: col.id })}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isCurrentColumn
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isCurrentColumn ? 'text-blue-700' : 'text-gray-700'}`}>
                      {col.name}
                    </span>
                    {hasValue && colResult?.isReviewed && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {hasValue ? colResult?.value : (colResult?.value === '__loading__' ? 'Extracting...' : 'Not extracted')}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
