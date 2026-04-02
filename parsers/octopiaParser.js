const crypto = require('crypto');

class OctopiaParser {
  async parse(page, site) {
    // 尝试从页面中找到隐私政策PDF链接
    const privacyLinkElement = await page.$('a[href*="Privacy-policy-OCTOPIA"]');
    
    if (privacyLinkElement) {
      // 提取PDF链接
      const pdfUrl = await page.evaluate(el => el.href, privacyLinkElement);
      
      // 从链接中提取日期（格式：DD.MM.YYYY）
      const dateMatch = pdfUrl.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      const standardizedDate = dateMatch 
        ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` 
        : null;
      
      // 计算内容hash
      const content = `Privacy policy available as PDF: ${pdfUrl}`;
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      
      // 构造统一的返回结构
      return {
        site: site.name.toUpperCase(),
        last_updated: standardizedDate,
        file_info: {
          type: "pdf",
          content_length: 0, // PDF内容长度无法直接获取
          language: "en"
        },
        metadata: {
          source_url: pdfUrl,
          source_file: site.name,
          selector_used: "privacy-policy-link",
          extracted_at: new Date().toISOString(),
          content_hash: contentHash
        },
        content: content
      };
    } else {
      // 如果没有找到PDF链接，使用通用解析逻辑
      const content = await this.extractContent(page);
      const lastUpdated = await this.extractLastUpdated(page, content);
      const language = await this.extractLanguage(page);
      
      // 计算内容hash
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      
      return {
        site: site.name.toUpperCase(),
        last_updated: lastUpdated,
        file_info: {
          type: "html",
          content_length: content.length,
          language: language
        },
        metadata: {
          source_url: site.url,
          source_file: site.name,
          selector_used: "html-content",
          extracted_at: new Date().toISOString(),
          content_hash: contentHash
        },
        content: content
      };
    }
  }
  
  async extractContent(page) {
    const bodyText = await page.evaluate(() => document.body.textContent);
    return this.cleanText(bodyText);
  }
  
  async extractLastUpdated(page, content) {
    const dateMatch = content.match(/(?:Effective|Updated|Revised|生效日期|更新日期).{0,20}?(\d{4}-\d{1,2}-\d{1,2})/i);
    return dateMatch ? dateMatch[1] : null;
  }
  
  async extractLanguage(page) {
    const language = await page.evaluate(() => {
      return document.documentElement.lang || 'unknown';
    });
    return language;
  }
  
  cleanText(text) {
    return text
      .replace(/\t/g, ' ')
      .replace(/ +/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
}

module.exports = OctopiaParser;