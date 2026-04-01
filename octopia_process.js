const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function run() {
    const inputFilename = process.argv[2]; 
    if (!inputFilename) return;

    const html = fs.readFileSync(inputFilename, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 1. 针对 Octopia 的特殊逻辑：从首页提取 PDF 链接并解析日期
    const privacyLinkElement = document.querySelector('a[href*="Privacy-policy-OCTOPIA"]');
    
    let result = {};
    const baseName = path.basename(inputFilename, '.html').replace('_home', '');

    if (privacyLinkElement) {
        const pdfUrl = privacyLinkElement.href;
        
        // 正则提取 DD.MM.YYYY
        const dateMatch = pdfUrl.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        const standardizedDate = dateMatch 
            ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` 
            : "Unknown Date";

        // 构造 JSON 对象
        result = {
            site: baseName.toUpperCase(),
            last_updated: standardizedDate,
            source_url: pdfUrl,
            file_type: "pdf",
            checked_at: new Date().toISOString(),
            raw_element: privacyLinkElement.outerHTML
        };
    } else {
        // 如果是普通 HTML 站点（如 eBay/Amazon），保持兼容逻辑
        const bodyText = document.body.textContent || "";
        const dateMatch = bodyText.match(/(?:Effective|Updated|Revised|生效日期|更新日期).{0,20}?(\d{4}-\d{1,2}-\d{1,2})/i);
        
        result = {
            site: baseName.toUpperCase(),
            last_updated: dateMatch ? dateMatch[1] : "Unknown Date",
            source_url: "N/A",
            file_type: "html",
            checked_at: new Date().toISOString()
        };
    }

    // 2. 写入 JSON 文件
    const outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${baseName}.json`);
    let existingData = null;
    if (fs.existsSync(outputPath)) {
        try {
            existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        } catch (err) {
            console.warn('[Warning] existing JSON parse failed, ignore old content:', err.message);
        }
    }

    // 1) 未采集到日期时且已有旧日期，则保留旧值
    if (( !result.last_updated || result.last_updated === 'Unknown Date')) {
        return;
    }
    // 2) 未采集到日期且没有旧日期时，不写 last_updated 字段
    if (result.last_updated === 'Unknown Date') {
        delete result.last_updated;
    }

    if (existingData && existingData.content) {
        result.old_content = existingData.content;
    }

    // 保存为 .json 后缀
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log(`Success: Generated ${baseName}.json`);
    console.log(`         last_updated: ${result.last_updated}`);
}

run().catch(console.error);
