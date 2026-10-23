const f = document.getElementById('f');
const out = document.getElementById('out');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); // 檔名可能含 < 符號

// 一開始與選完檔案都呼叫同一個函式顯示結果
function show() {
  const files = [...f.files]; // FileList 轉成真正的陣列才能用 map / reduce
  const total = files.reduce((sum, x) => sum + x.size, 0); // File.size 單位是 byte
  out.innerHTML = `file names: ${files.length ? files.map(x => esc(x.name)).join(',') : 0}<br>
    selected files: ${files.length};<br>
    total size: ${files.length ? (total / 1024 / 1024).toFixed(3) + ' MiB (' + total + ' bytes)' : 0}`;
}

f.onchange = show; // 選好檔案按「打開」後觸發
show();
