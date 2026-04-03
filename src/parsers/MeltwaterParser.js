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
