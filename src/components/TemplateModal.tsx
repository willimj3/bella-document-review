import { useState } from 'react';
import { X, FileText, Building, Users, Shield, CreditCard, Briefcase, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Template, ColumnType } from '../types';

const templates: Template[] = [
  {
    id: 'ma-deal-points',
    name: 'M&A Deal Points',
    description: 'Extract key terms from SPAs and merger agreements',
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
    description: 'Analyze commercial lease agreements',
    targetDocuments: 'Commercial Leases',
    columns: [
      { name: 'Monthly Rent', prompt: 'What is the monthly base rent amount?', type: 'currency' },
      { name: 'Lease Term', prompt: 'What is the initial term length of the lease?', type: 'text' },
      { name: 'Renewal Options', prompt: 'What renewal options does the tenant have, including terms and notice requirements?', type: 'text' },
      { name: 'Termination Rights', prompt: 'What early termination rights exist for either party?', type: 'text' },
      { name: 'Rent Escalation', prompt: 'How does rent escalate over the lease term (fixed increases, CPI, etc.)?', type: 'text' },
      { name: 'Security Deposit', prompt: 'What is the security deposit amount?', type: 'currency' },
      { name: 'Permitted Use', prompt: 'What is the permitted use of the premises?', type: 'text' },
      { name: 'Assignment Rights', prompt: 'Can the tenant assign or sublease, and under what conditions?', type: 'text' }
    ]
  },
  {
    id: 'service-agreements',
    name: 'Service Agreements',
    description: 'Review MSAs and SOWs for key commercial terms',
    targetDocuments: 'MSAs, SOWs, Service Contracts',
    columns: [
      { name: 'Contract Value', prompt: 'What is the total contract value or fees?', type: 'currency' },
      { name: 'Term', prompt: 'What is the initial term of the agreement?', type: 'text' },
      { name: 'Governing Law', prompt: 'What is the governing law or jurisdiction?', type: 'text' },
      { name: 'Termination Notice', prompt: 'How many days written notice is required to terminate?', type: 'number' },
      { name: 'Auto-Renewal', prompt: 'Does this agreement automatically renew?', type: 'boolean' },
      { name: 'Liability Cap', prompt: 'What is the limitation of liability cap?', type: 'currency' },
      { name: 'Indemnification', prompt: 'Summarize the key indemnification obligations.', type: 'text' },
      { name: 'Insurance Requirements', prompt: 'What insurance coverage is required?', type: 'text' }
    ]
  },
  {
    id: 'employment-agreements',
    name: 'Employment Agreements',
    description: 'Extract terms from offer letters and employment contracts',
    targetDocuments: 'Offer Letters, Employment Contracts',
    columns: [
      { name: 'Base Salary', prompt: 'What is the annual base salary?', type: 'currency' },
      { name: 'Start Date', prompt: 'What is the employment start date?', type: 'date' },
      { name: 'Title', prompt: 'What is the job title or position?', type: 'text' },
      { name: 'Reporting To', prompt: 'Who does this position report to?', type: 'text' },
      { name: 'Non-Compete', prompt: 'Is there a non-compete clause? If so, what is its duration and scope?', type: 'text' },
      { name: 'Non-Solicit', prompt: 'Is there a non-solicitation clause? If so, what are its terms?', type: 'text' },
      { name: 'Severance', prompt: 'What severance is provided upon termination?', type: 'text' },
      { name: 'Equity/Options', prompt: 'What equity or stock options are granted?', type: 'text' }
    ]
  },
  {
    id: 'nda-review',
    name: 'NDA Review',
    description: 'Analyze confidentiality agreements',
    targetDocuments: 'NDAs, Confidentiality Agreements',
    columns: [
      { name: 'Parties', prompt: 'Who are the parties to this agreement?', type: 'text' },
      { name: 'Effective Date', prompt: 'What is the effective date of the agreement?', type: 'date' },
      { name: 'Term', prompt: 'What is the term or duration of confidentiality obligations?', type: 'text' },
      { name: 'Confidential Info Definition', prompt: 'How is Confidential Information defined?', type: 'text' },
      { name: 'Permitted Disclosures', prompt: 'What disclosures are permitted or excluded?', type: 'text' },
      { name: 'Return/Destruction', prompt: 'What are the requirements for return or destruction of confidential information?', type: 'text' },
      { name: 'Governing Law', prompt: 'What is the governing law?', type: 'text' }
    ]
  },
  {
    id: 'credit-agreements',
    name: 'Credit Agreements',
    description: 'Review loan documents for key financial terms',
    targetDocuments: 'Loan Agreements, Credit Facilities',
    columns: [
      { name: 'Principal Amount', prompt: 'What is the principal loan amount or credit facility size?', type: 'currency' },
      { name: 'Interest Rate', prompt: 'What is the interest rate (fixed or floating, and any spread)?', type: 'text' },
      { name: 'Maturity Date', prompt: 'What is the maturity date of the loan?', type: 'date' },
      { name: 'Financial Covenants', prompt: 'What are the key financial covenants (debt ratios, coverage ratios, etc.)?', type: 'text' },
      { name: 'Events of Default', prompt: 'What are the main events of default?', type: 'text' },
      { name: 'Prepayment Terms', prompt: 'Are there prepayment penalties or requirements?', type: 'text' }
    ]
  }
];

const iconMap: Record<string, React.ReactNode> = {
  'ma-deal-points': <Briefcase className="w-5 h-5" />,
  'lease-review': <Building className="w-5 h-5" />,
  'service-agreements': <FileText className="w-5 h-5" />,
  'employment-agreements': <Users className="w-5 h-5" />,
  'nda-review': <Shield className="w-5 h-5" />,
  'credit-agreements': <CreditCard className="w-5 h-5" />
};

const typeLabels: Record<ColumnType, string> = {
  text: 'Text',
  date: 'Date',
  currency: '$',
  number: '#',
  boolean: 'Y/N',
  select: 'Select'
};

export function TemplateModal() {
  const { isTemplateModalOpen, setTemplateModalOpen, applyTemplate, columns } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  if (!isTemplateModalOpen) return null;

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    if (columns.length > 0) {
      const confirmed = window.confirm(
        'This will add template columns to your existing columns. Continue?'
      );
      if (!confirmed) return;
    }

    applyTemplate(selectedTemplate.columns);
    setTemplateModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleClose = () => {
    setTemplateModalOpen(false);
    setSelectedTemplate(null);
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
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '56rem',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Start with pre-configured extraction columns for common document types
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Template List */}
          <div className="w-1/2 border-r border-gray-200 overflow-auto">
            <div className="p-4 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {iconMap[template.id]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <span className="text-xs text-gray-400">
                          {template.columns.length} columns
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{template.targetDocuments}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-colors ${
                      selectedTemplate?.id === template.id ? 'text-blue-500' : 'text-gray-300'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Preview */}
          <div className="w-1/2 overflow-auto bg-gray-50">
            {selectedTemplate ? (
              <div className="p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    {iconMap[selectedTemplate.id]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Extraction Columns ({selectedTemplate.columns.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.columns.map((col, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{col.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {typeLabels[col.type]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{col.prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a template to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <p className="text-sm text-gray-500">
            {selectedTemplate
              ? `${selectedTemplate.columns.length} columns will be added`
              : 'Choose a template to continue'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyTemplate}
              disabled={!selectedTemplate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
