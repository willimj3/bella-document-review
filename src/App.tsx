import { useState } from 'react';
import {
  Header,
  UploadZone,
  DataGrid,
  CellDetailSidebar,
  ChatPanel,
  TemplateModal,
  ExportModal,
  WelcomeScreen
} from './components';
import { useStore } from './store/useStore';
import { runBulkExtraction } from './utils/extraction';

function App() {
  const {
    documents,
    columns,
    extractionResults,
    setIsExtracting,
    setExtractionProgress,
    setExtractionResult,
    selectedCell,
    isChatOpen,
    selectedDocuments
  } = useStore();

  const [isExportOpen, setIsExportOpen] = useState(false);

  // Show welcome screen when no documents and no columns
  const showWelcome = documents.length === 0 && columns.length === 0;

  const handleRunAnalysis = async () => {
    if (documents.length === 0 || columns.length === 0) {
      alert('Please upload documents and add columns before running analysis.');
      return;
    }

    // If documents are selected, only run on those; otherwise run on all
    const docsToProcess = selectedDocuments.length > 0
      ? documents.filter(d => selectedDocuments.includes(d.id))
      : documents;

    if (docsToProcess.length === 0) {
      alert('No documents selected for analysis.');
      return;
    }

    setIsExtracting(true);

    try {
      await runBulkExtraction(
        docsToProcess.map(d => ({ id: d.id, content: d.content })),
        columns.map(c => ({ id: c.id, prompt: c.prompt, type: c.type, options: c.options })),
        extractionResults,
        (current, total) => setExtractionProgress({ current, total }),
        (documentId, columnId, result) => setExtractionResult(documentId, columnId, result)
      );
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Extraction failed. Check console for details.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafaf9'
    }}>
      {!showWelcome && (
        <Header
          onRunAnalysis={handleRunAnalysis}
          onExport={() => setIsExportOpen(true)}
        />
      )}

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Main Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <>
              <DataGrid />
              <UploadZone />
            </>
          )}
        </div>

        {/* Right Sidebar - Cell Detail or Chat */}
        {selectedCell && !isChatOpen && <CellDetailSidebar />}
        {isChatOpen && <ChatPanel />}
      </div>

      {/* Modals */}
      <TemplateModal />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

export default App;
