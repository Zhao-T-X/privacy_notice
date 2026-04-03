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
