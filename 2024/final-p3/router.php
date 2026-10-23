<?php
// PHP 內建伺服器用：php -S 127.0.0.1:8000 router.php（效果等同 .htaccess）
$pages = ['/' => 'team021.html', '/login' => 'login.html', '/admin' => 'admin.html'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (!isset($pages[$path])) return false; // 其他網址（api.php、css、js）照常由伺服器處理
readfile(__DIR__ . '/' . $pages[$path]);
