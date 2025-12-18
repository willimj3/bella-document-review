import type { Document, Column, ExtractionResults } from '../types';

export function exportToCSV(
  documents: Document[],
  columns: Column[],
  results: ExtractionResults,
  includeConfidence: boolean = false,
  includeQuotes: boolean = false
): string {
  const headers = ['Document Name', ...columns.map(c => c.name)];

  if (includeConfidence) {
    columns.forEach(c => headers.push(`${c.name} (Confidence)`));
  }
  if (includeQuotes) {
    columns.forEach(c => headers.push(`${c.name} (Quote)`));
  }

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = documents.map(doc => {
    const row: string[] = [escapeCSV(doc.name)];

    // Values
    columns.forEach(col => {
      const result = results[doc.id]?.[col.id];
      const value = result?.value || '';
      row.push(escapeCSV(value === '__loading__' || value === '__error__' ? '' : value));
    });

    // Confidence
    if (includeConfidence) {
      columns.forEach(col => {
        const result = results[doc.id]?.[col.id];
        row.push(result?.confidence || '');
      });
    }

    // Quotes
    if (includeQuotes) {
      columns.forEach(col => {
        const result = results[doc.id]?.[col.id];
        row.push(escapeCSV(result?.quote || ''));
      });
    }

    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportToJSON(
  documents: Document[],
  columns: Column[],
  results: ExtractionResults,
  projectName: string
): string {
  const exportData = {
    projectName,
    exportedAt: new Date().toISOString(),
    columns: columns.map(c => ({
      name: c.name,
      prompt: c.prompt,
      type: c.type,
      options: c.options
    })),
    documents: documents.map(doc => ({
      name: doc.name,
      pageCount: doc.pageCount,
      fileSize: doc.fileSize,
      extractions: columns.reduce((acc, col) => {
        const result = results[doc.id]?.[col.id];
        if (result && result.value !== '__loading__' && result.value !== '__error__') {
          acc[col.name] = {
            value: result.value,
            confidence: result.confidence,
            reasoning: result.reasoning,
            quote: result.quote,
            pageNumber: result.pageNumber,
            isManuallyEdited: result.isManuallyEdited,
            isReviewed: result.isReviewed
          };
        }
        return acc;
      }, {} as Record<string, any>)
    }))
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
