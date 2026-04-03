const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, '../../config/sites.json');
    this.config = this._loadConfig();
  }

  _loadConfig() {
    try {
      const content = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load config from ${this.configPath}: ${error.message}`);
    }
  }

  getSites() {
    return this.config.sites || [];
  }

  getSite(name) {
    return this.config.sites.find(site => site.name === name);
  }

  getGlobalConfig() {
    return this.config.global || {};
  }

  getHeaders() {
    return this.config.global?.headers || {};
  }

  getBrowserConfig() {
    return this.config.global?.browser || {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    };
  }

  getOutputConfig() {
    return this.config.global?.output || {
      dataDir: './data',
      pagesDir: './pages',
      logDir: './logs'
    };
  }
}

module.exports = ConfigManager;
