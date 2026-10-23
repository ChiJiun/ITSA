<?php
// 圖片檔案管理 API：api.php?a=動作（list / upload / update / delete）
header('Content-Type: application/json; charset=utf-8');
$pdo = new PDO('mysql:host=127.0.0.1;dbname=crud;charset=utf8mb4', 'root', '', [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

function out($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function q($sql, $args = []) { global $pdo; $s = $pdo->prepare($sql); $s->execute($args); return $s; }

// 磁碟上的檔名只由 id 與白名單副檔名組成，不使用使用者給的檔名 → 不會路徑穿越、也不會互相覆蓋
function path($r) { return __DIR__ . "/uploads/{$r['id']}.{$r['file_type']}"; }

// 檢查 $_FILES['file']：副檔名白名單 + 內容真的是圖片（getimagesize），通過才回傳 [檔案, 副檔名]
function pick() {
  $f = $_FILES['file'] ?? null;
  if (!$f || $f['error'] !== UPLOAD_ERR_OK) out(['msg' => '請選擇有效的檔案'], 400);
  $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
  if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif']) || !@getimagesize($f['tmp_name']))
    out(['msg' => '上傳檔案格式只能是 JPG、JPEG、PNG 或 GIF'], 400);
  return [$f, $ext];
}

$a = $_GET['a'] ?? '';
$id = $_POST['id'] ?? 0;

if ($a === 'list') {
  $rows = q('SELECT * FROM uploads ORDER BY id')->fetchAll();
  // url 加上修改時間，換圖後瀏覽器才不會用到快取的舊圖
  foreach ($rows as &$r) $r['url'] = "uploads/{$r['id']}.{$r['file_type']}?v=" . @filemtime(path($r));
  out($rows);
}

if ($a === 'upload') {
  [$f, $ext] = pick();
  q('INSERT INTO uploads (tgl_upload, file_name, file_size, file_type) VALUES (CURDATE(), ?, ?, ?)',
    [mb_substr(basename($f['name']), 0, 100), $f['size'], $ext]);
  $row = ['id' => $pdo->lastInsertId(), 'file_type' => $ext];
  if (!move_uploaded_file($f['tmp_name'], path($row))) {
    q('DELETE FROM uploads WHERE id=?', [$row['id']]);
    out(['msg' => '儲存檔案失敗'], 500);
  }
  out(['ok' => true]);
}

if ($a === 'update') {
  $old = q('SELECT * FROM uploads WHERE id=?', [$id])->fetch() or out(['msg' => '找不到資料'], 404);
  [$f, $ext] = pick();
  $new = ['id' => $old['id'], 'file_type' => $ext];
  if (!move_uploaded_file($f['tmp_name'], path($new))) out(['msg' => '儲存檔案失敗'], 500);
  q('UPDATE uploads SET tgl_upload=CURDATE(), file_name=?, file_size=?, file_type=? WHERE id=?',
    [mb_substr(basename($f['name']), 0, 100), $f['size'], $ext, $id]);
  if (path($old) !== path($new)) @unlink(path($old)); // 資料庫更新成功才刪；副檔名變了舊檔不會被蓋掉，要手動刪
  out(['ok' => true]);
}

if ($a === 'delete') {
  $r = q('SELECT * FROM uploads WHERE id=?', [$id])->fetch() or out(['msg' => '找不到資料'], 404);
  @unlink(path($r)); // 資料列與伺服器上的實體檔一起刪
  q('DELETE FROM uploads WHERE id=?', [$id]);
  out(['ok' => true]);
}

out(['msg' => '未知動作'], 400);
