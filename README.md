# ITSA 全國大專校院程式設計極客挑戰賽：歷屆考古題解答

每題都以「最精簡的程式 + 易懂註解」重寫，初賽放在 `年份/p?-ans/`（2024~2026）；其他年份精選題放在 `年份/pre-p?/`（初賽）與 `年份/final-p?/`（決賽）。
官方題目 PDF 放在各年份資料夾，來源為競賽官網的[過去競賽資料](https://itsageekcontest.itsa.org.tw/2026/history.php)。
列印用筆記：[筆記.html](筆記.html)（A4，開頭是常用語法速查，之後每題一個分頁；瀏覽器開啟後直接列印，邊界選「預設」）。
改了程式碼或 `tools/cheatsheet.py`（常用語法）後，執行 `python tools/build_notes.py` 重新產生。

| 題目 | 資料夾 | 技術 | 執行方式 |
|---|---|---|---|
| 2019 決賽 P1 canvas 時鐘 | 2019/final-p1 | canvas + JS | 直接開 team021.html |
| 2021 初賽 P1 線上上傳檔案 | 2021/pre-p1 | File API | 直接開 team021.html |
| 2021 決賽 P3 圖片檔案管理 | 2021/final-p3 | PHP 上傳 + MySQL | XAMPP 匯入 team021-3.sql，開 team021-3.html |
| 2022 決賽 P1 視訊控制播放 | 2022/final-p1 | video API | 直接開 team021.html，選本機 mp4 |
| 2022 決賽 P3 會員資料輸入 | 2022/final-p3 | jQuery 表單驗證 | 直接開 team021.html |
| 2023 初賽 P1 圖片展示 | 2023/pre-p1 | flex + transition | 直接開 team021.html |
| 2023 初賽 P2 計時器 | 2023/pre-p2 | Date + setInterval | 直接開 team021.html |
| 2023 初賽 P4 日期選擇元件 | 2023/pre-p4 | Date 月曆 | 直接開 team021.html |
| 2023 決賽 P3 排座位工具 | 2023/final-p3 | Bootstrap + FileReader | 直接開 team021.html，載入 students.csv |
| 2024 決賽 P1 event_filter 元件 | 2024/final-p1 | Bootstrap + jQuery .load | 要用伺服器開（XAMPP 或 `python -m http.server`） |
| 2024 決賽 P3 聊天問答 + JWT | 2024/final-p3 | PHP + MySQL + JWT | 見 2024/final-p3/說明.md |
| 2024 初賽 P1 響應式 ITSA 首頁 | 2024/p1-ans | HTML5 + CSS3 | 直接開 team021.html |
| 2024 初賽 P2 圖書管理系統 | 2024/p2-ans | HTML + JS + localStorage | 直接開 team021.html |
| 2024 初賽 P3 健康度量管理系統 | 2024/p3-ans | jQuery + PHP PDO + MySQL | XAMPP 匯入 team021.sql，開 team021.html（帳號見 說明.md） |
| 2025 P1 河內塔 | 2025/p1-ans | HTML + JS 拖放 | 直接開 team111.html |
| 2025 P2 詐騙關鍵字週報 | 2025/p2-ans | PHP + Chart.js | XAMPP 開 team111.html |
| 2026 P1 叫號與候位系統 | 2026/p1-ans | Node 22.13+ + Express + SQLite | 放入離線套件 node_modules，`npm start` |
| 2026 P2 GamersHub | 2026/p2-ans | Bootstrap 5 + jQuery + PHP | XAMPP 匯入 gamershub.sql，開 team123.html |

測試帳號：2024 P3 醫檢員 tech1/1234、受檢者 p1~p5/1234；2026 P1 admin/password123；2026 P2 faker/caps/tenz/s1mple 密碼 1234；2024 決賽 P3 admin/password。

2025 年的題目 PDF 不在資料夾中，2025 兩題的需求是依先前作答與筆記整理的。
