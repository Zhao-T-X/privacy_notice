# Privacy Notice Parser

An automated tool for parsing privacy policies from various e-commerce platforms. Uses Puppeteer to navigate websites, extract privacy policy content, and save results in JSON format.

## Supported Platforms

| Platform | Parser | Compare Mode | Status |
|----------|--------|--------------|--------|
| Amazon | Generic | date | ✅ Active |
| Shopify | Generic | date | ✅ Active |
| eBay | Generic | date | ✅ Active |
| TikTok | Generic | date | ✅ Active |
| Octopia | Octopia | date | ✅ Active |
| AliExpress | AliExpress | date | ✅ Active |
| SHEIN Corp | SHEINCorp | hash | ✅ Active |
| Coupang | Generic | hash | ✅ Active |
| Meltwater | Meltwater | date | ✅ Active |

## Features

- 🚀 **Automated Browser** - Puppeteer-based website automation
- 🔍 **Multiple Parsers** - Custom parsers for different platforms
- 💾 **Data Persistence** - JSON-based local storage
- 📊 **Change Detection** - Compare by date or hash

## Project Structure

```
privacy_notice/
├── src/
│   ├── core/              # Core modules
│   │   ├── Browser.js        - Browser management (Puppeteer)
│   │   ├── ConfigManager.js  - Configuration management
│   │   ├── DataStore.js      - Data persistence
│   │   └── Logger.js         - Logging
│   ├── parsers/           # Parser implementations
│   │   ├── BaseParser.js     - Abstract base class
│   │   ├── ParserFactory.js  - Parser factory
│   │   ├── GenericParser.js  - Generic parser
│   │   ├── AliExpressParser.js
│   │   ├── SheinCorpParser.js
│   │   ├── OctopiaParser.js
│   │   └── MeltwaterParser.js
│   ├── utils/             # Utilities
│   │   ├── DateParser.js
│   │   ├── TextCleaner.js
│   │   └── HashUtil.js
│   └── index.js           - Entry point
├── config/
│   └── sites.json         - Site configurations
├── data/                  - Parsed data output
├── logs/                  - Log files
└── docs/                  - Documentation
```

## Installation

```bash
npm install
```

## Usage

```bash
# Run the parser
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

## Configuration

Edit `config/sites.json` to add or modify sites:

```json
{
  "name": "platform_name",
  "url": "https://example.com/privacy",
  "compare_mode": "date",  // or "hash"
  "parser": "generic",    // parser type
  "selectors": ["css", "selectors"]  // optional
}
```

## Compare Modes

- **date** - Compare by last updated date
- **hash** - Compare by content hash

## Output

Parsed data is saved to `data/*.json`:

```json
{
  "name": "platform_name",
  "url": "https://example.com/privacy",
  "last_updated": "2025-01-01",
  "content": "privacy policy text...",
  "parsed_at": "2025-01-01T00:00:00Z"
}
```

## License

MIT License - see [LICENSE](LICENSE) for details.