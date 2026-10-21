<?php
// 讀 CSV → 轉成 JSON 陣列給前端：[[week, keyword, count, avg_risk, trend], ...]
header('Content-Type: application/json; charset=utf-8');
$lines = file('weekly_kw.csv', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
array_shift($lines); // 去掉標題列
echo json_encode(array_map('str_getcsv', $lines), JSON_UNESCAPED_UNICODE);
