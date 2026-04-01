const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');

async function run() {
    const inputFilename = process.argv[2];
    if (!inputFilename) return;

    const html = fs.readFileSync(inputFilename, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const baseName = path.basename(inputFilename, '.html');
    const outputDir = path.join(process.cwd(), 'data');
    const outputPath = path.join(outputDir, `${baseName}.json`);

    // 1. 提取并清洗文本内容
    // 针对 SHEIN，移除脚本、样式、以及可能干扰对比的动态元素
    const contentNode = document.querySelector('.article-detail, article, main') || document.body;
    
    // 深度清理：移除所有 script, style 和隐藏元素
    const scripts = contentNode.querySelectorAll('script, style, .hidden, [style*="display:none"]');
    scripts.forEach(s => s.remove());

    // 获取纯文本并压缩空白符
    const rawContent = contentNode.textContent || "";
    const cleanContent = rawContent.replace(/\s+/g, ' ').trim();

    // 2. 计算当前内容的哈希值
    const currentHash = crypto.createHash('md5').update(cleanContent).digest('hex');

    // 3. 读取旧内容进行对比
    let oldData = null;
    if (fs.existsSync(outputPath)) {
        try {
            oldData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        } catch (e) {
            console.error("Old JSON format error, overwriting...");
        }
    }

    // 4. 判断是否需要更新
    if (oldData && oldData.content_hash === currentHash) {
        console.log(`[${baseName}] 内容未变动，跳过更新。`);
        return;
    }

    // 5. 构造结果（仅在不同时运行）
    const result = {
        site: baseName.toUpperCase(),
        // 如果内容变了，且页面没日期，我们将“检测到变动的时间”作为更新参考
        last_update_at: new Date().toISOString().split('T')[0],
        last_checked: new Date().toISOString(),
        content_hash: currentHash, // 存储指纹用于下次对比
        file_type: "html",
        content_length: cleanContent.length,
        content: cleanContent
    };

    // 写入文件
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`[${baseName}] 检测到内容更新！新 JSON 已生成。`);
    console.log(`Hash: ${currentHash}`);
}

run().catch(console.error);