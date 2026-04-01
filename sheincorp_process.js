const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function run() {
    const inputFilename = process.argv[2]; // Flat 下载的原始 API 结果 (latest_contract.json)
    if (!inputFilename) return;

    const rawData = JSON.parse(fs.readFileSync(inputFilename, 'utf8'));
    // 1. 提取核心内容 (假设 API 结构为 data.contractContent)
    // 如果 API 结构不同，请根据实际返回修改路径
    const rawContent = rawData.info?.contractContent || "";
    console.error(rawContent);
    // 清洗 HTML 标签（API 经常返回带 <p> 标签的内容）
    const cleanContent = rawContent.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

    if (!cleanContent) {
        console.error("API 返回内容为空，跳过处理");
        process.exit(1);
    }

    // 2. 计算指纹
    const currentHash = crypto.createHash('md5').update(cleanContent).digest('hex');

    const outputDir = path.join(process.cwd(), 'data');
    const baseName = path.basename(inputFilename, '.json');
    const outputPath = path.join(outputDir, `${baseName}.json`);

    // 3. 增量更新检查
    if (fs.existsSync(outputPath)) {
        const oldData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        if (oldData.content_hash === currentHash) {
            console.log(`[${baseName}] 内容未变动，无需更新。`);
            return;
        }
    }

    // 4. 构造你的“标准格式”
    const result = {
        site: "SHEIN-OPEN-PLATFORM",
        last_updated: new Date().toISOString().split('T')[0],
        file_info: {
            type: "json",
            content_length: cleanContent.length,
            language: "en" // 或从 API 字段动态获取
        },
        metadata: {
            source_url: "https://open.sheincorp.com/api/open/contract/getLatestContract",
            source_file: inputFilename,
            selector_used: "api_direct",
            extracted_at: new Date().toISOString(),
            content_hash: currentHash // 建议存入 metadata 方便下次对比
        },
        content: cleanContent
    };

    // 5. 写入
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`[${baseName}] 协议已更新！Hash: ${currentHash}`);
}

run().catch(console.error);
