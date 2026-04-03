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
