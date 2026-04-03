const path = require('path');
const ConfigManager = require('./core/ConfigManager');
const Browser = require('./core/Browser');
const DataStore = require('./core/DataStore');
const Logger = require('./core/Logger');
const ParserFactory = require('./parsers/ParserFactory');

class PrivacyPolicyMonitor {
  constructor(options = {}) {
    this.configManager = new ConfigManager(options.configPath);
    this.logger = new Logger({
      level: options.logLevel || 'info',
      enableFile: options.enableFileLog !== false
    });
    
    const globalConfig = this.configManager.getGlobalConfig();
    
    this.browser = new Browser(globalConfig.browser);
    this.dataStore = new DataStore(globalConfig.output);
  }

  async run() {
    const sites = this.configManager.getSites();
    const headers = this.configManager.getHeaders();

    this.logger.info(`Starting privacy policy monitor for ${sites.length} sites`);

    try {
      await this.browser.launch();

      for (const site of sites) {
        await this.processSite(site, headers);
      }
    } catch (error) {
      this.logger.error('Monitor failed:', { error: error.message });
      throw error;
    } finally {
      await this.browser.close();
    }

    this.logger.info('Monitor completed');
  }

  async processSite(site, headers) {
    this.logger.info(`Processing ${site.name}...`);

    const parser = ParserFactory.createParser(site.parser);
    if (!parser) {
      this.logger.error(`No parser found for ${site.name}`);
      return;
    }

    const page = await this.browser.newPage(headers);

    try {
      // 导航到目标页面
      await page.goto(site.url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // 保存页面内容
      const pageContent = await page.content();
      const pagePath = await this.dataStore.savePage(site.name, pageContent);
      this.logger.info(`[Page Saved] ${site.name} - ${pagePath}`);

      // 解析页面
      const result = await parser.parse(page, site);

      if (!result) {
        this.logger.warn(`[Skipped] ${site.name} - parser returned null`);
        return;
      }

      // 检查是否需要保存
      const { shouldSave, reason } = this.dataStore.shouldUpdate(
        site.name,
        result,
        site.compare_mode
      );

      if (!shouldSave) {
        this.logger.info(`[Skipped] ${site.name} - ${reason}`);
        return;
      }

      // 读取现有数据用于保留旧内容
      const existingData = this.dataStore.readExisting(site.name);

      // 保存结果
      const outputPath = this.dataStore.save(site.name, result, existingData);

      this.logger.info(`[Success] ${site.name}`, {
        mode: site.compare_mode,
        date: result.last_updated || 'N/A',
        path: outputPath,
        reason
      });

    } catch (error) {
      this.logger.error(`Error processing ${site.name}:`, { error: error.message });
    } finally {
      await this.browser.closePage(page);
    }
  }
}

// CLI 入口
async function main() {
  const monitor = new PrivacyPolicyMonitor();
  await monitor.run();
}

if (require.main === module) {
  main().catch(err => {
    console.error('[Error] Main process failed:', err.message);
    process.exit(1);
  });
}

module.exports = PrivacyPolicyMonitor;
