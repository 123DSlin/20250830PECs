"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkAnalyzer = void 0;
const configParser_1 = require("./configParser");
const trieTree_1 = require("./trieTree");
const pecExtractor_1 = require("./pecExtractor");
const ipUtils_1 = require("./ipUtils");
class NetworkAnalyzer {
    constructor() {
        // 初始化
    }
    // 分析配置文件
    analyzeConfig(configContent) {
        // 解析配置
        this.configParser = new configParser_1.ConfigParser(configContent);
        const configObjects = this.configParser.parse();
        // 构建 Trie 树
        const trie = new trieTree_1.TrieTree();
        configObjects.forEach(config => {
            config.prefixes.forEach(prefix => {
                trie.insert(prefix, config);
            });
        });
        // 提取 PEC
        const pecExtractor = new pecExtractor_1.PECExtractor(trie, configObjects);
        const pecs = pecExtractor.extractPECs();
        return {
            configObjects,
            trie,
            pecs
        };
    }
    // 获取分析统计信息
    getAnalysisStats() {
        const configObjects = this.configParser ? this.configParser.parse() : [];
        const totalConfigs = configObjects.length;
        const totalPrefixes = configObjects.reduce((sum, config) => sum + config.prefixes.length, 0);
        // 构建Trie树来计算PEC
        const trie = new trieTree_1.TrieTree();
        configObjects.forEach(config => {
            config.prefixes.forEach(prefix => {
                trie.insert(prefix, config);
            });
        });
        const pecExtractor = new pecExtractor_1.PECExtractor(trie, configObjects);
        const pecs = pecExtractor.extractPECs();
        const configuredPECs = pecs.filter((p) => p.configObjects.length > 0).length;
        const emptyPECs = pecs.filter((p) => p.configObjects.length === 0).length;
        let totalIPs = 0;
        let configuredIPs = 0;
        pecs.forEach((pec) => {
            const startNum = (0, ipUtils_1.ipToNumber)(pec.range.start);
            const endNum = (0, ipUtils_1.ipToNumber)(pec.range.end);
            const ipCount = endNum - startNum + 1;
            totalIPs += ipCount;
            if (pec.configObjects.length > 0) {
                configuredIPs += ipCount;
            }
        });
        return {
            totalConfigs,
            totalPrefixes,
            totalPECs: pecs.length,
            configuredPECs,
            emptyPECs,
            totalIPs,
            configuredIPs
        };
    }
    // 导出分析结果
    exportResults() {
        if (!this.configParser) {
            return JSON.stringify({ error: 'No configuration analyzed yet' });
        }
        const configObjects = this.configParser.parse();
        const trie = new trieTree_1.TrieTree();
        configObjects.forEach(config => {
            config.prefixes.forEach(prefix => {
                trie.insert(prefix, config);
            });
        });
        const pecExtractor = new pecExtractor_1.PECExtractor(trie, configObjects);
        const pecs = pecExtractor.extractPECs();
        const exportData = {
            timestamp: new Date().toISOString(),
            configObjects,
            pecs,
            stats: this.getAnalysisStats()
        };
        return JSON.stringify(exportData, null, 2);
    }
    // 查找指定IP的配置
    findConfigsForIP(ip) {
        if (!this.configParser) {
            return [];
        }
        const configObjects = this.configParser.parse();
        const trie = new trieTree_1.TrieTree();
        configObjects.forEach(config => {
            config.prefixes.forEach(prefix => {
                trie.insert(prefix, config);
            });
        });
        return trie.findConfigsForIP(ip);
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
