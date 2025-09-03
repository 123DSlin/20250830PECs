# Network Configuration Analyzer

一个用于分析网络配置文件并提取 Packet Equivalence Classes (PEC) 的 Web 应用程序。

## 功能特性

- **配置文件解析**: 支持 Cisco 风格的网络配置文件 (.cfg, .txt)
- **多种配置类型识别**:
  - Static Routes
  - Access Lists
  - Prefix Lists
  - Route Maps
  - Interface Configurations
  - BGP Configurations
- **Trie 树构建**: 将所有前缀构建到 Trie 树中，记录配置来源
- **PEC 提取**: 使用深度优先遍历算法提取所有 Packet Equivalence Classes
- **交互式界面**: 现代化的 Web 界面，支持文件拖拽上传
- **结果导出**: 支持将分析结果导出为 JSON 格式

## 技术架构

- **前端**: React 18 + TypeScript
- **构建工具**: Vite
- **核心算法**: 
  - Trie 树数据结构
  - 深度优先遍历
  - IP 地址范围计算
  - PEC 生成算法

## 安装和运行

### 前置要求
- Node.js 16+ 
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本
```bash
npm run build
```

## 使用方法

1. **上传配置文件**: 拖拽或点击选择网络配置文件
2. **自动分析**: 系统自动解析配置并构建 Trie 树
3. **查看结果**: 在多个标签页中查看分析结果
4. **导出结果**: 点击导出按钮下载 JSON 格式的分析结果

## 分析结果说明

### Overview 标签页
- 配置对象统计
- PEC 统计信息
- 网络覆盖率

### Packet Equivalence Classes 标签页
- 所有提取的 PEC 列表
- 每个 PEC 的 IP 范围
- 贡献的前缀和配置对象

### Configuration Objects 标签页
- 所有解析的配置对象
- 前缀信息
- Match 和 Set 条件

### Trie Tree Structure 标签页
- Trie 树结构预览
- 节点信息展示

## 算法原理

### Trie 树构建
1. 从根节点 (0.0.0.0/0) 开始
2. 逐位插入前缀，创建必要的中间节点
3. 在叶子节点记录配置对象

### PEC 提取
1. 深度优先遍历 Trie 树
2. 识别前缀边界
3. 合并具有相同配置的连续 IP 范围
4. 生成最终的 PEC 列表

### IP 范围计算
- 使用位运算计算网络地址和广播地址
- 支持 CIDR 表示法
- 处理 ge/le 修饰符

## 支持的配置语法

### Prefix Lists
```
ip prefix-list NAME seq N permit/deny NETWORK/MASK [ge GE] [le LE]
```

### Route Maps
```
route-map NAME permit/deny N
 match ip address prefix-list NAME
 set community VALUE [additive]
```

### Interfaces
```
interface NAME
 ip address IP MASK
```

### BGP
```
router bgp ASN
 neighbor IP remote-as ASN
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── FileUpload.tsx  # 文件上传组件
│   └── AnalysisResults.tsx # 结果展示组件
├── types/              # TypeScript 类型定义
│   └── network.ts      # 网络配置相关类型
├── utils/              # 核心算法和工具
│   ├── configParser.ts # 配置文件解析器
│   ├── trieTree.ts     # Trie 树实现
│   ├── pecExtractor.ts # PEC 提取器
│   ├── networkAnalyzer.ts # 主分析器
│   └── ipUtils.ts      # IP 地址工具函数
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── App.css             # 样式文件
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
