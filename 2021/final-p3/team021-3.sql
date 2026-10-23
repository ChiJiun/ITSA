-- 圖片檔案管理系統：crud 資料庫、uploads 資料表（欄位同圖 3-1）
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS crud DEFAULT CHARSET utf8mb4;
USE crud;
DROP TABLE IF EXISTS uploads;

-- 實際檔案存成 uploads/<id>.<file_type>，檔名由伺服器決定；file_name 只用來顯示原始檔名
CREATE TABLE uploads (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tgl_upload DATE NOT NULL,
  file_name VARCHAR(100) NOT NULL,
  file_size INT(20) NOT NULL,
  file_type VARCHAR(10) NOT NULL
);
