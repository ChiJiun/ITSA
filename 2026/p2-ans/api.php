<?php
// GamerHub API：api.php?a=動作
session_start();
header('Content-Type: application/json; charset=utf-8');
$host = '127.0.0.1'; $db = 'gamer_hub'; $user = 'root'; $pass = ''; $charset = 'utf8mb4';
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

function out($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function q($sql, $args = []) { global $pdo; $s = $pdo->prepare($sql); $s->execute($args); return $s; }

$a = $_GET['a'] ?? '';
$p = $_POST;

if ($a === 'login') {
  $u = q('SELECT id, nickname FROM users WHERE username=? AND password=?', [$p['username'] ?? '', $p['password'] ?? ''])->fetch();
  if (!$u) out(['msg' => '帳號或密碼錯誤'], 401);
  $_SESSION['uid'] = $u['id'];
  out($u);
}

// (2)a. 沒登入：瀏覽器直接開網址 → 轉回登入頁；AJAX 呼叫 → 401，前端再切回登入畫面
$uid = $_SESSION['uid'] ?? null;
if (!$uid) {
  if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'XMLHttpRequest') { header('Location: team123.html'); exit; } // 302 跳轉
  out(['msg' => '請先登入'], 401);
}

// 依人數決定狀態：滿員 full、達門檻 formed、其他 open
function refreshStatus($id) {
  q("UPDATE announcements a SET status = CASE
       WHEN (SELECT COUNT(*) FROM announcement_participants WHERE announcement_id=a.id) >= a.max_players THEN 'full'
       WHEN (SELECT COUNT(*) FROM announcement_participants WHERE announcement_id=a.id) >= a.min_players THEN 'formed'
       ELSE 'open' END WHERE id=?", [$id]);
  return q('SELECT status FROM announcements WHERE id=?', [$id])->fetchColumn();
}

switch ($a) {
  case 'logout':
    session_destroy();
    out(['ok' => true]);

  case 'data': // 一次拿齊畫面需要的資料；全部都以 $uid 過濾 → (2)b. 不同玩家看到不同內容
    $me = q('SELECT nickname FROM users WHERE id=?', [$uid])->fetch();
    $favs = q('SELECT g.id, g.game_name FROM user_games ug JOIN games g ON g.id=ug.game_id WHERE ug.user_id=? ORDER BY g.game_name', [$uid])->fetchAll();
    // 大廳：未滿員的公告，附上人數、隊長暱稱、我是否已加入
    $anns = q("SELECT a.*, g.game_name, u.nickname host,
        (SELECT COUNT(*) FROM announcement_participants WHERE announcement_id=a.id) cnt,
        EXISTS(SELECT 1 FROM announcement_participants WHERE announcement_id=a.id AND user_id=?) joined
      FROM announcements a JOIN games g ON g.id=a.game_id JOIN users u ON u.id=a.host_id
      WHERE a.status <> 'full' ORDER BY a.event_time", [$uid])->fetchAll();
    // (4)b. 行事曆：我有參加、且已成局或滿員
    $cal = q("SELECT a.event_time, g.game_name, u.nickname host,
        (SELECT COUNT(*) FROM announcement_participants WHERE announcement_id=a.id) cnt
      FROM announcement_participants ap JOIN announcements a ON a.id=ap.announcement_id
      JOIN games g ON g.id=a.game_id JOIN users u ON u.id=a.host_id
      WHERE ap.user_id=? AND a.status IN ('formed','full') ORDER BY a.event_time", [$uid])->fetchAll();
    out(['me' => $me, 'favs' => $favs, 'anns' => $anns, 'cal' => $cal]);

  case 'addfav': // (3)a. 遊戲不存在就先建立，再加進我的清單（IGNORE：重複不報錯）
    $name = trim($p['name'] ?? '');
    if ($name === '') out(['msg' => '請輸入遊戲名稱'], 400);
    q('INSERT IGNORE INTO games (game_name) VALUES (?)', [$name]);
    $gid = q('SELECT id FROM games WHERE game_name=?', [$name])->fetchColumn();
    q('INSERT IGNORE INTO user_games VALUES (?, ?)', [$uid, $gid]);
    out(['ok' => true]);

  case 'delfav': // (3)b. 移除喜愛遊戲
    q('DELETE FROM user_games WHERE user_id=? AND game_id=?', [$uid, $p['game_id']]);
    out(['ok' => true]);

  case 'post': // 發布公告：隊長自己也算一個名額
    if ($p['min'] < 2 || $p['max'] < $p['min']) out(['msg' => '人數設定錯誤'], 400);
    q('INSERT INTO announcements (host_id, game_id, event_time, min_players, max_players) VALUES (?, ?, ?, ?, ?)',
      [$uid, $p['game_id'], $p['event_time'], $p['min'], $p['max']]);
    $id = $pdo->lastInsertId();
    q('INSERT INTO announcement_participants (announcement_id, user_id) VALUES (?, ?)', [$id, $uid]);
    out(['status' => refreshStatus($id)]);

  case 'join': // (4)a. 加入 → 重算狀態，回傳新狀態給前端決定要不要淡出
    // 交易 + FOR UPDATE 鎖住這筆公告：兩人同時按加入時，第二個人要等第一個人做完，才不會超過上限
    $pdo->beginTransaction();
    $status = q('SELECT status FROM announcements WHERE id=? FOR UPDATE', [$p['id'] ?? 0])->fetchColumn();
    if ($status === false || $status === 'full') {
      $pdo->rollBack();
      out(['msg' => $status ? '已滿員' : '找不到公告'], $status ? 409 : 404);
    }
    q('INSERT IGNORE INTO announcement_participants (announcement_id, user_id) VALUES (?, ?)', [$p['id'], $uid]);
    $status = refreshStatus($p['id']);
    $pdo->commit();
    out(['status' => $status]);
}
out(['msg' => '未知動作'], 400);
