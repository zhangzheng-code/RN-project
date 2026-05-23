-- Create database if not exists
CREATE DATABASE IF NOT EXISTS contest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE contest_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    age INT NOT NULL CHECK (age >= 18 AND age <= 60),
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Insert default admin user (password: admin123, bcrypt hash)
INSERT IGNORE INTO users (username, password, role) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RXwuEw/aO', 'admin');

-- Insert sample data
INSERT IGNORE INTO categories (name) VALUES
('IT设备'),
('办公耗材'),
('办公家具');

INSERT IGNORE INTO employees (name, age, email) VALUES
('张三', 28, 'zhangsan@company.com'),
('李四', 32, 'lisi@company.com'),
('王五', 25, 'wangwu@company.com');

INSERT IGNORE INTO devices (name, model, category_id) VALUES
('笔记本电脑', 'ThinkPad X1', 1),
('打印机', 'HP LaserJet', 1),
('办公椅', 'Ergonomic Pro', 3);