class TextCleaner {
  static clean(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/\t/g, ' ')           // Tab 转空格
      .replace(/ +/g, ' ')           // 多个空格合并
      .replace(/\n\s*\n/g, '\n')     // 空行合并
      .replace(/\r\n/g, '\n')        // 统一换行符
      .trim();
  }

  static cleanHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/<[^>]*>?/gm, '')     // 移除HTML标签
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  static extractFromSelectors(page, selectors) {
    // 这个方法需要在解析器中使用 page.evaluate
    // 返回一个可在浏览器环境中执行的函数
    return (selectors) => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          return element.textContent.trim();
        }
      }
      return document.body ? document.body.textContent.trim() : '';
    };
  }
}

module.exports = TextCleaner;
