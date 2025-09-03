import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResults } from './components/AnalysisResults';
import { NetworkAnalyzer } from './utils/networkAnalyzer';
import { ParseResult } from './types/network';
import './App.css';
import { TrieTreeVisualizer } from './components/TrieTreeVisualizer';

function App() {
  const [results, setResults] = useState<ParseResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [showTestTrie, setShowTestTrie] = useState(false);

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
            
            {/* 测试按钮 */}
            <div className="test-section">
              <button 
                onClick={() => setShowTestTrie(!showTestTrie)} 
                className="test-button"
              >
                {showTestTrie ? 'Hide Test Trie' : 'Show Test Trie'}
              </button>
              {showTestTrie && (
                <div className="test-trie-container">
                  <h3>Test Trie Tree Visualization</h3>
                  <TrieTreeVisualizer trie={{
                    prefix: { network: '0.0.0.0', mask: 0 },
                    configObjects: [
                      {
                        id: 'test_config',
                        type: 'prefix-list',
                        router: 'test_router',
                        name: 'test_prefix',
                        prefixes: [{ network: '0.0.0.0', mask: 0 }],
                        source: 'test source'
                      }
                    ],
                    children: new Map([
                      ['0_0', {
                        prefix: { network: '0.0.0.0', mask: 1 },
                        configObjects: [],
                        children: new Map()
                      }],
                      ['0_1', {
                        prefix: { network: '128.0.0.0', mask: 1 },
                        configObjects: [
                          {
                            id: 'test_config_1',
                            type: 'prefix-list',
                            router: 'test_router',
                            name: 'test_prefix_1',
                            prefixes: [{ network: '128.0.0.0', mask: 1 }],
                            source: 'test source 1'
                          }
                        ],
                        children: new Map()
                      }]
                    ])
                  }} />
                </div>
              )}
            </div>
            
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
