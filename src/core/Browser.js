const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 使用 stealth 插件来避免被检测
puppeteer.use(StealthPlugin());

class Browser {
  constructor(config = {}) {
    this.config = {
      headless: config.headless !== false,
      args: config.args || [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: config.timeout || 60000,
      ...config
    };
    this.browser = null;
  }

  async launch() {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: this.config.args
    });

    return this.browser;
  }

  async newPage(headers = {}) {
    if (!this.browser) {
      await this.launch();
    }

    const page = await this.browser.newPage();
    
    if (Object.keys(headers).length > 0) {
      await page.setExtraHTTPHeaders(headers);
    }

    // 设置默认超时
    page.setDefaultTimeout(this.config.timeout);
    page.setDefaultNavigationTimeout(this.config.timeout);

    return page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async closePage(page) {
    if (page && !page.isClosed()) {
      await page.close();
    }
  }
}

module.exports = Browser;
