# 模块化重构隐私政策解析系统

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有代码重构为模块化结构，提取公共逻辑，统一配置管理，提高可维护性和可扩展性

**Architecture:** 
- 采用分层架构：core(核心) / parsers(解析器) / utils(工具) / config(配置)
- 引入 BaseParser 抽象基类统一解析器接口
- 统一配置管理，合并 sites.json 和 config.json
- 添加日志模块和错误处理中间件

**Tech Stack:** Node.js, Puppeteer, CommonJS (保持兼容)

---

## 重构后的目录结构

```
.
├── .github/workflows/
├── src/
│   ├── core/
│   │   ├── Browser.js          # 浏览器管理
│   │   ├── ConfigManager.js    # 统一配置管理
│   │   ├── Logger.js           # 日志模块
│   │   └── ErrorHandler.js     # 错误处理
│   ├── parsers/
│   │   ├── BaseParser.js       # 抽象基类
│   │   ├── ParserFactory.js    # 工厂类
│   │   ├── GenericParser.js    # 通用解析器
│   │   ├── AliExpressParser.js
│   │   ├── SheinCorpParser.js
│   │   ├── OctopiaParser.js
│   │   └── MeltwaterParser.js
│   ├── utils/
│   │   ├── DateParser.js       # 统一日期解析
│   │   ├── TextCleaner.js      # 文本清洗
│   │   └── HashUtil.js         # Hash计算
│   └── index.js                # 入口文件
├── config/
│   └── sites.json              # 站点配置
├── data/                       # 输出数据
├── pages/                      # 缓存页面
├── tests/                      # 测试目录
├── package.json
└── README.md
```

---

## Task 1: 创建目录结构

**Files:**
- Create: `src/core/` (目录)
- Create: `src/parsers/` (目录)
- Create: `src/utils/` (目录)
- Create: `config/` (目录)
- Create: `tests/` (目录)

**Step 1: 创建目录结构**

```bash
mkdir -p src/core src/parsers src/utils config tests
```

**Step 2: 验证目录创建**

```bash
ls -la src/
```

Expected: 显示 core, parsers, utils 三个目录

**Step 3: Commit**

```bash
git add .
git commit -m "chore: create modular directory structure"
```

---

## Task 2: 创建日志模块 (Logger.js)

**Files:**
- Create: `src/core/Logger.js`

**Step 1: 实现日志模块**

```javascript
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enableFile = options.enableFile !== false;
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  _writeToFile(level, message) {
    if (!this.enableFile) return;
    
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.log`);
    fs.appendFileSync(logFile, message + '\n');
  }

  log(level, message, meta) {
    if (!this._shouldLog(level)) return;

    const formatted = this._formatMessage(level, message, meta);
    
    // 控制台输出
    console.log(formatted);
    
    // 文件输出
    this._writeToFile(level, formatted);
  }

  error(message, meta) { this.log('error', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  info(message, meta) { this.log('info', message, meta); }
  debug(message, meta) { this.log('debug', message, meta); }
}

module.exports = Logger;
```

**Step 2: Commit**

```bash
git add src/core/Logger.js
git commit -m "feat: add Logger module with file and console output"
```

---

## Task 3: 创建统一配置管理 (ConfigManager.js)

**Files:**
- Create: `src/core/ConfigManager.js`
- Create: `config/sites.json` (从根目录复制并增强)

**Step 1: 创建增强版站点配置**

将 `sites.json` 复制到 `config/sites.json` 并添加更多配置项：

```json
{
  "sites": [
    {
      "name": "amazon",
      "url": "https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ",
      "compare_mode": "date",
      "parser": "generic",
      "selectors": ["#help_content", ".main-content", "main", "article", "body"]
    },
    {
      "name": "shopify",
      "url": "https://www.shopify.com/legal/privacy",
      "compare_mode": "date",
      "parser": "generic",
      "selectors": [".shopify-policy__body", ".main-content", "main", "article", "body"]
    },
    {
      "name": "ebay",
      "url": "https://www.ebay.com/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy?id=4260",
      "compare_mode": "date",
      "parser": "generic",
      "selectors": ["#mainContent", ".main-content", "main", "article", "body"]
    },
    {
      "name": "tiktok",
      "url": "https://www.tiktok.com/legal/page/global/partner-privacy-policy/en",
      "compare_mode": "date",
      "parser": "generic"
    },
    {
      "name": "octopia",
      "url": "https://octopia.com",
      "compare_mode": "date",
      "parser": "octopia"
    },
    {
      "name": "aliexpress",
      "url": "https://terms.alicdn.com/legal-agreement/terms/suit_bu1_aliexpress/suit_bu1_aliexpress202203091437_94260.html",
      "compare_mode": "date",
      "parser": "aliexpress"
    },
    {
      "name": "aliexpress_process",
      "url": "https://terms.alicdn.com/legal-agreement/terms/suit_bu1_aliexpress/suit_bu1_aliexpress202203091437_94260.html",
      "compare_mode": "date",
      "parser": "aliexpress"
    },
    {
      "name": "sheincorp",
      "url": "https://open.sheincorp.com/api/open/contract/getLatestContract",
      "compare_mode": "hash",
      "parser": "sheincorp"
    },
    {
      "name": "coupang",
      "url": "https://privacy.coupang.com/en/center/coupang",
      "compare_mode": "date",
      "parser": "generic"
    },
    {
      "name": "meltwater",
      "url": "https://www.meltwater.com/en/privacy",
      "compare_mode": "date",
      "parser": "meltwater"
    }
  ],
  "global": {
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
    },
    "browser": {
      "headless": true,
      "args": ["--no-sandbox", "--disable-setuid-sandbox"],
      "timeout": 60000
    },
    "output": {
      "dataDir": "./data",
      "pagesDir": "./pages",
      "logDir": "./logs"
    }
  }
}
```

**Step 2: 实现 ConfigManager**

```javascript
const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, '../../config/sites.json');
    this.config = this._loadConfig();
  }

  _loadConfig() {
    try {
      const content = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load config from ${this.configPath}: ${error.message}`);
    }
  }

  getSites() {
    return this.config.sites || [];
  }

  getSite(name) {
    return this.config.sites.find(site => site.name === name);
  }

  getGlobalConfig() {
    return this.config.global || {};
  }

  getHeaders() {
    return this.config.global?.headers || {};
  }

  getBrowserConfig() {
    return this.config.global?.browser || {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    };
  }

  getOutputConfig() {
    return this.config.global?.output || {
      dataDir: './data',
      pagesDir: './pages',
      logDir: './logs'
    };
  }
}

module.exports = ConfigManager;
```

**Step 3: Commit**

```bash
git add config/sites.json src/core/ConfigManager.js
git commit -m "feat: add ConfigManager with unified configuration"
```

---

## Task 4: 创建工具模块

### Task 4.1: 日期解析工具 (DateParser.js)

**Files:**
- Create: `src/utils/DateParser.js`

**Step 1: 实现日期解析工具**

```javascript
class DateParser {
  constructor() {
    // 月份名称映射
    this.monthMap = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };

    // 日期提取模式
    this.patterns = [
      // 关键词 + 日期
      {
        regex: /(?:Effective|Updated|Revised|Last updated|生效日期|更新日期|Lastupdated)[^\n]{0,60}/i,
        extract: (match) => this._extractFromContext(match[0])
      },
      // 中文日期格式
      {
        regex: /(\d{4})\s*[年\-\/]\s*(\d{1,2})\s*[月\-\/]\s*(\d{1,2})\s*日?/,
        extract: (match) => this._formatDate(match[1], match[2], match[3])
      },
      // ISO 格式
      {
        regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
        extract: (match) => this._formatDate(match[1], match[2], match[3])
      },
      // 点分隔格式
      {
        regex: /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
        extract: (match) => this._formatDate(match[1], match[2], match[3])
      },
      // 英文格式: March 26, 2025 或 March 26th 2025
      {
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i,
        extract: (match) => this._formatEnglishDate(match[1], match[2], match[3])
      },
      // 英文格式: 26 March 2025
      {
        regex: /(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/i,
        extract: (match) => this._formatEnglishDate(match[2], match[1], match[3])
      }
    ];
  }

  parse(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }

    for (const pattern of this.patterns) {
      const match = content.match(pattern.regex);
      if (match) {
        const result = pattern.extract(match);
        if (result) return result;
      }
    }

    return null;
  }

  _extractFromContext(context) {
    // 从上下文中提取日期
    const datePatterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i,
      /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/
    ];

    for (const pattern of datePatterns) {
      const match = context.match(pattern);
      if (match) {
        if (match[1].match(/\d{4}/)) {
          return this._formatDate(match[1], match[2], match[3]);
        } else {
          return this._formatEnglishDate(match[1], match[2], match[3]);
        }
      }
    }

    return null;
  }

  _formatDate(year, month, day) {
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);

    // 验证日期有效性
    if (y < 2000 || y > 2100) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;

    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return null;

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  _formatEnglishDate(monthName, day, year) {
    const month = this.monthMap[monthName.toLowerCase()];
    if (!month) return null;
    return this._formatDate(year, month, day);
  }

  // 从URL中提取日期 (用于Octopia等)
  parseFromUrl(url, regex) {
    const match = url.match(regex);
    if (match) {
      // 假设格式是 DD.MM.YYYY
      if (match.length >= 4) {
        return this._formatDate(match[3], match[2], match[1]);
      }
    }
    return null;
  }
}

module.exports = DateParser;
```

**Step 2: Commit**

```bash
git add src/utils/DateParser.js
git commit -m "feat: add unified DateParser utility"
```

### Task 4.2: 文本清洗工具 (TextCleaner.js)

**Files:**
- Create: `src/utils/TextCleaner.js`

**Step 1: 实现文本清洗工具**

```javascript
class TextCleaner {
  static clean(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/\t/g, ' ')           // Tab 转空格
      .replace(/ +/g, ' ')           // 多个空格合并
      .replace(/\n\s*\n/g, '\n')     // 空行合并
      .replace(/\r\n/g, '\n')        // 统一换行符
      .trim();
  }

  static cleanHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/<[^>]*>?/gm, '')     // 移除HTML标签
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  static extractFromSelectors(page, selectors) {
    // 这个方法需要在解析器中使用 page.evaluate
    // 返回一个可在浏览器环境中执行的函数
    return (selectors) => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          return element.textContent.trim();
        }
      }
      return document.body ? document.body.textContent.trim() : '';
    };
  }
}

module.exports = TextCleaner;
```

**Step 3: Commit**

```bash
git add src/utils/TextCleaner.js
git commit -m "feat: add TextCleaner utility"
```

### Task 4.3: Hash 工具 (HashUtil.js)

**Files:**
- Create: `src/utils/HashUtil.js`

**Step 1: 实现 Hash 工具**

```javascript
const crypto = require('crypto');

class HashUtil {
  static md5(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }
    return crypto.createHash('md5').update(content).digest('hex');
  }

  static sha256(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static compare(hash1, hash2) {
    return hash1 === hash2;
  }
}

module.exports = HashUtil;
```

**Step 4: Commit**

```bash
git add src/utils/HashUtil.js
git commit -m "feat: add HashUtil utility"
```

---

## Task 5: 创建 BaseParser 抽象基类

**Files:**
- Create: `src/parsers/BaseParser.js`

**Step 1: 实现 BaseParser**

```javascript
const DateParser = require('../utils/DateParser');
const TextCleaner = require('../utils/TextCleaner');
const HashUtil = require('../utils/HashUtil');

class BaseParser {
  constructor(options = {}) {
    this.name = options.name || 'unknown';
    this.siteName = options.siteName || 'UNKNOWN';
    this.dateParser = new DateParser();
    this.defaultSelectors = options.selectors || [
      '.main-content', 'main', 'article', '.content', 'body'
    ];
  }

  /**
   * 主解析方法 - 子类必须实现或调用 super.parse()
   */
  async parse(page, site) {
    const content = await this.extractContent(page, site);
    const lastUpdated = await this.extractLastUpdated(page, content);
    const language = await this.extractLanguage(page);
    const contentHash = HashUtil.md5(content);

    return this._buildResult({
      site,
      content,
      lastUpdated,
      language,
      contentHash
    });
  }

  /**
   * 提取页面内容 - 可被子类覆盖
   */
  async extractContent(page, site) {
    const selectors = site.selectors || this.defaultSelectors;
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await page.evaluate(el => el.textContent, element);
        if (text && text.trim()) {
          return TextCleaner.clean(text);
        }
      }
    }

    // 兜底方案
    const bodyText = await page.evaluate(() => document.body?.textContent || '');
    return TextCleaner.clean(bodyText);
  }

  /**
   * 提取更新日期 - 可被子类覆盖
   */
  async extractLastUpdated(page, content) {
    return this.dateParser.parse(content);
  }

  /**
   * 提取页面语言
   */
  async extractLanguage(page) {
    return page.evaluate(() => {
      return document.documentElement.lang || document.querySelector('html')?.lang || 'unknown';
    });
  }

  /**
   * 构建统一的结果结构
   */
  _buildResult({ site, content, lastUpdated, language, contentHash, extraMetadata = {} }) {
    return {
      site: this.siteName,
      last_updated: lastUpdated,
      file_info: {
        type: 'html',
        content_length: content?.length || 0,
        language: language
      },
      metadata: {
        source_url: site.url,
        source_file: site.name,
        selector_used: this.name,
        extracted_at: new Date().toISOString(),
        content_hash: contentHash,
        ...extraMetadata
      },
      content: content
    };
  }

  /**
   * 处理错误
   */
  handleError(error, context = '') {
    const message = context ? `${context}: ${error.message}` : error.message;
    console.error(`[Parser Error] ${this.name}:`, message);
    return null;
  }
}

module.exports = BaseParser;
```

**Step 2: Commit**

```bash
git add src/parsers/BaseParser.js
git commit -m "feat: add BaseParser abstract class with common logic"
```

---

## Task 6: 重构各个解析器

### Task 6.1: 重构 GenericParser

**Files:**
- Create: `src/parsers/GenericParser.js`

**Step 1: 实现新的 GenericParser**

```javascript
const BaseParser = require('./BaseParser');

class GenericParser extends BaseParser {
  constructor() {
    super({
      name: 'generic',
      siteName: 'GENERIC',
      selectors: [
        '#help_content',            // Amazon
        '.shopify-policy__body',    // Shopify
        '#mainContent',             // eBay
        '.main-content',
        'main',
        'article',
        'body'
      ]
    });
  }

  async parse(page, site) {
    // 使用站点特定的选择器（如果有）
    if (site.selectors) {
      this.defaultSelectors = site.selectors;
    }
    
    return super.parse(page, site);
  }
}

module.exports = GenericParser;
```

**Step 2: Commit**

```bash
git add src/parsers/GenericParser.js
git commit -m "refactor: GenericParser extends BaseParser"
```

### Task 6.2: 重构 AliExpressParser

**Files:**
- Create: `src/parsers/AliExpressParser.js`

**Step 1: 实现新的 AliExpressParser**

```javascript
const BaseParser = require('./BaseParser');

class AliExpressParser extends BaseParser {
  constructor() {
    super({
      name: 'aliexpress',
      siteName: 'ALIBABA-ALEXPRESS',
      selectors: [
        '#widget-content',
        '.main-content',
        '.content',
        '.policy-content',
        'article',
        'main',
        'body'
      ]
    });
  }

  async extractLastUpdated(page, content) {
    // AliExpress 特定的日期提取逻辑
    // 先查找关键词附近
    const keywordPatterns = [
      /(?:上次更新|更新时间|最新更新时间|Effective Date|Last Updated|Updated|Revised|生效日期)[^\n]{0,60}/i
    ];

    for (const pattern of keywordPatterns) {
      const match = content.match(pattern);
      if (match) {
        const date = this.dateParser.parse(match[0]);
        if (date) return date;

        // 扩展查找范围
        const context = content.substr(Math.max(0, match.index - 40), 120);
        const date2 = this.dateParser.parse(context);
        if (date2) return date2;
      }
    }

    // 使用通用日期解析
    return super.extractLastUpdated(page, content);
  }
}

module.exports = AliExpressParser;
```

**Step 2: Commit**

```bash
git add src/parsers/AliExpressParser.js
git commit -m "refactor: AliExpressParser extends BaseParser"
```

### Task 6.3: 重构 SheinCorpParser

**Files:**
- Create: `src/parsers/SheinCorpParser.js`

**Step 1: 实现新的 SheinCorpParser**

```javascript
const BaseParser = require('./BaseParser');
const TextCleaner = require('../utils/TextCleaner');
const HashUtil = require('../utils/HashUtil');

class SheinCorpParser extends BaseParser {
  constructor() {
    super({
      name: 'sheincorp',
      siteName: 'SHEIN-OPEN-PLATFORM'
    });
  }

  async parse(page, site) {
    // SheinCorp 是 API 返回 JSON，不走常规流程
    const pageContent = await page.content();
    
    let apiResponse = null;
    
    try {
      // 从 <pre> 标签中提取 JSON
      const preMatch = pageContent.match(/<pre>([\s\S]*?)<\/pre>/);
      if (preMatch) {
        const jsonStr = preMatch[1]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        apiResponse = JSON.parse(jsonStr);
      } else {
        apiResponse = JSON.parse(pageContent);
      }
    } catch (error) {
      return this.handleError(error, 'Failed to parse API response');
    }

    if (!apiResponse || apiResponse.code !== '0') {
      console.error('API response error:', apiResponse?.msg || 'Unknown error');
      return null;
    }

    const rawContent = apiResponse.info?.contractContent || '';
    const cleanContent = TextCleaner.cleanHtml(rawContent);

    if (!cleanContent) {
      console.error('API returned empty content');
      return null;
    }

    const contentHash = HashUtil.md5(cleanContent);

    return this._buildResult({
      site,
      content: cleanContent,
      lastUpdated: new Date().toISOString().split('T')[0],
      language: 'en',
      contentHash,
      extraMetadata: {
        selector_used: 'api_direct',
        api_code: apiResponse.code
      }
    });
  }
}

module.exports = SheinCorpParser;
```

**Step 2: Commit**

```bash
git add src/parsers/SheinCorpParser.js
git commit -m "refactor: SheinCorpParser extends BaseParser"
```

### Task 6.4: 重构 OctopiaParser

**Files:**
- Create: `src/parsers/OctopiaParser.js`

**Step 1: 实现新的 OctopiaParser**

```javascript
const BaseParser = require('./BaseParser');
const HashUtil = require('../utils/HashUtil');

class OctopiaParser extends BaseParser {
  constructor() {
    super({
      name: 'octopia',
      siteName: 'OCTOPIA'
    });
  }

  async parse(page, site) {
    // Octopia 特殊处理：查找 PDF 链接
    const privacyLinkElement = await page.$('a[href*="Privacy-policy-OCTOPIA"]');
    
    if (privacyLinkElement) {
      const pdfUrl = await page.evaluate(el => el.href, privacyLinkElement);
      
      // 从 URL 提取日期: DD.MM.YYYY
      const dateMatch = pdfUrl.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      const lastUpdated = dateMatch 
        ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` 
        : null;
      
      const content = `Privacy policy available as PDF: ${pdfUrl}`;
      const contentHash = HashUtil.md5(content);

      return {
        site: this.siteName,
        last_updated: lastUpdated,
        file_info: {
          type: 'pdf',
          content_length: 0,
          language: 'en'
        },
        metadata: {
          source_url: pdfUrl,
          source_file: site.name,
          selector_used: 'privacy-policy-link',
          extracted_at: new Date().toISOString(),
          content_hash: contentHash
        },
        content: content
      };
    }

    // 如果没找到 PDF 链接，使用通用解析
    return super.parse(page, site);
  }
}

module.exports = OctopiaParser;
```

**Step 2: Commit**

```bash
git add src/parsers/OctopiaParser.js
git commit -m "refactor: OctopiaParser extends BaseParser"
```

### Task 6.5: 重构 MeltwaterParser

**Files:**
- Create: `src/parsers/MeltwaterParser.js`

**Step 1: 实现新的 MeltwaterParser**

```javascript
const BaseParser = require('./BaseParser');

class MeltwaterParser extends BaseParser {
  constructor() {
    super({
      name: 'meltwater',
      siteName: 'MELTWATER',
      selectors: [
        '.privacy-policy-content',
        '.main-content',
        '#main-content',
        'main',
        'article',
        '.content',
        'body'
      ]
    });
  }

  async extractLastUpdated(page, content) {
    // Meltwater 特定的日期格式处理
    // 处理 "Last updated March 26th 2025" 或 "LastupdatedMarch26th2025"
    
    const patterns = [
      /Last updated\s*([A-Z][a-z]+)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})/i,
      /Lastupdated([A-Z][a-z]+)(\d{1,2})(?:st|nd|rd|th)?(\d{4})/i,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const date = this.dateParser._formatEnglishDate(match[1], match[2], match[3]);
        if (date) return date;
      }
    }

    return super.extractLastUpdated(page, content);
  }
}

module.exports = MeltwaterParser;
```

**Step 2: Commit**

```bash
git add src/parsers/MeltwaterParser.js
git commit -m "refactor: MeltwaterParser extends BaseParser"
```

---

## Task 7: 创建新的 ParserFactory

**Files:**
- Create: `src/parsers/ParserFactory.js`

**Step 1: 实现新的 ParserFactory**

```javascript
const BaseParser = require('./BaseParser');
const GenericParser = require('./GenericParser');
const AliExpressParser = require('./AliExpressParser');
const SheinCorpParser = require('./SheinCorpParser');
const OctopiaParser = require('./OctopiaParser');
const MeltwaterParser = require('./MeltwaterParser');

class ParserFactory {
  static createParser(parserName) {
    const name = parserName?.toLowerCase();
    
    switch (name) {
      case 'sheincorp':
        return new SheinCorpParser();
      case 'octopia':
        return new OctopiaParser();
      case 'aliexpress':
      case 'aliexpress_process':
        return new AliExpressParser();
      case 'meltwater':
        return new MeltwaterParser();
      case 'generic':
      default:
        return new GenericParser();
    }
  }

  static getAvailableParsers() {
    return [
      'generic',
      'aliexpress',
      'sheincorp',
      'octopia',
      'meltwater'
    ];
  }
}

module.exports = ParserFactory;
```

**Step 2: Commit**

```bash
git add src/parsers/ParserFactory.js
git commit -m "refactor: update ParserFactory with new parser classes"
```

---

## Task 8: 创建浏览器管理模块

**Files:**
- Create: `src/core/Browser.js`

**Step 1: 实现 Browser 管理类**

```javascript
const puppeteer = require('puppeteer');

class Browser {
  constructor(config = {}) {
    this.config = {
      headless: config.headless !== false,
      args: config.args || ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: config.timeout || 60000,
      ...config
    };
    this.browser = null;
  }

  async launch() {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: this.config.args
    });

    return this.browser;
  }

  async newPage(headers = {}) {
    if (!this.browser) {
      await this.launch();
    }

    const page = await this.browser.newPage();
    
    if (Object.keys(headers).length > 0) {
      await page.setExtraHTTPHeaders(headers);
    }

    // 设置默认超时
    page.setDefaultTimeout(this.config.timeout);
    page.setDefaultNavigationTimeout(this.config.timeout);

    return page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async closePage(page) {
    if (page && !page.isClosed()) {
      await page.close();
    }
  }
}

module.exports = Browser;
```

**Step 2: Commit**

```bash
git add src/core/Browser.js
git commit -m "feat: add Browser manager class"
```

---

## Task 9: 创建数据存储模块

**Files:**
- Create: `src/core/DataStore.js`

**Step 1: 实现 DataStore 类**

```javascript
const fs = require('fs');
const path = require('path');
const HashUtil = require('../utils/HashUtil');

class DataStore {
  constructor(options = {}) {
    this.dataDir = options.dataDir || './data';
    this.pagesDir = options.pagesDir || './pages';
    this._ensureDirectories();
  }

  _ensureDirectories() {
    [this.dataDir, this.pagesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 保存页面 HTML
   */
  async savePage(siteName, content) {
    const filePath = path.join(this.pagesDir, `${siteName}.html`);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * 读取已存在的数据
   */
  readExisting(siteName) {
    const filePath = path.join(this.dataDir, `${siteName}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`[Warning] Failed to parse existing data for ${siteName}:`, error.message);
      return null;
    }
  }

  /**
   * 检查是否需要更新
   */
  shouldUpdate(siteName, newData, compareMode = 'date') {
    const existing = this.readExisting(siteName);

    if (!existing) {
      return { shouldSave: true, reason: 'new' };
    }

    // 日期对比模式
    if (compareMode === 'date') {
      const hasDate = newData.last_updated && newData.last_updated !== 'Unknown Date';
      
      if (!hasDate) {
        return { shouldSave: false, reason: 'no_date' };
      }

      if (existing.last_updated === newData.last_updated) {
        return { shouldSave: false, reason: 'date_unchanged' };
      }

      return { shouldSave: true, reason: 'date_changed' };
    }

    // Hash 对比模式
    if (compareMode === 'hash') {
      const newHash = newData.metadata?.content_hash;
      const oldHash = existing.metadata?.content_hash;

      if (!newHash) {
        return { shouldSave: false, reason: 'no_hash' };
      }

      if (newHash === oldHash) {
        return { shouldSave: false, reason: 'hash_unchanged' };
      }

      return { shouldSave: true, reason: 'hash_changed' };
    }

    return { shouldSave: true, reason: 'unknown_mode' };
  }

  /**
   * 保存数据
   */
  save(siteName, data, existingData = null) {
    const filePath = path.join(this.dataDir, `${siteName}.json`);

    // 保留旧内容
    if (existingData?.content) {
      data.old_content = existingData.content;
    }

    // 保留旧日期（如果新日期未解析到）
    if (!data.last_updated && existingData?.last_updated) {
      data.last_updated = existingData.last_updated;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }
}

module.exports = DataStore;
```

**Step 2: Commit**

```bash
git add src/core/DataStore.js
git commit -m "feat: add DataStore for data persistence"
```

---

## Task 10: 创建新的入口文件

**Files:**
- Create: `src/index.js`
- Delete: `index.js` (旧的)
- Delete: `parserFactory.js` (旧的)
- Delete: `parsers/` (旧的目录)
- Delete: `config.json` (旧的)
- Delete: `sites.json` (旧的)

**Step 1: 实现新的入口文件**

```javascript
const path = require('path');
const ConfigManager = require('./core/ConfigManager');
const Browser = require('./core/Browser');
const DataStore = require('./core/DataStore');
const Logger = require('./core/Logger');
const ParserFactory = require('./parsers/ParserFactory');

class PrivacyPolicyMonitor {
  constructor(options = {}) {
    this.configManager = new ConfigManager(options.configPath);
    this.logger = new Logger({
      level: options.logLevel || 'info',
      enableFile: options.enableFileLog !== false
    });
    
    const globalConfig = this.configManager.getGlobalConfig();
    
    this.browser = new Browser(globalConfig.browser);
    this.dataStore = new DataStore(globalConfig.output);
  }

  async run() {
    const sites = this.configManager.getSites();
    const headers = this.configManager.getHeaders();

    this.logger.info(`Starting privacy policy monitor for ${sites.length} sites`);

    try {
      await this.browser.launch();

      for (const site of sites) {
        await this.processSite(site, headers);
      }
    } catch (error) {
      this.logger.error('Monitor failed:', { error: error.message });
      throw error;
    } finally {
      await this.browser.close();
    }

    this.logger.info('Monitor completed');
  }

  async processSite(site, headers) {
    this.logger.info(`Processing ${site.name}...`);

    const parser = ParserFactory.createParser(site.parser);
    if (!parser) {
      this.logger.error(`No parser found for ${site.name}`);
      return;
    }

    const page = await this.browser.newPage(headers);

    try {
      // 导航到目标页面
      await page.goto(site.url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // 保存页面内容
      const pageContent = await page.content();
      const pagePath = await this.dataStore.savePage(site.name, pageContent);
      this.logger.info(`[Page Saved] ${site.name} - ${pagePath}`);

      // 解析页面
      const result = await parser.parse(page, site);

      if (!result) {
        this.logger.warn(`[Skipped] ${site.name} - parser returned null`);
        return;
      }

      // 检查是否需要保存
      const { shouldSave, reason } = this.dataStore.shouldUpdate(
        site.name,
        result,
        site.compare_mode
      );

      if (!shouldSave) {
        this.logger.info(`[Skipped] ${site.name} - ${reason}`);
        return;
      }

      // 读取现有数据用于保留旧内容
      const existingData = this.dataStore.readExisting(site.name);

      // 保存结果
      const outputPath = this.dataStore.save(site.name, result, existingData);

      this.logger.info(`[Success] ${site.name}`, {
        mode: site.compare_mode,
        date: result.last_updated || 'N/A',
        path: outputPath,
        reason
      });

    } catch (error) {
      this.logger.error(`Error processing ${site.name}:`, { error: error.message });
    } finally {
      await this.browser.closePage(page);
    }
  }
}

// CLI 入口
async function main() {
  const monitor = new PrivacyPolicyMonitor();
  await monitor.run();
}

if (require.main === module) {
  main().catch(err => {
    console.error('[Error] Main process failed:', err.message);
    process.exit(1);
  });
}

module.exports = PrivacyPolicyMonitor;
```

**Step 2: Commit**

```bash
git add src/index.js
git commit -m "feat: add new main entry with PrivacyPolicyMonitor class"
```

---

## Task 11: 更新 package.json

**Files:**
- Modify: `package.json`

**Step 1: 更新 package.json**

```json
{
  "name": "privacy-notice-parser",
  "version": "2.0.0",
  "description": "Parse privacy notices from various e-commerce platforms",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/"
  },
  "dependencies": {
    "puppeteer": "^22.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "keywords": [
    "privacy",
    "parser",
    "e-commerce",
    "puppeteer"
  ],
  "author": "",
  "license": "ISC"
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: update package.json for modular structure"
```

---

## Task 12: 清理旧文件

**Files:**
- Delete: `index.js`
- Delete: `parserFactory.js`
- Delete: `parsers/` (目录)
- Delete: `config.json`
- Delete: `sites.json`

**Step 1: 删除旧文件**

```bash
rm index.js
rm parserFactory.js
rm config.json
rm sites.json
rm -rf parsers/
```

**Step 2: Commit**

```bash
git add .
git commit -m "chore: remove old files after modular refactor"
```

---

## Task 13: 创建测试文件

### Task 13.1: 测试 DateParser

**Files:**
- Create: `tests/utils/DateParser.test.js`

**Step 1: 创建测试**

```javascript
const DateParser = require('../../src/utils/DateParser');

describe('DateParser', () => {
  let parser;

  beforeEach(() => {
    parser = new DateParser();
  });

  test('should parse ISO date format', () => {
    const result = parser.parse('Last updated: 2024-03-15');
    expect(result).toBe('2024-03-15');
  });

  test('should parse English date format', () => {
    const result = parser.parse('Effective Date: March 26, 2025');
    expect(result).toBe('2025-03-26');
  });

  test('should parse Chinese date format', () => {
    const result = parser.parse('更新日期：2024年03月15日');
    expect(result).toBe('2024-03-15');
  });

  test('should return null for invalid date', () => {
    const result = parser.parse('No date here');
    expect(result).toBeNull();
  });
});
```

**Step 2: Commit**

```bash
git add tests/utils/DateParser.test.js
git commit -m "test: add DateParser unit tests"
```

### Task 13.2: 测试 TextCleaner

**Files:**
- Create: `tests/utils/TextCleaner.test.js`

**Step 1: 创建测试**

```javascript
const TextCleaner = require('../../src/utils/TextCleaner');

describe('TextCleaner', () => {
  test('should clean extra spaces', () => {
    const input = 'Hello    World';
    expect(TextCleaner.clean(input)).toBe('Hello World');
  });

  test('should clean HTML tags', () => {
    const input = '<p>Hello World</p>';
    expect(TextCleaner.cleanHtml(input)).toBe('Hello World');
  });

  test('should handle empty input', () => {
    expect(TextCleaner.clean('')).toBe('');
    expect(TextCleaner.clean(null)).toBe('');
  });
});
```

**Step 3: Commit**

```bash
git add tests/utils/TextCleaner.test.js
git commit -m "test: add TextCleaner unit tests"
```

---

## Task 14: 更新 .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: 更新 .gitignore**

```gitignore
# Dependencies
node_modules/

# Logs
logs/
*.log

# Data
data/
pages/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for new structure"
```

---

## Task 15: 更新 README

**Files:**
- Modify: `README.md`

**Step 1: 更新 README 文档**

```markdown
# Privacy Notice Parser

Parse privacy notices from various e-commerce platforms.

## Project Structure

```
src/
├── core/           # Core modules
│   ├── Browser.js      # Browser management
│   ├── ConfigManager.js # Configuration management
│   ├── DataStore.js    # Data persistence
│   └── Logger.js       # Logging
├── parsers/        # Parsers
│   ├── BaseParser.js   # Abstract base class
│   ├── ParserFactory.js
│   ├── GenericParser.js
│   ├── AliExpressParser.js
│   ├── SheinCorpParser.js
│   ├── OctopiaParser.js
│   └── MeltwaterParser.js
├── utils/          # Utilities
│   ├── DateParser.js
│   ├── TextCleaner.js
│   └── HashUtil.js
└── index.js        # Entry point

config/
└── sites.json      # Site configurations
```

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

## Configuration

Edit `config/sites.json` to add or modify sites.

## Testing

```bash
npm test
```
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for modular structure"
```

---

## 验证清单

重构完成后，验证以下内容：

- [ ] 目录结构符合设计
- [ ] 所有解析器继承 BaseParser
- [ ] 配置统一管理
- [ ] 日志正常工作
- [ ] 数据存储正常
- [ ] 测试可以运行
- [ ] 旧文件已清理
- [ ] README 已更新
