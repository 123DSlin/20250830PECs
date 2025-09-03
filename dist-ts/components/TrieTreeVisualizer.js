"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrieTreeVisualizer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const TrieTreeVisualizer = ({ trie }) => {
    const [scale, setScale] = (0, react_1.useState)(1);
    const [isDragging, setIsDragging] = (0, react_1.useState)(false);
    const [dragStart, setDragStart] = (0, react_1.useState)({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = (0, react_1.useState)({ x: 0, y: 0 });
    // 创建测试Trie树（如果传入的trie为空）
    const createTestTrie = () => {
        return {
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
            children: new Map()
        };
    };
    // 使用传入的trie或测试trie
    const effectiveTrie = trie && trie.children && trie.children.size > 0 ? trie : createTestTrie();
    // 将 Trie 树转换为可视化节点，显示所有有配置的节点
    const buildVisualTree = (node, level = 0, bitValue) => {
        const visualNode = {
            id: `${node.prefix.network}/${node.prefix.mask}`,
            prefix: `${node.prefix.network}/${node.prefix.mask}`,
            configCount: node.configObjects.length,
            level,
            children: [],
            bitValue
        };
        // 递归构建子节点，正确处理Map类型的children
        const childrenArray = Array.from(node.children.values());
        // 按key排序，确保0和1的顺序
        childrenArray.sort((a, b) => {
            const aKey = Array.from(node.children.keys()).find(key => node.children.get(key) === a);
            const bKey = Array.from(node.children.keys()).find(key => node.children.get(key) === b);
            if (aKey && bKey) {
                const aBit = parseInt(aKey.split('_')[1]);
                const bBit = parseInt(bKey.split('_')[1]);
                return aBit - bBit; // 0在前，1在后
            }
            return 0;
        });
        for (let i = 0; i < childrenArray.length; i++) {
            const child = childrenArray[i];
            const childBitValue = i === 0 ? 0 : 1;
            const childVisualNode = buildVisualTree(child, level + 1, childBitValue);
            visualNode.children.push(childVisualNode);
        }
        return visualNode;
    };
    // 缩放控制
    const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));
    const handleResetZoom = () => {
        setScale(1);
        setPanOffset({ x: 0, y: 0 });
    };
    // 拖拽处理
    const handleMouseDown = (e) => {
        if (e.button === 0) { // 左键
            setIsDragging(true);
            setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    };
    const handleMouseMove = (e) => {
        if (isDragging) {
            setPanOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    // 鼠标滚轮缩放
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.min(Math.max(prev * delta, 0.3), 3));
        }
    };
    const renderNode = (node) => {
        const hasChildren = node.children.length > 0;
        // 添加调试信息
        console.log('Rendering node:', {
            id: node.id,
            prefix: node.prefix,
            configCount: node.configCount,
            level: node.level,
            hasChildren: hasChildren,
            childrenCount: node.children.length
        });
        return ((0, jsx_runtime_1.jsxs)("div", { className: "trie-node-horizontal", children: [(0, jsx_runtime_1.jsxs)("div", { className: "node-content-horizontal", children: [(0, jsx_runtime_1.jsxs)("div", { className: "node-circle", children: [(0, jsx_runtime_1.jsx)("span", { className: "bit-label", children: node.bitValue !== undefined ? `bit ${node.level}` : 'root' }), node.configCount > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "config-badge", children: node.configCount }))] }), hasChildren && ((0, jsx_runtime_1.jsxs)("div", { className: "bit-branches", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bit-branch bit-0", children: [(0, jsx_runtime_1.jsx)("span", { className: "bit-value", children: "0" }), (0, jsx_runtime_1.jsx)("div", { className: "branch-line" }), (0, jsx_runtime_1.jsx)("div", { className: "child-node", children: renderNode(node.children[0]) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bit-branch bit-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "bit-value", children: "1" }), (0, jsx_runtime_1.jsx)("div", { className: "branch-line" }), (0, jsx_runtime_1.jsx)("div", { className: "child-node", children: renderNode(node.children[1]) })] })] })), !hasChildren && ((0, jsx_runtime_1.jsx)("div", { className: "terminal-node", children: (0, jsx_runtime_1.jsx)("div", { className: "terminal-dot" }) }))] }), node.configCount > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "config-info", children: [(0, jsx_runtime_1.jsx)("div", { className: "config-title", children: "Configs:" }), (0, jsx_runtime_1.jsxs)("div", { className: "config-details", children: [node.prefix, " - ", node.configCount, " configs"] })] }))] }, node.id));
    };
    const visualTree = buildVisualTree(effectiveTrie);
    // 添加调试信息
    console.log('Visual tree built:', visualTree);
    console.log('Trie root:', effectiveTrie);
    // 检查是否有有效的树结构
    if (!visualTree || !visualTree.children || visualTree.children.length === 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "trie-tree-visualizer-horizontal", children: [(0, jsx_runtime_1.jsxs)("div", { className: "visualizer-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Horizontal Trie Tree Structure" }), (0, jsx_runtime_1.jsx)("p", { children: "No tree data available. Please check your configuration." })] }), (0, jsx_runtime_1.jsx)("div", { className: "tree-container-horizontal", children: (0, jsx_runtime_1.jsxs)("div", { className: "no-data-message", children: [(0, jsx_runtime_1.jsx)("p", { children: "No Trie tree data to display." }), (0, jsx_runtime_1.jsxs)("p", { children: ["Debug info: ", JSON.stringify({
                                        hasVisualTree: !!visualTree,
                                        hasChildren: visualTree?.children?.length || 0,
                                        trieRoot: !!effectiveTrie
                                    })] })] }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "trie-tree-visualizer-horizontal", children: [(0, jsx_runtime_1.jsxs)("div", { className: "visualizer-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Horizontal Trie Tree Structure" }), (0, jsx_runtime_1.jsx)("p", { children: "Use mouse wheel + Ctrl/Cmd to zoom, drag to pan. All nodes with configurations are automatically displayed." }), (0, jsx_runtime_1.jsxs)("div", { className: "zoom-controls", children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleZoomIn, className: "zoom-btn zoom-in", title: "Zoom In", children: (0, jsx_runtime_1.jsx)("span", { children: "+" }) }), (0, jsx_runtime_1.jsxs)("span", { className: "zoom-level", children: [Math.round(scale * 100), "%"] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleZoomOut, className: "zoom-btn zoom-out", title: "Zoom Out", children: (0, jsx_runtime_1.jsx)("span", { children: "\u2212" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: handleResetZoom, className: "zoom-btn zoom-reset", title: "Reset View", children: (0, jsx_runtime_1.jsx)("span", { children: "\u2302" }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "tree-container-horizontal", children: (0, jsx_runtime_1.jsx)("div", { className: "tree-viewport", onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, onWheel: handleWheel, style: { cursor: isDragging ? 'grabbing' : 'grab' }, children: (0, jsx_runtime_1.jsx)("div", { className: "tree-root", style: {
                            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
                            transformOrigin: 'center top'
                        }, children: renderNode(visualTree) }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "tree-legend", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Legend:" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "legend-node", children: "Circle Node" }), " - Represents a bit position with configuration"] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "legend-bit", children: "0/1" }), " - Bit values for IP address"] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "legend-config", children: "Config Badge" }), " - Number of configurations"] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "legend-terminal", children: "Black Dot" }), " - Terminal point (no further configuration)"] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "legend-zoom", children: "Zoom Controls" }), " - Use +/- buttons or Ctrl+Wheel"] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "legend-pan", children: "Pan" }), " - Click and drag to move view"] })] })] })] }));
};
exports.TrieTreeVisualizer = TrieTreeVisualizer;
