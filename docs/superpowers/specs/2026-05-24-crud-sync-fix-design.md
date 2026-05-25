# CRUD 数据同步修复设计规格

**日期：** 2026-05-24
**状态：** 待实施
**范围：** 全栈字段对齐 + 错误处理修复

## 问题描述

点击"添加员工/分类/设备"后，手机端提示"添加成功"，但列表页面不刷新出新数据。删除和修改功能也存在类似问题。

## 根因分析

### 主因：前后端字段严重不对齐

**Employee 字段对比：**

| 前端 `Employee` 类型 | 后端 `Employee` 模型 | 后端 GET 返回 |
|---|---|---|
| id, name, email | id, name, age, email | id, name, age, email |
| phone, department, position, employee_id | **不存在** | **不返回** |

- 前端 `createEmployee` 发送 `{name, email, phone, department, position, employee_id}`（无 age）
- 后端 `@validate_json('name', 'age', 'email')` 要求必须有 age
- 后端 GET 只返回 4 个字段，前端期望 7 个

**Category 字段对比：**
- 前端发 `{name, description}` → 后端只要 name，description 被丢弃
- 后端返回 `{id, name, device_count}` → 前端期望 `{id, name, description}`

**Device 字段对比：**
- 前端发 8 个字段 → 后端只存 3 个（name, model, category_id）
- 后端返回 4 个字段 → 前端期望 8 个

### 加重因素 1：错误被静默吞掉

`apiClient.ts` 的 `request` 方法有 try/catch，网络错误返回 `{code: 500, message: '网络请求失败', data: null}`。`fetchEmployees` 只在 catch 时打日志，如果后端返回 401 或 400，`response.data` 为 null，`setEmployees(null || [])` 设为空数组，用户看到空列表但无错误提示。

### 加重因素 2：认证断裂

`AuthContext.tsx` 的 `loginUser` 调用 `mockApi.login` 获取假 token（`mock-jwt-token-xxx`），但后端 `@authorized()` 验证真实 JWT。`apiClient.ts` 在 401 时调用 `window.location.reload()`，在 React Native 中无效。

## 修复方案：前后端同时对齐

### 设计约束

1. **不删表不清数据** — 使用 ALTER TABLE 语句平滑迁移，由用户在 Navicat 中手动执行
2. **字段类型严格对齐** — 后端模型的 Column 类型与前端 Payload 的 TypeScript 类型保持一致

## 修改清单

### 1. 后端模型扩展 (`backend/models.py`)

**Employee 新增字段：**
```
phone: String(20), nullable=True
department: String(50), nullable=True
position: String(50), nullable=True
employee_id: String(50), nullable=True
```

**Category 新增字段：**
```
description: Text, nullable=True
```

**Device 新增字段：**
```
serial_number: String(100), nullable=True
assigned_to: Integer, ForeignKey('employees.id', ondelete='SET NULL'), nullable=True
status: String(20), default='available'
purchase_date: String(20), nullable=True
notes: Text, nullable=True
```

### 2. 后端 API 扩展

**`backend/employees.py`：**
- `create_employee` — 接收 name, age, email, phone?, department?, position?, employee_id?
- `update_employee` — 更新全部字段
- `get_employees` — 返回全部字段

**`backend/categories_devices.py`：**
- `create_category` — 接收 name + description?
- `get_categories` — 返回 id, name, description?, device_count
- `create_device` — 接收全部字段
- `get_devices` — 返回全部字段
- 新增 `PUT /categories/<id>` 端点
- 新增 `PUT /devices/<id>` 端点

### 3. 数据库迁移 SQL

用户在 Navicat 中手动执行以下 ALTER TABLE 语句：

```sql
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
```

### 4. 前端修复

**`apiClient.ts`：**
- 移除 `window.location.reload()`
- 统一 endpoint 格式（employees 去掉尾斜杠）
- 添加请求/响应日志

**`AuthContext.tsx`：**
- `loginUser` 改用 `apiClient.login` 替代 `mockApi.login`

**`EmployeeScreen.tsx`：**
- Modal 表单添加 age 输入框
- 修复 fetchEmployees 的错误处理（检查 response.code）

**`CategoryScreen.tsx`：**
- 修复 fetchCategories 的错误处理

**`DeviceScreen.tsx`：**
- 修复 fetchDevices 的错误处理

**`types.ts`：**
- 不修改，已包含正确字段定义

### 5. 字段类型对齐表

| 字段 | 前端 TypeScript 类型 | 后端 SQLAlchemy 类型 | 一致性 |
|---|---|---|---|
| Employee.id | number | Integer | OK |
| Employee.name | string | String(20) | OK |
| Employee.age | number | Integer | OK |
| Employee.email | string | String(100) | OK |
| Employee.phone | string (optional) | String(20) nullable | OK |
| Employee.department | string (optional) | String(50) nullable | OK |
| Employee.position | string (optional) | String(50) nullable | OK |
| Employee.employee_id | string (optional) | String(50) nullable | OK |
| Category.id | number | Integer | OK |
| Category.name | string | String(100) | OK |
| Category.description | string (optional) | Text nullable | OK |
| Device.id | number | Integer | OK |
| Device.name | string | String(100) | OK |
| Device.model | string (optional) | String(100) nullable | OK |
| Device.serial_number | string (optional) | String(100) nullable | OK |
| Device.category_id | number \| null | Integer FK nullable | OK |
| Device.assigned_to | number \| null | Integer FK nullable | OK |
| Device.status | string literal | String(20) default | OK |
| Device.purchase_date | string (optional) | String(20) nullable | OK |
| Device.notes | string (optional) | Text nullable | OK |

## 验收标准

1. 添加员工（含 age 字段）→ 成功提示 → 列表立即显示新员工
2. 编辑员工 → 成功提示 → 列表更新
3. 删除员工 → 确认对话框 → 列表移除
4. 分类的增删改查同样正常工作
5. 设备的增删改查同样正常工作
6. 后端 API 用 Postman/curl 测试，返回完整字段
7. 前端控制台显示 API 请求/响应日志
