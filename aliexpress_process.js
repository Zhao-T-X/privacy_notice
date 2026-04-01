const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function normalizeDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;

  // 支持常见日期格式
  const patterns = [
    /([0-9]{4})\s*[年\-\/]\s*([0-9]{1,2})\s*[月\-\/]\s*([0-9]{1,2})\s*日?/, // 2022年03月09日, 2022-03-09
    /([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})/, // 2022-03-09
    /([0-9]{4})\.([0-9]{1,2})\.([0-9]{1,2})/, // 2022.03.09
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})/i,
    /(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const m = dateStr.match(pattern);
    if (!m) continue;

    if (m.length >= 4 && /[A-Za-z]/.test(m[1])) {
      // Month name first
      const month = new Date(`${m[1]} 1, ${m[3]}`).getMonth() + 1;
      if (!month) continue;
      return `${m[3]}-${String(month).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    }

    if (m.length >= 4 && /[A-Za-z]/.test(m[2])) {
      // Day monthname year
      const month = new Date(`${m[2]} 1, ${m[3]}`).getMonth() + 1;
      if (!month) continue;
      return `${m[3]}-${String(month).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    }

    // 数字格式
    const year = m[1];
    const month = String(m[2]).padStart(2, '0');
    const day = String(m[3]).padStart(2, '0');

    const parsed = new Date(`${year}-${month}-${day}`);
    if (!isNaN(parsed.getTime())) {
      return `${year}-${month}-${day}`;
    }
  }

  // 尝试直接使用 Date 解析
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) {
    const y = direct.getFullYear();
    const m = String(direct.getMonth() + 1).padStart(2, '0');
    const d = String(direct.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

function findUpdateDate(document) {
  const text = document.body.textContent || '';

  // 先查找常见关键词附近日期
  const keywordPatterns = [
    /(?:上次更新|更新时间|最新更新时间|Effective Date|Last Updated|Updated|Revised|生效日期)[^\n]{0,60}/i,
    /(?:Published|Effective|Updated|Revised)[^\n]{0,60}/i,
  ];

  for (const kp of keywordPatterns) {
    const match = text.match(kp);
    if (!match) continue;

    const candidate = match[0];
    const date = normalizeDate(candidate);
    if (date) return date;

    // 扩展查找范围
    const post = text.substr(Math.max(0, match.index - 40), 120);
    const date2 = normalizeDate(post);
    if (date2) return date2;
  }

  // 整体查找日期
  const dateCandidate = text.match(/\d{4}[\-\.年\/]\d{1,2}[\-\.月\/]\d{1,2}日?/);
  if (dateCandidate) {
    return normalizeDate(dateCandidate[0]);
  }

  const englishCandidate = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/i);
  if (englishCandidate) {
    return normalizeDate(englishCandidate[0]);
  }

  return null;
}

function extractMainContent(document) {
  const selectors = [
    '#widget-content',
    '.main-content',
    '.content',
    '.policy-content',
    'article',
    'main',
    'body',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      return el.textContent.replace(/\t/g, ' ').replace(/ +/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    }
  }

  return document.body.textContent
    ? document.body.textContent.replace(/\t/g, ' ').replace(/ +/g, ' ').replace(/\n\s*\n/g, '\n').trim()
    : '';
}

async function run() {
  const inputFilename = process.argv[2];
  if (!inputFilename) {
    console.error('Usage: node aliexpress_process.js <input-html-file>');
    process.exit(1);
  }

  const html = fs.readFileSync(inputFilename, 'utf-8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const extractedDate = findUpdateDate(document);
   if (extractedDate === "Unknown Date") { 
        return;
    }
  const extractedContent = extractMainContent(document);

  const outputDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'aliexpress.json');
  let existingData = null;
  if (fs.existsSync(outputPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    } catch (err) {
      console.warn('Warning: existing aliexpress.json 无法解析，将重新构造。', err.message);
      existingData = null;
    }
    if(extractedDate == existingData.last_updated){
       console.error('时间重合 无需更新');
      return;
    }
  }

  const preservedLastUpdated = existingData && existingData.last_updated ? existingData.last_updated : 'Unknown Date';
  const lastUpdated = extractedDate || preservedLastUpdated;
  const result = {
    site: 'ALIBABA-ALEXPRESS',
    last_updated: lastUpdated,
    file_info: {
      type: 'json',
      content_length: extractedContent.length,
      language: document.documentElement.lang || 'unknown',
    },
    metadata: {
      source_url: 'https://terms.alicdn.com/legal-agreement/terms/suit_bu1_aliexpress/suit_bu1_aliexpress202203091437_94260.html',
      source_file: path.basename(inputFilename),
      selector_used: 'auto',
      extracted_at: new Date().toISOString(),
    },
    content: extractedContent,
  };

  if (existingData && existingData.content) {
    result.old_content = existingData.content;
  }

  // 如果已有last_updated且本次没解析到，不覆盖oldDate。但如果提取到了则更新
  if (!extractedDate && existingData && existingData.last_updated) {
    result.last_updated = existingData.last_updated;
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  console.log('[Success] aliexpress policy processed.');
  console.log('         last_updated:', result.last_updated);
  console.log('         output_file:', outputPath);
}

run().catch(err => {
  console.error('[Error] aliexpress_process failed:', err.message);
  process.exit(1);
});
