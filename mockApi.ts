import { Employee, Category, Device, ApiResponse, LoginCredentials, AuthUser } from './types';

// Mock data storage
let employees: Employee[] = [
  { id: 1, name: '张三', email: 'zhangsan@company.com', phone: '13800138001', department: '技术部', position: '软件工程师', employee_id: 'EMP001' },
  { id: 2, name: '李四', email: 'lisi@company.com', phone: '13800138002', department: '人事部', position: '人事专员', employee_id: 'EMP002' },
  { id: 3, name: '王五', email: 'wangwu@company.com', phone: '13800138003', department: '财务部', position: '会计', employee_id: 'EMP003' },
];

let categories: Category[] = [
  { id: 1, name: 'IT设备', description: '计算机及相关设备' },
  { id: 2, name: '办公耗材', description: '办公用纸、文具等' },
  { id: 3, name: '办公家具', description: '桌椅、柜子等家具' },
];

let devices: Device[] = [
  { id: 1, name: '笔记本电脑', model: 'ThinkPad X1', serial_number: 'SN001', category_id: 1, assigned_to: 1, status: 'assigned', purchase_date: '2023-01-15', notes: '高性能开发用机' },
  { id: 2, name: '打印机', model: 'HP LaserJet', serial_number: 'SN002', category_id: 1, assigned_to: null, status: 'available', purchase_date: '2023-02-20', notes: '共享打印设备' },
  { id: 3, name: '办公椅', model: '人体工学椅', serial_number: 'SN003', category_id: 3, assigned_to: 2, status: 'assigned', purchase_date: '2023-03-10', notes: '可调节高度' },
];

// API logging function
const logApiCall = (method: string, path: string, status: number, duration: number) => {
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  console.log(`[${timestamp}] ${method} ${path} - STATUS ${status} - ${duration}ms`);
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const login = async (credentials: LoginCredentials): Promise<ApiResponse<any>> => {
  await delay(300);
  const startTime = Date.now();

  if (credentials.username === 'admin') {
    const response: ApiResponse<AuthUser> = {
      code: 200,
      message: '登录成功',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        username: credentials.username,
      }
    };
    logApiCall('POST', '/api/login', 200, Date.now() - startTime);
    return response;
  } else {
    const response: ApiResponse<AuthUser> = {
      code: 401,
      message: '用户名或密码错误',
      data: null
    };
    logApiCall('POST', '/api/login', 401, Date.now() - startTime);
    return response;
  }
};

// Employee API
export const getEmployees = async (): Promise<ApiResponse<Employee[]>> => {
  await delay(200);
  const startTime = Date.now();

  const response: ApiResponse<Employee[]> = {
    code: 200,
    message: '获取员工列表成功',
    data: employees
  };
  logApiCall('GET', '/api/employees', 200, Date.now() - startTime);
  return response;
};

export const createEmployee = async (employee: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> => {
  await delay(300);
  const startTime = Date.now();

  // Validation
  if (employee.name.length < 1 || employee.name.length > 50) {
    const response: ApiResponse<Employee> = {
      code: 400,
      message: '参数校验失败: 姓名长度必须在1-50个字符之间',
      data: null
    };
    logApiCall('POST', '/api/employees', 400, Date.now() - startTime);
    return response;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    const response: ApiResponse<Employee> = {
      code: 400,
      message: '参数校验失败: 邮箱格式不正确',
      data: null
    };
    logApiCall('POST', '/api/employees', 400, Date.now() - startTime);
    return response;
  }

  const newEmployee: Employee = {
    ...employee,
    id: Date.now()
  };

  employees.push(newEmployee);

  const response: ApiResponse<Employee> = {
    code: 200,
    message: '创建员工成功',
    data: newEmployee
  };
  logApiCall('POST', '/api/employees', 200, Date.now() - startTime);
  return response;
};

export const updateEmployee = async (id: string, employee: Omit<Employee, 'id'>): Promise<ApiResponse<any>> => {
  await delay(300);
  const startTime = Date.now();

  const index = employees.findIndex(emp => emp.id === parseInt(id));
  if (index === -1) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '员工不存在',
      data: null
    };
    logApiCall('PUT', `/api/employees/${id}`, 404, Date.now() - startTime);
    return response;
  }

  // Validation
  if (employee.name.length < 1 || employee.name.length > 50) {
    const response: ApiResponse<Employee> = {
      code: 400,
      message: '参数校验失败: 姓名长度必须在1-50个字符之间',
      data: null
    };
    logApiCall('PUT', `/api/employees/${id}`, 400, Date.now() - startTime);
    return response;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    const response: ApiResponse<Employee> = {
      code: 400,
      message: '参数校验失败: 邮箱格式不正确',
      data: null
    };
    logApiCall('PUT', `/api/employees/${id}`, 400, Date.now() - startTime);
    return response;
  }

  const updatedEmployee = { ...employee, id: parseInt(id) };
  employees[index] = updatedEmployee;

  const response: ApiResponse<Employee> = {
    code: 200,
    message: '更新员工成功',
    data: updatedEmployee
  };
  logApiCall('PUT', `/api/employees/${id}`, 200, Date.now() - startTime);
  return response;
};

export const deleteEmployee = async (id: string): Promise<ApiResponse<any>> => {
  await delay(200);
  const startTime = Date.now();

  const index = employees.findIndex(emp => emp.id === parseInt(id));
  if (index === -1) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '员工不存在',
      data: null
    };
    logApiCall('DELETE', `/api/employees/${id}`, 404, Date.now() - startTime);
    return response;
  }

  employees.splice(index, 1);

  const response: ApiResponse<null> = {
    code: 200,
    message: '删除员工成功',
    data: null
  };
  logApiCall('DELETE', `/api/employees/${id}`, 200, Date.now() - startTime);
  return response;
};

// Category API
export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  await delay(200);
  const startTime = Date.now();

  const response: ApiResponse<Category[]> = {
    code: 200,
    message: '获取分类列表成功',
    data: categories
  };
  logApiCall('GET', '/api/categories', 200, Date.now() - startTime);
  return response;
};

export const createCategory = async (category: Omit<Category, 'id'>): Promise<ApiResponse<Category>> => {
  await delay(300);
  const startTime = Date.now();

  const newCategory: Category = {
    ...category,
    id: Date.now()
  };

  categories.push(newCategory);

  const response: ApiResponse<Category> = {
    code: 200,
    message: '创建分类成功',
    data: newCategory
  };
  logApiCall('POST', '/api/categories', 200, Date.now() - startTime);
  return response;
};

export const deleteCategory = async (id: string): Promise<ApiResponse<any>> => {
  await delay(200);
  const startTime = Date.now();

  const deviceCount = devices.filter(device => device.category_id === parseInt(id)).length;
  if (deviceCount > 0) {
    const response: ApiResponse<Category> = {
      code: 409,
      message: '业务冲突：分类下存在设备，无法删除',
      data: null
    };
    logApiCall('DELETE', `/api/categories/${id}`, 409, Date.now() - startTime);
    return response;
  }

  const index = categories.findIndex(cat => cat.id === parseInt(id));
  if (index === -1) {
    const response: ApiResponse<Category> = {
      code: 404,
      message: '分类不存在',
      data: null
    };
    logApiCall('DELETE', `/api/categories/${id}`, 404, Date.now() - startTime);
    return response;
  }

  categories.splice(index, 1);

  const response: ApiResponse<null> = {
    code: 200,
    message: '删除分类成功',
    data: null
  };
  logApiCall('DELETE', `/api/categories/${id}`, 200, Date.now() - startTime);
  return response;
};

// Device API
export const getDevices = async (categoryId?: string): Promise<ApiResponse<Device[]>> => {
  await delay(200);
  const startTime = Date.now();

  const filteredDevices = categoryId
    ? devices.filter(device => device.category_id === parseInt(categoryId))
    : devices;

  const response: ApiResponse<Device[]> = {
    code: 200,
    message: '获取设备列表成功',
    data: filteredDevices
  };
  logApiCall('GET', '/api/devices', 200, Date.now() - startTime);
  return response;
};

export const createDevice = async (device: Omit<Device, 'id'>): Promise<ApiResponse<Device>> => {
  await delay(300);
  const startTime = Date.now();

  const newDevice: Device = {
    ...device,
    id: Date.now()
  };

  devices.push(newDevice);

  const response: ApiResponse<Device> = {
    code: 200,
    message: '创建设备成功',
    data: newDevice
  };
  logApiCall('POST', '/api/devices', 200, Date.now() - startTime);
  return response;
};

// Helper function to get device count for a category
export const getDeviceCountForCategory = (categoryId: string): number => {
  return devices.filter(device => device.category_id === parseInt(categoryId)).length;
};