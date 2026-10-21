<?php
// 所有請求都走這支：api.php?a=動作，回傳 JSON
session_start();
header('Content-Type: application/json; charset=utf-8');
$db = new PDO('mysql:host=127.0.0.1;dbname=health;charset=utf8mb4', 'root', '', [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

// 白名單：可以被增刪改的表與欄位（避免 SQL injection 亂指定欄位）
$TABLES = [
  'users'   => ['name', 'account', 'password', 'role', 'must_change'],
  'items'   => ['name', 'min_score', 'max_score'],
  'results' => ['user_id', 'item_id', 'score'],
];

function out($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function need($role) { if (($_SESSION['role'] ?? '') !== $role) out(['msg' => '沒有權限'], 403); }
function q($sql, $args = []) { global $db; $s = $db->prepare($sql); $s->execute($args); return $s; }

$a = $_GET['a'] ?? '';
$p = $_POST;
$t = $p['t'] ?? $_GET['t'] ?? '';

try {
  switch ($a) {
    case 'login':
      $u = q('SELECT * FROM users WHERE account=? AND password=?', [$p['account'], $p['password']])->fetch();
      if (!$u) out(['msg' => '帳號或密碼錯誤'], 401);
      $_SESSION = ['id' => $u['id'], 'role' => $u['role']];
      out(['role' => $u['role'], 'must_change' => $u['must_change'], 'name' => $u['name']]);

    case 'register': // 醫檢員自行註冊
      q("INSERT INTO users (name, account, password, role, must_change) VALUES (?, ?, ?, 'tech', 0)",
        [$p['name'], $p['account'], $p['password']]);
      out(['msg' => '註冊成功，請登入']);

    case 'logout':
      session_destroy();
      out(['msg' => '已登出']);

    case 'chpwd': // c. 受檢者第一次登入改密碼：大小寫英文 + 數字混合，共 12 碼
      if (!isset($_SESSION['id'])) out(['msg' => '請先登入'], 401);
      if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{12}$/', $p['password']))
        out(['msg' => '密碼需為 12 碼，且包含大寫、小寫英文與數字'], 400);
      q('UPDATE users SET password=?, must_change=0 WHERE id=?', [$p['password'], $_SESSION['id']]);
      out(['msg' => '密碼已更新']);

    case 'mine': // d. 受檢者看自己的所有項目分數
      need('patient');
      if (q('SELECT must_change FROM users WHERE id=?', [$_SESSION['id']])->fetchColumn()) out(['msg' => '請先更新密碼'], 403);
      out(q('SELECT i.name, r.score FROM results r JOIN items i ON i.id=r.item_id WHERE r.user_id=?', [$_SESSION['id']])->fetchAll());

    case 'list': // b. 醫檢員查詢任一張表
      need('tech');
      if (!isset($TABLES[$t])) out(['msg' => '表名錯誤'], 400);
      out(q("SELECT * FROM $t ORDER BY id")->fetchAll());

    case 'save': // a. 新增（沒有 id）或更新（有 id）
      need('tech');
      if (!isset($TABLES[$t])) out(['msg' => '表名錯誤'], 400);
      $cols = $TABLES[$t];
      $vals = array_map(fn($c) => $p[$c] ?? null, $cols);
      if (empty($p['id'])) {
        q("INSERT INTO $t (" . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')', $vals);
      } else {
        q("UPDATE $t SET " . implode('=?,', $cols) . '=? WHERE id=?', [...$vals, $p['id']]);
      }
      out(['msg' => '已儲存']);

    case 'del': // a. 刪除
      need('tech');
      if (!isset($TABLES[$t])) out(['msg' => '表名錯誤'], 400);
      q("DELETE FROM $t WHERE id=?", [$p['id']]);
      out(['msg' => '已刪除']);
  }
  out(['msg' => '未知動作'], 400);
} catch (PDOException $e) {
  out(['msg' => '資料錯誤：' . $e->getMessage()], 400); // 例如帳號重複、分數超出 1~10
}
