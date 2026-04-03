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
