"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const FileUpload_1 = require("./components/FileUpload");
const AnalysisResults_1 = require("./components/AnalysisResults");
const networkAnalyzer_1 = require("./utils/networkAnalyzer");
require("./App.css");
const TrieTreeVisualizer_1 = require("./components/TrieTreeVisualizer");
function App() {
    const [results, setResults] = (0, react_1.useState)(null);
    const [isAnalyzing, setIsAnalyzing] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [filename, setFilename] = (0, react_1.useState)('');
    const [showTestTrie, setShowTestTrie] = (0, react_1.useState)(false);
    const handleFileUpload = async (content, filename) => {
        setIsAnalyzing(true);
        setError(null);
        setFilename(filename);
        try {
            const analyzer = new networkAnalyzer_1.NetworkAnalyzer();
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
        }
        catch (err) {
            setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const handleExport = () => {
        if (!results)
            return;
        const analyzer = new networkAnalyzer_1.NetworkAnalyzer();
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "App", children: [(0, jsx_runtime_1.jsxs)("header", { className: "app-header", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Network Configuration Analyzer" }), (0, jsx_runtime_1.jsx)("p", { children: "Analyze network configurations and extract Packet Equivalence Classes" })] }), (0, jsx_runtime_1.jsx)("main", { className: "app-main", children: !results ? ((0, jsx_runtime_1.jsxs)("div", { className: "upload-section", children: [(0, jsx_runtime_1.jsx)(FileUpload_1.FileUpload, { onFileUpload: handleFileUpload }), (0, jsx_runtime_1.jsxs)("div", { className: "test-section", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setShowTestTrie(!showTestTrie), className: "test-button", children: showTestTrie ? 'Hide Test Trie' : 'Show Test Trie' }), showTestTrie && ((0, jsx_runtime_1.jsxs)("div", { className: "test-trie-container", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Test Trie Tree Visualization" }), (0, jsx_runtime_1.jsx)(TrieTreeVisualizer_1.TrieTreeVisualizer, { trie: {
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
                                            } })] }))] }), isAnalyzing && ((0, jsx_runtime_1.jsxs)("div", { className: "analyzing", children: [(0, jsx_runtime_1.jsx)("div", { className: "spinner" }), (0, jsx_runtime_1.jsx)("p", { children: "Analyzing configuration file..." })] })), error && ((0, jsx_runtime_1.jsxs)("div", { className: "error-message", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Error" }), (0, jsx_runtime_1.jsx)("pre", { children: error })] }))] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "results-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "results-header", children: [(0, jsx_runtime_1.jsxs)("h2", { children: ["Analysis Complete: ", filename] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleExport, className: "export-button", children: "Export Results" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setResults(null), className: "new-analysis-button", children: "New Analysis" })] }), (0, jsx_runtime_1.jsx)(AnalysisResults_1.AnalysisResults, { results: results })] })) }), (0, jsx_runtime_1.jsx)("footer", { className: "app-footer", children: (0, jsx_runtime_1.jsx)("p", { children: "Network Configuration Analyzer - Built with React & TypeScript" }) })] }));
}
exports.default = App;
