const fs = require('fs');
const path = require('path');

// 导入各个平台的解析器
const GenericParser = require('./parsers/genericParser');
const SheinCorpParser = require('./parsers/sheincorpParser');
const OctopiaParser = require('./parsers/octopiaParser');
const AliExpressParser = require('./parsers/aliexpressParser');

class ParserFactory {
  static createParser(siteName) {
    switch (siteName.toLowerCase()) {
      case 'sheincorp':
        return new SheinCorpParser();
      case 'octopia':
        return new OctopiaParser();
      case 'aliexpress_process':
      case 'aliexpress':
        return new AliExpressParser();
      default:
        // 其他平台使用通用解析器
        return new GenericParser();
    }
  }
}

module.exports = ParserFactory;