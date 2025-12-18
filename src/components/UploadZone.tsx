import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { parseDocument, isValidFileType } from '../utils/documentParser';
import type { Document } from '../types';

interface UploadProgress {
  fileName: string;
  status: 'parsing' | 'done' | 'error';
  error?: string;
}

export function UploadZone() {
  const { addDocuments } = useStore();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(isValidFileType);
    const invalidFiles = acceptedFiles.filter(f => !isValidFileType(f));

    if (invalidFiles.length > 0) {
      alert(`Unsupported files: ${invalidFiles.map(f => f.name).join(', ')}\n\nSupported formats: PDF, DOCX, TXT`);
    }

    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setUploadProgress(validFiles.map(f => ({ fileName: f.name, status: 'parsing' })));

    const documents: Document[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const doc = await parseDocument(file);
        documents.push(doc);
        setUploadProgress(prev =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'done' } : p
          )
        );
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
        setUploadProgress(prev =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'error', error: 'Failed to parse file' } : p
          )
        );
      }
    }

    if (documents.length > 0) {
      addDocuments(documents);
    }

    // Clear progress after a short delay
    setTimeout(() => {
      setUploadProgress([]);
      setIsProcessing(false);
    }, 2000);
  }, [addDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    disabled: isProcessing
  });

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploadProgress.length > 0 ? (
          <div className="space-y-2">
            {uploadProgress.map((progress, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2 text-sm">
                {progress.status === 'parsing' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-gray-600">Processing {progress.fileName}...</span>
                  </>
                )}
                {progress.status === 'done' && (
                  <>
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">{progress.fileName} ready</span>
                  </>
                )}
                {progress.status === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">{progress.fileName}: {progress.error}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop files here...'
                : 'Drag & drop files here, or click to browse'}
            </p>
            <p className="text-xs text-gray-400">
              Supports PDF, DOCX, TXT (max 50 files)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
