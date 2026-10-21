-- ==========================================================
-- GamerHub 玩家組隊社群平台 - 資料庫建置與初始測試資料
-- ==========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0; -- 暫時關閉外鍵檢查，以便順利重建資料表

-- 建立並選擇資料庫
CREATE DATABASE IF NOT EXISTS `gamer_hub` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gamer_hub`;

-- 刪除舊表（反向順序刪除，避免外鍵衝突）
DROP TABLE IF EXISTS `announcement_participants`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `user_games`;
DROP TABLE IF EXISTS `games`;
DROP TABLE IF EXISTS `users`;

-- ==========================================================
-- 1. 建立資料表 (Table Schema)
-- ==========================================================

-- Table 1: 會員資料表
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '登入帳號',
  `nickname` VARCHAR(50) NOT NULL COMMENT '玩家顯示暱稱',
  `password` VARCHAR(255) NOT NULL COMMENT '密碼 (測試用明碼)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: 遊戲主檔
CREATE TABLE `games` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `game_name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: 玩家喜愛遊戲 (多對多關聯)
CREATE TABLE `user_games` (
  `user_id` INT NOT NULL,
  `game_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `game_id`),
  CONSTRAINT `fk_ug_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ug_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: 組隊公告主檔 (招募大廳)
CREATE TABLE `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `host_id` INT NOT NULL COMMENT '發起人',
  `game_id` INT NOT NULL,
  `event_time` DATETIME NOT NULL COMMENT '預計遊玩時段',
  `min_players` INT NOT NULL DEFAULT 2 COMMENT '成局最少門檻',
  `max_players` INT NOT NULL COMMENT '滿員人數限制',
  `status` VARCHAR(20) DEFAULT 'open' COMMENT '狀態: open(招募中), formed(已成局), full(已滿員)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ann_host` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ann_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: 公告參與者明細表 (Time Table 紀錄依據)
CREATE TABLE `announcement_participants` (
  `announcement_id` INT NOT NULL,
  `user_id` INT NOT NULL COMMENT '加入的玩家',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`announcement_id`, `user_id`),
  CONSTRAINT `fk_ap_ann` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ap_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1; -- 重新開啟外鍵檢查

-- ==========================================================
-- 2. 匯入測試資料 (Mock Data)
-- ==========================================================

-- 匯入遊戲主檔
INSERT INTO `games` (`id`, `game_name`) VALUES
(1, '英雄聯盟 (LoL)'),
(2, '特戰英豪 (Valorant)'),
(3, 'Apex 英雄'),
(4, '絕對武力 2 (CS2)');

-- 匯入預設玩家 (密碼皆設為 1234，方便測試)
INSERT INTO `users` (`id`, `username`, `nickname`, `password`) VALUES
(1, 'faker', '大魔王Faker', '1234'),
(2, 'caps', '歐洲法王Caps', '1234'),
(3, 'tenz', '拉頭神童TenZ', '1234'),
(4, 's1mple', '狙神s1mple', '1234');

-- 匯入玩家喜愛遊戲設定
INSERT INTO `user_games` (`user_id`, `game_id`) VALUES
(1, 1), (1, 2), -- Faker 喜歡 LoL 和 Valorant
(2, 1), (2, 4), -- Caps 喜歡 LoL 和 CS2
(3, 2), (3, 3), -- TenZ 喜歡 Valorant 和 Apex
(4, 2), (4, 4); -- s1mple 喜歡 Valorant 和 CS2

-- 匯入預設組隊公告 (涵蓋 3 種不同狀態的測試情境)
INSERT INTO `announcements` (`id`, `host_id`, `game_id`, `event_time`, `min_players`, `max_players`, `status`) VALUES
(1, 1, 1, '2026-08-01 19:00:00', 2, 5, 'open'),   -- 情境 1: 缺咖招募中 (僅 Faker 1 人，門檻 2，未成局)
(2, 3, 2, '2026-08-02 21:30:00', 2, 4, 'formed'), -- 情境 2: 已成局招募中 (TenZ + Faker 2 人，達到門檻 2，但未滿 4 人)
(3, 4, 4, '2026-08-05 14:00:00', 2, 2, 'full');   -- 情境 3: 已滿員隱藏版 (s1mple + Caps 2 人，達到上限 2 人)

-- 匯入各公告的實際參與成員 (發起人自己也必須寫入此表佔用一個名額)
INSERT INTO `announcement_participants` (`announcement_id`, `user_id`) VALUES
-- 公告 1 參與者 (目前僅 1 人)
(1, 1), 

-- 公告 2 參與者 (目前有 2 人)
(2, 3), 
(2, 1), 

-- 公告 3 參與者 (滿員 2 人)
(3, 4), 
(3, 2);