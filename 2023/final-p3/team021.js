const $ = id => document.getElementById(id);
let all = [];            // CSV 讀進來的全部姓名
let arrange = sequential; // 目前的排法；改寬高時沿用

// 下拉選單 5~10
for (const id of ['w', 'h'])
  $(id).innerHTML = Array.from({ length: 6 }, (_, i) => `<option>${i + 5}</option>`).join('');

const size = () => $('w').value * $('h').value;
const names = () => all.slice(0, size()); // 超過 w*h 只取最前面 w*h 筆；保留完整名單，座位調大時被截掉的人會回來

// 讀檔：FileReader 讀成文字，一行一個姓名
$('file').onchange = e => {
  const r = new FileReader();
  r.onload = () => {
    all = r.result.replace(/^﻿/, '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    refresh();
  };
  r.readAsText(e.target.files[0]);
};

function sequential() { // 先放名單，不足的補空字串
  return [...names(), ...Array(size() - names().length).fill('')];
}

function random() {     // Fisher-Yates：從後面往前，每格和「前面隨機一格」交換
  const a = sequential();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function refresh() {
  // 名單用 textContent 放入（不用 innerHTML），避免姓名裡的 < > 被當成 HTML
  $('list').replaceChildren(...names().map((n, i) => {
    const tr = document.createElement('tr');
    tr.insertCell().textContent = i + 1;
    tr.insertCell().textContent = n;
    return tr;
  }));
  // 座位表：CSS grid，欄數 = 寬
  const box = $('seats');
  box.style.gridTemplateColumns = `repeat(${$('w').value}, 1fr)`;
  box.replaceChildren(...arrange().map(n => {
    const d = document.createElement('div');
    d.className = 'seat';
    d.textContent = n;
    return d;
  }));
}

$('seq').onclick = () => { arrange = sequential; refresh(); };
$('rnd').onclick = () => { arrange = random; refresh(); };
$('w').onchange = $('h').onchange = refresh; // 改寬高就重畫

refresh();
