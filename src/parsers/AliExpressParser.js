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
