# Privacy Notice Parser

Parse privacy notices from various e-commerce platforms.

## Project Structure

```
src/
├── core/           # Core modules
│   ├── Browser.js      # Browser management
│   ├── ConfigManager.js # Configuration management
│   ├── DataStore.js    # Data persistence
│   └── Logger.js       # Logging
├── parsers/        # Parsers
│   ├── BaseParser.js   # Abstract base class
│   ├── ParserFactory.js
│   ├── GenericParser.js
│   ├── AliExpressParser.js
│   ├── SheinCorpParser.js
│   ├── OctopiaParser.js
│   └── MeltwaterParser.js
├── utils/          # Utilities
│   ├── DateParser.js
│   ├── TextCleaner.js
│   └── HashUtil.js
└── index.js        # Entry point

config/
└── sites.json      # Site configurations
```

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

## Configuration

Edit `config/sites.json` to add or modify sites.

## Testing

```bash
npm test
```