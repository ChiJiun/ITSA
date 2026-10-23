// 每張表的欄位：[中文表頭, 新增列的預設值]
const COLS = {
  users:   { name: ['姓名', ''], account: ['帳號', ''], password: ['密碼', '1234'], role: ['角色', 'patient'], must_change: ['需改密碼', '1'] },
  items:   { name: ['項目名稱', ''], min_score: ['最低分', '1'], max_score: ['最高分', '10'] },
  results: { user_id: ['受檢者', ''], item_id: ['醫檢項目', ''], score: ['分數(1~10)', ''] },
};
// 這些欄位用下拉選單；user_id、item_id 的選項在 loadAll() 讀完資料後補上
const OPTS = {
  role: [['tech', '醫檢員'], ['patient', '受檢者']],
  must_change: [['1', '是'], ['0', '否']],
};

// 跳脫 HTML：資料庫裡的文字不能被當成 HTML 執行
const esc = s => $('<div>').text(s ?? '').html();

// 共用：呼叫 api.php，失敗時把後端訊息顯示出來
function api(a, data, ok) {
  $.post('api.php?a=' + a, data, ok, 'json')
    .fail(x => $('#msg').text(x.responseJSON?.msg || '連線錯誤'));
}

// 只顯示某一區，其他藏起來
function show(id) {
  $('section').prop('hidden', true);
  $('#' + id).prop('hidden', false);
  $('#logout').prop('hidden', id === 'login');
}

function login() {
  api('login', { account: $('#account').val(), password: $('#password').val() }, r => {
    $('#msg').text('歡迎 ' + r.name);
    if (r.role === 'tech') { show('tech'); loadAll(); }
    else if (r.must_change == 1) show('chpwd');
    else loadMine();
  });
}

function register() {
  api('register', { name: $('#name').val(), account: $('#account').val(), password: $('#password').val() },
    r => $('#msg').text(r.msg));
}

function logout() { api('logout', {}, () => show('login')); }

function chpwd() {
  if (!$('#newpwd')[0].checkValidity()) return $('#msg').text('密碼格式不符：需 12 碼且含大寫、小寫、數字');
  api('chpwd', { password: $('#newpwd').val() }, r => { $('#msg').text(r.msg); loadMine(); });
}

function loadMine() {
  show('patient');
  $.getJSON('api.php?a=mine', rows =>
    $('#mine').html('<tr><th>項目</th><th>分數</th></tr>' +
      rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.score}</td></tr>`).join('')));
}

// 醫檢員：每列都是 input，可直接改完按「存」；最後一列空白用來新增
function load(t, done) {
  $.getJSON('api.php?a=list&t=' + t, rows => {
    const cols = Object.keys(COLS[t]);
    const input = (c, v) => OPTS[c]
      ? `<select data-c="${c}">${OPTS[c].map(([k, txt]) => `<option value="${k}" ${k == v ? 'selected' : ''}>${esc(txt)}</option>`).join('')}</select>`
      : `<input data-c="${c}" value="${esc(v).replace(/"/g, '&quot;')}">`;
    const cell = (r, c) => `<td>${input(c, r[c])}</td>`;
    const row = r => `<tr data-id="${r.id || ''}"><td>${r.id || '新增'}</td>${cols.map(c => cell(r, c)).join('')}
      <td><button onclick="save('${t}', this)">${r.id ? '存' : '新增'}</button>${r.id ? `<button onclick="del('${t}', ${r.id})">刪</button>` : ''}</td></tr>`;
    const blank = Object.fromEntries(cols.map(c => [c, COLS[t][c][1]])); // 新增列用預設值
    $('#' + t).html(`<tr><th>編號</th>${cols.map(c => `<th>${COLS[t][c][0]}</th>`).join('')}<th></th></tr>` +
      rows.map(row).join('') + row(blank));
    done && done(rows);
  });
}

function save(t, btn) {
  const tr = $(btn).closest('tr'), data = { t, id: tr.data('id') };
  tr.find('[data-c]').each((i, el) => data[el.dataset.c] = el.value); // input 和 select 都抓
  api('save', data, r => { $('#msg').text(r.msg); loadAll(); });
}

function del(t, id) {
  if (confirm('確定刪除？')) api('del', { t, id }, r => { $('#msg').text(r.msg); loadAll(); });
}

// b. 總表：受檢者 × 項目，一人一列（人員編號不重複）
function loadAll() {
  load('users', users => load('items', items => {
    // 讀完人員、項目後，產生檢查結果表要用的下拉選項（只列受檢者）
    OPTS.user_id = users.filter(u => u.role === 'patient').map(u => [u.id, `${u.id} ${u.name}`]);
    OPTS.item_id = items.map(i => [i.id, `${i.id} ${i.name}`]);
    load('results', results => {
      const score = (u, i) => results.find(r => r.user_id == u && r.item_id == i)?.score ?? '-';
      $('#pivot').html(`<tr><th>編號</th><th>姓名</th>${items.map(i => `<th>${esc(i.name)}</th>`).join('')}</tr>` +
        users.filter(u => u.role === 'patient').map(u =>
          `<tr><td>${u.id}</td><td>${esc(u.name)}</td>${items.map(i => `<td>${score(u.id, i.id)}</td>`).join('')}</tr>`).join(''));
    });
  }));
}
