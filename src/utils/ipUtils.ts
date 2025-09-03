// IP地址转换为数字
export function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
}

// 数字转换为IP地址
export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

// 计算网络地址
export function getNetworkAddress(ip: string, mask: number): string {
  const ipNum = ipToNumber(ip);
  const networkNum = ipNum & (0xFFFFFFFF << (32 - mask));
  return numberToIp(networkNum);
}

// 计算广播地址
export function getBroadcastAddress(ip: string, mask: number): string {
  const ipNum = ipToNumber(ip);
  const networkNum = ipNum & (0xFFFFFFFF << (32 - mask));
  const broadcastNum = networkNum | (0xFFFFFFFF >>> mask);
  return numberToIp(broadcastNum);
}

// 检查IP是否在范围内
export function isIpInRange(ip: string, start: string, end: string): boolean {
  const ipNum = ipToNumber(ip);
  const startNum = ipToNumber(start);
  const endNum = ipToNumber(end);
  return ipNum >= startNum && ipNum <= endNum;
}

// 获取前缀范围
export function getPrefixRange(prefix: string, mask: number): { start: string; end: string } {
  const network = getNetworkAddress(prefix, mask);
  const broadcast = getBroadcastAddress(prefix, mask);
  return { start: network, end: broadcast };
}

// 检查两个前缀是否重叠
export function prefixesOverlap(p1: Prefix, p2: Prefix): boolean {
  const range1 = getPrefixRange(p1.network, p1.mask);
  const range2 = getPrefixRange(p2.network, p2.mask);
  
  return !(range1.end < range2.start || range2.end < range1.start);
}

// 获取前缀的字符串表示
export function prefixToString(prefix: Prefix): string {
  let result = `${prefix.network}/${prefix.mask}`;
  if (prefix.ge !== undefined) result += ` ge ${prefix.ge}`;
  if (prefix.le !== undefined) result += ` le ${prefix.le}`;
  return result;
}
