# Privacy Notice Parser

一个使用Puppeteer和工厂模式重构的电商平台隐私政策解析系统。

## 功能特性

- **多平台支持**：处理多个电商平台的隐私政策，包括Amazon、Shopify、eBay、Octopia、AliExpress、SheinCorp等
- **统一返回结构**：所有平台的解析结果都使用统一的JSON格式
- **工厂模式**：使用工厂模式创建平台特定的解析器
- **Puppeteer集成**：使用Puppeteer进行页面加载和解析，支持动态内容
- **增量更新**：只在内容变化时更新数据
- **错误处理**：对网络错误、解析失败等情况有容错处理

## 系统架构

```
├── index.js          # 主入口文件
├── parserFactory.js  # 解析器工厂
├── parsers/          # 平台特定解析器
│   ├── genericParser.js     # 通用解析器
│   ├── sheincorpParser.js   # SheinCorp解析器
│   ├── octopiaParser.js     # Octopia解析器
│   └── aliexpressParser.js  # AliExpress解析器
├── config.json       # HTTP请求头配置
├── sites.json        # 站点配置
├── data/             # 存储解析结果
└── package.json      # 项目依赖
```

## 安装

1. 克隆项目
2. 安装依赖：
   ```bash
   npm install
   ```

## 使用方法

运行主入口文件：

```bash
node index.js
```

系统会自动处理所有在 `sites.json` 中配置的站点，并将解析结果保存到 `data/` 目录。

## 配置文件

### sites.json

配置要处理的站点信息：

```json
[
  {
    "name": "amazon",
    "url": "https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ&ref_=footer_privacy",
    "process_name": "process"
  },
  // 其他站点...
]
```

### config.json

配置HTTP请求头：

```json
{
  "headers": {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
  }
}
```

## 解析器说明

- **genericParser**：通用解析器，适用于大多数标准HTML站点
- **sheincorpParser**：SheinCorp解析器，处理API响应
- **octopiaParser**：Octopia解析器，从首页提取PDF链接
- **aliexpressParser**：AliExpress解析器，支持多种日期格式

## 输出格式

所有解析结果都使用统一的JSON格式：

```json
{
  "site": "SITE_NAME",
  "last_updated": "YYYY-MM-DD",
  "file_info": {
    "type": "json",
    "content_length": 1234,
    "language": "en"
  },
  "metadata": {
    "source_url": "https://example.com",
    "source_file": "site_name",
    "selector_used": "auto",
    "extracted_at": "2023-01-01T00:00:00.000Z"
  },
  "content": "隐私政策内容...",
  "old_content": "旧的隐私政策内容..." // 仅当内容有变化时
}
```

## 注意事项

- 系统依赖网络连接，某些站点可能因网络限制或反爬机制而失败
- SheinCorp需要API响应，可能需要根据实际情况调整解析逻辑
- Octopia从PDF链接中提取日期，依赖链接格式的稳定性
- 运行时间取决于站点数量和网络速度，可能需要较长时间

## 扩展方法

要添加新的平台解析器：

1. 在 `parsers/` 目录创建新的解析器文件
2. 在 `parserFactory.js` 中注册新的解析器
3. 在 `sites.json` 中添加新的站点配置

## 技术栈

- Node.js
- Puppeteer
- 工厂模式设计
- 正则表达式
- 文件系统操作

## 许可证

ISC