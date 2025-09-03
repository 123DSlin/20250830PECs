import { PEC, ConfigObject, Prefix } from '../types/network';
import { TrieTree } from './trieTree';
import { getPrefixRange, ipToNumber, numberToIp } from './ipUtils';

export class PECExtractor {
  private trie: TrieTree;
  private pecs: PEC[] = [];

  constructor(trie: TrieTree) {
    this.trie = trie;
  }

  // 提取所有 PEC
  public extractPECs(): PEC[] {
    this.pecs = [];
    
    // 从 Trie 树获取所有前缀
    const allPrefixes = this.trie.getAllPrefixes();
    
    // 按网络地址排序
    allPrefixes.sort((a, b) => {
      const aNum = ipToNumber(a.network);
      const bNum = ipToNumber(b.network);
      return aNum - bNum;
    });

    // 生成 PEC
    this.generatePECs(allPrefixes);
    
    return this.pecs;
  }

  // 生成 PEC
  private generatePECs(prefixes: Prefix[]): void {
    if (prefixes.length === 0) return;

    let currentStart = '0.0.0.0';
    let currentEnd = '255.255.255.255';
    let currentConfigs: ConfigObject[] = [];
    let currentContributingPrefixes: Prefix[] = [];

    // 遍历所有前缀，识别边界
    for (let i = 0; i < prefixes.length; i++) {
      const prefix = prefixes[i];
      const range = getPrefixRange(prefix.network, prefix.mask);
      
      // 检查是否需要创建新的 PEC
      if (this.shouldCreateNewPEC(range, currentStart, currentEnd, currentConfigs)) {
        // 保存当前 PEC
        if (currentConfigs.length > 0 || currentContributingPrefixes.length > 0) {
          this.createPEC(currentStart, currentEnd, currentConfigs, currentContributingPrefixes);
        }
        
        // 开始新的 PEC
        currentStart = range.start;
        currentEnd = range.end;
        currentConfigs = this.getConfigsForPrefix(prefix);
        currentContributingPrefixes = [prefix];
      } else {
        // 扩展当前 PEC
        currentStart = this.minIP(currentStart, range.start);
        currentEnd = this.maxIP(currentEnd, range.end);
        currentConfigs = this.mergeConfigs(currentConfigs, this.getConfigsForPrefix(prefix));
        currentContributingPrefixes.push(prefix);
      }
    }

    // 创建最后一个 PEC
    if (currentConfigs.length > 0 || currentContributingPrefixes.length > 0) {
      this.createPEC(currentStart, currentEnd, currentConfigs, currentContributingPrefixes);
    }

    // 填充没有配置的 IP 范围
    this.fillEmptyRanges(prefixes);
  }

  // 判断是否需要创建新的 PEC
  private shouldCreateNewPEC(
    newRange: { start: string; end: string },
    currentStart: string,
    currentEnd: string,
    currentConfigs: ConfigObject[]
  ): boolean {
    // 如果新范围与当前范围不重叠，需要新 PEC
    if (newRange.end < currentStart || newRange.start > currentEnd) {
      return true;
    }

    // 如果配置发生变化，需要新 PEC
    const newConfigs = this.getConfigsForRange(newRange);
    if (!this.configsEqual(currentConfigs, newConfigs)) {
      return true;
    }

    return false;
  }

  // 获取指定前缀的配置对象
  private getConfigsForPrefix(prefix: Prefix): ConfigObject[] {
    // 这里需要从 Trie 树中查找配置对象
    // 简化实现，实际应该从 Trie 树获取
    return [];
  }

  // 获取指定范围的配置对象
  private getConfigsForRange(range: { start: string; end: string }): ConfigObject[] {
    // 从 Trie 树中查找覆盖该范围的所有配置对象
    const configs: ConfigObject[] = [];
    
    // 遍历 Trie 树，找到所有重叠的前缀
    this.trie.extractPECs().forEach(pec => {
      if (this.rangesOverlap(pec.range, range)) {
        configs.push(...pec.configObjects);
      }
    });
    
    return configs;
  }

  // 检查两个范围是否重叠
  private rangesOverlap(
    range1: { start: string; end: string },
    range2: { start: string; end: string }
  ): boolean {
    return !(range1.end < range2.start || range2.end < range1.start);
  }

  // 合并配置对象
  private mergeConfigs(configs1: ConfigObject[], configs2: ConfigObject[]): ConfigObject[] {
    const merged = [...configs1];
    
    for (const config of configs2) {
      if (!merged.some(c => c.id === config.id)) {
        merged.push(config);
      }
    }
    
    return merged;
  }

  // 比较两个配置对象数组是否相等
  private configsEqual(configs1: ConfigObject[], configs2: ConfigObject[]): boolean {
    if (configs1.length !== configs2.length) return false;
    
    const ids1 = new Set(configs1.map(c => c.id));
    const ids2 = new Set(configs2.map(c => c.id));
    
    for (const id of ids1) {
      if (!ids2.has(id)) return false;
    }
    
    return true;
  }

  // 创建 PEC
  private createPEC(start: string, end: string, configs: ConfigObject[], contributingPrefixes: Prefix[]): void {
    const pec: PEC = {
      id: `pec_${this.pecs.length + 1}`,
      range: { start, end },
      configObjects: [...configs],
      contributingPrefixes: [...contributingPrefixes]
    };
    
    this.pecs.push(pec);
  }

  // 填充空的 IP 范围
  private fillEmptyRanges(prefixes: Prefix[]): void {
    const sortedPECs = [...this.pecs].sort((a, b) => {
      return ipToNumber(a.range.start) - ipToNumber(b.range.start);
    });

    const newPECs: PEC[] = [];
    let currentIP = '0.0.0.0';

    for (const pec of sortedPECs) {
      if (ipToNumber(pec.range.start) > ipToNumber(currentIP)) {
        // 创建空的 PEC
        const emptyPEC: PEC = {
          id: `pec_empty_${newPECs.length + 1}`,
          range: { start: currentIP, end: this.decrementIP(pec.range.start) },
          configObjects: [],
          contributingPrefixes: []
        };
        newPECs.push(emptyPEC);
      }
      currentIP = this.incrementIP(pec.range.end);
    }

    // 添加最后一个空范围
    if (ipToNumber(currentIP) <= ipToNumber('255.255.255.255')) {
      const emptyPEC: PEC = {
        id: `pec_empty_${newPECs.length + 1}`,
        range: { start: currentIP, end: '255.255.255.255' },
        configObjects: [],
        contributingPrefixes: []
      };
      newPECs.push(emptyPEC);
    }

    this.pecs.push(...newPECs);
  }

  // IP 地址递增
  private incrementIP(ip: string): string {
    const num = ipToNumber(ip);
    return numberToIp(num + 1);
  }

  // IP 地址递减
  private decrementIP(ip: string): string {
    const num = ipToNumber(ip);
    return numberToIp(num - 1);
  }

  // 获取最小 IP
  private minIP(ip1: string, ip2: string): string {
    return ipToNumber(ip1) < ipToNumber(ip2) ? ip1 : ip2;
  }

  // 获取最大 IP
  private maxIP(ip1: string, ip2: string): string {
    return ipToNumber(ip1) > ipToNumber(ip2) ? ip1 : ip2;
  }

  // 获取 PEC 统计信息
  public getPECStats(): {
    totalPECs: number;
    configuredPECs: number;
    emptyPECs: number;
    totalIPs: number;
    configuredIPs: number;
  } {
    let totalIPs = 0;
    let configuredIPs = 0;

    this.pecs.forEach(pec => {
      const startNum = ipToNumber(pec.range.start);
      const endNum = ipToNumber(pec.range.end);
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
