import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ApiResponse,
  LoginCredentials,
  AuthUser,
  Employee,
  Category,
  Device,
} from "./types";

// Configure base URL for different environments
const getBaseUrl = () => {
  // For Android emulator, use 10.0.2.2 to access host machine
  // For iOS simulator and web, use localhost
  if (typeof window !== "undefined") {
    // Web environment
    return "http://172.20.10.2:8000/api";
  }
  // React Native environment - check if we're on Android
  try {
    const { Platform } = require("react-native");
    return Platform.OS === "android"
      ? "http://10.0.2.2:8000/api"
      : "http://172.20.10.2:8000/api";
  } catch {
    // Fallback to localhost
    return "http://172.20.10.2:8000/api";
  }
};

const API_BASE_URL = getBaseUrl();

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem("authToken");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (data.code === 401) {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("username");
        console.warn("[API] 401 Unauthorized — auth data cleared");
      }

      console.log(
        `[API] ${options.method || "GET"} ${endpoint} → ${data.code}`,
        data.message,
      );

      return data;
    } catch (error) {
      return {
        code: 500,
        message: "网络请求失败",
        data: null,
      };
    }
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    return this.request<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // Employee endpoints
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.request<Employee[]>("/employees");
  }

  async createEmployee(
    employee: Omit<Employee, "id">,
  ): Promise<ApiResponse<Employee>> {
    return this.request<Employee>("/employees/", {
      method: "POST",
      body: JSON.stringify(employee),
    });
  }

  async updateEmployee(
    id: string,
    employee: Omit<Employee, "id">,
  ): Promise<ApiResponse<Employee>> {
    return this.request<Employee>(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(employee),
    });
  }

  async deleteEmployee(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/employees/${id}`, {
      method: "DELETE",
    });
  }

  // Category endpoints
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>("/categories");
  }

  async createCategory(
    category: Omit<Category, "id">,
  ): Promise<ApiResponse<Category>> {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async updateCategory(
    id: string,
    category: Omit<Category, "id">,
  ): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Device endpoints
  async getDevices(categoryId?: string): Promise<ApiResponse<Device[]>> {
    const url = categoryId ? `/devices?category_id=${categoryId}` : "/devices";
    return this.request<Device[]>(url);
  }

  async createDevice(device: Omit<Device, "id">): Promise<ApiResponse<Device>> {
    return this.request<Device>("/devices", {
      method: "POST",
      body: JSON.stringify(device),
    });
  }

  async updateDevice(
    id: string,
    device: Omit<Device, "id">,
  ): Promise<ApiResponse<Device>> {
    return this.request<Device>(`/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(device),
    });
  }

  async deleteDevice(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/devices/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();
