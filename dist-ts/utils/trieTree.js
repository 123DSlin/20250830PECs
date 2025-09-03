"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrieTree = void 0;
const ipUtils_1 = require("./ipUtils");
class TrieTree {
    constructor() {
        Object.defineProperty(this, "root", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.root = {
            prefix: { network: '0.0.0.0', mask: 0 },
            configObjects: [],
            children: new Map()
        };
    }
    // 插入前缀和配置对象
    insert(prefix, configObject) {
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
                const newPrefix = {
                    network: this.getNetworkAtMask(network, currentMask + 1),
                    mask: currentMask + 1
                };
                const newNode = {
                    prefix: newPrefix,
                    configObjects: [],
                    children: new Map(),
                    parent: currentNode
                };
                currentNode.children.set(key, newNode);
            }
            currentNode = currentNode.children.get(key);
            currentMask++;
        }
        // 在叶子节点添加配置对象
        currentNode.configObjects.push(configObject);
    }
    // 获取指定位置的位值
    getBitAtPosition(ip, position) {
        const ipNum = (0, ipUtils_1.ipToNumber)(ip);
        return (ipNum >>> (31 - position)) & 1;
    }
    // 获取指定掩码长度的网络地址
    getNetworkAtMask(ip, mask) {
        const ipNum = (0, ipUtils_1.ipToNumber)(ip);
        const networkNum = ipNum & (0xFFFFFFFF << (32 - mask));
        return (0, ipUtils_1.numberToIp)(networkNum);
    }
    // 深度优先遍历，提取 PEC
    extractPECs() {
        const pecs = [];
        const visited = new Set();
        this.dfsExtractPECs(this.root, visited, pecs);
        return pecs;
    }
    dfsExtractPECs(node, visited, pecs) {
        const nodeKey = `${node.prefix.network}/${node.prefix.mask}`;
        if (visited.has(nodeKey)) {
            return;
        }
        visited.add(nodeKey);
        // 如果节点有配置对象，创建 PEC
        if (node.configObjects.length > 0) {
            const range = (0, ipUtils_1.getPrefixRange)(node.prefix.network, node.prefix.mask);
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
    findConfigsForIP(ip) {
        const configs = [];
        this.findConfigsRecursive(this.root, ip, configs);
        return configs;
    }
    findConfigsRecursive(node, ip, configs) {
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
    isIPInPrefix(ip, prefix) {
        const range = (0, ipUtils_1.getPrefixRange)(prefix.network, prefix.mask);
        const ipNum = (0, ipUtils_1.ipToNumber)(ip);
        const startNum = (0, ipUtils_1.ipToNumber)(range.start);
        const endNum = (0, ipUtils_1.ipToNumber)(range.end);
        return ipNum >= startNum && ipNum <= endNum;
    }
    // 获取所有前缀
    getAllPrefixes() {
        const prefixes = [];
        this.collectPrefixes(this.root, prefixes);
        return prefixes;
    }
    collectPrefixes(node, prefixes) {
        if (node.configObjects.length > 0) {
            prefixes.push(node.prefix);
        }
        for (const child of node.children.values()) {
            this.collectPrefixes(child, prefixes);
        }
    }
    // 打印 Trie 树结构（用于调试）
    printTree() {
        this.printNode(this.root, 0);
    }
    printNode(node, depth) {
        // console.log(`${'  '.repeat(depth)}${node.prefix.network}/${node.prefix.mask} [${node.configObjects.length} configs]`);
        for (const child of node.children.values()) {
            this.printNode(child, depth + 1);
        }
    }
}
exports.TrieTree = TrieTree;
