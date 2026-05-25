# CRUD 数据同步修复 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 修复前后端字段不对齐导致的 CRUD 操作"假成功"——添加/编辑/删除后列表不刷新

**架构：** 后端 Sanic + SQLAlchemy 模型扩展新字段，前端 Screen 组件适配后端实际数据结构，apiClient 修复错误处理和认证流程

**技术栈：** Python Sanic, SQLAlchemy (async), MySQL, React Native (Expo), TypeScript

**分批策略：** 共 3 批，每批独立可验证。先改后端（Batch 1），再改前端（Batch 2），最后联调验证（Batch 3）。

---

## Batch 1：后端模型与 API 扩展

### 任务 1：扩展 SQLAlchemy 模型

**文件：**
- 修改：`backend/models.py`

- [ ] **步骤 1：Employee 模型新增 4 个字段**

在 `backend/models.py` 的 `Employee` 类中，`email` 行之后、`created_at` 行之前添加：

```python
phone = Column(String(20), nullable=True)
department = Column(String(50), nullable=True)
position = Column(String(50), nullable=True)
employee_id = Column(String(50), nullable=True)
```

- [ ] **步骤 2：Category 模型新增 description 字段**

在 `backend/models.py` 的 `Category` 类中，`name` 行之后添加：

```python
description = Column(Text, nullable=True)
```

需确认 `models.py` 顶部已导入 `Text`：
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, CheckConstraint
```

- [ ] **步骤 3：Device 模型新增 5 个字段**

在 `backend/models.py` 的 `Device` 类中，`model` 行之后、`created_at` 行之前添加：

```python
serial_number = Column(String(100), nullable=True)
assigned_to = Column(Integer, ForeignKey('employees.id', ondelete='SET NULL'), nullable=True)
status = Column(String(20), default='available')
purchase_date = Column(String(20), nullable=True)
notes = Column(Text, nullable=True)
```

- [ ] **步骤 4：输出 ALTER TABLE SQL**

将以下 SQL 保存到 `backend/migrate_2026_05_24.sql` 文件中，供用户在 Navicat 手动执行：

```sql
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
```

- [ ] **步骤 5：Commit**

```bash
git add backend/models.py backend/migrate_2026_05_24.sql
git commit -m "feat(backend): extend Employee/Category/Device models with new fields"
```

---

### 任务 2：扩展 employees.py CRUD 接口

**文件：**
- 修改：`backend/employees.py`

- [ ] **步骤 1：修改 get_employees 返回全部字段**

将 `backend/models.py:18-26` 的 `employees_data` 列表推导替换为：

```python
employees_data = [
    {
        "id": emp.id,
        "name": emp.name,
        "age": emp.age,
        "email": emp.email,
        "phone": emp.phone,
        "department": emp.department,
        "position": emp.position,
        "employee_id": emp.employee_id,
    }
    for emp in employees
]
```

- [ ] **步骤 2：修改 create_employee 接收全部字段**

在 `backend/employees.py` 的 `create_employee` 函数中，将 `@validate_json('name', 'age', 'email')` 保持不变（这三个仍是必填）。

在函数体内，`email = request.json['email']` 之后添加：

```python
phone = request.json.get('phone', '')
department = request.json.get('department', '')
position = request.json.get('position', '')
employee_id_str = request.json.get('employee_id', '')
```

将 `new_employee = Employee(name=name, age=age, email=email)` 替换为：

```python
new_employee = Employee(
    name=name,
    age=age,
    email=email,
    phone=phone or None,
    department=department or None,
    position=position or None,
    employee_id=employee_id_str or None,
)
```

将 return 中的 dict 替换为：

```python
return api_response(200, "创建员工成功", {
    "id": new_employee.id,
    "name": new_employee.name,
    "age": new_employee.age,
    "email": new_employee.email,
    "phone": new_employee.phone,
    "department": new_employee.department,
    "position": new_employee.position,
    "employee_id": new_employee.employee_id,
})
```

- [ ] **步骤 3：修改 update_employee 支持全部字段**

在 `backend/employees.py` 的 `update_employee` 函数中，`email = request.json['email']` 之后添加：

```python
phone = request.json.get('phone', '')
department = request.json.get('department', '')
position = request.json.get('position', '')
employee_id_str = request.json.get('employee_id', '')
```

将 `employee.name = name` 那几行替换为：

```python
employee.name = name
employee.age = age
employee.email = email
employee.phone = phone or None
employee.department = department or None
employee.position = position or None
employee.employee_id = employee_id_str or None
```

将 return 中的 dict 替换为：

```python
return api_response(200, "更新员工成功", {
    "id": employee.id,
    "name": employee.name,
    "age": employee.age,
    "email": employee.email,
    "phone": employee.phone,
    "department": employee.department,
    "position": employee.position,
    "employee_id": employee.employee_id,
})
```

- [ ] **步骤 4：Commit**

```bash
git add backend/employees.py
git commit -m "feat(backend): employee CRUD returns all fields"
```

---

### 任务 3：扩展 categories_devices.py CRUD 接口

**文件：**
- 修改：`backend/categories_devices.py`

- [ ] **步骤 1：修改 get_categories 返回 description**

将 `categories_devices.py:25-30` 的 `categories_data` 替换为：

```python
categories_data = [
    {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description if hasattr(cat, 'description') else None,
        "device_count": cat.device_count
    }
    for cat in result.all()
]
```

注意：因为当前用的是 `select(Category.id, Category.name, func.count(...))` 而不是 `select(Category)`，需要改查询方式。将 `get_categories` 中的查询替换为：

```python
result = await session.execute(
    select(Category).outerjoin(Device, Category.id == Device.category_id).group_by(Category.id)
)
rows = result.scalars().all()

# 单独查 device_count
count_result = await session.execute(
    select(Category.id, func.count(Device.id).label('device_count'))
    .outerjoin(Device, Category.id == Device.category_id)
    .group_by(Category.id)
)
count_map = {row.id: row.device_count for row in count_result.all()}

categories_data = [
    {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "device_count": count_map.get(cat.id, 0)
    }
    for cat in rows
]
```

- [ ] **步骤 2：修改 create_category 接收 description**

在 `create_category` 中，`name = request.json['name']` 之后添加：

```python
description = request.json.get('description', '')
```

将 `new_category = Category(name=name)` 替换为：

```python
new_category = Category(name=name, description=description or None)
```

将 return 替换为：

```python
return api_response(200, "创建分类成功", {
    "id": new_category.id,
    "name": new_category.name,
    "description": new_category.description,
})
```

- [ ] **步骤 3：新增 update_category 端点**

在 `delete_category` 函数之后、`# Devices endpoints` 注释之前添加：

```python
@categories_devices_bp.put('/categories/<category_id:int>')
@authorized()
@validate_json('name')
async def update_category(request: Request, category_id: int):
    """Update category"""
    name = request.json['name']
    description = request.json.get('description', '')

    async for session in get_db():
        result = await session.execute(
            select(Category).where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()

        if not category:
            raise APIException(404, "分类不存在")

        # Check duplicate name
        result = await session.execute(
            select(Category).where(Category.name == name, Category.id != category_id)
        )
        if result.scalar_one_or_none():
            raise APIException(400, "分类名称已存在")

        category.name = name
        category.description = description or None
        await session.commit()

        return api_response(200, "更新分类成功", {
            "id": category.id,
            "name": category.name,
            "description": category.description,
        })
```

- [ ] **步骤 4：修改 get_devices 返回全部字段**

将 `get_devices` 中的 `devices_data` 替换为：

```python
devices_data = [
    {
        "id": dev.id,
        "name": dev.name,
        "model": dev.model,
        "serial_number": dev.serial_number,
        "category_id": dev.category_id,
        "assigned_to": dev.assigned_to,
        "status": dev.status,
        "purchase_date": dev.purchase_date,
        "notes": dev.notes,
    }
    for dev in devices
]
```

- [ ] **步骤 5：修改 create_device 接收全部字段**

将 `create_device` 中的字段提取替换为：

```python
name = request.json['name']
category_id = request.json['category_id']
model = request.json.get('model', '')
serial_number = request.json.get('serial_number', '')
assigned_to = request.json.get('assigned_to')
status = request.json.get('status', 'available')
purchase_date = request.json.get('purchase_date', '')
notes = request.json.get('notes', '')
```

将 `new_device = Device(...)` 替换为：

```python
new_device = Device(
    name=name,
    model=model or None,
    category_id=category_id,
    serial_number=serial_number or None,
    assigned_to=assigned_to,
    status=status,
    purchase_date=purchase_date or None,
    notes=notes or None,
)
```

将 return 替换为完整字段 dict。

- [ ] **步骤 6：新增 update_device 端点**

在 `create_device` 之后添加：

```python
@categories_devices_bp.put('/devices/<device_id:int>')
@authorized()
@validate_json('name', 'category_id')
async def update_device(request: Request, device_id: int):
    """Update device"""
    name = request.json['name']
    category_id = request.json['category_id']
    model = request.json.get('model', '')
    serial_number = request.json.get('serial_number', '')
    assigned_to = request.json.get('assigned_to')
    status = request.json.get('status', 'available')
    purchase_date = request.json.get('purchase_date', '')
    notes = request.json.get('notes', '')

    async for session in get_db():
        result = await session.execute(
            select(Device).where(Device.id == device_id)
        )
        device = result.scalar_one_or_none()

        if not device:
            raise APIException(404, "设备不存在")

        # Check category exists
        result = await session.execute(
            select(Category).where(Category.id == category_id)
        )
        if not result.scalar_one_or_none():
            raise APIException(400, "指定的分类不存在")

        device.name = name
        device.model = model or None
        device.category_id = category_id
        device.serial_number = serial_number or None
        device.assigned_to = assigned_to
        device.status = status
        device.purchase_date = purchase_date or None
        device.notes = notes or None

        await session.commit()

        return api_response(200, "更新设备成功", {
            "id": device.id,
            "name": device.name,
            "model": device.model,
            "serial_number": device.serial_number,
            "category_id": device.category_id,
            "assigned_to": device.assigned_to,
            "status": device.status,
            "purchase_date": device.purchase_date,
            "notes": device.notes,
        })
```

- [ ] **步骤 7：Commit**

```bash
git add backend/categories_devices.py
git commit -m "feat(backend): category/device CRUD with full fields and update endpoints"
```

---

## Batch 2：前端修复

### 任务 4：修复 apiClient.ts

**文件：**
- 修改：`apiClient.ts`

- [ ] **步骤 1：移除 window.location.reload，添加日志**

将 `apiClient.ts:46-56` 的 catch 前的 401 处理替换为：

```typescript
if (data.code === 401) {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('username');
  console.warn('[API] 401 Unauthorized — auth data cleared');
}

console.log(`[API] ${options.method || 'GET'} ${endpoint} → ${data.code}`, data.message);
```

- [ ] **步骤 2：统一 endpoint 格式**

将 `apiClient.ts:78` 的 `/employees/` 改为 `/employees`（去掉尾斜杠），与 categories/devices 保持一致。

- [ ] **步骤 3：Commit**

```bash
git add apiClient.ts
git commit -m "fix(frontend): remove window.location.reload, add API logging"
```

---

### 任务 5：修复 AuthContext.tsx 认证断裂

**文件：**
- 修改：`AuthContext.tsx`

- [ ] **步骤 1：改用 apiClient.login**

将 `AuthContext.tsx:10` 的 import 替换为：

```typescript
import { apiClient } from './apiClient';
```

删除 `import { login } from "./mockApi";`

将 `loginUser` 函数中的 `const response = await login(credentials);` 替换为：

```typescript
const response = await apiClient.login(credentials);
```

同时将返回类型中的 `ApiResponse<AuthUser>` 的 data 映射调整为：

```typescript
if (response.code === 200 && response.data) {
  const authData: AuthUser = {
    token: (response.data as any).token,
    username: (response.data as any).username,
  };
  await AsyncStorage.setItem("authToken", authData.token);
  await AsyncStorage.setItem("username", authData.username);
  setUser(authData);
}
```

- [ ] **步骤 2：Commit**

```bash
git add AuthContext.tsx
git commit -m "fix(frontend): use real apiClient.login instead of mockApi"
```

---

### 任务 6：修复 EmployeeScreen.tsx

**文件：**
- 修改：`screens/EmployeeScreen.tsx`

- [ ] **步骤 1：修复 fetchEmployees 错误处理**

将 `fetchEmployees` 函数替换为：

```typescript
const fetchEmployees = async () => {
  try {
    setLoading(true);
    const response = await apiClient.getEmployees();
    if (response.code === 200) {
      setEmployees(response.data || []);
    } else {
      Alert.alert('Error', response.message || 'Failed to load employees');
    }
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    Alert.alert('Error', 'Failed to load employees');
  } finally {
    setLoading(false);
  }
};
```

- [ ] **步骤 2：Modal 表单添加 age 输入框**

在 `EmployeeScreen.tsx` 的 `<TextInput placeholder="Email *" ... />` 之后，添加：

```tsx
<TextInput
  style={styles.input}
  placeholder="Age *"
  value={formData.age}
  onChangeText={(text) => setFormData({ ...formData, age: text })}
  keyboardType="numeric"
/>
```

- [ ] **步骤 3：更新 formData state 和 resetForm**

将 `formData` 的 useState 替换为：

```typescript
const [formData, setFormData] = useState({
  name: '',
  age: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  employee_id: '',
});
```

将 `resetForm` 替换为：

```typescript
const resetForm = () => {
  setFormData({
    name: '',
    age: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employee_id: '',
  });
  setEditingEmployee(null);
};
```

- [ ] **步骤 4：更新 handleEdit 映射 age**

将 `handleEdit` 中的 `setFormData` 替换为：

```typescript
setFormData({
  name: employee.name,
  age: employee.age?.toString() || '',
  email: employee.email,
  phone: employee.phone || '',
  department: employee.department || '',
  position: employee.position || '',
  employee_id: employee.employee_id || '',
});
```

- [ ] **步骤 5：更新 handleSave 发送 age**

将 `handleSave` 中的验证替换为：

```typescript
if (!formData.name || !formData.email || !formData.age) {
  Alert.alert('Error', 'Name, age and email are required');
  return;
}

const ageNumber = parseInt(formData.age);
if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 60) {
  Alert.alert('Error', 'Age must be between 18 and 60');
  return;
}
```

将 `apiClient.createEmployee(formData)` 和 `apiClient.updateEmployee(...)` 调用中的 formData 替换为：

```typescript
const payload = {
  ...formData,
  age: ageNumber,
};

if (editingEmployee) {
  await apiClient.updateEmployee(editingEmployee.id.toString(), payload);
} else {
  await apiClient.createEmployee(payload);
}
```

- [ ] **步骤 6：修复 handleSave 错误处理**

将 `handleSave` 中的 catch 块替换为：

```typescript
} catch (error: any) {
  console.error('Failed to save employee:', error);
  Alert.alert('Error', error?.message || 'Failed to save employee');
}
```

- [ ] **步骤 7：Commit**

```bash
git add screens/EmployeeScreen.tsx
git commit -m "fix(frontend): EmployeeScreen age field and error handling"
```

---

### 任务 7：修复 CategoryScreen.tsx 和 DeviceScreen.tsx

**文件：**
- 修改：`screens/CategoryScreen.tsx`
- 修改：`screens/DeviceScreen.tsx`

- [ ] **步骤 1：修复 CategoryScreen fetchCategories 错误处理**

将 `fetchCategories` 替换为：

```typescript
const fetchCategories = async () => {
  try {
    setLoading(true);
    const response = await apiClient.getCategories();
    if (response.code === 200) {
      setCategories(response.data || []);
    } else {
      Alert.alert('Error', response.message || 'Failed to load categories');
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    Alert.alert('Error', 'Failed to load categories');
  } finally {
    setLoading(false);
  }
};
```

- [ ] **步骤 2：修复 DeviceScreen fetchDevices 错误处理**

将 `fetchDevices` 替换为：

```typescript
const fetchDevices = async () => {
  try {
    setLoading(true);
    const response = await apiClient.getDevices();
    if (response.code === 200) {
      setDevices(response.data || []);
    } else {
      Alert.alert('Error', response.message || 'Failed to load devices');
    }
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    Alert.alert('Error', 'Failed to load devices');
  } finally {
    setLoading(false);
  }
};
```

- [ ] **步骤 3：修复 CategoryScreen handleSave 错误处理**

在 `handleSave` 的 catch 块中改为：

```typescript
} catch (error: any) {
  console.error('Failed to save category:', error);
  Alert.alert('Error', error?.message || 'Failed to save category');
}
```

- [ ] **步骤 4：修复 DeviceScreen handleSave 错误处理**

在 `handleSave` 的 catch 块中改为：

```typescript
} catch (error: any) {
  console.error('Failed to save device:', error);
  Alert.alert('Error', error?.message || 'Failed to save device');
}
```

- [ ] **步骤 5：Commit**

```bash
git add screens/CategoryScreen.tsx screens/DeviceScreen.tsx
git commit -m "fix(frontend): Category/Device screen error handling"
```

---

## Batch 3：联调验证

### 任务 8：端到端验证

- [ ] **步骤 1：用户在 Navicat 中执行 ALTER TABLE SQL**

提示用户打开 `backend/migrate_2026_05_24.sql`，在 Navicat 中逐条执行。

- [ ] **步骤 2：重启 Sanic 后端**

```bash
cd backend && python app.py
```

确认控制台无报错，显示 "Database initialized successfully!"

- [ ] **步骤 3：用 curl 验证后端 API**

```bash
# 登录获取 token
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"your_password"}'

# 用返回的 token 测试 GET
curl http://localhost:8000/api/employees -H "Authorization: Bearer <token>"
```

确认返回包含 phone/department/position/employee_id 字段。

- [ ] **步骤 4：前端完整 CRUD 测试**

1. 启动 Expo：`npx expo start`
2. 登录 → 员工管理 → 添加员工（含 age）→ 确认列表刷新
3. 编辑员工 → 确认列表更新
4. 删除员工 → 确认列表移除
5. 分类管理 → 同样测试增删改
6. 设备管理 → 同样测试增删改

- [ ] **步骤 5：最终 Commit**

```bash
git add -A
git commit -m "fix: complete CRUD data synchronization across all entities"
```
