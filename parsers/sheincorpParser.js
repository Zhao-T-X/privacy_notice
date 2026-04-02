const crypto = require('crypto');

class SheinCorpParser {
  async parse(page, site) {
    // 获取页面内容
    const pageContent = await page.content();
    
    // 从页面内容中提取JSON数据
    // 页面内容是 <html><head>...</head><body><pre>{JSON}</pre></body></html>
    let apiResponse = null;
    
    try {
      // 尝试从<pre>标签中提取JSON
      const preMatch = pageContent.match(/<pre>([\s\S]*?)<\/pre>/);
      if (preMatch) {
        const jsonStr = preMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        apiResponse = JSON.parse(jsonStr);
      } else {
        // 如果没有<pre>标签，尝试直接解析整个页面内容
        apiResponse = JSON.parse(pageContent);
      }
    } catch (e) {
      console.error('Failed to parse API response from page:', e.message);
      return null;
    }
    
    if (!apiResponse || apiResponse.code !== '0') {
      console.error('API response error:', apiResponse?.msg || 'Unknown error');
      return null;
    }
    
    // 提取核心内容
    const rawContent = apiResponse.info?.contractContent || "";
    
    // 清洗HTML标签
    const cleanContent = this.cleanText(rawContent);
    
    if (!cleanContent) {
      console.error('API returned empty content');
      return null;
    }
    
    // 计算指纹
    const currentHash = crypto.createHash('md5').update(cleanContent).digest('hex');
    
    // 构造统一的返回结构
    return {
      site: "SHEIN-OPEN-PLATFORM",
      last_updated: new Date().toISOString().split('T')[0],
      file_info: {
        type: "json",
        content_length: cleanContent.length,
        language: "en"
      },
      metadata: {
        source_url: site.url,
        source_file: site.name,
        selector_used: "api_direct",
        extracted_at: new Date().toISOString(),
        content_hash: currentHash
      },
      content: cleanContent
    };
  }
  
  cleanText(text) {
    return text
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = SheinCorpParser;