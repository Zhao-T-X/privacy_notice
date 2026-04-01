// 使用 Deno 的 DOM 解析库
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

/**
 * 将日期字符串标准化为 yyyy-MM-dd
 */
function standardizeDate(dateStr: string): string {
  const cleanDate = dateStr.replace(/(Effective|Updated|Revised|from|on|生效日期|更新日期|[:：])/gi, "").trim();
  const date = new Date(cleanDate);
  
  if (isNaN(date.getTime())) {
    return "Unknown Date";
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  // Flat Data 会将文件名作为第一个参数传入
  const inputFilename = Deno.args[0];
  if (!inputFilename) {
    console.error("No input file provided");
    return;
  }

  const decoder = new TextDecoder("utf-8");
  const data = await Deno.readFile(inputFilename);
  const html = decoder.decode(data);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (!doc) {
    console.error("Failed to parse HTML");
    return;
  }

  // 1. 提取日期 (寻找包含关键字的文本)
  let dateVal = "Unknown Date";
  const bodyText = doc.body?.textContent || "";
  const dateMatch = bodyText.match(/(?:Effective|Updated|Revised|生效日期|更新日期).{0,20}?([A-Z][a-z]+ \d{1,2}, \d{4}|\d{4}-\d{1,2}-\d{1,2})/i);
  
  if (dateMatch && dateMatch[1]) {
    dateVal = standardizeDate(dateMatch[1]);
  }

  // 2. 提取主体内容 (尝试 Amazon, Shopify, eBay 的常见容器)
  const mainContent = doc.querySelector("#help_content, .shopify-policy__body, .main-content, main, body");
  const cleanText = mainContent?.textContent.replace(/\n\s*\n/g, "\n").trim() || "";

  // 3. 构造输出
  const baseName = inputFilename.replace(".html", "");
  const outputContent = `SITE: ${baseName.toUpperCase()}
LAST_UPDATED: ${dateVal}
CHECKED_AT: ${new Date().toISOString().split('T')[0]}
----------------------------------------
${cleanText}`;

  // 确保 data 目录存在
  try {
    await Deno.mkdir("data");
  } catch (e) {
    // 目录已存在则忽略
  }

  const encoder = new TextEncoder();
  await Deno.writeFile(`data/${baseName}_clean.txt`, encoder.encode(outputContent));
  
  console.log(`Successfully processed ${inputFilename} -> data/${baseName}_clean.txt`);
}

main();
