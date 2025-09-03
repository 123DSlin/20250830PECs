"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigParser = void 0;
class ConfigParser {
    constructor(content) {
        this.configObjects = [];
        this.content = content;
    }
    parse() {
        this.configObjects = [];
        // 按路由器分割配置
        const routerConfigs = this.splitRouterConfigs();
        // 为每个路由器解析配置
        routerConfigs.forEach(routerConfig => {
            this.parseRouterConfig(routerConfig);
        });
        return this.configObjects;
    }
    splitRouterConfigs() {
        const routerConfigs = [];
        // 使用更可靠的分割方法
        const sections = this.content.split(/(?=^!$)/m);
        console.log('分割后的配置段数量:', sections.length);
        sections.forEach((section, index) => {
            console.log(`配置段 ${index + 1}:`, section.substring(0, 100) + '...');
            const hostnameMatch = section.match(/hostname\s+(\S+)/);
            if (hostnameMatch) {
                console.log(`找到路由器: ${hostnameMatch[1]}`);
                routerConfigs.push({
                    hostname: hostnameMatch[1],
                    config: section
                });
            }
            else {
                console.log(`配置段 ${index + 1} 没有找到hostname`);
            }
        });
        console.log('最终路由器配置数量:', routerConfigs.length);
        return routerConfigs;
    }
    parseRouterConfig(routerConfig) {
        const routerName = routerConfig.hostname;
        const config = routerConfig.config;
        // 解析该路由器的各种配置
        this.parsePrefixListsForRouter(config, routerName);
        this.parseRouteMapsForRouter(config, routerName);
        this.parseStaticRoutesForRouter(config, routerName);
        this.parseInterfacesForRouter(config, routerName);
        this.parseBGPForRouter(config, routerName);
    }
    parsePrefixListsForRouter(config, routerName) {
        const prefixListRegex = /ip prefix-list\s+(\S+)\s+seq\s+(\d+)\s+(permit|deny)\s+([^\s]+)(?:\s+(ge|le)\s+(\d+))?(?:\s+(ge|le)\s+(\d+))?/g;
        let match;
        while ((match = prefixListRegex.exec(config)) !== null) {
            const [, name, seq, , network, ge1, geVal1, le1, leVal1] = match;
            // 解析网络地址和掩码
            const [ip, maskStr] = network.split('/');
            const mask = parseInt(maskStr);
            const prefix = {
                network: ip,
                mask: mask
            };
            // 处理 ge 和 le 参数
            if (ge1 === 'ge' && geVal1) {
                prefix.ge = parseInt(geVal1);
            }
            else if (le1 === 'le' && leVal1) {
                prefix.le = parseInt(leVal1);
            }
            if (ge1 === 'le' && geVal1) {
                prefix.le = parseInt(geVal1);
            }
            else if (le1 === 'ge' && geVal1) {
                prefix.ge = parseInt(geVal1);
            }
            const configObj = {
                id: `${routerName}_${name}_seq_${seq}`,
                type: 'prefix-list',
                router: routerName,
                name: name,
                prefixes: [prefix],
                source: match[0]
            };
            this.configObjects.push(configObj);
        }
    }
    parseRouteMapsForRouter(config, routerName) {
        const routeMapRegex = /route-map\s+(\S+)\s+(permit|deny)\s+(\d+)(?:\s+([^!]+))?/g;
        let match;
        while ((match = routeMapRegex.exec(config)) !== null) {
            const [, name, action, seq, routeMapConfig] = match;
            const configObj = {
                id: `${routerName}_${name}_${action}_${seq}`,
                type: 'route-map',
                router: routerName,
                name: name,
                prefixes: [],
                matchConditions: [],
                setActions: [],
                source: match[0]
            };
            // 解析 match 和 set 语句
            if (routeMapConfig) {
                this.parseRouteMapConfig(routeMapConfig, configObj);
            }
            this.configObjects.push(configObj);
        }
    }
    parseStaticRoutesForRouter(config, routerName) {
        const staticRouteRegex = /ip route\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/g;
        let match;
        while ((match = staticRouteRegex.exec(config)) !== null) {
            const [, network, mask, nextHop] = match;
            // 计算网络地址和掩码
            const maskBits = this.subnetMaskToBits(mask);
            const networkAddr = this.getNetworkAddress(network, maskBits);
            const prefix = {
                network: networkAddr,
                mask: maskBits
            };
            const configObj = {
                id: `${routerName}_static_${network}_${mask}`,
                type: 'static-route',
                router: routerName,
                name: `Static route to ${network}/${mask}`,
                prefixes: [prefix],
                source: match[0]
            };
            this.configObjects.push(configObj);
        }
    }
    parseInterfacesForRouter(config, routerName) {
        const interfaceRegex = /interface\s+(\S+)\s*\n(?:[^!]*?ip address\s+([^\s]+)\s+([^\s\n]+)[^!]*?)/g;
        let match;
        while ((match = interfaceRegex.exec(config)) !== null) {
            const [, interfaceName, ip, mask] = match;
            // 计算网络地址
            const maskBits = this.subnetMaskToBits(mask);
            const network = this.getNetworkAddress(ip, maskBits);
            const prefix = {
                network: network,
                mask: maskBits
            };
            const configObj = {
                id: `${routerName}_interface_${interfaceName}`,
                type: 'interface',
                router: routerName,
                name: interfaceName,
                prefixes: [prefix],
                source: match[0]
            };
            this.configObjects.push(configObj);
        }
    }
    parseBGPForRouter(config, routerName) {
        const bgpRegex = /router bgp\s+(\d+)([^!]*?)/g;
        let match;
        while ((match = bgpRegex.exec(config)) !== null) {
            const [, asn] = match;
            const configObj = {
                id: `${routerName}_bgp_as_${asn}`,
                type: 'bgp',
                router: routerName,
                name: `BGP AS ${asn}`,
                prefixes: [],
                source: match[0]
            };
            this.configObjects.push(configObj);
        }
    }
    parseRouteMapConfig(config, configObj) {
        // 解析 match 语句
        const matchRegex = /match\s+(ip\s+address\s+prefix-list\s+(\S+)|community\s+(\S+)|as-path\s+(\S+))/g;
        let match;
        while ((match = matchRegex.exec(config)) !== null) {
            const matchCondition = {
                type: 'ip',
                value: match[1]
            };
            if (match[2]) { // prefix-list
                matchCondition.type = 'ip';
                matchCondition.prefixList = match[2];
            }
            else if (match[3]) { // community
                matchCondition.type = 'community';
                matchCondition.value = match[3];
            }
            else if (match[4]) { // as-path
                matchCondition.type = 'as-path';
                matchCondition.value = match[4];
            }
            configObj.matchConditions.push(matchCondition);
        }
        // 解析 set 语句
        const setRegex = /set\s+(community\s+(\S+)(?:\s+additive)?|local-preference\s+(\d+)|med\s+(\d+))/g;
        while ((match = setRegex.exec(config)) !== null) {
            const setAction = {
                type: 'community',
                value: match[1]
            };
            if (match[2]) { // community
                setAction.type = 'community';
                setAction.value = match[2];
                setAction.additive = config.includes('additive');
            }
            else if (match[3]) { // local-preference
                setAction.type = 'local-pref';
                setAction.value = match[3];
            }
            else if (match[4]) { // med
                setAction.type = 'med';
                setAction.value = match[4];
            }
            configObj.setActions.push(setAction);
        }
    }
    subnetMaskToBits(mask) {
        const octets = mask.split('.').map(Number);
        return octets.reduce((count, octet) => {
            return count + (octet >>> 0).toString(2).replace(/0/g, '').length;
        }, 0);
    }
    getNetworkAddress(ip, maskBits) {
        const octets = ip.split('.').map(Number);
        const mask = 0xFFFFFFFF << (32 - maskBits);
        const networkOctets = octets.map((octet, i) => {
            const shift = 24 - (i * 8);
            return (octet & (mask >>> shift)) & 0xFF;
        });
        return networkOctets.join('.');
    }
}
exports.ConfigParser = ConfigParser;
