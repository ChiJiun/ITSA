-- 聊天對話框：chat 資料庫，admins（管理員）與 faqs（問答集）
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS chat DEFAULT CHARSET utf8mb4;
USE chat;
DROP TABLE IF EXISTS admins, faqs;

-- 密碼存 password_hash() 的雜湊（這串就是 "password"），登入時用 password_verify() 比對
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);
INSERT INTO admins (username, password) VALUES ('admin', '$2y$10$XPZoV2dDgRzsbdDWTZYBF.h4wVYxw/ToB4AkCuHzEDKLaEsXEskjW');

CREATE TABLE faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  answer VARCHAR(500) NOT NULL
);
INSERT INTO faqs (question, answer) VALUES
('請問你們的營業時間？', '我們的營業時間是每天24小時營業。'),
('你們的地址在哪裡？', '我們的地址是台北市中山區南京東路九段9999號。'),
('請問要怎麼付款？', '我們提供宅配服務，您可以在店內或者線上下單。'),
('你們的商品有哪些？', '我們提供多種商品，包括食品、飲料、日用品、以及即時便當。');
