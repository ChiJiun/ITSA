let data = {}; // 後端回來的 { me, favs, anns, cal }

// 文字跳脫：玩家輸入的遊戲名稱不能被當 HTML 執行
const esc = s => $('<div>').text(s).html();

// 共用：呼叫 API；401 代表沒登入 → 回登入畫面
function api(a, body) {
  return $.post('api.php?a=' + a, body).fail(x => {
    if (x.status === 401) showLogin();
    else alert(x.responseJSON?.msg || '發生錯誤');
  });
}

function showLogin() { $('#mainView').addClass('d-none'); $('#loginView').removeClass('d-none'); }

function login() {
  api('login', { username: $('#username').val(), password: $('#password').val() })
    .done(load)
    .fail(() => $('#err').text('帳號或密碼錯誤'));
}

function logout() { api('logout').done(showLogin); }

// 重新抓資料並畫整個畫面（不重整網頁）
function load() {
  return api('data').done(d => {
    data = d;
    $('#loginView').addClass('d-none');
    $('#mainView').removeClass('d-none');
    $('#nick').text(d.me.nickname);

    // (3)a. 喜愛清單標籤 + 兩個下拉選單，都用同一份 favs 產生 → 新增後三處同步
    $('#favs').html(d.favs.map(g =>
      `<span class="badge bg-info text-dark me-1 mb-1">${esc(g.game_name)}
        <a href="#" class="text-dark" onclick="delFav(${g.id}); return false">✕</a></span>`).join(''));
    const opts = d.favs.map(g => `<option value="${g.id}">${esc(g.game_name)}</option>`).join('');
    // 重畫選單後保留原本的選擇（每 3 秒自動更新時才不會把使用者選的值洗掉）
    const keepPost = $('#postGame').val(), keep = $('#filter').val();
    $('#postGame').html('<option value="">-- 請選擇遊戲 --</option>' + opts).val(keepPost);
    if (!$('#postGame').val()) $('#postGame').val('');
    $('#filter').html('<option value="">全部</option>' + opts).val(keep);
    if (!$('#filter').val()) $('#filter').val('');

    drawLobby();
    // (4)b. 行事曆只有已成局 / 滿員（後端已過濾）
    $('#cal').html(d.cal.map(e => `<tr>
      <td class="text-warning"><i class="fa-regular fa-clock"></i> ${e.event_time}</td>
      <td><span class="badge text-bg-secondary">${esc(e.game_name)}</span></td>
      <td><b class="text-info">${esc(e.host)}</b> 與另外 ${e.cnt - 1} 人</td></tr>`).join('')
      || '<tr><td colspan="3" class="text-muted">尚無已成局的事件</td></tr>');
  });
}

// (3)b. 大廳只顯示「我喜愛的遊戲」，再依快速過濾篩選
function drawLobby() {
  const f = $('#filter').val();
  const list = data.anns.filter(a => data.favs.some(g => g.id == a.game_id) && (!f || a.game_id == f));
  $('#cards').html(list.map(a => `
    <div class="col-md-6" id="ann${a.id}"><div class="card card-body ann">
      <div class="d-flex justify-content-between">
        <h5 class="text-info"><i class="fa-solid fa-crosshairs"></i> ${esc(a.game_name)}</h5>
        ${a.status === 'formed'
          ? '<span class="badge bg-success align-self-start"><i class="fa-solid fa-fire"></i> 已成局招募</span>'
          : '<span class="badge bg-primary align-self-start"><i class="fa-solid fa-user-plus"></i> 招募中</span>'}
      </div>
      <div><i class="fa-regular fa-calendar"></i> 時段: ${a.event_time}</div>
      <div><i class="fa-solid fa-crown text-warning"></i> 發起隊長: ${esc(a.host)}</div>
      <div class="d-flex justify-content-between"><span>成局門檻: ${a.min_players}人</span><b>${a.cnt} / ${a.max_players} 人</b></div>
      <div class="progress my-2" style="height:6px"><div class="progress-bar bg-info" style="width:${a.cnt / a.max_players * 100}%"></div></div>
      ${a.joined == 1
        ? '<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-check"></i> 你已在隊伍中</button>'
        : `<button class="btn btn-info btn-sm" onclick="join(${a.id})"><i class="fa-solid fa-right-to-bracket"></i> 我加入</button>`}
    </div></div>`).join('') || '<p class="text-muted">目前沒有招募公告</p>');
}

function addFav() {
  api('addfav', { name: $('#favName').val() }).done(() => { $('#favName').val(''); load(); });
}

function delFav(id) { api('delfav', { game_id: id }).done(load); }

function post() {
  const time = $('#postTime').val();
  if (!$('#postGame').val() || !time) return alert('請選擇遊戲與時段');
  api('post', { game_id: $('#postGame').val(), event_time: time.replace('T', ' ') + ':00', min: $('#postMin').val(), max: $('#postMax').val() })
    .done(load);
}

// (4)a. 加入後若滿員 → 字卡淡出再重畫；否則直接重畫（狀態文字會變成已成局）
function join(id) {
  api('join', { id }).done(r => r.status === 'full' ? $('#ann' + id).fadeOut(600, load) : load());
}

// 頁籤切換：只切 d-none，不換頁
$('[data-tab]').on('click', function (e) {
  e.preventDefault();
  $('[data-tab]').removeClass('active');
  $(this).addClass('active');
  $('#lobby, #calendar').addClass('d-none');
  $('#' + this.dataset.tab).removeClass('d-none');
  load(); // 切頁籤時抓最新資料
});

// 每 3 秒自動更新：別的玩家加入、公告滿員時，自己的大廳與行事曆也會同步（只在已登入時）
setInterval(() => $('#mainView').hasClass('d-none') || load(), 3000);

// 開頁先試著拿資料：有登入就進大廳，沒登入 api() 會切回登入畫面
load();
