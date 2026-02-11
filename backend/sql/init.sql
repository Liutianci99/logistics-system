-- 创建数据库
CREATE DATABASE IF NOT EXISTS logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用用户
CREATE USER IF NOT EXISTS 'logistics_user'@'%' IDENTIFIED BY 'logistics_pass';
GRANT ALL PRIVILEGES ON logistics_db.* TO 'logistics_user'@'%';
FLUSH PRIVILEGES;

USE logistics_db;

-- 用户表会由 TypeORM synchronize 自动创建
-- 以下为默认管理员账户（密码: admin123, bcrypt hash）
-- 仅在表存在且无管理员时插入
