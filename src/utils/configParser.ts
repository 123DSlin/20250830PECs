

import { ConfigObject, Prefix, MatchCondition, SetAction } from '../types/network';

export class ConfigParser {
  private content: string;
  private routerName: string;
  private configObjects: ConfigObject[] = [];

  constructor(content: string) {
    this.content = content;
    this.routerName = this.extractRouterName();
  }

  private extractRouterName(): string {
    const hostnameMatch = this.content.match(/hostname\s+(\S+)/);
    return hostnameMatch ? hostnameMatch[1] : 'unknown';
  }

  public parse(): ConfigObject[] {
    this.parsePrefixLists();
    this.parseRouteMaps();
    this.parseInterfaces();
    this.parseBGP();
    return this.configObjects;
  }

  private parsePrefixLists(): void {
    const prefixListRegex = /ip prefix-list\s+(\S+)\s+seq\s+(\d+)\s+(permit|deny)\s+([^\s]+)(?:\s+(ge|le)\s+(\d+))?(?:\s+(ge|le)\s+(\d+))?/g;
    let match;

    while ((match = prefixListRegex.exec(this.content)) !== null) {
      const [, name, seq, , network, ge1, geVal1, le1, leVal1] = match;
      
      // 解析网络地址和掩码
      const [ip, maskStr] = network.split('/');
      const mask = parseInt(maskStr);
      
      const prefix: Prefix = {
        network: ip,
        mask: mask
      };

      // 处理 ge 和 le 参数
      if (ge1 === 'ge' && geVal1) {
        prefix.ge = parseInt(geVal1);
      } else if (le1 === 'le' && leVal1) {
        prefix.le = parseInt(leVal1);
      }

      if (ge1 === 'le' && geVal1) {
        prefix.le = parseInt(geVal1);
      } else if (le1 === 'ge' && leVal1) {
        prefix.ge = parseInt(leVal1);
      }

      const configObj: ConfigObject = {
        id: `${name}_seq_${seq}`,
        type: 'prefix-list',
        router: this.routerName,
        name: name,
        prefixes: [prefix],
        source: match[0]
      };

      this.configObjects.push(configObj);
    }
  }

  private parseRouteMaps(): void {
    const routeMapRegex = /route-map\s+(\S+)\s+(permit|deny)\s+(\d+)(?:\s+([^!]+))?/g;
    let match;

    while ((match = routeMapRegex.exec(this.content)) !== null) {
      const [, name, action, seq, config] = match;
      
      const configObj: ConfigObject = {
        id: `${name}_${action}_${seq}`,
        type: 'route-map',
        router: this.routerName,
        name: name,
        prefixes: [],
        matchConditions: [],
        setActions: [],
        source: match[0]
      };

      // 解析 match 和 set 语句
      if (config) {
        this.parseRouteMapConfig(config, configObj);
      }

      this.configObjects.push(configObj);
    }
  }

  private parseRouteMapConfig(config: string, configObj: ConfigObject): void {
    // 解析 match 语句
    const matchRegex = /match\s+(ip\s+address\s+prefix-list\s+(\S+)|community\s+(\S+)|as-path\s+(\S+))/g;
    let match;
    
    while ((match = matchRegex.exec(config)) !== null) {
      const matchCondition: MatchCondition = {
        type: 'ip',
        value: match[1]
      };

      if (match[2]) { // prefix-list
        matchCondition.type = 'ip';
        matchCondition.prefixList = match[2];
      } else if (match[3]) { // community
        matchCondition.type = 'community';
        matchCondition.value = match[3];
      } else if (match[4]) { // as-path
        matchCondition.type = 'as-path';
        matchCondition.value = match[4];
      }

      configObj.matchConditions!.push(matchCondition);
    }

    // 解析 set 语句
    const setRegex = /set\s+(community\s+(\S+)(?:\s+additive)?|local-preference\s+(\d+)|med\s+(\d+))/g;
    
    while ((match = setRegex.exec(config)) !== null) {
      const setAction: SetAction = {
        type: 'community',
        value: match[1]
      };

      if (match[2]) { // community
        setAction.type = 'community';
        setAction.value = match[2];
        setAction.additive = config.includes('additive');
      } else if (match[3]) { // local-preference
        setAction.type = 'local-pref';
        setAction.value = match[3];
      } else if (match[4]) { // med
        setAction.type = 'med';
        setAction.value = match[4];
      }

      configObj.setActions!.push(setAction);
    }
  }

  private parseInterfaces(): void {
    const interfaceRegex = /interface\s+(\S+)\s*\n(?:[^!]*?ip address\s+([^\s]+)\s+([^\s\n]+)[^!]*?)/g;
    let match;

    while ((match = interfaceRegex.exec(this.content)) !== null) {
      const [, interfaceName, ip, mask] = match;
      
      // 计算网络地址
      const maskBits = this.subnetMaskToBits(mask);
      const network = this.getNetworkAddress(ip, maskBits);
      
      const prefix: Prefix = {
        network: network,
        mask: maskBits
      };

      const configObj: ConfigObject = {
        id: `interface_${interfaceName}`,
        type: 'interface',
        router: this.routerName,
        name: interfaceName,
        prefixes: [prefix],
        source: match[0]
      };

      this.configObjects.push(configObj);
    }
  }

  private parseBGP(): void {
    const bgpRegex = /router bgp\s+(\d+)([^!]*?)/g;
    let match;

    while ((match = bgpRegex.exec(this.content)) !== null) {
      const [, asn] = match;
      
      const configObj: ConfigObject = {
        id: `bgp_as_${asn}`,
        type: 'bgp',
        router: this.routerName,
        name: `BGP AS ${asn}`,
        prefixes: [],
        source: match[0]
      };

      this.configObjects.push(configObj);
    }
  }

  private subnetMaskToBits(mask: string): number {
    const octets = mask.split('.').map(Number);
    return octets.reduce((count, octet) => {
      return count + (octet >>> 0).toString(2).replace(/0/g, '').length;
    }, 0);
  }

  private getNetworkAddress(ip: string, maskBits: number): string {
    const octets = ip.split('.').map(Number);
    const mask = 0xFFFFFFFF << (32 - maskBits);
    
    const networkOctets = octets.map((octet, i) => {
      const shift = 24 - (i * 8);
      return (octet & (mask >>> shift)) & 0xFF;
    });
    
    return networkOctets.join('.');
  }
}
