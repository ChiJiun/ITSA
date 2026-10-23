// 三個頁面共用一支 JS，依 <body data-page="..."> 決定要執行哪一段
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

// 一律 POST；token 放在 Authorization 標頭。401 代表沒登入或過期 → 回登入頁
async function call(a, data = {}) {
  const r = await fetch('api.php?a=' + a, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + localStorage.token },
    body: new URLSearchParams(data),
  });
  if (r.status === 401 && document.body.dataset.page === 'admin') return logout();
  return r.json();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('exp');
  location.href = 'login'; // 相對路徑：/admin → /login
}

const pages = {
  // 已登入（token 有效）就直接進後台，否則留在登入表單
  async login() {
    $('form').onsubmit = async e => {
      e.preventDefault();
      const r = await call('login', { username: $('username').value, password: $('password').value });
      if (!r.token) return alert(r.msg);
      localStorage.token = r.token;
      localStorage.exp = r.exp;
      location.href = 'admin';
    };
    if (localStorage.token && Array.isArray(await call('list'))) location.href = 'admin';
  },

  admin() {
    // 沒 token 或已過期就踢走；否則用 setTimeout 在 exp 到期那一刻自動登出（沒有登出鈕）
    const left = localStorage.exp * 1000 - Date.now();
    if (!localStorage.token || !(left > 0)) return logout();
    setTimeout(logout, left);

    let items = [], editId = null;
    const buttons = () => $('btns').innerHTML = editId
      ? '<button class="btn" id="save">更新</button><button class="btn" id="cancel">取消</button>'
      : '<button class="btn" id="save">新增</button>';

    async function load() {
      items = (await call('list')) || [];
      $('list').innerHTML = items.map(i => `<div class="item"><b>${esc(i.question)}</b><div>${esc(i.answer)}</div>
        <div class="row"><button class="btn" data-edit="${i.id}">編輯</button><button class="btn" data-del="${i.id}">刪除</button></div></div>`).join('');
    }
    function reset() { editId = null; $('question').value = $('answer').value = ''; buttons(); }

    $('btns').onclick = async e => {
      if (e.target.id === 'cancel') return reset();
      if (e.target.id !== 'save') return;
      const r = await call(editId ? 'update' : 'add', { id: editId, question: $('question').value, answer: $('answer').value });
      if (r.msg) return alert(r.msg);
      reset();
      load();
    };
    $('list').onclick = async e => {
      const { edit, del } = e.target.dataset;
      if (edit) { // 編輯：把這筆帶回最上面兩個欄位，按鈕換成 更新 / 取消
        const i = items.find(i => i.id == edit);
        $('question').value = i.question; $('answer').value = i.answer;
        editId = i.id; buttons();
      }
      if (del) {
        await call('delete', { id: del });
        if (editId == del) reset();
        load();
      }
    };
    buttons();
    load();
  },

  chat() {
    const say = (text, who) => {
      const d = document.createElement('div');
      d.className = 'msg ' + who;
      d.textContent = text; // textContent：使用者輸入不會被當成 HTML
      $('box').append(d);
      $('box').scrollTop = $('box').scrollHeight; // 自動捲到最底
    };
    say('您好，請問有需要什麼服務嗎？', 'bot');
    $('form').onsubmit = async e => {
      e.preventDefault();
      const q = $('q').value.trim();
      if (!q) return;
      say(q, 'user');
      $('q').value = '';
      say((await call('ask', { q })).answer, 'bot');
    };
  },
};
pages[document.body.dataset.page]();
