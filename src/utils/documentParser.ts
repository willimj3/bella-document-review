import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import type { Document, DocumentPage } from '../types';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function parsePDF(file: File): Promise<{ content: string; pages: DocumentPage[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: DocumentPage[] = [];
  let fullContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    pages.push({ number: i, text: pageText });
    fullContent += pageText + '\n\n';
  }

  return { content: fullContent.trim(), pages };
}

export async function parseDOCX(file: File): Promise<{ content: string; pages: DocumentPage[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  // DOCX doesn't have page numbers, so we treat the whole document as one "page"
  // In a production app, you might want to split by paragraphs or sections
  const content = result.value;

  // Split into pseudo-pages of roughly 3000 characters each
  const pageSize = 3000;
  const pages: DocumentPage[] = [];

  for (let i = 0; i < content.length; i += pageSize) {
    pages.push({
      number: pages.length + 1,
      text: content.slice(i, i + pageSize)
    });
  }

  if (pages.length === 0) {
    pages.push({ number: 1, text: content });
  }

  return { content, pages };
}

export async function parseTXT(file: File): Promise<{ content: string; pages: DocumentPage[] }> {
  const content = await file.text();

  // Split into pseudo-pages of roughly 3000 characters each
  const pageSize = 3000;
  const pages: DocumentPage[] = [];

  for (let i = 0; i < content.length; i += pageSize) {
    pages.push({
      number: pages.length + 1,
      text: content.slice(i, i + pageSize)
    });
  }

  if (pages.length === 0) {
    pages.push({ number: 1, text: content });
  }

  return { content, pages };
}

export async function parseDocument(file: File): Promise<Document> {
  const fileName = file.name.toLowerCase();
  let content: string;
  let pages: DocumentPage[];
  let fileType: 'pdf' | 'docx' | 'txt';

  if (fileName.endsWith('.pdf')) {
    const result = await parsePDF(file);
    content = result.content;
    pages = result.pages;
    fileType = 'pdf';
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    const result = await parseDOCX(file);
    content = result.content;
    pages = result.pages;
    fileType = 'docx';
  } else if (fileName.endsWith('.txt')) {
    const result = await parseTXT(file);
    content = result.content;
    pages = result.pages;
    fileType = 'txt';
  } else {
    throw new Error(`Unsupported file type: ${fileName}`);
  }

  return {
    id: uuidv4(),
    name: file.name,
    content,
    pages,
    uploadedAt: new Date().toISOString(),
    fileSize: file.size,
    pageCount: pages.length,
    fileType
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isValidFileType(file: File): boolean {
  const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
}
