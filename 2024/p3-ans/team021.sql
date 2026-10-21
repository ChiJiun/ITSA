-- 健康度量管理系統：人員 / 醫檢項目 / 檢查結果 三張表（第三正規化）
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS health DEFAULT CHARSET utf8mb4;
USE health;
DROP TABLE IF EXISTS results, items, users;

-- a. 人員：role 區分醫檢員(tech)/受檢者(patient)；must_change=1 代表第一次登入要強制改密碼
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  account VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('tech','patient') NOT NULL,
  must_change TINYINT NOT NULL DEFAULT 1
);

-- b. 醫檢項目：度量分數尺規 1~10
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  min_score TINYINT NOT NULL DEFAULT 1,
  max_score TINYINT NOT NULL DEFAULT 10
);

-- c. 檢查結果：誰(user_id) 的 哪一項(item_id) 幾分
--    UNIQUE(user_id,item_id) => 同一項目同一個人只會有一筆（人員編號不重複）
CREATE TABLE results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 10),
  UNIQUE (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- 模擬資料：3 位醫檢員、5 位受檢者（密碼為測試用明碼）
INSERT INTO users (name, account, password, role, must_change) VALUES
('王醫檢', 'tech1', '1234', 'tech', 0),
('李醫檢', 'tech2', '1234', 'tech', 0),
('陳醫檢', 'tech3', '1234', 'tech', 0),
('張小明', 'p1', '1234', 'patient', 1),
('林小華', 'p2', '1234', 'patient', 1),
('黃小美', 'p3', '1234', 'patient', 1),
('吳大同', 'p4', '1234', 'patient', 1),
('周小玉', 'p5', '1234', 'patient', 1);

INSERT INTO items (name) VALUES ('血壓'), ('血糖'), ('膽固醇'), ('視力'), ('體脂肪');

-- 5 位受檢者(id 4~8) × 5 項目，分數 1~10
INSERT INTO results (user_id, item_id, score)
SELECT u.id, i.id, 1 + (u.id * 3 + i.id * 7) % 10 FROM users u, items i WHERE u.role = 'patient';
