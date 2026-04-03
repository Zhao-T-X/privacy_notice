const fs = require('fs');
const path = require('path');
const HashUtil = require('../utils/HashUtil');

class DataStore {
  constructor(options = {}) {
    this.dataDir = options.dataDir || './data';
    this.pagesDir = options.pagesDir || './pages';
    this._ensureDirectories();
  }

  _ensureDirectories() {
    [this.dataDir, this.pagesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 保存页面 HTML
   */
  async savePage(siteName, content) {
    const filePath = path.join(this.pagesDir, `${siteName}.html`);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * 读取已存在的数据
   */
  readExisting(siteName) {
    const filePath = path.join(this.dataDir, `${siteName}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`[Warning] Failed to parse existing data for ${siteName}:`, error.message);
      return null;
    }
  }

  /**
   * 检查是否需要更新
   */
  shouldUpdate(siteName, newData, compareMode = 'date') {
    const existing = this.readExisting(siteName);

    if (!existing) {
      return { shouldSave: true, reason: 'new' };
    }

    // 日期对比模式
    if (compareMode === 'date') {
      const hasDate = newData.last_updated && newData.last_updated !== 'Unknown Date';
      
      if (!hasDate) {
        return { shouldSave: false, reason: 'no_date' };
      }

      if (existing.last_updated === newData.last_updated) {
        return { shouldSave: false, reason: 'date_unchanged' };
      }

      return { shouldSave: true, reason: 'date_changed' };
    }

    // Hash 对比模式
    if (compareMode === 'hash') {
      const newHash = newData.metadata?.content_hash;
      const oldHash = existing.metadata?.content_hash;

      if (!newHash) {
        return { shouldSave: false, reason: 'no_hash' };
      }

      if (newHash === oldHash) {
        return { shouldSave: false, reason: 'hash_unchanged' };
      }
      newData.last_updated = new Date().toISOString();
      return { shouldSave: true, reason: 'hash_changed'};
    }
      newData.last_updated = new Date().toISOString();
    return { shouldSave: true, reason: 'unknown_mode' };
  }

  /**
   * 保存数据
   */
  save(siteName, data, existingData = null) {
    const filePath = path.join(this.dataDir, `${siteName}.json`);

    // 保留旧内容
    if (existingData?.content) {
      data.old_content = existingData.content;
    }

    // 保留旧日期（如果新日期未解析到）
    if (!data.last_updated && existingData?.last_updated) {
      data.last_updated = existingData.last_updated;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }
}

module.exports = DataStore;
