const cheerio = require('cheerio');
const DateParser = require('../utils/DateParser');
const TextCleaner = require('../utils/TextCleaner');
const HashUtil = require('../utils/HashUtil');

/**
 * CheerioParser - 使用 Cheerio 解析静态 HTML
 * 比 Puppeteer 更轻量，适合已下载的 HTML 内容
 */
class CheerioParser {
  constructor(options = {}) {
    this.name = options.name || 'unknown';
    this.siteName = options.siteName || 'UNKNOWN';
    this.dateParser = new DateParser();
    this.defaultSelectors = options.selectors || [
      '.main-content', 'main', 'article', '.content', 'body'
    ];
  }

  /**
   * 主解析方法 - 从 HTML 字符串解析
   */
  parse(html, site) {
    const $ = cheerio.load(html);
    const content = this.extractContent($, site);
    const lastUpdated = this.extractLastUpdated($, content);
    const language = this.extractLanguage($);
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
   * 提取页面内容 - 使用 Cheerio 选择器
   */
  extractContent($, site) {
    const selectors = site.selectors || this.defaultSelectors;
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text();
        if (text && text.trim()) {
          return TextCleaner.clean(text);
        }
      }
    }

    // 兜底方案
    const bodyText = $('body').text() || '';
    return TextCleaner.clean(bodyText);
  }

  /**
   * 提取更新日期
   */
  extractLastUpdated($, content) {
    return this.dateParser.parse(content);
  }

  /**
   * 提取页面语言
   */
  extractLanguage($) {
    return $('html').attr('lang') || $('html').prop('lang') || 'unknown';
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

module.exports = CheerioParser;
