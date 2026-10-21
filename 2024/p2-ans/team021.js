// 資料存在 localStorage，重新整理也不會消失
let books = JSON.parse(localStorage.books || '[]');
let nextId = Number(localStorage.nextId || 1);
let editId = null; // null = 新增模式；有值 = 正在更新哪一本

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/</g, '&lt;'); // 防止輸入 <script> 被當成 HTML 執行

function store() {
  localStorage.books = JSON.stringify(books);
  localStorage.nextId = nextId;
  render();
}

// (2) 查看：把陣列畫成表格
function render() {
  $('list').innerHTML = books.map(b => `
    <tr><td>${b.id}</td><td>${esc(b.title)}</td><td>${esc(b.author)}</td><td>${b.year}</td>
    <td><button onclick="del(${b.id})">刪除</button></td>
    <td><button onclick="edit(${b.id})">更新</button></td></tr>`).join('');
}

// (1) 添加 / (4) 更新：同一個表單，看 editId 決定
function save() {
  const b = { id: editId || nextId++, title: $('title').value, author: $('author').value, year: $('year').value };
  if (editId) books = books.map(x => x.id === editId ? b : x);
  else books.push(b);
  editId = null;
  $('btn').textContent = '添加圖書';
  document.forms[0].reset();
  store();
}

// (3) 刪除：filter 留下 id 不同的
function del(id) {
  books = books.filter(b => b.id !== id);
  store();
}

// (4) 按「更新」：把資料帶回表單，按鈕改成「儲存更新」
function edit(id) {
  const b = books.find(b => b.id === id);
  $('title').value = b.title;
  $('author').value = b.author;
  $('year').value = b.year;
  editId = id;
  $('btn').textContent = '儲存更新';
}

render();
