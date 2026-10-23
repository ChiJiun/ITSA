<?php
// 聊天問答 API：api.php?a=動作。ask 公開；login 換 JWT；其餘動作都要帶 Authorization: Bearer <token>
header('Content-Type: application/json; charset=utf-8');
$pdo = new PDO('mysql:host=127.0.0.1;dbname=chat;charset=utf8mb4', 'root', '', [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
// 簽章金鑰：第一次執行時隨機產生並存檔；不能寫死在程式裡，否則看得到原始碼的人都能偽造 token
if (!is_file(__DIR__ . '/secret.txt')) file_put_contents(__DIR__ . '/secret.txt', bin2hex(random_bytes(32)));
define('SECRET', file_get_contents(__DIR__ . '/secret.txt'));

function out($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function q($sql, $args = []) { global $pdo; $s = $pdo->prepare($sql); $s->execute($args); return $s; }

// ---- 手寫 JWT（HS256）：base64url(header).base64url(payload).簽章 ----
function b64($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function sign($data) { return b64(hash_hmac('sha256', $data, SECRET, true)); }
function makeJwt($user, $exp) {
  $body = b64('{"alg":"HS256","typ":"JWT"}') . '.' . b64(json_encode(['sub' => $user, 'exp' => $exp]));
  return $body . '.' . sign($body);
}
// 驗簽章 + 檢查 exp；失敗一律回 401
function requireJwt() {
  $t = explode('.', preg_replace('/^Bearer /', '', $_SERVER['HTTP_AUTHORIZATION'] ?? ''));
  if (count($t) !== 3 || !hash_equals(sign("$t[0].$t[1]"), $t[2])) out(['msg' => '請先登入'], 401);
  $p = json_decode(base64_decode(strtr($t[1], '-_', '+/')), true);
  if (($p['exp'] ?? 0) < time()) out(['msg' => '登入已過期'], 401);
}

$a = $_GET['a'] ?? '';
$p = $_POST;

if ($a === 'login') {
  $u = q('SELECT * FROM admins WHERE username=?', [$p['username'] ?? ''])->fetch();
  if (!$u || !password_verify($p['password'] ?? '', $u['password'])) out(['msg' => '使用者或密碼錯誤！'], 401);
  $exp = time() + 600; // 10 分鐘後過期
  out(['token' => makeJwt($u['username'], $exp), 'exp' => $exp]);
}

if ($a === 'ask') { // 對話頁：不需登入。去掉前後空白與標點後，用 LIKE 找最短的相符問題
  $k = trim(preg_replace('/^[\s?？!！。.,，]+|[\s?？!！。.,，]+$/u', '', $p['q'] ?? ''));
  $r = $k === '' ? false : q("SELECT answer FROM faqs WHERE question LIKE ? ORDER BY CHAR_LENGTH(question) LIMIT 1",
    ['%' . addcslashes($k, '%_\\') . '%'])->fetchColumn();
  out(['answer' => $r ?: '很抱歉，我無法回答這個問題。']);
}

requireJwt(); // 以下是管理 API，沒有有效 token 就到此為止

$q = trim($p['question'] ?? ''); $ans = trim($p['answer'] ?? '');
if (in_array($a, ['add', 'update']) && ($q === '' || $ans === '')) out(['msg' => '問題與答案都要填'], 400);

switch ($a) {
  case 'list':   out(q('SELECT * FROM faqs ORDER BY id')->fetchAll());
  case 'add':    q('INSERT INTO faqs (question, answer) VALUES (?, ?)', [$q, $ans]); out(['ok' => true]);
  case 'update': q('UPDATE faqs SET question=?, answer=? WHERE id=?', [$q, $ans, $p['id'] ?? 0]); out(['ok' => true]);
  case 'delete': q('DELETE FROM faqs WHERE id=?', [$p['id'] ?? 0]); out(['ok' => true]);
}
out(['msg' => '未知動作'], 400);
