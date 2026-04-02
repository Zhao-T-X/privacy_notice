const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const parserFactory = require('./parserFactory');

async function main() {
  // 读取站点配置
  const sitesConfig = JSON.parse(fs.readFileSync('sites.json', 'utf8'));
  
  // 读取请求头配置
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  
  // 初始化浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const site of sitesConfig) {
      console.log(`Processing ${site.name}...`);
      
      // 创建对应的解析器
      const parser = parserFactory.createParser(site.name);
      if (!parser) {
        console.error(`No parser found for ${site.name}`);
        continue;
      }
      
      // 创建页面
      const page = await browser.newPage();
      
      // 设置请求头
      await page.setExtraHTTPHeaders(config.headers);
      
      try {
        // 导航到目标页面
        await page.goto(site.url, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });
        
        // 打印页面内容到文件
        const pageContent = await page.content();
        const pageDir = path.join(__dirname, 'pages');
        if (!fs.existsSync(pageDir)) {
          fs.mkdirSync(pageDir, { recursive: true });
        }
        const pagePath = path.join(pageDir, `${site.name}.html`);
        fs.writeFileSync(pagePath, pageContent, 'utf8');
        console.log(`[Page Saved] ${site.name} - Saved to ${pagePath}`);
        
        // 解析页面
        const result = await parser.parse(page, site);
        
        // 保存结果
        if (result && result.last_updated && result.last_updated !== 'Unknown Date' && result.last_updated !== 'Unknown') {
          await saveResult(result, site.name);
        } else {
          console.log(`[Skipped] ${site.name} - last_updated is empty or unknown`);
        }
        
      } catch (error) {
        console.error(`Error processing ${site.name}:`, error.message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

async function saveResult(result, siteName) {
  const outputDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, `${siteName}.json`);
  let existingData = null;
  
  if (fs.existsSync(outputPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch (err) {
      console.warn(`[Warning] existing JSON parse failed for ${siteName}:`, err.message);
    }
  }
  
  // 保留旧内容
  if (existingData && existingData.content) {
    result.old_content = existingData.content;
  }
  
  // 保留旧日期（如果新日期未解析到）
  if (!result.last_updated && existingData && existingData.last_updated) {
    result.last_updated = existingData.last_updated;
  }
  
  // 写入文件
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  
  console.log(`[Success] Processed ${siteName}`);
  console.log(`          Date: ${result.last_updated || 'Unknown'}`);
  console.log(`          Saved to: ${outputPath}`);
}

main().catch(err => {
  console.error('[Error] Main process failed:', err.message);
  process.exit(1);
});