# 隐私声明解析器

一款自动化工具，用于从各种电商平台解析隐私政策。使用 Puppeteer 浏览网站，提取隐私政策内容，并以 JSON 格式保存结果。

## 支持平台

| 平台 | 解析器 | 比较模式 | 状态 |
|------|--------|----------|------|
| Amazon | 通用 | 日期 | ✅ 启用 |
| Shopify | 通用 | 日期 | ✅ 启用 |
| eBay | 通用 | 日期 | ✅ 启用 |
| TikTok | 通用 | 日期 | ✅ 启用 |
| Octopia | Octopia | 日期 | ✅ 启用 |
| AliExpress | AliExpress | 日期 | ✅ 启用 |
| SHEIN 企业 | SHEINCorp | 哈希 | ✅ 启用 |
| Coupang | 通用 | 哈希 | ✅ 启用 |
| Meltwater | Meltwater | 日期 | ✅ 启用 |

## 功能特性

- 🚀 **自动化浏览器** - 基于 Puppeteer 的网站自动化
- 🔍 **多种解析器** - 针对不同平台的自定义解析器
- 💾 **数据持久化** - 基于 JSON 的本地存储
- 📊 **变更检测** - 支持日期或哈希比较

## 项目结构

```
privacy_notice/
├── src/
│   ├── core/              # 核心模块
│   │   ├── Browser.js        - 浏览器管理 (Puppeteer)
│   │   ├── ConfigManager.js  - 配置管理
│   │   ├── DataStore.js      - 数据持久化
│   │   └── Logger.js         - 日志记录
│   ├── parsers/           # 解析器实现
│   │   ├── BaseParser.js     - 抽象基类
│   │   ├── ParserFactory.js  - 解析器工厂
│   │   ├── GenericParser.js  - 通用解析器
│   │   ├── AliExpressParser.js
│   │   ├── SheinCorpParser.js
│   │   ├── OctopiaParser.js
│   │   └── MeltwaterParser.js
│   ├── utils/             # 工具类
│   │   ├── DateParser.js
│   │   ├── TextCleaner.js
│   │   └── HashUtil.js
│   └── index.js           - 入口文件
├── config/
│   └── sites.json         - 站点配置
├── data/                  - 解析数据输出
├── logs/                  - 日志文件
└── docs/                  - 文档
```

## 安装

```bash
npm install
```

## 使用方法

```bash
# 运行解析器
npm start

# 运行测试
npm test

# 监听模式运行测试
npm run test:watch

# 代码检查
npm run lint
```

## 配置

编辑 `config/sites.json` 来添加或修改站点：

```json
{
  "name": "平台名称",
  "url": "https://example.com/privacy",
  "compare_mode": "date",  // 或 "hash"
  "parser": "generic",    // 解析器类型
  "selectors": ["css", "选择器"]  // 可选
}
```

## 比较模式

- **date** - 根据最后更新日期比较
- **hash** - 根据内容哈希比较

## 输出

解析后的数据保存到 `data/*.json`：

```json
{
  "name": "平台名称",
  "url": "https://example.com/privacy",
  "last_updated": "2025-01-01",
  "content": "隐私政策内容...",
  "parsed_at": "2025-01-01T00:00:00Z"
}
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。