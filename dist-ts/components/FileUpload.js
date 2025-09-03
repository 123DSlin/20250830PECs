"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpload = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dropzone_1 = require("react-dropzone");
const FileUpload = ({ onFileUpload }) => {
    const onDrop = (0, react_1.useCallback)((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                onFileUpload(content, file.name);
            };
            reader.readAsText(file);
        }
    }, [onFileUpload]);
    const { getRootProps, getInputProps, isDragActive } = (0, react_dropzone_1.useDropzone)({
        onDrop,
        accept: {
            'text/plain': ['.cfg', '.txt'],
            'application/octet-stream': ['.cfg']
        },
        multiple: false
    });
    return ((0, jsx_runtime_1.jsx)("div", { className: "file-upload", children: (0, jsx_runtime_1.jsxs)("div", { ...getRootProps(), className: `dropzone ${isDragActive ? 'active' : ''}`, children: [(0, jsx_runtime_1.jsx)("input", { ...getInputProps() }), (0, jsx_runtime_1.jsxs)("div", { className: "upload-content", children: [(0, jsx_runtime_1.jsx)("svg", { className: "upload-icon", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }), (0, jsx_runtime_1.jsx)("p", { className: "upload-text", children: isDragActive
                                ? 'Drop the configuration file here...'
                                : 'Drag & drop a configuration file, or click to select' }), (0, jsx_runtime_1.jsx)("p", { className: "upload-hint", children: "Supports .cfg and .txt files" })] })] }) }));
};
exports.FileUpload = FileUpload;
