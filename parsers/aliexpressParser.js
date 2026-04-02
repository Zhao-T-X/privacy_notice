const crypto = require('crypto');

class AliExpressParser {
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
      site: "ALIBABA-ALEXPRESS",
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
      '#widget-content',
      '.main-content',
      '.content',
      '.policy-content',
      'article',
      'main',
      'body'
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
    // 先查找常见关键词附近日期
    const keywordPatterns = [
      /(?:上次更新|更新时间|最新更新时间|Effective Date|Last Updated|Updated|Revised|生效日期)[^\n]{0,60}/i,
      /(?:Published|Effective|Updated|Revised)[^\n]{0,60}/i
    ];
    
    for (const pattern of keywordPatterns) {
      const match = content.match(pattern);
      if (match) {
        const candidate = match[0];
        const date = this.normalizeDate(candidate);
        if (date) return date;
        
        // 扩展查找范围
        const post = content.substr(Math.max(0, match.index - 40), 120);
        const date2 = this.normalizeDate(post);
        if (date2) return date2;
      }
    }
    
    // 整体查找日期
    const dateCandidate = content.match(/\d{4}[\-\.年\/]\d{1,2}[\-\.月\/]\d{1,2}日?/);
    if (dateCandidate) {
      return this.normalizeDate(dateCandidate[0]);
    }
    
    const englishCandidate = content.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/i);
    if (englishCandidate) {
      return this.normalizeDate(englishCandidate[0]);
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
  
  normalizeDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;

    // 支持常见日期格式
    const patterns = [
      /([0-9]{4})\s*[年\-\/]\s*([0-9]{1,2})\s*[月\-\/]\s*([0-9]{1,2})\s*日?/, // 2022年03月09日, 2022-03-09
      /([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})/, // 2022-03-09
      /([0-9]{4})\.([0-9]{1,2})\.([0-9]{1,2})/, // 2022.03.09
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})/i,
      /(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/i
    ];

    for (const pattern of patterns) {
      const m = dateStr.match(pattern);
      if (!m) continue;

      if (m.length >= 4 && /[A-Za-z]/.test(m[1])) {
        // Month name first
        const month = new Date(`${m[1]} 1, ${m[3]}`).getMonth() + 1;
        if (!month) continue;
        return `${m[3]}-${String(month).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
      }

      if (m.length >= 4 && /[A-Za-z]/.test(m[2])) {
        // Day monthname year
        const month = new Date(`${m[2]} 1, ${m[3]}`).getMonth() + 1;
        if (!month) continue;
        return `${m[3]}-${String(month).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
      }

      // 数字格式
      const year = m[1];
      const month = String(m[2]).padStart(2, '0');
      const day = String(m[3]).padStart(2, '0');

      const parsed = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsed.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }

    // 尝试直接使用 Date 解析
    const direct = new Date(dateStr);
    if (!isNaN(direct.getTime())) {
      const y = direct.getFullYear();
      const m = String(direct.getMonth() + 1).padStart(2, '0');
      const d = String(direct.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  }
}

module.exports = AliExpressParser;