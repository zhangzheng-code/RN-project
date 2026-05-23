import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser, LoginCredentials, ApiResponse } from "./types";
import { login } from "./mockApi";
import { Alert } from "react-native";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginUser: (credentials: LoginCredentials) => Promise<ApiResponse<AuthUser>>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const username = await AsyncStorage.getItem("username");

      if (token && username) {
        setUser({ token, username });
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginUser = async (
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthUser>> => {
    try {
      const response = await login(credentials);

      if (response.code === 200 && response.data) {
        await AsyncStorage.setItem("authToken", response.data.token);
        await AsyncStorage.setItem("username", response.data.username);
        setUser(response.data);
      }

      return response;
    } catch (error) {
      const errorResponse: ApiResponse<AuthUser> = {
        code: 500,
        message: "登录过程中发生错误",
        data: null,
      };
      return errorResponse;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("username");
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    loginUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
