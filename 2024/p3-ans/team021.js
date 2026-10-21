// 每張表要顯示/編輯的欄位，以及「新增列」的預設值
const COLS = {
  users:   { name: '', account: '', password: '1234', role: 'patient', must_change: 1 },
  items:   { name: '', min_score: 1, max_score: 10 },
  results: { user_id: '', item_id: '', score: '' },
};

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
      rows.map(r => `<tr><td>${r.name}</td><td>${r.score}</td></tr>`).join('')));
}

// 醫檢員：每列都是 input，可直接改完按「存」；最後一列空白用來新增
function load(t, done) {
  $.getJSON('api.php?a=list&t=' + t, rows => {
    const cols = Object.keys(COLS[t]);
    const cell = (r, c) => `<td><input data-c="${c}" value="${String(r[c] ?? '').replace(/"/g, '&quot;')}"></td>`;
    const row = r => `<tr data-id="${r.id || ''}"><td>${r.id || '新增'}</td>${cols.map(c => cell(r, c)).join('')}
      <td><button onclick="save('${t}', this)">存</button>${r.id ? `<button onclick="del('${t}', ${r.id})">刪</button>` : ''}</td></tr>`;
    $('#' + t).html(`<tr><th>id</th>${cols.map(c => `<th>${c}</th>`).join('')}<th></th></tr>` +
      rows.map(row).join('') + row(COLS[t]));
    done && done(rows);
  });
}

function save(t, btn) {
  const tr = $(btn).closest('tr'), data = { t, id: tr.data('id') };
  tr.find('input').each((i, el) => data[el.dataset.c] = el.value);
  api('save', data, r => { $('#msg').text(r.msg); loadAll(); });
}

function del(t, id) {
  if (confirm('確定刪除？')) api('del', { t, id }, r => { $('#msg').text(r.msg); loadAll(); });
}

// b. 總表：受檢者 × 項目，一人一列（人員編號不重複）
function loadAll() {
  load('users', users => load('items', items => load('results', results => {
    const score = (u, i) => results.find(r => r.user_id == u && r.item_id == i)?.score ?? '-';
    $('#pivot').html(`<tr><th>編號</th><th>姓名</th>${items.map(i => `<th>${i.name}</th>`).join('')}</tr>` +
      users.filter(u => u.role === 'patient').map(u =>
        `<tr><td>${u.id}</td><td>${u.name}</td>${items.map(i => `<td>${score(u.id, i.id)}</td>`).join('')}</tr>`).join(''));
  })));
}
