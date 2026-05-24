-- CRUD 字段对齐迁移脚本
-- 执行前请备份数据库！

-- Employee 表新增字段
ALTER TABLE employees ADD COLUMN phone VARCHAR(20) NULL;
ALTER TABLE employees ADD COLUMN department VARCHAR(50) NULL;
ALTER TABLE employees ADD COLUMN position VARCHAR(50) NULL;
ALTER TABLE employees ADD COLUMN employee_id VARCHAR(50) NULL;

-- Category 表新增字段
ALTER TABLE categories ADD COLUMN description TEXT NULL;

-- Device 表新增字段
ALTER TABLE devices ADD COLUMN serial_number VARCHAR(100) NULL;
ALTER TABLE devices ADD COLUMN assigned_to INTEGER NULL;
ALTER TABLE devices ADD COLUMN status VARCHAR(20) DEFAULT 'available';
ALTER TABLE devices ADD COLUMN purchase_date VARCHAR(20) NULL;
ALTER TABLE devices ADD COLUMN notes TEXT NULL;
ALTER TABLE devices ADD CONSTRAINT fk_device_employee FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL;
