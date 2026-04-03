const crypto = require('crypto');

class HashUtil {
  static md5(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }
    return crypto.createHash('md5').update(content).digest('hex');
  }

  static sha256(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static compare(hash1, hash2) {
    return hash1 === hash2;
  }
}

module.exports = HashUtil;
