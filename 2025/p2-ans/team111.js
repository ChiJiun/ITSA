let rows = [], chart, top10 = [];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); // 防止 CSV 內容被當 HTML
const sum = (list, key) => list.reduce((s, r) => s + r[key], 0);

// 1. 讀資料：PHP 回傳 [週, 關鍵字, 次數, ...]，轉成物件比較好讀
fetch('team111.php').then(r => r.json()).then(data => {
  rows = data.map(([week, kw, count]) => ({ week, kw, count: Number(count) }));
  const weeks = [...new Set(rows.map(r => r.week))]; // Set 去重複
  weeks.forEach(w => $('week').add(new Option(w, w)));
  draw();
});

// 2. 依目前選的週期算 TOP 10，畫圖和表格
function draw() {
  const w = $('week').value;
  const picked = rows.filter(r => !w || r.week === w);
  const weeks = [...new Set(picked.map(r => r.week))];

  // 每個關鍵字加總次數 → 由大到小取前 10
  const total = {};
  picked.forEach(r => total[r.kw] = (total[r.kw] || 0) + r.count);
  top10 = Object.entries(total).sort((a, b) => b[1] - a[1]).slice(0, 10);

  $('weeks').textContent = weeks.length;
  $('kws').textContent = Object.keys(total).length;
  $('hot').textContent = top10[0]?.[0] || '-';
  $('table').innerHTML = '<tr><th>排名</th><th>關鍵字</th><th>次數</th></tr>' +
    top10.map(([kw, c], i) => `<tr><td>${i + 1}</td><td>${esc(kw)}</td><td>${c}</td></tr>`).join('');

  // 長條圖：TOP 10 總次數；趨勢圖：TOP 5 關鍵字每週的次數變化
  const line = $('type').value === 'line';
  const datasets = line
    ? top10.slice(0, 5).map(([kw]) => ({
        label: kw,
        data: weeks.map(wk => sum(picked.filter(r => r.week === wk && r.kw === kw), 'count')),
      }))
    : [{ label: '出現次數', data: top10.map(t => t[1]) }];

  if (chart) chart.destroy(); // 換圖前要先銷毀舊圖
  chart = new Chart($('chart'), {
    type: line ? 'line' : 'bar',
    data: { labels: line ? weeks : top10.map(t => t[0]), datasets },
    options: { plugins: { title: { display: true, text: `TOP 10 詐騙關鍵字（${w || '全部週期'}）` } } },
  });
}

// 3. 下載：用 Blob / dataURL 產生檔案，再用 <a download> 觸發下載
function save(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

function downloadCsv() {
  const csv = '\uFEFF排名,關鍵字,次數\n' + top10.map(([kw, c], i) => `${i + 1},${kw},${c}`).join('\n'); // \uFEFF 讓 Excel 不亂碼
  save(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), `週報_${$('week').value || '全部'}.csv`);
}

function downloadPng() { save(chart.toBase64Image(), 'chart.png'); }
