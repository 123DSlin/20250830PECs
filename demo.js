const fs = require('fs');
const { NetworkAnalyzer } = require('./dist/utils/networkAnalyzer.js');

// 读取测试配置文件
const configContent = fs.readFileSync('./test_config.cfg', 'utf8');

console.log('=== Network Configuration Analyzer Demo ===\n');

try {
  // 创建分析器实例
  const analyzer = new NetworkAnalyzer();
  
  console.log('1. 验证配置文件...');
  const validation = analyzer.validateConfig(configContent);
  console.log(`   验证结果: ${validation.isValid ? '通过' : '失败'}`);
  
  if (validation.warnings.length > 0) {
    console.log('   警告:');
    validation.warnings.forEach(warning => console.log(`     - ${warning}`));
  }
  
  if (validation.errors.length > 0) {
    console.log('   错误:');
    validation.errors.forEach(error => console.log(`     - ${error}`));
  }
  
  console.log('\n2. 分析配置文件...');
  const results = analyzer.analyzeConfig(configContent);
  
  console.log(`   配置对象数量: ${results.configObjects.length}`);
  console.log(`   PEC 数量: ${results.pecs.length}`);
  
  console.log('\n3. 配置对象详情:');
  results.configObjects.forEach((config, index) => {
    console.log(`   ${index + 1}. ${config.type.toUpperCase()}: ${config.name}`);
    console.log(`      路由器: ${config.router}`);
    console.log(`      前缀数量: ${config.prefixes.length}`);
    
    if (config.prefixes.length > 0) {
      console.log(`      前缀: ${config.prefixes.map(p => `${p.network}/${p.mask}`).join(', ')}`);
    }
    
    if (config.matchConditions && config.matchConditions.length > 0) {
      console.log(`      匹配条件: ${config.matchConditions.length} 个`);
    }
    
    if (config.setActions && config.setActions.length > 0) {
      console.log(`      设置动作: ${config.setActions.length} 个`);
    }
    console.log('');
  });
  
  console.log('4. PEC 详情:');
  results.pecs.forEach((pec, index) => {
    console.log(`   ${index + 1}. ${pec.id}`);
    console.log(`      IP 范围: ${pec.range.start} - ${pec.range.end}`);
    console.log(`      配置对象: ${pec.configObjects.length} 个`);
    console.log(`      贡献前缀: ${pec.contributingPrefixes.length} 个`);
    console.log('');
  });
  
  console.log('5. 统计信息:');
  const stats = analyzer.getAnalysisStats();
  console.log(`   总配置对象: ${stats.totalConfigs}`);
  console.log(`   总前缀: ${stats.totalPrefixes}`);
  console.log(`   总 PEC: ${stats.totalPECs}`);
  console.log(`   配置 PEC: ${stats.configuredPECs}`);
  console.log(`   空 PEC: ${stats.emptyPECs}`);
  console.log(`   覆盖率: ${stats.coveragePercentage}%`);
  
  console.log('\n6. 搜索示例:');
  const searchResults = analyzer.searchIP('192.168.1.50');
  console.log(`   搜索 IP: ${searchResults.ip}`);
  console.log(`   匹配前缀: ${searchResults.matchingPrefixes.length} 个`);
  console.log(`   匹配 PEC: ${searchResults.matchingPECs.length} 个`);
  
  console.log('\n=== 演示完成 ===');
  
} catch (error) {
  console.error('演示过程中发生错误:', error.message);
  console.error(error.stack);
}
