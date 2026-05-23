import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from './types';

// Global API interceptor for handling 401 errors
export const handleApiResponse = async <T>(response: ApiResponse<T>): Promise<ApiResponse<T>> => {
  if (response.code === 401) {
    // Clear stored auth data
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('username');

    // Force reload the app to show login screen
    // In a real app, you would navigate to login screen
    console.log('Unauthorized access detected, clearing auth data');
  }

  return response;
};

// Wrap all API calls with this interceptor
export const withAuthInterceptor = async <T>(
  apiCall: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiCall();
    return await handleApiResponse(response);
  } catch (error) {
    // Handle network errors
    const errorResponse: ApiResponse<any> = {
      code: 500,
      message: '网络请求失败',
      data: null
    };
    return errorResponse;
  }
};