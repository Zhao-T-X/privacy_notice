const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enableFile = options.enableFile !== false;
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  _writeToFile(level, message) {
    if (!this.enableFile) return;
    
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.log`);
    fs.appendFileSync(logFile, message + '\n');
  }

  log(level, message, meta) {
    if (!this._shouldLog(level)) return;

    const formatted = this._formatMessage(level, message, meta);
    
    // 控制台输出
    console.log(formatted);
    
    // 文件输出
    this._writeToFile(level, formatted);
  }

  error(message, meta) { this.log('error', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  info(message, meta) { this.log('info', message, meta); }
  debug(message, meta) { this.log('debug', message, meta); }
}

module.exports = Logger;
