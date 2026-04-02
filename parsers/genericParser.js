const crypto = require('crypto');

class GenericParser {
  async parse(page, site) {
    // 提取页面内容
    const content = await this.extractContent(page);
    
    // 提取更新日期
    const lastUpdated = await this.extractLastUpdated(page, content);
    
    // 提取语言
    const language = await this.extractLanguage(page);
    
    // 计算内容hash（用于没有last_updated的平台）
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    
    // 构造统一的返回结构
    return {
      site: site.name.toUpperCase(),
      last_updated: lastUpdated,
      file_info: {
        type: "json",
        content_length: content.length,
        language: language
      },
      metadata: {
        source_url: site.url,
        source_file: site.name,
        selector_used: "auto",
        extracted_at: new Date().toISOString(),
        content_hash: contentHash
      },
      content: content
    };
  }
  
  async extractContent(page) {
    // 尝试不同的选择器提取内容
    const selectors = [
      '#help_content',            // Amazon 常用
      '.shopify-policy__body',    // Shopify 常用
      '.main-content',            // 通用
      '#mainContent',             // eBay 常用
      'main',                     // HTML5 标准
      'article',                  // 文章主体
      'body'                      // 最终兜底
    ];
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await page.evaluate(el => el.textContent, element);
        if (text && text.trim()) {
          return this.cleanText(text);
        }
      }
    }
    
    // 兜底方案：获取整个页面文本
    const bodyText = await page.evaluate(() => document.body.textContent);
    return this.cleanText(bodyText);
  }
  
  async extractLastUpdated(page, content) {
    // 从内容中提取日期
    const datePatterns = [
      /(?:Effective|Updated|Revised|生效日期|更新日期|Last updated| ).{0,50}/i,
      /\d{4}-\d{1,2}-\d{1,2}/,
      /[A-Z][a-z]+ \d{1,2}, \d{4}/
    ];
    
    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        const dateStr = match[0];
        const formattedDate = this.formatDate(dateStr);
        if (formattedDate && formattedDate !== "Unknown Date") {
          return formattedDate;
        }
      }
    }
    
    return null;
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
  
  formatDate(dateStr) {
    const dateMatch = dateStr.match(/[A-Z][a-z]+ \d{1,2}, \d{4}|\d{4}-\d{1,2}-\d{1,2}/);
    if (!dateMatch) return "Unknown Date";

    const d = new Date(dateMatch[0]);
    if (isNaN(d.getTime())) return dateMatch[0];

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

module.exports = GenericParser;