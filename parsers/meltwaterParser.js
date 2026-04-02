const crypto = require('crypto');

class MeltwaterParser {
  async parse(page, site) {
    // 提取页面内容
    const content = await this.extractContent(page);
    
    if (!content || content.trim().length === 0) {
      console.error('No content found for Meltwater');
      return null;
    }
    
    // 提取更新日期
    const lastUpdated = this.extractLastUpdated(content);
    
    // 调试日志
    console.log('Meltwater content preview:', content.substring(0, 100) + '...');
    console.log('Extracted last_updated:', lastUpdated);
    
    // 计算内容hash
    const currentHash = crypto.createHash('md5').update(content).digest('hex');
    
    // 提取语言
    const language = await this.extractLanguage(page);
    
    // 构造统一的返回结构
    return {
      site: "MELTWATER",
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
        content_hash: currentHash // 用于对比内容变化
      },
      content: content
    };
  }
  
  extractLastUpdated(content) {
    // 从内容中提取日期
    // 处理可能没有空格分隔的文本
    // 先尝试直接匹配
    let datePattern = /Last updated\s*([A-Z][a-z]+)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})/i;
    let match = content.match(datePattern);
    
    // 如果没有匹配到，尝试处理没有空格的情况
    if (!match) {
      // 尝试匹配 "LastupdatedMarch26th2025" 格式
      datePattern = /Lastupdated([A-Z][a-z]+)(\d{1,2})(?:st|nd|rd|th)?(\d{4})/i;
      match = content.match(datePattern);
    }
    
    // 如果还是没有匹配到，尝试更通用的模式
    if (!match) {
      // 尝试匹配任何包含月份和日期的模式
      datePattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})/i;
      match = content.match(datePattern);
    }
    
    if (match) {
      const month = match[1];
      const day = match[2];
      const year = match[3];
      
      const date = new Date(`${month} ${day}, ${year}`);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    
    // 尝试其他格式
    const otherPatterns = [
      /(?:Updated|Effective|生效日期|更新日期).{0,50}/i,
      /\d{4}-\d{1,2}-\d{1,2}/,
      /[A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)? \d{4}/i
    ];
    
    for (const pattern of otherPatterns) {
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
  
  formatDate(dateStr) {
    // 处理 "March 26th 2025" 格式
    const ordinalPattern = /([A-Z][a-z]+) (\d{1,2})(?:st|nd|rd|th)? (\d{4})/i;
    const ordinalMatch = dateStr.match(ordinalPattern);
    if (ordinalMatch) {
      const month = ordinalMatch[1];
      const day = ordinalMatch[2];
      const year = ordinalMatch[3];
      
      const date = new Date(`${month} ${day}, ${year}`);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    
    // 处理其他格式
    const dateMatch = dateStr.match(/[A-Z][a-z]+ \d{1,2}, \d{4}|\d{4}-\d{1,2}-\d{1,2}/);
    if (!dateMatch) return "Unknown Date";

    const d = new Date(dateMatch[0]);
    if (isNaN(d.getTime())) return dateMatch[0];

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  async extractContent(page) {
    // 尝试不同的选择器提取内容
    const selectors = [
      '.privacy-policy-content',  // Meltwater可能的class
      '.main-content',            // 通用
      '#main-content',            // 通用
      'main',                     // HTML5 标准
      'article',                  // 文章主体
      '.content',                 // 通用
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

module.exports = MeltwaterParser;