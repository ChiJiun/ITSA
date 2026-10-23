# 讀取各題答案原始碼，產生可列印的 筆記.html（A4、每題分頁、彩色區分初賽／決賽）
# 用法：python tools/build_notes.py
import html
import re
from pathlib import Path

from cheatsheet import CHEATSHEET

ROOT = Path(__file__).resolve().parent.parent

# 每題：標題、題目重點、解題思路、要印的檔案
PROBLEMS = [
    ('2019 決賽 P1｜在網頁上顯示時鐘 2.0（canvas、三角函數）', '2019/final-p1',
     ['canvas 500×500：橘框黃底大圓、藍色與紅色小圓，中心都在正中央',
      '依系統時間畫時針、分針、秒針；時針位置要把分與秒的進度算進去',
      '圓周畫 1~12 紅色數字與棕色刻度，每條刻度角度不同',
      '疊放：秒針最上，其下紅圓、藍圓、分針，時針最底；每秒更新並顯示數字時間'],
     ['角度用「一圈的比例 f」：x = O + len·sin(2πf)、y = O − len·cos(2πf)，0 在 12 點方向',
      '寫一個 line(f, from, to, width, color) 小函式，指針和刻度共用',
      '時針 f = (h%12 + m/60 + s/3600)/12；分針 f = (m + s/60)/60；秒針 f = s/60',
      'canvas 後畫的蓋在上面：時針 → 分針 → 藍圓 → 紅圓 → 秒針',
      '數字用 fillText 搭配 textAlign、textBaseline 置中；setInterval(draw, 1000) 每秒重畫'],
     ['team021.html', 'team021.js']),
    ('2021 初賽 P1｜線上上傳檔案（input file multiple、File API）', '2021/pre-p1',
     ['一次選多個檔案（input type=file multiple）',
      '顯示檔案個數、每個檔名、總大小（byte 與 MiB）',
      '起始畫面顯示 file names: 0、selected files: 0、total size: 0'],
     ['選完檔案觸發 onchange，檔案在 input.files（FileList）',
      '`[...input.files]` 轉成陣列，才能 map 取 name、reduce 加總 size',
      'File.size 單位是 byte；MiB = size / 1024 / 1024，toFixed(3)',
      '起始與 onchange 共用同一個 show()；檔名放進 innerHTML 前要跳脫'],
     ['team021.html', 'team021.js']),
    ('2021 決賽 P3｜圖片檔案管理系統（PHP + MySQL 檔案上傳）', '2021/final-p3',
     ['建立 crud 資料庫與 uploads 資料表（id、tgl_upload、file_name、file_size、file_type）',
      '新增圖片：只接受 JPG、JPEG、PNG、GIF，格式不符要 alert 並留在上傳頁',
      '首頁列表顯示圖片、檔名、大小、格式，每列有檢視、修改、刪除',
      '修改要刪掉伺服器上的舊檔；刪除先 confirm，資料列與實體檔一起刪'],
     ['form 加 enctype="multipart/form-data"；前端 FormData + fetch 送出，PHP 從 $_FILES 取檔',
      '副檔名 in_array 白名單，再用 getimagesize 確認內容真的是圖片',
      '實體檔名自己產生 uploads/<id>.<副檔名>，不用使用者給的檔名 → 防路徑穿越與覆蓋',
      'move_uploaded_file 搬檔；修改、刪除時 unlink 舊檔',
      '列表顯示原始檔名前 esc() 跳脫；圖片網址加 ?v=filemtime 避免快取舊圖',
      '單頁用 location.hash 切換首頁、新增、檢視、修改'],
     ['team021-3.html', 'team021-3.js', 'api.php', 'team021-3.sql']),
    ('2022 決賽 P1｜視訊控制播放系統（video、createObjectURL）', '2022/final-p1',
     ['按鈕選本機 mp4 並播放；播放、暫停按鈕要顯示目前狀態',
      '放大、縮小、正常三種畫面大小',
      '音量滑桿，並顯示目前播放時間與總長度'],
     ['`URL.createObjectURL(file)` 產生暫時網址，直接設給 video.src，不必上傳',
      'video.play()、video.pause() 控制播放，順便更新狀態文字',
      '放大縮小只改 video.width',
      '音量用 range（min 0、max 1、step 0.1），oninput 時設 video.volume',
      'timeupdate 事件讀 currentTime、duration，轉成 mm:ss；loadedmetadata 時先顯示總長度'],
     ['team021.html', 'team021.js']),
    ('2022 決賽 P3｜會員資料輸入系統（jQuery 表單驗證、正規表示式）', '2022/final-p3',
     ['失去焦點（blur）就檢查，錯誤時紅框加紅字',
      '正規表示式偵測 SQL Injection 字串、檢查信箱格式、密碼規範與強度',
      '同一組 radio、勾選 checkbox 複製戶籍地址、placeholder、眼睛圖示切換顯示密碼',
      '按確認再全部檢查一次，彈出成功或失敗訊息'],
     ['`.on("blur", ...)` 綁在所有要檢查的欄位上',
      '每個欄位的規則放進物件（test + 錯誤訊息），一個 check 函式通用',
      'SQL Injection 用 /…|select|from|or|and/i，i 表示不分大小寫',
      '密碼「不連續」：/(.)\\1/ 擋相同字元相連，charCodeAt 相差 1 擋 abc、123',
      'radio 的 name 相同就是同一組；checkbox 的 change 事件複製地址',
      '眼睛圖示用 `attr("type")` 在 password 和 text 間切換',
      '送出時先 map 檢查全部欄位再 every，才不會遇到第一個錯就停、漏標紅'],
     ['team021.html', 'team021.css', 'team021.js']),
    ('2023 初賽 P1｜圖片展示系統（flex-wrap、篩選、hover scale）', '2023/pre-p1',
     ['Flex 排 8 張圖；按鈕篩選：全部 8、自然 5、城市 3',
      '每種篩選都要 RWD：寬螢幕多欄、窄螢幕單欄',
      '圖有陰影；hover 放大（scale）且陰影消失'],
     ['display:flex + flex-wrap:wrap + justify-content:center：放不下自動換行，不需 @media',
      'data-type 標分類，按鈕只切換 hidden，其餘自動重排',
      'width:300px + max-width:100%，窄螢幕跟著縮',
      ':hover { transform: scale(1.1); box-shadow: none; } 搭配 transition: transform .3s'],
     ['team021.html', 'team021.css', 'team021.js']),
    ('2023 初賽 P2｜計時器（datetime-local、Date 相減、setInterval）', '2023/pre-p2',
     ['標題、剩餘時間 00:00:00、日期時間輸入欄、開始與重置按鈕',
      '沒設定或設成過去時間，按開始要跳出提醒',
      '開始後每秒倒數，按鈕依序變成暫停、繼續；重置或時間到回到初始畫面'],
     ['`<input type="datetime-local" step="1">` 內建選擇器，值可直接 new Date()',
      '剩餘 = new Date(目標) − new Date()，得到毫秒再換成時分秒',
      '用 state（idle / run / pause）決定同一顆按鈕的行為與文字',
      '暫停、重置 clearInterval；開始、繼續 setInterval(tick, 1000)',
      'tick 發現剩餘 ≤ 0 就 reset() 再 alert'],
     ['team021.html', 'team021.css', 'team021.js']),
    ('2023 初賽 P4｜日期選擇元件（Date、月曆、民國年）', '2023/pre-p4',
     ['訊息列顯示「所選日期: 民國 112 年 07 月 26 日」，下方月曆可逐月翻頁',
      '月曆佔視窗 80% 寬、水平置中、5px 藍色實線框；所選日期灰底',
      '標題 Jul 2023 與 < > 翻頁，星期列 S M T W T F S；日期與星期要正確（113/02 有 29 日且是週四）'],
     ['`new Date(y, m, 1).getDay()`：1 號是星期幾 → 前面補幾個空格',
      '`new Date(y, m + 1, 0).getDate()`：當月天數（下個月第 0 天），閏年自動處理',
      '翻月用 new Date(y, m ± 1, 1)，月份超出範圍會自動進位',
      '民國年 = 西元 − 1911；`padStart(2, "0")` 補零',
      'CSS grid repeat(7, 1fr) 排七欄；width:80% + margin:0 auto 置中'],
     ['team021.html', 'team021.css', 'team021.js']),
    ('2023 決賽 P3｜排座位工具（Bootstrap、FileReader 讀 CSV、洗牌）', '2023/final-p3',
     ['載入 CSV 名單並顯示；超過 w×h 只取前面的人',
      '寬、高下拉選單 5~10，改動時刷新座位表',
      '循序排座由左至右、由上至下；隨機排座把 w×h 陣列洗牌，空位也隨機',
      '≥576px 左 25% 右 75%，以下上下堆疊'],
     ['col-sm-3 / col-sm-9：sm 斷點剛好是 576px',
      'FileReader.readAsText() 讀檔，再 split(/\r?\n/) 一行一個姓名',
      'names.slice(0, w*h) 取前 w×h 筆；座位用 grid-template-columns: repeat(w, 1fr)',
      '範例名單 students.csv 一行一個姓名；先把名單補空字串湊滿 w×h，再 Fisher-Yates 洗牌，空位自然散開',
      'Fisher-Yates：i 從尾到頭，和 0..i 之間的隨機位置交換'],
     ['team021.html', 'team021.css', 'team021.js']),
    ('2024 初賽 P1｜響應式 ITSA 首頁（HTML5 + CSS3，不可用 Bootstrap）', '2024/p1-ans',
     ['>900px：導覽列、頁首、內容區置中等寬；頁首灰底、圖片與文字不等高、報名按鈕',
      '內容兩列圖文交疊：第一列圖左文右，第二列圖右文左',
      '750~900px 滿版無左右邊界；<750px 每個元素各佔一列'],
     ['.wrap{max-width:900px;margin:auto} 一行搞定置中，寬度不足時自然滿版',
      '交疊＝文字框 margin 負值 + position:relative 疊到圖片上',
      '第二列用 flex-direction:row-reverse 反轉，不必改 HTML',
      '手機版 .txt{display:contents} 拆掉外框，h3 才能用 order 排到圖片上面'],
     ['team021.html', 'team021.css']),
    ('2024 初賽 P2｜圖書管理系統（新增 / 列表 / 刪除 / 更新）', '2024/p2-ans',
     ['輸入書名、作者、出版年份新增；表格列出全部；每列有刪除、更新按鈕'],
     ['資料放陣列，每次改完存 localStorage 再整張表重畫（render）',
      '新增和更新共用同一個表單，用 editId 是否為 null 判斷模式',
      '刪除＝filter 留下 id 不同的；更新＝map 換掉 id 相同的'],
     ['team021.html', 'team021.js', 'team021.css']),
    ('2024 初賽 P3｜健康度量管理系統（jQuery + PHP PDO + MySQL）', '2024/p3-ans',
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
    ('2024 決賽 P1｜可重複使用網頁元件 event_filter（jQuery .load、JSON）', '2024/final-p1',
     ['元件片段只含 UI 與 JS（沒有 html/head/body），由主頁動態匯入',
      'from、to 兩個日期欄位，改變就刷新事件列表，依日期遞增排序',
      '事件 JSON 放在主頁 script 標籤，至少 10 筆且不按日期排',
      '匯入失敗要顯示錯誤訊息；≥768px 兩區塊各佔 50%，以下上下堆疊'],
     ['`$("#box").load("event_filter.html", callback)`：.load() 會執行片段內的 script，fetch + innerHTML 不會',
      '事件放 `<script id="events" type="application/json">`，用 JSON.parse($("#events").text()) 讀',
      'yyyy-mm-dd 字串可以直接比大小過濾；sort 用 localeCompare',
      'callback 判斷 status === "error"，顯示 xhr.status 與 statusText',
      '兩區塊都是 col-md-6（md＝768px）；列表用 .text() 自動跳脫'],
     ['team021.html', 'event_filter.html', 'team021.css']),
    ('2024 決賽 P3｜聊天對話框後端與前端整合（PHP + MySQL + JWT）', '2024/final-p3',
     ['/login 管理員登入，錯誤 alert「使用者或密碼錯誤！」；admin/password 存在資料庫',
      'JWT 驗證，10 分鐘自動登出回 /login；未登入進 /admin 跳回 /login',
      '/admin 問答新增、編輯（更新／取消）、刪除，預設 4 筆；管理 API 都要驗登入',
      '/ 對話頁：Enter 或按鈕送出，查無回「很抱歉，我無法回答這個問題。」，自動捲到最底'],
     ['手寫 HS256：hash_hmac("sha256", header.payload, 金鑰, true) + base64url；驗證用 hash_equals 並檢查 exp',
      '金鑰第一次執行時用 random_bytes 產生，存成 secret.php（return 字串），從網址開只會執行、看不到內容',
      '登入回傳 token（exp＝現在 + 600 秒），前端存 localStorage，呼叫 API 帶 Authorization: Bearer',
      '前端 setTimeout(logout, exp*1000 − Date.now()) 自動登出；API 回 401 也導回登入頁',
      '密碼用 password_hash 存、password_verify 比對',
      '/login、/admin：XAMPP 用 .htaccess RewriteRule，PHP 內建伺服器用 router.php',
      '用 form submit 處理 Enter（不會誤送輸入法選字）；訊息用 textContent，scrollTop = scrollHeight 捲到底'],
     ['team021.html', 'login.html', 'admin.html', 'team021.js', 'team021.css', 'api.php', 'team021.sql', '.htaccess', 'router.php']),
    ('2025 初賽 P1｜圖形化河內塔（拖放）', '2025/p1-ans',
     ['3~9 個圓盤，拖放移動；顯示最少步數 2ⁿ−1 與目前步數',
      '只能拿最上面的圓盤，大的不能疊在小的上；全部移到右柱即過關'],
     ['柱子用 flex-direction:column-reverse → appendChild 就是疊到最上面',
      '最上面那塊＝lastElementChild，DOM 本身就是狀態，不用另存陣列',
      'dragover 一定要 preventDefault，否則 drop 不會觸發'],
     ['team111.html', 'team111.css', 'team111.js']),
    ('2025 初賽 P2｜詐騙關鍵字週報（CSV + Chart.js + PHP）', '2025/p2-ans',
     ['讀 weekly_kw.csv（week, keyword, count, …），可選全部或單一週期',
      '長條圖 / 趨勢圖切換，顯示 TOP 10 與統計卡，下載 CSV 與圖表 PNG',
      '※ 原題 PDF 不在資料夾中，需求依先前作答與筆記整理'],
     ['PHP 只負責把 CSV 轉 JSON；統計全部在前端做',
      '加總用物件當字典 total[kw] += count，再 Object.entries 排序取前 10',
      '換圖前 chart.destroy()；PNG 用 chart.toBase64Image()',
      'CSV 開頭加 \\uFEFF（BOM），Excel 開中文才不會亂碼'],
     ['team111.php', 'team111.html', 'team111.js', 'team111.css']),
    ('2026 初賽 P1｜叫號與候位系統（Node.js + Express + SQLite）', '2026/p1-ans',
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
    ('2026 初賽 P2｜GamersHub 玩家組隊與行事曆（Bootstrap 5 + jQuery + PHP）', '2026/p2-ans',
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
    return ('<section class="cheatsheet"><h2>常用語法速查</h2>' +
            ''.join(f'<h3>{html.escape(cat)}</h3><table class="cheat">{rows(items)}</table>' for cat, items in CHEATSHEET) +
            '</section>')


def section(title, folder, spec, ideas, files):
    li = lambda xs: ''.join('<li>' + re.sub(r'`([^`]+)`', r'<code>\1</code>', html.escape(x)) + '</li>' for x in xs)
    codes = ''
    for f in files:
        src = (ROOT / folder / f).read_text(encoding='utf-8').strip()
        body = md(src) if f.endswith('.md') else f'<pre>{highlight(src, Path(f).suffix)}</pre>'
        codes += f'<div class="file">{folder}/{f}</div>{body}'
    return (f'<section class="{"final" if "決賽" in title else "pre"}"><h2>{html.escape(title)}</h2><div class="head">'
            f'<div class="spec"><b>題目重點</b><ul>{li(spec)}</ul></div><div class="idea"><b>解題思路</b><ul>{li(ideas)}</ul></div></div>'
            f'{codes}</section>')


CSS = '''
/* A4 直式彩色：藍＝初賽、紅＝決賽、綠＝語法；黑白列印時深淺仍分得出來 */
@page { size: A4; margin: 10mm 10mm 10mm 12mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* 列印時保留背景色 */
body { margin: 0; font: 10pt/1.5 "Microsoft JhengHei", "PingFang TC", sans-serif; color: #111; background: #fff; }
main { max-width: 188mm; margin: auto; }
section + section { break-before: page; }   /* 每題從新的一頁開始 */
h1 { font-size: 16pt; margin: 0 0 3mm; padding-bottom: 1.5mm; border-bottom: 2.5px solid #1d4ed8; color: #1e3a8a; }
h2 { font-size: 13pt; margin: 0 0 2.5mm; padding: 1.5mm 3mm; background: #1e40af; color: #fff; break-after: avoid; }
.final h2 { background: #9f1239; border-left: 4mm solid #fda4af; } /* 決賽用深紅＋淺色左框，黑白列印也分得出來 */
.cheatsheet h2 { background: #065f46; }     /* 語法速查用深綠 */
ul { margin: 1mm 0 0; padding-left: 5mm; }
li { margin-bottom: 0.5mm; }
/* 題目重點（淡藍底）與解題思路（淡橘底、橘色粗左線）並排 */
.head { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 2mm; break-inside: avoid; }
.spec, .idea { padding: 1.5mm 3mm; font-size: 9.5pt; line-height: 1.4; }
.spec { background: #e0ecff; border-left: 5px solid #3b82f6; }
.idea { background: #fff4e5; border-left: 5px solid #f59e0b; }
.spec b { font-size: 10.5pt; color: #1e40af; }
.idea b { font-size: 10.5pt; color: #b45309; }
/* 常用語法：分類標題綠底；語法欄淡綠底等寬字 */
h3 { font-size: 11pt; margin: 3mm 0 0; padding: 1mm 3mm; background: #047857; color: #fff; break-after: avoid; }
.cheat { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
.cheat td { border: 1px solid #a7c4b5; padding: 0.6mm 2mm; vertical-align: top; line-height: 1.35; }
.cheat td:first-child { width: 60%; background: #ecfdf5; }
.cheat tr { break-inside: avoid; }
pre.syn { border: 0; padding: 0; font-size: 8.5pt; background: none; }
/* 檔名：深灰藍底白字；程式碼：極淡灰底 */
.file { font: bold 9pt Consolas, monospace; background: #334155; color: #fff; padding: 0.8mm 3mm; margin-top: 2mm; break-after: avoid; }
pre { margin: 0; padding: 1.5mm 3mm; border: 1px solid #94a3b8; border-top: 0; background: #f8fafc; font: 8.5pt/1.2 Consolas, "Courier New", monospace;
      white-space: pre-wrap; word-break: break-all; }
/* 註解：綠色斜體，和程式碼一眼分開 */
pre i { color: #15803d; font-style: italic; }
.doc { font-size: 8.5pt; line-height: 1.35; padding: 1mm 3mm; border: 1px solid #94a3b8; border-top: 0; }
.doc > b { display: block; margin-top: 1.5mm; color: #1e3a8a; }
.md { border-collapse: collapse; width: 100%; margin: 1mm 0 2mm; }
.md th, .md td { border: 1px solid #94a3b8; padding: 0.6mm 1.5mm; text-align: left; vertical-align: top; }
.md th { background: #dbeafe; }
.md tr:nth-child(even) td { background: #f1f5f9; }
code { font: 8.5pt Consolas, monospace; background: #fde68a; padding: 0 1mm; }
@media screen { body { padding: 10mm 0; } }
'''


def build():
    body = cheatsheet() + ''.join(section(*p) for p in PROBLEMS)
    page = (f'<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>ITSA 歷屆考古題筆記</title>'
            f'<style>{CSS}</style></head><body><main><h1>ITSA 極客挑戰賽 歷屆考古題筆記（2019~2026 初賽・決賽精選）</h1>'
            f'{body}</main></body></html>')
    (ROOT / '筆記.html').write_text(page, encoding='utf-8')
    print('寫入', ROOT / '筆記.html')


build()
