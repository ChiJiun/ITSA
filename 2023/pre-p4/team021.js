const $ = id => document.getElementById(id);
const MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const pad = n => String(n).padStart(2, '0'); // 7 -> '07'

let sel = new Date();                              // 所選日期，一開始是今天
let y = sel.getFullYear(), m = sel.getMonth();     // 月曆正在看的年、月（月份 0~11）

function show() {
  // 民國年 = 西元年 - 1911
  $('msg').textContent = `所選日期: 民國 ${sel.getFullYear() - 1911} 年 ${pad(sel.getMonth() + 1)} 月 ${pad(sel.getDate())} 日`;
}

function render() {
  const first = new Date(y, m, 1).getDay();        // 當月 1 號是星期幾（0=日），前面要補幾格空白
  const days = new Date(y, m + 1, 0).getDate();    // 下個月的第 0 天 = 當月最後一天 = 當月天數（自動處理閏年）
  let h = `<div class="head"><span onclick="go(-1)">&lt;</span>${MON[m]} ${y}<span onclick="go(1)">&gt;</span></div>
           <div class="grid">${[...'SMTWTFS'].map(d => `<div>${d}</div>`).join('')}`;
  h += '<div></div>'.repeat(first);
  for (let d = 1; d <= days; d++) {
    const on = sel.getFullYear() === y && sel.getMonth() === m && sel.getDate() === d;
    h += `<div class="day${on ? ' sel' : ''}" onclick="pick(${d})">${d}</div>`;
  }
  $('cal').innerHTML = h + '</div>';
}

// new Date(2024, 12, 1) 會自動進位成 2025/01，所以翻月只要 m 加減 1
function go(n) { const d = new Date(y, m + n, 1); y = d.getFullYear(); m = d.getMonth(); render(); }
function pick(d) { sel = new Date(y, m, d); show(); render(); }

show(); render();
