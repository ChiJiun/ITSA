# 讀取各題答案原始碼，產生可列印的 筆記.html（A4、每題分頁、灰階區分）
# 用法：python tools/build_notes.py
import html
import re
from pathlib import Path

from cheatsheet import CHEATSHEET

ROOT = Path(__file__).resolve().parent.parent

# 每題：標題、題目重點、解題思路、要印的檔案
PROBLEMS = [
    ('2024 P1｜響應式 ITSA 首頁（HTML5 + CSS3，不可用 Bootstrap）', '2024/p1-ans',
     ['>900px：導覽列、頁首、內容區置中等寬；頁首灰底、圖片與文字不等高、報名按鈕',
      '內容兩列圖文交疊：第一列圖左文右，第二列圖右文左',
      '750~900px 滿版無左右邊界；<750px 每個元素各佔一列'],
     ['.wrap{max-width:900px;margin:auto} 一行搞定置中，寬度不足時自然滿版',
      '交疊＝文字框 margin 負值 + position:relative 疊到圖片上',
      '第二列用 flex-direction:row-reverse 反轉，不必改 HTML',
      '手機版 .txt{display:contents} 拆掉外框，h3 才能用 order 排到圖片上面'],
     ['team021.html', 'team021.css']),
    ('2024 P2｜圖書管理系統（新增 / 列表 / 刪除 / 更新）', '2024/p2-ans',
     ['輸入書名、作者、出版年份新增；表格列出全部；每列有刪除、更新按鈕'],
     ['資料放陣列，每次改完存 localStorage 再整張表重畫（render）',
      '新增和更新共用同一個表單，用 editId 是否為 null 判斷模式',
      '刪除＝filter 留下 id 不同的；更新＝map 換掉 id 相同的'],
     ['team021.html', 'team021.js', 'team021.css']),
    ('2024 P3｜健康度量管理系統（jQuery + PHP PDO + MySQL）', '2024/p3-ans',
     ['人員（醫檢員/受檢者）、醫檢項目、檢查結果三張表，分數 1~10',
      '醫檢員：註冊、登入、三張表新增/刪除/更新/查詢，同項目人員編號不重複',
      '受檢者：首次登入強制改密碼（12 碼、大小寫英文 + 數字），之後單頁看全部分數',
      '測試帳號：醫檢員 tech1/1234；受檢者 p1~p5/1234'],
     ['一支 api.php 用 ?a=動作 分流；表名、欄位走白名單，SQL 一律 prepare',
      'results 加 UNIQUE(user_id,item_id) → 資料庫層保證不重複；CHECK 限制 1~10',
      'save 有 id 就 UPDATE、沒有就 INSERT，三張表共用同一段程式',
      '前端每列都是 input，改完按「存」；最後一列空白當新增列',
      '密碼規則前端 pattern 先擋、後端 preg_match 再驗一次'],
     ['team021.sql', 'api.php', 'team021.html', 'team021.js', 'team021.css']),
    ('2025 P1｜圖形化河內塔（拖放）', '2025/p1-ans',
     ['3~9 個圓盤，拖放移動；顯示最少步數 2ⁿ−1 與目前步數',
      '只能拿最上面的圓盤，大的不能疊在小的上；全部移到右柱即過關'],
     ['柱子用 flex-direction:column-reverse → appendChild 就是疊到最上面',
      '最上面那塊＝lastElementChild，DOM 本身就是狀態，不用另存陣列',
      'dragover 一定要 preventDefault，否則 drop 不會觸發'],
     ['team111.html', 'team111.css', 'team111.js']),
    ('2025 P2｜詐騙關鍵字週報（CSV + Chart.js + PHP）', '2025/p2-ans',
     ['讀 weekly_kw.csv（week, keyword, count, …），可選全部或單一週期',
      '長條圖 / 趨勢圖切換，顯示 TOP 10 與統計卡，下載 CSV 與圖表 PNG',
      '※ 原題 PDF 不在資料夾中，需求依先前作答與筆記整理'],
     ['PHP 只負責把 CSV 轉 JSON；統計全部在前端做',
      '加總用物件當字典 total[kw] += count，再 Object.entries 排序取前 10',
      '換圖前 chart.destroy()；PNG 用 chart.toBase64Image()',
      'CSV 開頭加 \\uFEFF（BOM），Excel 開中文才不會亂碼'],
     ['team111.php', 'team111.html', 'team111.js', 'team111.css']),
    ('2026 P1｜叫號與候位系統（Node.js + Express + SQLite）', '2026/p1-ans',
     ['前台：選服務（一般 G / 開戶 A / 諮詢 C）取號，顯示號碼、目前叫號、等待清單，5 秒內自動更新',
      '櫃台：admin/password123 登入，下一位、完成服務、歷史紀錄、登出銷毀 session',
      '單一 FIFO 佇列；同時最多 1 筆服務中；違規回 409；服務非白名單回 400',
      '號碼 前綴+3 位數，超過 999 變 A1000，存 DB 不重置；重啟後完整還原',
      '執行：把 P1_Node離線套件.zip 的 node_modules 放進 p1-ans，npm start'],
     ['用 Node 22 內建 node:sqlite（同步 API），不用 callback，也不會有併發交錯',
      '計數器一行：INSERT … ON CONFLICT DO UPDATE SET n=n+1 RETURNING n',
      '時間存毫秒數字排序最準，輸出時才格式化成 YYYY/M/D HH:mm:ss',
      'session 自己做：Set 存 sid，登出 delete → 舊 Cookie 重放也是 401',
      '權限一定在伺服器檢查（auth middleware），前端停用按鈕只是輔助',
      '前端 element id 別取 history、login 這種和全域變數撞名的名字'],
     ['app.js', 'package.json', 'public/team123.html', 'public/admin.html', 'public/common.js', '系統設計文件.md']),
    ('2026 P2｜GamersHub 玩家組隊與行事曆（Bootstrap 5 + jQuery + PHP）', '2026/p2-ans',
     ['左「控制面板」右「大廳/行事曆」，<992px 上下堆疊；SPA 不重整',
      '未登入直接開大廳或 API → 跳回登入；玩家 A、B 資料各自隔離',
      '新增喜愛遊戲（不存在就建立）→ 標籤、發布選單、快速過濾同步多一項；移除後該遊戲公告消失',
      '招募中 → 達下限「已成局招募」→ 達上限淡出消失，並出現在每位成員的行事曆',
      '測試帳號 faker / caps / tenz / s1mple，密碼 1234'],
     ['col-lg-4 / col-lg-8：lg 斷點剛好是 992px',
      '所有查詢都 WHERE user_id = session 的 uid → 天生資料隔離',
      '一個 load() 抓全部資料、重畫所有區塊 → 三個選單自然同步',
      '狀態用一句 UPDATE … CASE 依人數重算；join 回傳 full 時先 fadeOut 再重畫',
      '未登入：AJAX 回 401；瀏覽器直接開回 302（401 不會跟著 Location 跳）',
      'Font Awesome 的 CSS 寫 ../webfonts/，所以 all.min.css 要放在 css/ 子資料夾'],
     ['api.php', 'team123.html', 'app.js', '系統設計文件.md']),
]

# 註解上色：先 escape，再把註解包成 <i>
COMMENT = {
    '.js': [r'(^|\s)(//.*)$', r'/\*.*?\*/'],
    '.css': [r'/\*.*?\*/'],
    '.php': [r'(^|\s)(//.*)$', r'(^|\s)(#.*)$'],
    '.sql': [r'(^|\s)(--.*)$'],
    '.py': [r'(^|\s)(#.*)$'],
    '.html': [r'&lt;!--.*?--&gt;', r'(^|\s)(//.*)$'],
}


def highlight(code, ext):
    out = html.escape(code)
    for pat in COMMENT.get(ext, []):
        if pat.startswith('(^|\\s)'):
            out = re.sub(pat, lambda m: m.group(1) + f'<i>{m.group(2)}</i>', out, flags=re.M)
        else:
            out = re.sub(pat, lambda m: f'<i>{m.group(0)}</i>', out, flags=re.S)
    return out


def md(text):
    # 只處理設計文件用到的：# 標題、| 表格 |、一般段落；`code` 轉 <code>
    inline = lambda t: re.sub(r'`([^`]+)`', r'<code>\1</code>', html.escape(t))
    out, rows = [], []
    for line in text.splitlines() + ['']:
        if line.startswith('|'):
            cells = [c.strip() for c in line.strip('|').split('|')]
            if not set(''.join(cells)) <= set('-: '):
                rows.append(cells)
            continue
        if rows:
            head, *rest = rows
            tr = lambda cs, t: '<tr>' + ''.join(f'<{t}>{inline(c)}</{t}>' for c in cs) + '</tr>'
            out.append('<table class="md">' + tr(head, 'th') + ''.join(tr(r, 'td') for r in rest) + '</table>')
            rows = []
        if line.startswith('#'):
            out.append(f'<b>{inline(line.lstrip("# "))}</b>')
        elif line.strip():
            out.append(f'<div>{inline(line)}</div>')
    return '<div class="doc">' + ''.join(out) + '</div>'


def cheatsheet():
    rows = lambda items: ''.join(f'<tr><td><pre class="syn">{html.escape(code)}</pre></td><td>{html.escape(desc)}</td></tr>'
                                 for code, desc in items)
    return ('<section><h2>常用語法速查</h2>' +
            ''.join(f'<h3>{html.escape(cat)}</h3><table class="cheat">{rows(items)}</table>' for cat, items in CHEATSHEET) +
            '</section>')


def section(title, folder, spec, ideas, files):
    li = lambda xs: ''.join(f'<li>{html.escape(x)}</li>' for x in xs)
    codes = ''
    for f in files:
        src = (ROOT / folder / f).read_text(encoding='utf-8').strip()
        body = md(src) if f.endswith('.md') else f'<pre>{highlight(src, Path(f).suffix)}</pre>'
        codes += f'<div class="file">{folder}/{f}</div>{body}'
    return (f'<section><h2>{html.escape(title)}</h2><div class="head">'
            f'<div class="spec"><b>題目重點</b><ul>{li(spec)}</ul></div><div class="idea"><b>解題思路</b><ul>{li(ideas)}</ul></div></div>'
            f'{codes}</section>')


CSS = '''
/* A4 直式；灰階深淺做區分，黑白列印也分得出來 */
@page { size: A4; margin: 10mm 10mm 10mm 12mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* 列印時保留背景色 */
body { margin: 0; font: 10pt/1.5 "Microsoft JhengHei", "PingFang TC", sans-serif; color: #000; background: #fff; }
main { max-width: 188mm; margin: auto; }
section + section { break-before: page; }   /* 每題從新的一頁開始 */
h1 { font-size: 16pt; margin: 0 0 3mm; padding-bottom: 1.5mm; border-bottom: 2.5px solid #000; }
h2 { font-size: 13pt; margin: 0 0 2.5mm; padding: 1.5mm 3mm; background: #000; color: #fff; break-after: avoid; }
ul { margin: 1mm 0 0; padding-left: 5mm; }
li { margin-bottom: 0.5mm; }
/* 題目重點（淺灰底）與解題思路（白底粗左線）並排 */
.head { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 3mm; break-inside: avoid; }
.spec, .idea { padding: 2mm 3mm; font-size: 9.5pt; line-height: 1.45; }
.spec { background: #e6e6e6; }
.idea { border: 1px solid #999; border-left: 5px solid #000; }
.spec b, .idea b { font-size: 10.5pt; }
/* 常用語法：分類標題深灰底；語法欄淺灰底等寬字；列與列之間斑馬紋 */
h3 { font-size: 11pt; margin: 3mm 0 0; padding: 1mm 3mm; background: #444; color: #fff; break-after: avoid; }
.cheat { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
.cheat td { border: 1px solid #999; padding: 0.6mm 2mm; vertical-align: top; line-height: 1.35; }
.cheat td:first-child { width: 60%; background: #ececec; }
.cheat tr { break-inside: avoid; }
pre.syn { border: 0; padding: 0; font-size: 8.5pt; }
/* 檔名：中灰底白字；程式碼：灰色左線 */
.file { font: bold 9pt Consolas, monospace; background: #555; color: #fff; padding: 1mm 3mm; margin-top: 3mm; break-after: avoid; }
pre { margin: 0; padding: 1.5mm 3mm; border: 1px solid #555; border-top: 0; font: 8.5pt/1.25 Consolas, "Courier New", monospace;
      white-space: pre-wrap; word-break: break-all; }
/* 註解：淺灰底＋斜體＋深灰字，和程式碼一眼分開 */
pre i { background: #e3e3e3; color: #333; font-style: italic; }
.doc { font-size: 8.5pt; line-height: 1.35; padding: 1mm 3mm; border: 1px solid #555; border-top: 0; }
.doc > b { display: block; margin-top: 1.5mm; }
.md { border-collapse: collapse; width: 100%; margin: 1mm 0 2mm; }
.md th, .md td { border: 1px solid #888; padding: 0.6mm 1.5mm; text-align: left; vertical-align: top; }
.md th { background: #d0d0d0; }
.md tr:nth-child(even) td { background: #f2f2f2; }
code { font: 8.5pt Consolas, monospace; background: #e6e6e6; padding: 0 1mm; }
@media screen { body { padding: 10mm 0; } }
'''


def build():
    body = cheatsheet() + ''.join(section(*p) for p in PROBLEMS)
    page = (f'<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>ITSA 歷屆考古題筆記</title>'
            f'<style>{CSS}</style></head><body><main><h1>ITSA 極客挑戰賽 歷屆考古題筆記（2024~2026）</h1>'
            f'{body}</main></body></html>')
    (ROOT / '筆記.html').write_text(page, encoding='utf-8')
    print('寫入', ROOT / '筆記.html')


build()
