import { useState } from 'react';
import {
  Play,
  Trash2,
  Download,
  LayoutTemplate,
  Loader2,
  Plus,
  Upload,
  Sparkles,
  HelpCircle,
  X,
  Zap,
  MessageSquare,
  Table2,
  Edit2
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface HeaderProps {
  onRunAnalysis: () => void;
  onExport: () => void;
}

export function Header({ onRunAnalysis, onExport }: HeaderProps) {
  const {
    projectName,
    setProjectName,
    isExtracting,
    extractionProgress,
    toggleChat,
    isChatOpen,
    setTemplateModalOpen,
    clearProject,
    documents,
    columns,
    selectedDocuments
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const canRunAnalysis = documents.length > 0 && columns.length > 0 && !isExtracting;
  const hasData = documents.length > 0 || columns.length > 0;

  // Calculate extraction summary based on selection
  const docsToRun = selectedDocuments.length > 0 ? selectedDocuments.length : documents.length;
  const totalCells = docsToRun * columns.length;
  const runButtonText = selectedDocuments.length > 0 ? `Run Selected` : 'Run All';

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e7e5e4'
    }}>
      {/* Top bar */}
      <div style={{
        padding: '0.625rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Bella Logo - Click to go home */}
          <img
            src="/bella.png"
            alt="Bella"
            onClick={() => {
              if (window.confirm('Go back to home? Your current work will be cleared.')) {
                clearProject();
              }
            }}
            style={{
              height: '28px',
              objectFit: 'contain',
              cursor: 'pointer'
            }}
            title="Click to go home"
          />

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e7e5e4' }} />

          {/* Project Name */}
          {isEditing ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                borderBottom: '2px solid #3b82f6',
                outline: 'none',
                padding: '0.125rem 0.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: '#3b82f6'
              }}
              autoFocus
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: '#292524',
                cursor: 'pointer'
              }}
              title="Click to rename"
            >
              {projectName}
            </span>
          )}

          {/* Status badges */}
          {hasData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f5f5f4',
                color: '#78716c',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500
              }}>
                {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
              </span>
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f5f5f4',
                color: '#78716c',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500
              }}>
                {columns.length} {columns.length === 1 ? 'column' : 'columns'}
              </span>
              {selectedDocuments.length > 0 && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  {selectedDocuments.length} selected
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {hasData && (
            <button
              onClick={() => {
                if (window.confirm('Clear all documents, columns, and extracted data?')) {
                  clearProject();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                fontSize: '0.875rem',
                color: '#78716c',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
              title="Clear project"
            >
              <Trash2 style={{ width: 18, height: 18 }} />
            </button>
          )}

          <button
            onClick={onRunAnalysis}
            disabled={!canRunAnalysis}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: canRunAnalysis ? 'white' : '#a8a29e',
              backgroundColor: canRunAnalysis ? '#292524' : '#f5f5f4',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: canRunAnalysis ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s'
            }}
          >
            {isExtracting ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                <span>{extractionProgress.current}/{extractionProgress.total}</span>
              </>
            ) : (
              <>
                <Play style={{ width: 16, height: 16 }} />
                <span>{runButtonText}</span>
                {totalCells > 0 && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>({totalCells})</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {hasData && (
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#fafaf9',
          borderTop: '1px solid #f5f5f4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ToolbarButton icon={<Upload style={{ width: 16, height: 16 }} />} label="Add documents" />
            <ToolbarButton
              icon={<Plus style={{ width: 16, height: 16 }} />}
              label="Add columns"
              onClick={() => setTemplateModalOpen(true)}
            />
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e7e5e4', margin: '0 0.25rem' }} />
            <ToolbarButton
              icon={<LayoutTemplate style={{ width: 16, height: 16 }} />}
              label="Templates"
              onClick={() => setTemplateModalOpen(true)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ToolbarButton
              icon={<Sparkles style={{ width: 16, height: 16 }} />}
              label="Chat"
              onClick={toggleChat}
              active={isChatOpen}
              disabled={documents.length === 0}
            />
            <ToolbarButton
              icon={<Download style={{ width: 16, height: 16 }} />}
              label="Download"
              onClick={onExport}
              disabled={documents.length === 0}
            />
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e7e5e4', margin: '0 0.25rem' }} />
            <ToolbarButton
              icon={<HelpCircle style={{ width: 16, height: 16 }} />}
              label="Help"
              onClick={() => setShowHelp(true)}
            />
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Help Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e7e5e4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/bella.png" alt="Bella" style={{ height: '32px' }} />
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#292524', margin: 0 }}>
                    Getting Started with Bella
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#78716c', margin: 0 }}>
                    AI-powered document extraction and review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: 20, height: 20, color: '#78716c' }} />
              </button>
            </div>

            {/* Help Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Quick Start */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Quick Start Guide
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <HelpStep number={1} icon={<Upload style={{ width: 18, height: 18 }} />} title="Upload Documents" description="Drag & drop PDF, DOCX, or TXT files into the upload area. You can upload multiple documents at once." />
                  <HelpStep number={2} icon={<Zap style={{ width: 18, height: 18 }} />} title="Choose How to Analyze" description="Click 'Quick Analyze' for automatic extraction of common fields, or select a template for document-specific extraction columns." />
                  <HelpStep number={3} icon={<Play style={{ width: 18, height: 18 }} />} title="Run Extraction" description="Click 'Run All' to extract information from all documents. The AI will fill in each column based on the document content." />
                  <HelpStep number={4} icon={<MessageSquare style={{ width: 18, height: 18 }} />} title="Ask Questions" description="Use the Chat feature to ask questions about your extracted data and find insights across all documents." />
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Key Features
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <FeatureCard icon={<Table2 style={{ width: 16, height: 16 }} />} title="Templates" description="Pre-built extraction schemas for M&A, Leases, NDAs, and more" />
                  <FeatureCard icon={<Plus style={{ width: 16, height: 16 }} />} title="Custom Columns" description="Add your own extraction prompts for any data point" />
                  <FeatureCard icon={<Edit2 style={{ width: 16, height: 16 }} />} title="Edit Results" description="Click any cell to review, edit, or add notes to extractions" />
                  <FeatureCard icon={<Download style={{ width: 16, height: 16 }} />} title="Export" description="Download your results as CSV or Excel for further analysis" />
                </div>
              </div>

              {/* Tips */}
              <div style={{
                backgroundColor: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#7c3aed', marginBottom: '0.5rem' }}>
                  Pro Tips
                </p>
                <ul style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                  <li>Click on any cell to see the full extracted value and source context</li>
                  <li>Use the Chat to compare terms across documents or find specific clauses</li>
                  <li>Add custom columns with detailed prompts for better extraction accuracy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, active, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        fontSize: '0.8125rem',
        color: active ? '#7c3aed' : disabled ? '#d6d3d1' : '#57534e',
        backgroundColor: active ? '#f3e8ff' : 'transparent',
        border: active ? '1px solid #e9d5ff' : '1px solid transparent',
        borderRadius: '0.375rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface HelpStepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function HelpStep({ number, icon, title, description }: HelpStepProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '36px',
          height: '36px',
          backgroundColor: '#f5f5f4',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#78716c'
        }}>
          {icon}
        </div>
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
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
          {number}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#292524', margin: 0, marginBottom: '0.125rem' }}>
          {title}
        </p>
        <p style={{ fontSize: '0.8125rem', color: '#78716c', margin: 0, lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div style={{
      padding: '0.875rem',
      backgroundColor: '#fafaf9',
      borderRadius: '10px',
      border: '1px solid #f5f5f4'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
        <span style={{ color: '#78716c' }}>{icon}</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#292524' }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#78716c', margin: 0, lineHeight: 1.4 }}>
        {description}
      </p>
    </div>
  );
}
