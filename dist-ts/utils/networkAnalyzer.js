"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkAnalyzer = void 0;
const configParser_1 = require("./configParser");
const trieTree_1 = require("./trieTree");
const pecExtractor_1 = require("./pecExtractor");
class NetworkAnalyzer {
    constructor() {
        Object.defineProperty(this, "configParser", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "trie", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pecExtractor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.trie = new trieTree_1.TrieTree();
        this.pecExtractor = new pecExtractor_1.PECExtractor(this.trie);
    }
    // 分析配置文件
    analyzeConfig(configContent) {
        // 解析配置
        this.configParser = new configParser_1.ConfigParser(configContent);
        const configObjects = this.configParser.parse();
        // 构建 Trie 树
        this.buildTrie(configObjects);
        // 提取 PEC
        const pecs = this.pecExtractor.extractPECs();
        return {
            configObjects,
            trie: this.trie.root,
            pecs
        };
    }
    // 构建 Trie 树
    buildTrie(configObjects) {
        // 清空现有的 Trie 树
        this.trie = new trieTree_1.TrieTree();
        this.pecExtractor = new pecExtractor_1.PECExtractor(this.trie);
        // 插入所有前缀到 Trie 树
        configObjects.forEach(configObj => {
            configObj.prefixes.forEach(prefix => {
                this.trie.insert(prefix, configObj);
            });
        });
    }
    // 获取分析统计信息
    getAnalysisStats() {
        const configObjects = this.configParser ? this.configParser.parse() : [];
        const pecs = this.pecExtractor ? this.pecExtractor.extractPECs() : [];
        const totalPrefixes = configObjects.reduce((sum, config) => sum + config.prefixes.length, 0);
        const configuredPECs = pecs.filter(p => p.configObjects.length > 0).length;
        const emptyPECs = pecs.filter(p => p.configObjects.length === 0).length;
        const coveragePercentage = pecs.length > 0 ? (configuredPECs / pecs.length) * 100 : 0;
        return {
            totalConfigs: configObjects.length,
            totalPrefixes,
            totalPECs: pecs.length,
            configuredPECs,
            emptyPECs,
            coveragePercentage: Math.round(coveragePercentage * 100) / 100
        };
    }
    // 搜索特定 IP 的配置
    searchIP(ip) {
        const matchingPrefixes = [];
        const matchingPECs = [];
        // 查找匹配的前缀
        const configObjects = this.configParser ? this.configParser.parse() : [];
        configObjects.forEach(configObj => {
            configObj.prefixes.forEach(prefix => {
                if (this.isIPInPrefix(ip, prefix)) {
                    matchingPrefixes.push({
                        prefix: `${prefix.network}/${prefix.mask}`,
                        configs: [configObj]
                    });
                }
            });
        });
        // 查找匹配的 PEC
        const pecs = this.pecExtractor ? this.pecExtractor.extractPECs() : [];
        pecs.forEach(pec => {
            if (this.isIPInRange(ip, pec.range.start, pec.range.end)) {
                matchingPECs.push(pec);
            }
        });
        return {
            ip,
            matchingPrefixes,
            matchingPECs
        };
    }
    // 检查 IP 是否在前缀范围内
    isIPInPrefix(ip, prefix) {
        const ipNum = this.ipToNumber(ip);
        const networkNum = this.ipToNumber(prefix.network);
        const mask = 0xFFFFFFFF << (32 - prefix.mask);
        const networkAddress = networkNum & mask;
        const broadcastAddress = networkAddress | (0xFFFFFFFF >>> prefix.mask);
        return ipNum >= networkAddress && ipNum <= broadcastAddress;
    }
    // 检查 IP 是否在范围内
    isIPInRange(ip, start, end) {
        const ipNum = this.ipToNumber(ip);
        const startNum = this.ipToNumber(start);
        const endNum = this.ipToNumber(end);
        return ipNum >= startNum && ipNum <= endNum;
    }
    // IP 地址转换为数字
    ipToNumber(ip) {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
    }
    // 导出分析结果为 JSON
    exportResults() {
        const configObjects = this.configParser ? this.configParser.parse() : [];
        const pecs = this.pecExtractor ? this.pecExtractor.extractPECs() : [];
        const stats = this.getAnalysisStats();
        const exportData = {
            timestamp: new Date().toISOString(),
            statistics: stats,
            configurationObjects: configObjects,
            packetEquivalenceClasses: pecs
        };
        return JSON.stringify(exportData, null, 2);
    }
    // 验证配置文件的完整性
    validateConfig(configContent) {
        const errors = [];
        const warnings = [];
        // 检查基本语法
        if (!configContent.includes('hostname')) {
            warnings.push('No hostname found in configuration');
        }
        if (!configContent.includes('interface')) {
            warnings.push('No interface configuration found');
        }
        // 检查 BGP 配置
        if (configContent.includes('router bgp')) {
            if (!configContent.includes('neighbor')) {
                warnings.push('BGP configured but no neighbors defined');
            }
        }
        // 检查 prefix-list 语法
        const prefixListRegex = /ip prefix-list\s+\S+\s+seq\s+\d+\s+(permit|deny)\s+[^\s]+/g;
        const prefixListMatches = configContent.match(prefixListRegex);
        if (prefixListMatches) {
            prefixListMatches.forEach(match => {
                if (!match.includes('/')) {
                    errors.push(`Invalid prefix-list syntax: ${match}`);
                }
            });
        }
        // 检查 route-map 语法
        const routeMapRegex = /route-map\s+\S+\s+(permit|deny)\s+\d+/g;
        const routeMapMatches = configContent.match(routeMapRegex);
        if (routeMapMatches) {
            routeMapMatches.forEach(match => {
                if (!configContent.includes(`match`) && !configContent.includes(`set`)) {
                    warnings.push(`Route-map ${match} has no match or set statements`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.NetworkAnalyzer = NetworkAnalyzer;
