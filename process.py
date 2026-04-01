import sys
import os
from bs4 import BeautifulSoup
import re
from datetime import datetime

def parse_to_standard_date(date_str):
    """
    将不同的日期字符串尝试转换为 yyyy-MM-dd 格式
    """
    # 移除多余的词汇，只留日期部分
    clean_date = re.sub(r'(Effective|Updated|Revised|from|on|生效日期|更新日期|[:：])', '', date_str, flags=re.IGNORECASE).strip()
    
    # 尝试常见的几种格式解析
    formats = [
        "%B %d, %Y",  # April 21, 2025
        "%d %B %Y",   # 21 April 2025
        "%Y-%m-%d",   # 2025-04-21
        "%m/%d/%Y",   # 04/21/2025
        "%d/%m/%Y",   # 21/04/2025
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(clean_date, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    # 如果都匹配不上，返回原始清洗后的字符串
    return clean_date

def extract_update_date(soup):
    # 匹配模式：寻找关键词 + 日期部分
    # 重点捕获：Month DD, YYYY 或 YYYY-MM-DD
    pattern = r"(?:Effective|Updated|Revised|生效日期|更新日期).{0,20}?([A-Z][a-z]+ \d{1,2}, \d{4}|\d{4}-\d{1,2}-\d{1,2})"
    
    all_text = soup.get_text(separator=" ", strip=True)
    match = re.search(pattern, all_text, re.IGNORECASE)
    
    if match:
        raw_date = match.group(1) # 只取日期部分
        standard_date = parse_to_standard_date(raw_date)
        return standard_date
            
    return "Unknown Date"

def process():
    if len(sys.argv) < 2: return
    input_file = sys.argv[1]
    base_name = os.path.basename(input_file).replace(".html", "")
    output_path = f"data/{base_name}_clean.txt"
    os.makedirs("data", exist_ok=True)

    with open(input_file, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    date_val = extract_update_date(soup)

    # 提取正文
    main_content = (
        soup.find(id="help_content") or 
        soup.find(class_="shopify-policy__body") or 
        soup.find(class_="main-content") or
        soup.body
    )

    if main_content:
        clean_text = main_content.get_text(separator="\n", strip=True)
        
        # 格式化输出
        final_content = [
            f"SITE: {base_name.upper()}",
            f"LAST_UPDATED: {date_val}", # 这里就是标准的 yyyy-MM-dd
            f"MONITOR_TIME: {datetime.now().strftime('%Y-%m-%d')}",
            "-"*40,
            clean_text
        ]

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(final_content))
        
        print(f"Done: {base_name} -> {date_val}")

if __name__ == "__main__":
    process()
