const BaseParser = require('./BaseParser');
const GenericParser = require('./GenericParser');
const AliExpressParser = require('./AliExpressParser');
const SheinCorpParser = require('./SheinCorpParser');
const OctopiaParser = require('./OctopiaParser');
const MeltwaterParser = require('./MeltwaterParser');
const CheerioParser = require('./CheerioParser');

class ParserFactory {
  /**
   * 创建 Puppeteer 解析器（用于动态页面）
   */
  static createParser(parserName) {
    const name = parserName?.toLowerCase();
    
    switch (name) {
      case 'sheincorp':
        return new SheinCorpParser();
      case 'octopia':
        return new OctopiaParser();
      case 'aliexpress':
      case 'aliexpress_process':
        return new AliExpressParser();
      case 'meltwater':
        return new MeltwaterParser();
      case 'generic':
      default:
        return new GenericParser();
    }
  }

  /**
   * 创建 Cheerio 解析器（用于静态 HTML）
   */
  static createCheerioParser(parserName) {
    const name = parserName?.toLowerCase();
    
    // 使用统一的 CheerioParser，传入不同的配置
    const configs = {
      'generic': { name: 'generic', siteName: 'GENERIC' },
      'aliexpress': { name: 'aliexpress', siteName: 'ALIBABA-ALEXPRESS' },
      'meltwater': { name: 'meltwater', siteName: 'MELTWATER' },
      'default': { name: 'generic', siteName: 'GENERIC' }
    };

    const config = configs[name] || configs['default'];
    return new CheerioParser(config);
  }

  static getAvailableParsers() {
    return [
      'generic',
      'aliexpress',
      'sheincorp',
      'octopia',
      'meltwater'
    ];
  }
}

module.exports = ParserFactory;
