const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * 将日期标准化为 yyyy-mm-dd
 */
function formatDate(dateStr) {
    const dateMatch = dateStr.match(/[A-Z][a-z]+ \d{1,2}, \d{4}|\d{4}-\d{1,2}-\d{1,2}/);
    if (!dateMatch) return "Unknown Date";

    const d = new Date(dateMatch[0]);
    if (isNaN(d.getTime())) return dateMatch[0];

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function run() {
    const inputFilename = process.argv[2];
    if (!inputFilename) return;

    const html = fs.readFileSync(inputFilename, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 1. 提取日期
    let displayDate = "Unknown Date";
    const bodyText = document.body.textContent || "";
    const effectiveMatch = bodyText.match(/(?:Effective|Updated|Revised|生效日期|更新日期).{0,50}/i);
    if (effectiveMatch) {
        displayDate = formatDate(effectiveMatch[0]);
    }

    // 2. 提取正文 (适配 Amazon, eBay, Shopify)
    const selectors = ['#help_content', '.shopify-policy__body', '.main-content', 'main', 'body'];
    let contentNode = null;
    for (const s of selectors) {
        contentNode = document.querySelector(s);
        if (contentNode) break;
    }

    const cleanText = contentNode ? contentNode.textContent.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim() : "";

    // 3. 写入文件
    const baseName = path.basename(inputFilename, '.html');
    const outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const outputContent = `SITE: ${baseName.toUpperCase()}\nLAST_UPDATED: ${displayDate}\n${'='.repeat(20)}\n\n${cleanText}`;
    
    fs.writeFileSync(path.join(outputDir, `${baseName}_clean.txt`), outputContent);
    console.log(`Successfully processed ${baseName}: ${displayDate}`);
}

run().catch(console.error);
