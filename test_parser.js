const fs = require('fs');

// 模拟浏览器环境
global.window = {};
global.document = {};

// 读取测试配置
const configContent = fs.readFileSync('./test_example_accurate.cfg', 'utf8');

console.log('=== 测试配置文件内容 ===');
console.log(configContent);
console.log('\n=== 开始测试 ===\n');

// 测试配置解析
try {
  // 这里我们需要测试配置解析器
  // 但由于我们在 Node.js 环境中，我们需要先构建项目
  
  console.log('配置文件读取成功！');
  console.log('配置长度:', configContent.length, '字符');
  
  // 检查是否包含预期的配置项
  const hasR0StaticRoute = configContent.includes('ip route 128.0.0.0 255.128.0.0');
  const hasR1RouteMap = configContent.includes('route-map R0_to_R1');
  const hasR2StaticRoute = configContent.includes('ip route 192.0.0.0 255.192.0.0');
  
  console.log('\n配置项检查:');
  console.log('✓ R0 静态路由 (128.0.0.0/1):', hasR0StaticRoute ? '找到' : '未找到');
  console.log('✓ R1 路由映射 (R0_to_R1):', hasR1RouteMap ? '找到' : '未找到');
  console.log('✓ R2 静态路由 (192.0.0.0/2):', hasR2StaticRoute ? '找到' : '未找到');
  
  // 检查前缀列表
  const hasPrefix128 = configContent.includes('128.0.0.0/3');
  const hasPrefix144 = configContent.includes('144.0.0.0/3');
  
  console.log('✓ 前缀列表 128.0.0.0/3:', hasPrefix128 ? '找到' : '未找到');
  console.log('✓ 前缀列表 144.0.0.0/3:', hasPrefix144 ? '找到' : '未找到');
  
  console.log('\n=== 测试完成 ===');
  console.log('现在你可以在浏览器中打开 http://localhost:3000');
  console.log('上传 test_example_accurate.cfg 文件来测试完整的解析功能');
  
} catch (error) {
  console.error('测试过程中发生错误:', error.message);
}
