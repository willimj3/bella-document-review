import { useState } from 'react';
import { X, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportToCSV, exportToJSON, downloadFile } from '../utils/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { documents, columns, extractionResults, projectName } = useStore();

  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [includeConfidence, setIncludeConfidence] = useState(false);
  const [includeQuotes, setIncludeQuotes] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'csv') {
      const content = exportToCSV(documents, columns, extractionResults, includeConfidence, includeQuotes);
      downloadFile(content, `${safeProjectName}_export_${timestamp}.csv`, 'text/csv');
    } else {
      const content = exportToJSON(documents, columns, extractionResults, projectName);
      downloadFile(content, `${safeProjectName}_export_${timestamp}.json`, 'application/json');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Export Data</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className={`w-6 h-6 ${format === 'csv' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-sm">CSV</div>
                  <div className="text-xs text-gray-500">Spreadsheet format</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  format === 'json'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileJson className={`w-6 h-6 ${format === 'json' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-sm">JSON</div>
                  <div className="text-xs text-gray-500">Full data with metadata</div>
                </div>
              </button>
            </div>
          </div>

          {/* Options (CSV only) */}
          {format === 'csv' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Include in Export
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeConfidence}
                  onChange={(e) => setIncludeConfidence(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Confidence scores</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeQuotes}
                  onChange={(e) => setIncludeQuotes(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Source quotes</span>
              </label>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p><strong>{documents.length}</strong> documents with <strong>{columns.length}</strong> extraction columns</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
