const fs = require('fs');
const { NetworkAnalyzer } = require('./dist-ts/utils/networkAnalyzer.js');

// 读取配置文件
const configContent = fs.readFileSync('./test_conex.cfg', 'utf8');

console.log('=== 测试配置文件内容 ===');
console.log(configContent);
console.log('\n=== 开始分析 ===');

try {
  // 创建网络分析器
  const analyzer = new NetworkAnalyzer();
  
  // 分析配置
  const results = analyzer.analyzeConfig(configContent);
  
  console.log('\n=== 分析结果 ===');
  console.log('配置对象数量:', results.configObjects.length);
  console.log('Trie 树前缀数量:', results.trie ? '已构建' : '未构建');
  console.log('PEC 数量:', results.pecs.length);
  
  console.log('\n=== 配置对象详情 ===');
  results.configObjects.forEach((obj, index) => {
    console.log(`${index + 1}. ${obj.type} - ${obj.name}`);
    console.log(`   路由器: ${obj.router}`);
    console.log(`   前缀: ${obj.prefixes.map(p => `${p.network}/${p.mask}`).join(', ')}`);
    console.log(`   来源: ${obj.source}`);
    console.log('');
  });
  
  console.log('\n=== PEC 详情 ===');
  results.pecs.forEach((pec, index) => {
    console.log(`${index + 1}. ${pec.id}`);
    console.log(`   范围: ${pec.range.start} - ${pec.range.end}`);
    console.log(`   配置对象数量: ${pec.configObjects.length}`);
    console.log(`   贡献前缀数量: ${pec.contributingPrefixes.length}`);
    
    if (pec.configObjects.length > 0) {
      console.log(`   配置对象: ${pec.configObjects.map(c => c.name).join(', ')}`);
    }
    
    if (pec.contributingPrefixes.length > 0) {
      console.log(`   贡献前缀: ${pec.contributingPrefixes.map(p => `${p.network}/${p.mask}`).join(', ')}`);
    }
    console.log('');
  });
  
  // 验证 PEC 范围
  console.log('=== PEC 范围验证 ===');
  const expectedRanges = [
    { start: '0.0.0.0', end: '127.255.255.255', desc: '无配置范围' },
    { start: '128.0.0.0', end: '143.255.255.255', desc: 'prefix_128_144 范围' },
    { start: '144.0.0.0', end: '191.255.255.255', desc: 'prefix_144_192 范围' },
    { start: '192.0.0.0', end: '255.255.255.255', desc: 'R0和R2静态路由重叠范围' }
  ];
  
  expectedRanges.forEach((expected, index) => {
    const found = results.pecs.find(pec => 
      pec.range.start === expected.start && pec.range.end === expected.end
    );
    
    if (found) {
      console.log(`✓ PEC ${index + 1}: ${expected.start} - ${expected.end} (${expected.desc})`);
    } else {
      console.log(`✗ PEC ${index + 1}: ${expected.start} - ${expected.end} (${expected.desc}) - 未找到`);
    }
  });
  
} catch (error) {
  console.error('分析过程中出现错误:', error);
  console.error('错误堆栈:', error.stack);
}
