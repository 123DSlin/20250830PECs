import { TrieNode, Prefix, ConfigObject } from '../types/network';
import { ipToNumber, numberToIp, getPrefixRange } from './ipUtils';

export class TrieTree {
  public root: TrieNode;

  constructor() {
    this.root = {
      prefix: { network: '0.0.0.0', mask: 0 },
      configObjects: [],
      children: new Map()
    };
  }

  // 插入前缀和配置对象
  public insert(prefix: Prefix, configObject: ConfigObject): void {
    const network = prefix.network;
    const mask = prefix.mask;
    
    let currentNode = this.root;
    let currentMask = 0;
    
    // 逐位构建 Trie 树
    while (currentMask < mask) {
      const nextBit = this.getBitAtPosition(network, currentMask);
      const key = `${currentMask}_${nextBit}`;
      
      if (!currentNode.children.has(key)) {
        // 创建新节点
        const newPrefix: Prefix = {
          network: this.getNetworkAtMask(network, currentMask + 1),
          mask: currentMask + 1
        };
        
        const newNode: TrieNode = {
          prefix: newPrefix,
          configObjects: [],
          children: new Map(),
          parent: currentNode
        };
        
        currentNode.children.set(key, newNode);
      }
      
      currentNode = currentNode.children.get(key)!;
      currentMask++;
    }
    
    // 在叶子节点添加配置对象
    currentNode.configObjects.push(configObject);
  }

  // 获取指定位置的位值
  private getBitAtPosition(ip: string, position: number): number {
    const ipNum = ipToNumber(ip);
    return (ipNum >>> (31 - position)) & 1;
  }

  // 获取指定掩码长度的网络地址
  private getNetworkAtMask(ip: string, mask: number): string {
    const ipNum = ipToNumber(ip);
    const networkNum = ipNum & (0xFFFFFFFF << (32 - mask));
    return numberToIp(networkNum);
  }

  // 深度优先遍历，提取 PEC
  public extractPECs(): Array<{ range: { start: string; end: string }; configObjects: ConfigObject[] }> {
    const pecs: Array<{ range: { start: string; end: string }; configObjects: ConfigObject[] }> = [];
    const visited = new Set<string>();
    
    this.dfsExtractPECs(this.root, visited, pecs);
    
    return pecs;
  }

  private dfsExtractPECs(
    node: TrieNode, 
    visited: Set<string>, 
    pecs: Array<{ range: { start: string; end: string }; configObjects: ConfigObject[] }>
  ): void {
    const nodeKey = `${node.prefix.network}/${node.prefix.mask}`;
    
    if (visited.has(nodeKey)) {
      return;
    }
    
    visited.add(nodeKey);
    
    // 如果节点有配置对象，创建 PEC
    if (node.configObjects.length > 0) {
      const range = getPrefixRange(node.prefix.network, node.prefix.mask);
      pecs.push({
        range,
        configObjects: [...node.configObjects]
      });
    }
    
    // 递归访问子节点
    for (const child of node.children.values()) {
      this.dfsExtractPECs(child, visited, pecs);
    }
  }

  // 查找包含指定 IP 的所有配置对象
  public findConfigsForIP(ip: string): ConfigObject[] {
    const configs: ConfigObject[] = [];
    this.findConfigsRecursive(this.root, ip, configs);
    return configs;
  }

  private findConfigsRecursive(node: TrieNode, ip: string, configs: ConfigObject[]): void {
    // 检查当前节点是否匹配
    if (this.isIPInPrefix(ip, node.prefix)) {
      configs.push(...node.configObjects);
    }
    
    // 递归检查子节点
    for (const child of node.children.values()) {
      this.findConfigsRecursive(child, ip, configs);
    }
  }

  // 检查 IP 是否在前缀范围内
  private isIPInPrefix(ip: string, prefix: Prefix): boolean {
    const range = getPrefixRange(prefix.network, prefix.mask);
    const ipNum = ipToNumber(ip);
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    
    return ipNum >= startNum && ipNum <= endNum;
  }

  // 获取所有前缀
  public getAllPrefixes(): Prefix[] {
    const prefixes: Prefix[] = [];
    this.collectPrefixes(this.root, prefixes);
    return prefixes;
  }

  private collectPrefixes(node: TrieNode, prefixes: Prefix[]): void {
    if (node.configObjects.length > 0) {
      prefixes.push(node.prefix);
    }
    
    for (const child of node.children.values()) {
      this.collectPrefixes(child, prefixes);
    }
  }

  // 打印 Trie 树结构（用于调试）
  public printTree(): void {
    this.printNode(this.root, 0);
  }

  private printNode(node: TrieNode, depth: number): void {
    // console.log(`${'  '.repeat(depth)}${node.prefix.network}/${node.prefix.mask} [${node.configObjects.length} configs]`);
    
    for (const child of node.children.values()) {
      this.printNode(child, depth + 1);
    }
  }
}
