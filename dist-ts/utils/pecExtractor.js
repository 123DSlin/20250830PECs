"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PECExtractor = void 0;
const ipUtils_1 = require("./ipUtils");
class PECExtractor {
    constructor(trie) {
        Object.defineProperty(this, "trie", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pecs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.trie = trie;
    }
    // 提取所有 PEC
    extractPECs() {
        this.pecs = [];
        // 从 Trie 树获取所有前缀
        const allPrefixes = this.trie.getAllPrefixes();
        // 生成 PEC
        this.generatePECs(allPrefixes);
        return this.pecs;
    }
    // 生成 PEC - 使用清晰的逻辑
    generatePECs(prefixes) {
        if (prefixes.length === 0) {
            // 如果没有前缀，创建默认 PEC
            this.createPEC('0.0.0.0', '255.255.255.255', [], []);
            return;
        }
        // 按网络地址排序
        prefixes.sort((a, b) => {
            const aNum = (0, ipUtils_1.ipToNumber)(a.network);
            const bNum = (0, ipUtils_1.ipToNumber)(b.network);
            return aNum - bNum;
        });
        // 创建 PEC 范围
        this.createPECRanges(prefixes);
    }
    // 创建 PEC 范围
    createPECRanges(prefixes) {
        // 1. 创建第一个 PEC (0.0.0.0 - 127.255.255.255)
        if (prefixes.length > 0) {
            const firstPrefix = prefixes[0];
            const firstRange = (0, ipUtils_1.getPrefixRange)(firstPrefix.network, firstPrefix.mask);
            if ((0, ipUtils_1.ipToNumber)(firstRange.start) > 0) {
                this.createPEC('0.0.0.0', this.decrementIP(firstRange.start), [], []);
            }
        }
        // 2. 为每个前缀创建 PEC
        for (let i = 0; i < prefixes.length; i++) {
            const prefix = prefixes[i];
            const range = (0, ipUtils_1.getPrefixRange)(prefix.network, prefix.mask);
            const configs = this.getConfigsForPrefix(prefix);
            this.createPEC(range.start, range.end, configs, [prefix]);
        }
        // 3. 创建最后一个 PEC (192.0.0.0 - 255.255.255.255)
        if (prefixes.length > 0) {
            const lastPrefix = prefixes[prefixes.length - 1];
            const lastRange = (0, ipUtils_1.getPrefixRange)(lastPrefix.network, lastPrefix.mask);
            if ((0, ipUtils_1.ipToNumber)(lastRange.end) < (0, ipUtils_1.ipToNumber)('255.255.255.255')) {
                const emptyStart = this.incrementIP(lastRange.end);
                this.createPEC(emptyStart, '255.255.255.255', [], []);
            }
        }
    }
    // 获取指定前缀的配置对象
    getConfigsForPrefix(prefix) {
        const configs = [];
        // 为前缀创建配置对象
        const mockConfig = {
            id: `config_${prefix.network}_${prefix.mask}`,
            type: 'prefix-list',
            router: 'router',
            name: `prefix_${prefix.network}_${prefix.mask}`,
            prefixes: [prefix],
            source: `prefix ${prefix.network}/${prefix.mask}`
        };
        configs.push(mockConfig);
        return configs;
    }
    // 创建 PEC
    createPEC(start, end, configs, contributingPrefixes) {
        // 验证范围的有效性
        if ((0, ipUtils_1.ipToNumber)(start) > (0, ipUtils_1.ipToNumber)(end)) {
            return; // 跳过无效范围
        }
        const pec = {
            id: `pec_${this.pecs.length + 1}`,
            range: { start, end },
            configObjects: [...configs],
            contributingPrefixes: [...contributingPrefixes]
        };
        this.pecs.push(pec);
    }
    // IP 地址递增
    incrementIP(ip) {
        const num = (0, ipUtils_1.ipToNumber)(ip);
        return this.numberToIp(num + 1);
    }
    // IP 地址递减
    decrementIP(ip) {
        const num = (0, ipUtils_1.ipToNumber)(ip);
        return this.numberToIp(num - 1);
    }
    // 数字转IP地址
    numberToIp(num) {
        if (num < 0)
            num = 0;
        if (num > 4294967295)
            num = 4294967295;
        const octets = [];
        let tempNum = num;
        for (let i = 0; i < 4; i++) {
            octets.unshift(tempNum & 255);
            tempNum = tempNum >> 8;
        }
        return octets.join('.');
    }
    // 获取 PEC 统计信息
    getPECStats() {
        let totalIPs = 0;
        let configuredIPs = 0;
        this.pecs.forEach(pec => {
            const startNum = (0, ipUtils_1.ipToNumber)(pec.range.start);
            const endNum = (0, ipUtils_1.ipToNumber)(pec.range.end);
            const ipCount = endNum - startNum + 1;
            totalIPs += ipCount;
            if (pec.configObjects.length > 0) {
                configuredIPs += ipCount;
            }
        });
        return {
            totalPECs: this.pecs.length,
            configuredPECs: this.pecs.filter(p => p.configObjects.length > 0).length,
            emptyPECs: this.pecs.filter(p => p.configObjects.length === 0).length,
            totalIPs,
            configuredIPs
        };
    }
}
exports.PECExtractor = PECExtractor;
