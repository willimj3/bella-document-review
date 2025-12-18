import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Column, ColumnType } from '../types';

interface AddColumnPopoverProps {
  onClose: () => void;
  editingColumn?: Column;
}

const columnTypes: { value: ColumnType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Free text, summaries, descriptions' },
  { value: 'date', label: 'Date', description: 'Dates in various formats' },
  { value: 'currency', label: 'Currency', description: 'Monetary amounts with symbol' },
  { value: 'number', label: 'Number', description: 'Numeric values with optional units' },
  { value: 'boolean', label: 'Yes/No', description: 'Binary true/false answers' },
  { value: 'select', label: 'Select', description: 'Choose from predefined options' },
];

export function AddColumnPopover({ onClose, editingColumn }: AddColumnPopoverProps) {
  const { addColumn, updateColumn } = useStore();

  const [name, setName] = useState(editingColumn?.name || '');
  const [prompt, setPrompt] = useState(editingColumn?.prompt || '');
  const [type, setType] = useState<ColumnType>(editingColumn?.type || 'text');
  const [options, setOptions] = useState<string[]>(editingColumn?.options || ['', '']);

  const isEditing = !!editingColumn;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !prompt.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (type === 'select' && options.filter(o => o.trim()).length < 2) {
      alert('Please provide at least 2 options for select type');
      return;
    }

    const validOptions = options.filter(o => o.trim());

    if (isEditing) {
      updateColumn(editingColumn.id, {
        name: name.trim(),
        prompt: prompt.trim(),
        type,
        options: type === 'select' ? validOptions : undefined
      });
    } else {
      addColumn(name.trim(), prompt.trim(), type, type === 'select' ? validOptions : undefined);
    }

    onClose();
  };

  return (
    <div
      className="modal-overlay"
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '32rem',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            {isEditing ? 'Edit Column' : 'Add Column'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Column Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
              Column Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Governing Law"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Extraction Prompt */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
              Extraction Prompt <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What is the governing law or jurisdiction for this agreement?"
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
              Write a natural language question that describes what to extract from each document.
            </p>
          </div>

          {/* Data Type */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
              Data Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {columnTypes.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setType(ct.value)}
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    border: type === ct.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: type === ct.value ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{ct.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{ct.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Select Options */}
          {type === 'select' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Options <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {options.map((option, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[idx] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                        style={{
                          padding: '0.5rem',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          borderRadius: '0.5rem'
                        }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOptions([...options, ''])}
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Plus style={{ width: '1rem', height: '1rem' }} />
                Add option
              </button>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: '#374151',
                background: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'white',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              {isEditing ? 'Save Changes' : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
