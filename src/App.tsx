import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResults } from './components/AnalysisResults';
import { NetworkAnalyzer } from './utils/networkAnalyzer';
import { ParseResult } from './types/network';
import './App.css';

function App() {
  const [results, setResults] = useState<ParseResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');

  const handleFileUpload = async (content: string, filename: string) => {
    setIsAnalyzing(true);
    setError(null);
    setFilename(filename);

    try {
      const analyzer = new NetworkAnalyzer();
      
      // 验证配置文件
      const validation = analyzer.validateConfig(content);
      if (!validation.isValid) {
        setError(`Configuration validation failed:\n${validation.errors.join('\n')}`);
        setIsAnalyzing(false);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('Configuration warnings:', validation.warnings);
      }

      // 分析配置
      const analysisResults = analyzer.analyzeConfig(content);
      setResults(analysisResults);
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!results) return;

    const analyzer = new NetworkAnalyzer();
    const exportData = analyzer.exportResults();
    
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-analysis-${filename.replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Network Configuration Analyzer</h1>
        <p>Analyze network configurations and extract Packet Equivalence Classes</p>
      </header>

      <main className="app-main">
        {!results ? (
          <div className="upload-section">
            <FileUpload onFileUpload={handleFileUpload} />
            {isAnalyzing && (
              <div className="analyzing">
                <div className="spinner"></div>
                <p>Analyzing configuration file...</p>
              </div>
            )}
            {error && (
              <div className="error-message">
                <h3>Error</h3>
                <pre>{error}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <h2>Analysis Complete: {filename}</h2>
              <button onClick={handleExport} className="export-button">
                Export Results
              </button>
              <button 
                onClick={() => setResults(null)} 
                className="new-analysis-button"
              >
                New Analysis
              </button>
            </div>
            <AnalysisResults results={results} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Network Configuration Analyzer - Built with React & TypeScript</p>
      </footer>
    </div>
  );
}

export default App;
