import React, { useState } from 'react';
import { TrieNode } from '../types/network';

interface TrieTreeVisualizerProps {
  trie: TrieNode;
}

interface VisualNode {
  id: string;
  prefix: string;
  configCount: number;
  level: number;
  children: VisualNode[];
  bitValue?: number;
}

export const TrieTreeVisualizer: React.FC<TrieTreeVisualizerProps> = ({ trie }) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // 创建测试Trie树（如果传入的trie为空）
  const createTestTrie = (): TrieNode => {
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
  const buildVisualTree = (node: TrieNode, level: number = 0, bitValue?: number): VisualNode => {
    const visualNode: VisualNode = {
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
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // 左键
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(prev * delta, 0.3), 3));
    }
  };

  const renderNode = (node: VisualNode) => {
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

    return (
      <div key={node.id} className="trie-node-horizontal">
        <div className="node-content-horizontal">
          <div className="node-circle">
            <span className="bit-label">
              {node.bitValue !== undefined ? `bit ${node.level}` : 'root'}
            </span>
            {node.configCount > 0 && (
              <div className="config-badge">{node.configCount}</div>
            )}
          </div>
          
          {hasChildren && (
            <div className="bit-branches">
              <div className="bit-branch bit-0">
                <span className="bit-value">0</span>
                <div className="branch-line"></div>
                <div className="child-node">
                  {renderNode(node.children[0])}
                </div>
              </div>
              <div className="bit-branch bit-1">
                <span className="bit-value">1</span>
                <div className="branch-line"></div>
                <div className="child-node">
                  {renderNode(node.children[1])}
                </div>
              </div>
            </div>
          )}
          
          {!hasChildren && (
            <div className="terminal-node">
              <div className="terminal-dot"></div>
            </div>
          )}
        </div>
        
        {/* 配置信息显示 */}
        {node.configCount > 0 && (
          <div className="config-info">
            <div className="config-title">Configs:</div>
            <div className="config-details">
              {node.prefix} - {node.configCount} configs
            </div>
          </div>
        )}
      </div>
    );
  };

  const visualTree = buildVisualTree(effectiveTrie);

  // 添加调试信息
  console.log('Visual tree built:', visualTree);
  console.log('Trie root:', effectiveTrie);

  // 检查是否有有效的树结构
  if (!visualTree || !visualTree.children || visualTree.children.length === 0) {
    return (
      <div className="trie-tree-visualizer-horizontal">
        <div className="visualizer-header">
          <h3>Horizontal Trie Tree Structure</h3>
          <p>No tree data available. Please check your configuration.</p>
        </div>
        <div className="tree-container-horizontal">
          <div className="no-data-message">
            <p>No Trie tree data to display.</p>
            <p>Debug info: {JSON.stringify({ 
              hasVisualTree: !!visualTree, 
              hasChildren: visualTree?.children?.length || 0,
              trieRoot: !!effectiveTrie 
            })}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trie-tree-visualizer-horizontal">
      <div className="visualizer-header">
        <h3>Horizontal Trie Tree Structure</h3>
        <p>Use mouse wheel + Ctrl/Cmd to zoom, drag to pan. All nodes with configurations are automatically displayed.</p>
        
        {/* 缩放控制按钮 */}
        <div className="zoom-controls">
          <button onClick={handleZoomIn} className="zoom-btn zoom-in" title="Zoom In">
            <span>+</span>
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomOut} className="zoom-btn zoom-out" title="Zoom Out">
            <span>−</span>
          </button>
          <button onClick={handleResetZoom} className="zoom-btn zoom-reset" title="Reset View">
            <span>⌂</span>
          </button>
        </div>
      </div>
      
      <div className="tree-container-horizontal">
        <div 
          className="tree-viewport"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div 
            className="tree-root"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
              transformOrigin: 'center top'
            }}
          >
            {renderNode(visualTree)}
          </div>
        </div>
      </div>
      
      <div className="tree-legend">
        <h4>Legend:</h4>
        <ul>
          <li><span className="legend-node">Circle Node</span> - Represents a bit position with configuration</li>
          <li><span className="legend-bit">0/1</span> - Bit values for IP address</li>
          <li><span className="legend-config">Config Badge</span> - Number of configurations</li>
          <li><span className="legend-terminal">Black Dot</span> - Terminal point (no further configuration)</li>
          <li><span className="legend-zoom">Zoom Controls</span> - Use +/- buttons or Ctrl+Wheel</li>
          <li><span className="legend-pan">Pan</span> - Click and drag to move view</li>
        </ul>
      </div>
    </div>
  );
};
