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

    // 保存为 .json 后缀
    fs.writeFileSync(
        path.join(outputDir, `${baseName}.json`), 
        JSON.stringify(result, null, 2) // 格式化输出，方便阅读
    );
    
    console.log(`Success: Generated ${baseName}.json`);
}

run().catch(console.error);
