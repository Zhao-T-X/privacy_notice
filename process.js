const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * 将日期标准化为 yyyy-mm-dd
 * 支持格式: "March 31, 2026" 或 "2026-03-31" 等
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
    if (!inputFilename) {
        console.error("Please provide an input HTML file.");
        return;
    }

    // 读取 HTML
    const html = fs.readFileSync(inputFilename, 'utf8');
    console.error(html)
    const dom = new JSDOM(html);
    
    const document = dom.window.document;

    // --- 1. 提取日期 ---
    let displayDate = "Unknown Date";
    const bodyText = document.body.textContent || "";
    // 匹配包含关键字的行，向前截取 50 个字符寻找日期
    const effectiveMatch = bodyText.match(/(?:Effective|Updated|Revised|生效日期|更新日期).{0,50}/i);
    if (effectiveMatch) {
        displayDate = formatDate(effectiveMatch[0]);
    }

    if (displayDate === "Unknown Date") { 
        return;
    }
    // --- 2. 提取正文 (优先级选择器) ---
    const selectors = [
        '#help_content',            // Amazon 常用
        '.shopify-policy__body',    // Shopify 常用
        '.main-content',            // 通用
        '#mainContent',             // eBay 常用
        'main',                     // HTML5 标准
        'article',                  // 文章主体
        'body'                      // 最终兜底
    ];

    let contentNode = null;
    let matchedSelector = "none";

    for (const s of selectors) {
        contentNode = document.querySelector(s);
        if (contentNode) {
            matchedSelector = s;
            break;
        }
    }

    // 清洗文本：去除多余空格、制表符，统一换行
    const cleanText = contentNode 
        ? contentNode.textContent
            .replace(/\t/g, ' ') 
            .replace(/ +/g, ' ') 
            .replace(/\n\s*\n/g, '\n') 
            .trim() 
        : "";

    // --- 3. 构造 JSON 对象 ---
    const baseName = path.basename(inputFilename, path.extname(inputFilename));

    const outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${baseName}.json`);
    let existingData = null;
    if (fs.existsSync(outputPath)) {
        try {
            existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        } catch (err) {
            console.warn('[Warning] existing JSON parse failed, ignore old content:', err.message);
        }
    }

    const parsedDate = displayDate && displayDate !== 'Unknown Date' ? displayDate : null;
    const preservedDate = existingData && existingData.last_updated ? existingData.last_updated : null;

    const result = {
        site: baseName.toUpperCase(),
        file_info: {
            type: "json",
            content_length: cleanText.length,
            language: document.documentElement.lang || "unknown"
        },
        metadata: {
            source_file: path.basename(inputFilename),
            selector_used: matchedSelector,
            extracted_at: new Date().toISOString()
        },
        content: cleanText
    };

    // 仅当可用时才写入 last_updated，不写入 Unknown Date
    if (parsedDate) {
        result.last_updated = parsedDate;
    } else if (preservedDate) {
        result.last_updated = preservedDate;
    }

    if (existingData && existingData.content) {
        result.old_content = existingData.content;
    }

    // --- 4. 写入 JSON 文件 ---
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

    console.log(`[Success] Processed: ${baseName}`);
    console.log(`          Date: ${result.last_updated}`);
    console.log(`          Saved to: ${outputPath}`);
}

run().catch(err => {
    console.error("[Error] Processing failed:", err.message);
});
