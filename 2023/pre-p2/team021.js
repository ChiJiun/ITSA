const $ = id => document.getElementById(id);
let state = 'idle'; // idle 未開始 / run 倒數中 / pause 暫停
let timer;          // setInterval 的編號，clearInterval 要用

const pad = n => String(n).padStart(2, '0');

// 剩餘毫秒 → 時:分:秒（小時不取餘數，超過 24 小時也能顯示）
function show(ms) {
  const s = Math.floor(ms / 1000);
  $('time').textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

function tick() {
  const left = new Date($('target').value) - new Date(); // Date 相減得到毫秒
  if (left <= 0) { reset(); alert('目標日期及時間已到，計時結束'); return; }
  show(left);
}

function reset() {
  clearInterval(timer);
  state = 'idle';
  $('start').textContent = '開始';
  $('target').value = '';
  show(0);
}

// 同一顆按鈕，依 state 決定做什麼、下一個文字是什麼
$('start').onclick = () => {
  if (state === 'run') {
    clearInterval(timer);
    state = 'pause';
    $('start').textContent = '繼續';
    return;
  }
  if (state === 'idle') {
    if (!$('target').value) return alert('請先設定目標日期及時間');
    if (new Date($('target').value) <= new Date()) return alert('目標時間已過，請重新設定');
  }
  state = 'run';
  $('start').textContent = '暫停';
  tick();
  timer = setInterval(tick, 1000);
};

$('reset').onclick = reset;
