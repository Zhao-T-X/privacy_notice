const BaseParser = require('./BaseParser');
const TextCleaner = require('../utils/TextCleaner');
const HashUtil = require('../utils/HashUtil');

class SheinCorpParser extends BaseParser {
  constructor() {
    super({
      name: 'sheincorp',
      siteName: 'SHEIN-OPEN-PLATFORM'
    });
  }

  async parse(page, site) {
    // SheinCorp 是 API 返回 JSON，不走常规流程
    const pageContent = await page.content();
    
    let apiResponse = null;
    
    try {
      // 从 <pre> 标签中提取 JSON
      const preMatch = pageContent.match(/<pre>([\s\S]*?)<\/pre>/);
      if (preMatch) {
        const jsonStr = preMatch[1]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        apiResponse = JSON.parse(jsonStr);
      } else {
        apiResponse = JSON.parse(pageContent);
      }
    } catch (error) {
      return this.handleError(error, 'Failed to parse API response');
    }

    if (!apiResponse || apiResponse.code !== '0') {
      console.error('API response error:', apiResponse?.msg || 'Unknown error');
      return null;
    }

    const rawContent = apiResponse.info?.contractContent || '';
    const cleanContent = TextCleaner.cleanHtml(rawContent);

    if (!cleanContent) {
      console.error('API returned empty content');
      return null;
    }

    const contentHash = HashUtil.md5(cleanContent);

    return this._buildResult({
      site,
      content: cleanContent,
      lastUpdated: new Date().toISOString().split('T')[0],
      language: 'en',
      contentHash,
      extraMetadata: {
        selector_used: 'api_direct',
        api_code: apiResponse.code
      }
    });
  }
}

module.exports = SheinCorpParser;
