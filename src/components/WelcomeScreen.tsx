import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Building,
  Shield,
  Briefcase,
  Loader2,
  AlertCircle,
  Plus,
  Table2,
  Zap,
  Play,
  MessageSquare
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { parseDocument, isValidFileType } from '../utils/documentParser';
import type { Template, Document } from '../types';

const howItWorksSteps = [
  {
    icon: Upload,
    title: 'Upload Documents',
    description: 'Drag & drop PDFs, Word docs, or text files'
  },
  {
    icon: Zap,
    title: 'Choose Extraction',
    description: 'Quick analyze or pick a template for specific doc types'
  },
  {
    icon: Play,
    title: 'Run Analysis',
    description: 'AI extracts key information into a structured table'
  },
  {
    icon: MessageSquare,
    title: 'Ask Questions',
    description: 'Chat with your data to find insights across documents'
  }
];

const templates: Template[] = [
  {
    id: 'ma-deal-points',
    name: 'M&A Deal Points',
    description: 'SPAs, Merger Agreements',
    targetDocuments: 'SPAs, Merger Agreements',
    columns: [
      { name: 'Purchase Price', prompt: 'What is the total purchase price or consideration for this transaction?', type: 'currency' },
      { name: 'Closing Date', prompt: 'What is the expected or actual closing date for this transaction?', type: 'date' },
      { name: 'Reps & Warranties', prompt: 'Summarize the key representations and warranties made by the seller.', type: 'text' },
      { name: 'Indemnification Cap', prompt: 'What is the maximum indemnification cap or liability limit?', type: 'currency' },
      { name: 'Escrow Amount', prompt: 'What is the escrow amount or holdback, if any?', type: 'currency' },
      { name: 'Material Adverse Change', prompt: 'How is Material Adverse Change (MAC) or Material Adverse Effect (MAE) defined?', type: 'text' },
      { name: 'Closing Conditions', prompt: 'What are the key conditions precedent to closing?', type: 'text' }
    ]
  },
  {
    id: 'lease-review',
    name: 'Lease Review',
    description: 'Commercial Leases',
    targetDocuments: 'Commercial Leases',
    columns: [
      { name: 'Monthly Rent', prompt: 'What is the monthly base rent amount?', type: 'currency' },
      { name: 'Lease Term', prompt: 'What is the initial term length of the lease?', type: 'text' },
      { name: 'Renewal Options', prompt: 'What renewal options does the tenant have, including terms and notice requirements?', type: 'text' },
      { name: 'Termination Rights', prompt: 'What early termination rights exist for either party?', type: 'text' },
      { name: 'Security Deposit', prompt: 'What is the security deposit amount?', type: 'currency' },
      { name: 'Permitted Use', prompt: 'What is the permitted use of the premises?', type: 'text' }
    ]
  },
  {
    id: 'service-agreements',
    name: 'Service Agreements',
    description: 'MSAs, SOWs',
    targetDocuments: 'MSAs, SOWs, Service Contracts',
    columns: [
      { name: 'Contract Value', prompt: 'What is the total contract value or fees?', type: 'currency' },
      { name: 'Term', prompt: 'What is the initial term of the agreement?', type: 'text' },
      { name: 'Governing Law', prompt: 'What is the governing law or jurisdiction?', type: 'text' },
      { name: 'Termination Notice', prompt: 'How many days written notice is required to terminate?', type: 'number' },
      { name: 'Auto-Renewal', prompt: 'Does this agreement automatically renew?', type: 'boolean' },
      { name: 'Liability Cap', prompt: 'What is the limitation of liability cap?', type: 'currency' }
    ]
  },
  {
    id: 'nda-review',
    name: 'NDA Review',
    description: 'Confidentiality Agreements',
    targetDocuments: 'NDAs, Confidentiality Agreements',
    columns: [
      { name: 'Parties', prompt: 'Who are the parties to this agreement?', type: 'text' },
      { name: 'Effective Date', prompt: 'What is the effective date of the agreement?', type: 'date' },
      { name: 'Term', prompt: 'What is the term or duration of confidentiality obligations?', type: 'text' },
      { name: 'Confidential Info Definition', prompt: 'How is Confidential Information defined?', type: 'text' },
      { name: 'Governing Law', prompt: 'What is the governing law?', type: 'text' }
    ]
  }
];

const iconMap: Record<string, React.ReactNode> = {
  'ma-deal-points': <Briefcase style={{ width: 16, height: 16 }} />,
  'lease-review': <Building style={{ width: 16, height: 16 }} />,
  'service-agreements': <FileText style={{ width: 16, height: 16 }} />,
  'nda-review': <Shield style={{ width: 16, height: 16 }} />
};

interface UploadProgress {
  fileName: string;
  status: 'parsing' | 'done' | 'error';
  error?: string;
}

export function WelcomeScreen() {
  const { applyTemplate, addDocuments, setTemplateModalOpen } = useStore();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectTemplate = (template: Template) => {
    applyTemplate(template.columns);
  };

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
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '6vh',
      backgroundColor: '#fafaf9',
      overflow: 'auto'
    }}>
      {/* Logo and Tagline */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img
          src="/bella.png"
          alt="Bella"
          style={{
            height: '80px',
            marginBottom: '0.5rem',
            objectFit: 'contain'
          }}
        />
        <p style={{
          color: '#78716c',
          fontSize: '1rem',
          fontWeight: 400
        }}>
          AI-powered document extraction and review
        </p>
      </div>

      {/* Main Upload Area - Harvey Style */}
      <div style={{
        width: '100%',
        maxWidth: '700px',
        padding: '0 1.5rem',
        marginBottom: '2rem'
      }}>
        <div
          {...getRootProps()}
          style={{
            border: isDragActive ? '2px solid #3b82f6' : '1px solid #e7e5e4',
            borderRadius: '12px',
            backgroundColor: isDragActive ? '#eff6ff' : 'white',
            padding: '2rem',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <input {...getInputProps()} />

          {uploadProgress.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {uploadProgress.map((progress, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  {progress.status === 'parsing' && (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
                      <span style={{ color: '#57534e' }}>Processing {progress.fileName}...</span>
                    </>
                  )}
                  {progress.status === 'done' && (
                    <>
                      <FileText style={{ width: 16, height: 16, color: '#22c55e' }} />
                      <span style={{ color: '#16a34a' }}>{progress.fileName} ready</span>
                    </>
                  )}
                  {progress.status === 'error' && (
                    <>
                      <AlertCircle style={{ width: 16, height: 16, color: '#ef4444' }} />
                      <span style={{ color: '#dc2626' }}>{progress.fileName}: {progress.error}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Upload style={{
                width: 32,
                height: 32,
                color: isDragActive ? '#3b82f6' : '#a8a29e'
              }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '0.9375rem',
                  color: '#44403c',
                  margin: 0
                }}>
                  {isDragActive ? 'Drop files here...' : 'Drop documents here, or click to upload'}
                </p>
                <p style={{
                  fontSize: '0.8125rem',
                  color: '#a8a29e',
                  marginTop: '0.25rem'
                }}>
                  PDF, DOCX, TXT
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setTemplateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              color: '#44403c',
              backgroundColor: 'white',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#fafaf9';
              e.currentTarget.style.borderColor = '#d6d3d1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e7e5e4';
            }}
          >
            <Table2 style={{ width: 16, height: 16 }} />
            Choose template
          </button>
          <button
            {...getRootProps()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              color: '#44403c',
              backgroundColor: 'white',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#fafaf9';
              e.currentTarget.style.borderColor = '#d6d3d1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e7e5e4';
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add files
          </button>
        </div>
      </div>

      {/* Quick Start Templates */}
      <div style={{
        width: '100%',
        maxWidth: '700px',
        padding: '0 1.5rem'
      }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#a8a29e',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.75rem'
        }}>
          Quick start templates
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem'
        }}>
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'white',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fafaf9';
                e.currentTarget.style.borderColor = '#d6d3d1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e7e5e4';
              }}
            >
              <div style={{
                padding: '0.5rem',
                backgroundColor: '#f5f5f4',
                borderRadius: '6px',
                color: '#78716c'
              }}>
                {iconMap[template.id]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#292524'
                }}>
                  {template.name}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#a8a29e',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {template.columns.length} columns
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{
        width: '100%',
        maxWidth: '700px',
        padding: '0 1.5rem',
        marginTop: '3rem',
        marginBottom: '2rem'
      }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#a8a29e',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          How it works
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          {howItWorksSteps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div
                key={idx}
                style={{
                  textAlign: 'center',
                  padding: '1rem 0.5rem'
                }}
              >
                <div style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: '#f5f5f4',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComponent style={{ width: 20, height: 20, color: '#78716c' }} />
                  </div>
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#292524',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#292524',
                  marginBottom: '0.25rem'
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontSize: '0.6875rem',
                  color: '#a8a29e',
                  lineHeight: 1.4
                }}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
