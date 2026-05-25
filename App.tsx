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
import EmployeeScreen from "./screens/EmployeeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import DeviceScreen from "./screens/DeviceScreen";

const TABS = [
  { key: "employees", label: "员工" },
  { key: "categories", label: "分类" },
  { key: "devices", label: "设备" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function MainApp() {
  const { user, isLoading, logout } = useAuth();
  const [currentTab, setCurrentTab] = React.useState<TabKey>("employees");

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
            {TABS.map((tab) => {
              const isActive = currentTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => setCurrentTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.logoutButtonText}>退出</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {currentTab === "employees" && <EmployeeScreen />}
      {currentTab === "categories" && <CategoryScreen />}
      {currentTab === "devices" && <DeviceScreen />}

      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
    backgroundColor: "#F8FAFC",
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    ...Platform.select({
      ios: {
        shadowColor: "#1E3A8A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabContainer: {
    flexDirection: "row",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 4,
    position: "relative",
  },
  activeTab: {},
  tabText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1E3A8A",
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: "#1E3A8A",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  logoutButton: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
});
