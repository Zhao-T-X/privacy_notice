class DateParser {
  constructor() {
    // 月份名称映射
    this.monthMap = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };

    // 日期提取模式
    this.patterns = [
      // 关键词 + 日期
      {
        regex: /(?:Effective|Updated|Revised|Last updated|生效日期|更新日期|Lastupdated)[^\n]{0,60}/i,
        extract: (match) => this._extractFromContext(match[0])
      },
      // 中文日期格式
      {
        regex: /(\d{4})\s*[年\-\/]\s*(\d{1,2})\s*[月\-\/]\s*(\d{1,2})\s*日?/,
        extract: (match) => this._formatDate(match[1], match[2], match[3])
      },
      // ISO 格式
      {
        regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
        extract: (match) => this._formatDate(match[1], match[2], match[3])
      },
      // 点分隔格式
      {
        regex: /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
        extract: (match) => this._formatDate(match[1], match[2], match[3])
      },
      // 英文格式: March 26, 2025 或 March 26th 2025
      {
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i,
        extract: (match) => this._formatEnglishDate(match[1], match[2], match[3])
      },
      // 英文格式: 26 March 2025
      {
        regex: /(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/i,
        extract: (match) => this._formatEnglishDate(match[2], match[1], match[3])
      }
    ];
  }

  parse(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }

    for (const pattern of this.patterns) {
      const match = content.match(pattern.regex);
      if (match) {
        const result = pattern.extract(match);
        if (result) return result;
      }
    }

    return null;
  }

  _extractFromContext(context) {
    // 从上下文中提取日期
    const datePatterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i,
      /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/
    ];

    for (const pattern of datePatterns) {
      const match = context.match(pattern);
      if (match) {
        if (match[1].match(/\d{4}/)) {
          return this._formatDate(match[1], match[2], match[3]);
        } else {
          return this._formatEnglishDate(match[1], match[2], match[3]);
        }
      }
    }

    return null;
  }

  _formatDate(year, month, day) {
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);

    // 验证日期有效性
    if (y < 2000 || y > 2100) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;

    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return null;

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  _formatEnglishDate(monthName, day, year) {
    const month = this.monthMap[monthName.toLowerCase()];
    if (!month) return null;
    return this._formatDate(year, month, day);
  }

  // 从URL中提取日期 (用于Octopia等)
  parseFromUrl(url, regex) {
    const match = url.match(regex);
    if (match) {
      // 假设格式是 DD.MM.YYYY
      if (match.length >= 4) {
        return this._formatDate(match[3], match[2], match[1]);
      }
    }
    return null;
  }
}

module.exports = DateParser;
