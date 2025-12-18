import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Plus,
  MoreVertical,
  FileText,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Pencil,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Document, Column, ExtractionResult, ColumnType } from '../types';
import { AddColumnPopover } from './AddColumnPopover';

// Universal extraction columns that work across most document types
const quickAnalyzeColumns = [
  { name: 'Document Type', prompt: 'What type of document is this? (e.g., Contract, Agreement, NDA, Lease, Employment Agreement, etc.)', type: 'text' as ColumnType },
  { name: 'Parties', prompt: 'Who are the parties to this agreement or document? List all party names.', type: 'text' as ColumnType },
  { name: 'Effective Date', prompt: 'What is the effective date or execution date of this document?', type: 'date' as ColumnType },
  { name: 'Term/Duration', prompt: 'What is the term, duration, or expiration of this agreement?', type: 'text' as ColumnType },
  { name: 'Key Financial Terms', prompt: 'What are the key financial terms, amounts, or payment obligations mentioned?', type: 'text' as ColumnType },
  { name: 'Governing Law', prompt: 'What is the governing law or jurisdiction specified?', type: 'text' as ColumnType },
  { name: 'Key Obligations', prompt: 'Summarize the main obligations or responsibilities of each party.', type: 'text' as ColumnType },
  { name: 'Termination', prompt: 'How can this agreement be terminated? What are the termination provisions?', type: 'text' as ColumnType },
];

type ExtractionStatus = 'complete' | 'partial' | 'error' | 'pending';

function getDocumentStatus(
  docId: string,
  columns: Column[],
  extractionResults: Record<string, Record<string, ExtractionResult>>
): ExtractionStatus {
  if (columns.length === 0) return 'pending';

  const docResults = extractionResults[docId] || {};
  let complete = 0;
  let errors = 0;
  let loading = 0;

  columns.forEach(col => {
    const result = docResults[col.id];
    if (!result) return;
    if (result.value === '__loading__') loading++;
    else if (result.value === '__error__') errors++;
    else complete++;
  });

  if (loading > 0) return 'partial';
  if (errors > 0 && complete === 0) return 'error';
  if (complete === columns.length) return 'complete';
  if (complete > 0) return 'partial';
  return 'pending';
}

const statusConfig: Record<ExtractionStatus, { color: string; label: string }> = {
  complete: { color: 'bg-green-500', label: 'Complete' },
  partial: { color: 'bg-amber-500', label: 'In Progress' },
  error: { color: 'bg-red-500', label: 'Error' },
  pending: { color: 'bg-gray-300', label: 'Pending' }
};

interface CellContentProps {
  result: ExtractionResult | undefined;
  isSelected: boolean;
  onClick: () => void;
}

function CellContent({ result, isSelected, onClick }: CellContentProps) {
  if (!result) {
    return (
      <div
        className={`px-3 py-2.5 h-full cursor-pointer hover:bg-amber-50/50 transition-colors ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}`}
        onClick={onClick}
      >
        <span className="text-gray-400 text-sm">-</span>
      </div>
    );
  }

  const isLoading = result.value === '__loading__';
  const isError = result.value === '__error__';

  if (isLoading) {
    return (
      <div className="px-3 py-2.5 h-full flex items-center bg-amber-50/30">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`px-3 py-2.5 h-full cursor-pointer hover:bg-red-50 transition-colors ${isSelected ? 'bg-red-100 ring-1 ring-inset ring-red-200' : 'bg-red-50/50'}`}
        onClick={onClick}
      >
        <span className="text-red-500 text-sm flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Error
        </span>
      </div>
    );
  }

  return (
    <div
      className={`px-3 py-2.5 h-full cursor-pointer hover:bg-amber-50/50 transition-colors group ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-gray-700 truncate flex-1" title={result.value}>
          {result.value}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {result.isManuallyEdited && (
            <span title="Manually edited">
              <Pencil className="w-3 h-3 text-gray-400" />
            </span>
          )}
          {result.isReviewed && (
            <span title="Reviewed">
              <CheckCircle className="w-3 h-3 text-green-500" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ColumnHeaderProps {
  column: Column;
  onEdit: () => void;
  onDelete: () => void;
}

function ColumnHeader({ column, onEdit, onDelete }: ColumnHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  const typeLabels: Record<ColumnType, string> = {
    text: 'Text',
    date: 'Date',
    currency: '$',
    number: '#',
    boolean: 'Y/N',
    select: 'Select'
  };

  return (
    <div className="flex items-center justify-between w-full group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-sm text-gray-700 truncate">{column.name}</span>
        <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded shrink-0">{typeLabels[column.type]}</span>
      </div>
      <div className="relative">
        <button
          className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                onClick={() => {
                  setShowMenu(false);
                  onEdit();
                }}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                onClick={() => {
                  setShowMenu(false);
                  if (window.confirm('Delete this column?')) {
                    onDelete();
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DataGrid() {
  const {
    documents,
    columns,
    extractionResults,
    selectedCell,
    setSelectedCell,
    removeDocument,
    removeColumn,
    selectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection
  } = useStore();

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);

  const columnHelper = createColumnHelper<Document>();

  const allSelected = documents.length > 0 && selectedDocuments.length === documents.length;
  const someSelected = selectedDocuments.length > 0 && selectedDocuments.length < documents.length;

  const tableColumns = useMemo<ColumnDef<Document, any>[]>(() => {
    const cols: ColumnDef<Document, any>[] = [
      // Checkbox column
      {
        id: 'select',
        header: () => (
          <div className="flex items-center justify-center px-2">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={() => {
                if (allSelected) {
                  clearDocumentSelection();
                } else {
                  selectAllDocuments();
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        ),
        cell: (info) => {
          const doc = info.row.original;
          const isSelected = selectedDocuments.includes(doc.id);
          return (
            <div className="flex items-center justify-center px-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleDocumentSelection(doc.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          );
        },
        size: 44,
        minSize: 44,
        maxSize: 44,
      },
      // Status indicator column
      {
        id: 'status',
        header: () => null,
        cell: (info) => {
          const doc = info.row.original;
          const status = getDocumentStatus(doc.id, columns, extractionResults);
          const config = statusConfig[status];
          return (
            <div className="flex items-center justify-center px-1">
              <span title={config.label}>
                <span className={`w-2.5 h-2.5 rounded-full ${config.color} inline-block`} />
              </span>
            </div>
          );
        },
        size: 32,
        minSize: 32,
        maxSize: 32,
      },
      // Document name column
      columnHelper.accessor('name', {
        header: () => (
          <div className="flex items-center gap-2 px-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm text-gray-600">Document</span>
          </div>
        ),
        cell: (info) => {
          const doc = info.row.original;
          const isRowSelected = selectedDocuments.includes(doc.id);
          return (
            <div className={`px-3 py-2.5 flex items-center justify-between group transition-colors ${isRowSelected ? 'bg-blue-50/50' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800 truncate flex items-center gap-1" title={doc.name}>
                  {doc.name}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xs text-gray-400">
                  {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                </div>
              </div>
              <button
                className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => {
                  if (window.confirm('Remove this document?')) {
                    removeDocument(doc.id);
                  }
                }}
                title="Remove document"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          );
        },
        size: 240,
        minSize: 180,
      }),
    ];

    // Add dynamic columns
    columns.forEach((col) => {
      cols.push({
        id: col.id,
        header: () => (
          <ColumnHeader
            column={col}
            onEdit={() => setEditingColumn(col)}
            onDelete={() => removeColumn(col.id)}
          />
        ),
        cell: (info) => {
          const doc = info.row.original;
          const result = extractionResults[doc.id]?.[col.id];
          const isSelected = selectedCell?.documentId === doc.id && selectedCell?.columnId === col.id;

          return (
            <CellContent
              result={result}
              isSelected={isSelected}
              onClick={() => setSelectedCell({ documentId: doc.id, columnId: col.id })}
            />
          );
        },
        size: 180,
        minSize: 140,
      });
    });

    // Add "+" column for adding new columns
    cols.push({
      id: 'add-column',
      header: () => (
        <button
          className="w-full h-full flex items-center justify-center hover:bg-amber-50 rounded transition-colors py-2"
          onClick={() => setShowAddColumn(true)}
          title="Add column"
        >
          <Plus className="w-5 h-5 text-gray-400" />
        </button>
      ),
      cell: () => null,
      size: 50,
      minSize: 50,
      maxSize: 50,
    });

    return cols;
  }, [columns, extractionResults, selectedCell, columnHelper, removeDocument, removeColumn, setSelectedCell, selectedDocuments, allSelected, someSelected, clearDocumentSelection, selectAllDocuments, toggleDocumentSelection]);

  const table = useReactTable({
    data: documents,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { setTemplateModalOpen, applyTemplate } = useStore();

  const handleQuickAnalyze = () => {
    applyTemplate(quickAnalyzeColumns);
  };

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-8">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No documents yet</p>
          <p className="text-sm">Upload PDF, DOCX, or TXT files to get started</p>
        </div>
      </div>
    );
  }

  // Show helpful prompt when documents exist but no columns
  if (documents.length > 0 && columns.length === 0) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-8">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} ready to analyze
            </h3>
            <p className="text-gray-500 mb-6">
              Run a quick analysis to extract common information, or choose a specific template for detailed extraction.
            </p>

            {/* Primary action - Quick Analyze */}
            <button
              onClick={handleQuickAnalyze}
              className="w-full max-w-xs mx-auto mb-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-semibold shadow-md flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Quick Analyze
              <span className="text-amber-200 text-xs ml-1">8 fields</span>
            </button>

            <p className="text-xs text-gray-400 mb-4">
              Extracts: Document Type, Parties, Dates, Terms, Financial Info, and more
            </p>

            {/* Secondary options */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTemplateModalOpen(true)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Choose template
              </button>
              <button
                onClick={() => setShowAddColumn(true)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Custom columns
              </button>
            </div>
          </div>
        </div>

        {/* Add Column Popover */}
        {showAddColumn && (
          <AddColumnPopover
            onClose={() => setShowAddColumn(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-amber-50/30 to-orange-50/20">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-stone-100/95 backdrop-blur-sm">
                {headerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    className={`
                      border-b border-stone-200 px-2 py-3 text-left
                      ${idx === 0 || idx === 1 ? 'sticky left-0 z-20 bg-stone-100/95' : ''}
                      ${idx === 1 ? 'left-[44px]' : ''}
                      ${idx === 2 ? 'sticky left-[76px] z-20 bg-stone-100/95' : ''}
                    `}
                    style={{
                      width: header.getSize(),
                      left: idx === 0 ? 0 : idx === 1 ? 44 : idx === 2 ? 76 : undefined
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isRowSelected = selectedDocuments.includes(row.original.id);
              return (
                <tr
                  key={row.id}
                  className={`
                    border-b border-stone-100 transition-colors
                    ${isRowSelected ? 'bg-blue-50/40' : 'bg-white hover:bg-amber-50/30'}
                  `}
                >
                  {row.getVisibleCells().map((cell, idx) => (
                    <td
                      key={cell.id}
                      className={`
                        border-r border-stone-100 p-0
                        ${idx === 0 || idx === 1 ? 'sticky left-0 z-10' : ''}
                        ${idx === 1 ? 'left-[44px]' : ''}
                        ${idx === 2 ? 'sticky left-[76px] z-10' : ''}
                        ${idx <= 2 ? (isRowSelected ? 'bg-blue-50/40' : 'bg-white') : ''}
                      `}
                      style={{
                        width: cell.column.getSize(),
                        left: idx === 0 ? 0 : idx === 1 ? 44 : idx === 2 ? 76 : undefined
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Column Popover */}
      {showAddColumn && (
        <AddColumnPopover
          onClose={() => setShowAddColumn(false)}
        />
      )}

      {/* Edit Column Modal */}
      {editingColumn && (
        <AddColumnPopover
          editingColumn={editingColumn}
          onClose={() => setEditingColumn(null)}
        />
      )}
    </>
  );
}
