// 每個欄位的規則：test 回傳 true 代表「有問題」，msg 是紅字
const SQL = /['‘’#!*]|\|\||&&|select|use|drop|delete|from|or|and/i; // 符號 + 關鍵字，i = 不分大小寫
const sqlRule = { bad: v => SQL.test(v), msg: '疑似SQL Injection攻擊字串' };

// 信箱：帳號(英數_.，頭尾不能是 _ .) @ 網址(至少兩段，點不連續)
const MAIL = /^[a-z0-9]([a-z0-9_.]*[a-z0-9])?@[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

const rules = {
  name:  sqlRule,
  addr1: sqlRule,
  addr2: sqlRule,
  mail:  { bad: v => !MAIL.test(v) || /\.\./.test(v), msg: '電子郵件帳號不符合規則' },
  mail2: { bad: v => v !== $('#mail').val(), msg: '電子郵件帳號不相同' },
  pw:    { bad: v => strength(v) < 4 || v.length < 8 || serial(v), msg: '密碼不符合規範' },
  pw2:   { bad: v => v !== $('#pw').val(), msg: '兩次輸入密碼不相同' },
};

// 「不連續」解讀為：不能有相同字元相連（aa），也不能有 3 個遞增字元（abc、123）
const serial = v => /(.)\1/.test(v) || [...v].some((c, i) => v.charCodeAt(i + 1) - v.charCodeAt(i) === 1 && v.charCodeAt(i + 2) - v.charCodeAt(i + 1) === 1);

// 密碼強度 = 符合幾種字元類別（小寫、大寫、數字、符號）
const strength = v => [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter(r => r.test(v)).length;

// 檢查單一欄位；回傳 true = 通過。空白只有按確認時才標紅（無文字）
function check($el, submitting) {
  const v = $el.val(), r = rules[$el.attr('id')];
  let msg = '';
  if (!v) { if (!submitting) { show($el, ''); return true; } }
  else if (r && r.bad(v)) msg = r.msg;
  const ok = v && !msg;
  show($el, ok ? '' : msg, !ok);
  return !!ok;
}

// 紅框 + 輸入框下方紅字（錯誤訊息 div 緊接在輸入框後面）
function show($el, msg, bad) {
  $el.toggleClass('bad', !!bad).next('.err').remove();
  if (msg) $el.after(`<div class="err">${msg}</div>`);
}

$(() => {
  // blur = 失去焦點（由 active 變 inactive）
  $('.chk').on('blur', function () { check($(this)); });

  // 勾選後複製戶籍地址；已勾選時戶籍地址再改也同步
  const copy = () => $('#same').prop('checked') && $('#addr2').val($('#addr1').val());
  $('#same').on('change', copy);
  $('#addr1').on('input', copy);

  // 眼睛：切換 type=password / text
  $('.eye').on('click', function () {
    const $i = $('#' + $(this).data('for'));
    $i.attr('type', $i.attr('type') === 'password' ? 'text' : 'password');
  });

  // 輸入時即時顯示強度
  $('#pw').on('input', function () {
    const n = strength($(this).val());
    $('#strength').text($(this).val() ? ['弱', '弱', '中', '中', '強'][n] : '');
  });

  $('#f').on('submit', e => {
    e.preventDefault();
    // 用 map 先全部檢查完（every 遇到錯就停，會漏標紅）
    const all = $('.chk').map((_, el) => check($(el), true)).get().every(Boolean);
    alert(all ? '資料已填寫完畢，謝謝' : '請填入所有資料及修正錯誤資料');
  });
});
