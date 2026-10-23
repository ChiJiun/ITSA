const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const api = (a, body) => fetch('api.php?a=' + a, body && { method: 'POST', body }).then(r => r.json());

const bar = btn => `<div class="d-flex justify-content-between align-items-center mb-3"><span>圖片檔案管理系統</span>${btn}</div>`;
const card = (title, body) => `<div class="card"><div class="card-header">${title}</div><div class="card-body">${body}</div></div>`;
const back = '<a class="btn btn-outline-danger btn-sm" href="#/">回首頁Back</a>';

// 簡易路由：#/ 首頁、#/add 新增、#/view/3 檢視、#/edit/3 修改
async function render() {
  const [, page, id] = location.hash.split('/');
  const rows = await api('list');
  const row = rows.find(r => r.id == id);

  if (page === 'add') {
    app.innerHTML = bar(back) + card('編輯圖片資料', form());
  } else if (page === 'view' && row) {
    app.innerHTML = bar('') + card('檔案資訊', `<div class="row"><div class="col-md-8"><img class="img-fluid" src="${row.url}"></div>
      <div class="col-md-4"><b>檔案名稱</b><p>${esc(row.file_name)}</p><b>檔案大小</b><p>${row.file_size}</p><b>檔案型態</b><p>${row.file_type}</p>${back}</div></div>`);
  } else if (page === 'edit' && row) {
    app.innerHTML = bar(back) + card('編輯圖片資料', form(row));
  } else {
    app.innerHTML = bar('<a class="btn btn-primary" href="#/add">新增圖片</a>') + card('所有檔案資訊', `<table class="table">
      <thead><tr><th>圖片</th><th>檔案名稱</th><th>檔案大小</th><th>檔案格式</th><th>指令動作</th></tr></thead><tbody>${rows.map(r => `
      <tr><td><img src="${r.url}" height="40"></td><td>${esc(r.file_name)}</td><td>${r.file_size}</td><td>${r.file_type}</td><td>
        <a class="btn btn-success btn-sm" href="#/view/${r.id}">檢視</a>
        <a class="btn btn-info btn-sm" href="#/edit/${r.id}">修改</a>
        <button class="btn btn-danger btn-sm" data-del="${r.id}">刪除</button></td></tr>`).join('')}</tbody></table>`);
  }
}

// 新增與修改共用同一張表單；修改時多一個 hidden id 並顯示舊圖
const form = row => `<form enctype="multipart/form-data">
  <input type="hidden" name="id" value="${row ? row.id : ''}">
  <label class="form-label">選擇圖片</label>
  ${row ? `<div><img src="${row.url}" height="60"></div>` : ''}
  <input class="form-control mb-3" type="file" name="file">
  <button class="btn btn-primary">Submit</button></form>`;

// 前端先擋一次副檔名（立刻 alert）；真正的檢查在 api.php，不能只靠這裡
app.onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const ext = fd.get('file').name.split('.').pop().toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    alert('上傳檔案格式只能是 JPG、JPEG、PNG 或 GIF');
    return e.target.reset(); // 清掉選到的檔案，留在原頁等使用者重選
  }
  const res = await api(fd.get('id') ? 'update' : 'upload', fd);
  if (res.msg) return alert(res.msg);
  location.hash = '#/';
};

app.onclick = async e => {
  const id = e.target.dataset.del;
  if (!id || !confirm('你確定要刪除這筆資料嗎？')) return;
  await api('delete', new URLSearchParams({ id }));
  render();
};

onhashchange = render;
render();
