// 配置对象类型
export interface ConfigObject {
  id: string;
  type: 'prefix-list' | 'route-map' | 'static-route' | 'interface' | 'bgp';
  router: string;
  name: string;
  prefixes: Prefix[];
  matchConditions?: MatchCondition[];
  setActions?: SetAction[];
  source: string; // 配置文件内容
}

// IP前缀
export interface Prefix {
  network: string; // 如 "192.0.2.0"
  mask: number;    // 如 24
  ge?: number;     // greater than or equal
  le?: number;     // less than or equal
}

// 匹配条件
export interface MatchCondition {
  type: 'ip' | 'community' | 'as-path';
  value: string;
  prefixList?: string;
}

// 设置动作
export interface SetAction {
  type: 'community' | 'local-pref' | 'med';
  value: string;
  additive?: boolean;
}

// Trie树节点
export interface TrieNode {
  prefix: Prefix;
  configObjects: ConfigObject[];
  children: Map<string, TrieNode>;
  parent?: TrieNode;
}

// Packet Equivalence Class
export interface PEC {
  id: string;
  range: {
    start: string;
    end: string;
  };
  configObjects: ConfigObject[];
  contributingPrefixes: Prefix[];
}

// 解析结果
export interface ParseResult {
  configObjects: ConfigObject[];
  trie: TrieNode;
  pecs: PEC[];
}
