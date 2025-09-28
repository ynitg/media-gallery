-- 创建数据库
CREATE DATABASE IF NOT EXISTS media_display;
USE media_display;

-- 用户表（管理员）
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 媒体内容表
CREATE TABLE media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('image', 'video') NOT NULL,
  url VARCHAR(255) NOT NULL,
  upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 媒体与标签的多对多关系表
CREATE TABLE media_tags (
  media_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (media_id, tag_id),
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 插入初始管理员账户
INSERT INTO users (username, password) VALUES ('admin', 'admin123');