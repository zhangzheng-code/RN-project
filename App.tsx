import React from "react";
import {
  StatusBar,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Platform,
} from "react-native";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginScreen from "./screens/LoginScreen";
// 严格检查：确保没有带花括号 {}，且路径大小写完全一致！
import EmployeeScreen from "./screens/EmployeeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import DeviceScreen from "./screens/DeviceScreen";

function MainApp() {
  const { user, isLoading, logout } = useAuth();
  const [currentTab, setCurrentTab] = React.useState<
    "employees" | "categories" | "devices"
  >("employees");

  if (isLoading) {
    return <View style={styles.container} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tabBar}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                currentTab === "employees" && styles.activeTab,
              ]}
              onPress={() => setCurrentTab("employees")}
            >
              <Text
                style={[
                  styles.tabText,
                  currentTab === "employees" && styles.activeTabText,
                ]}
              >
                员工管理
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                currentTab === "categories" && styles.activeTab,
              ]}
              onPress={() => setCurrentTab("categories")}
            >
              <Text
                style={[
                  styles.tabText,
                  currentTab === "categories" && styles.activeTabText,
                ]}
              >
                分类管理
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === "devices" && styles.activeTab]}
              onPress={() => setCurrentTab("devices")}
            >
              <Text
                style={[
                  styles.tabText,
                  currentTab === "devices" && styles.activeTabText,
                ]}
              >
                设备管理
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>退出</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {currentTab === "employees" && <EmployeeScreen />}
      {currentTab === "categories" && <CategoryScreen />}
      {currentTab === "devices" && <DeviceScreen />}

      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  safeArea: {
    backgroundColor: "#007AFF", // 将安全区域背景设为和导航栏一致的蓝色
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, // 兼容 Android 状态栏高度
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabContainer: {
    flexDirection: "row",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
