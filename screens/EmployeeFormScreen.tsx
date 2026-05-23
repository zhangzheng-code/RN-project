import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Employee, ApiResponse } from '../types';
import { createEmployee, updateEmployee, getEmployees } from '../mockApi';

interface EmployeeFormScreenProps {
  navigation: any;
  route: {
    params?: {
      employee?: Employee;
      isEdit?: boolean;
    };
  };
}

const EmployeeFormScreen: React.FC<EmployeeFormScreenProps> = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>('');

  useEffect(() => {
    if (route.params?.employee && route.params?.isEdit) {
      const employee = route.params.employee;
      setName(employee.name);
      // 把原先那行彻底替换成这行：
setAge((employee as any).age?.toString() ?? '');
      setEmail(employee.email);
      setEmployeeId(employee.id.toString());
      setIsEdit(true);
    }
  }, [route.params]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入员工姓名');
      return false;
    }

    if (name.length < 1 || name.length > 20) {
      Alert.alert('错误', '姓名长度必须在1-20个字符之间');
      return false;
    }

    const ageNumber = parseInt(age);
    if (!age || isNaN(ageNumber)) {
      Alert.alert('错误', '请输入有效的年龄');
      return false;
    }

    if (ageNumber < 18 || ageNumber > 60) {
      Alert.alert('错误', '年龄必须在18-60岁之间');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('错误', '请输入邮箱地址');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('错误', '请输入有效的邮箱格式');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const employeeData = {
        name: name.trim(),
        age: parseInt(age),
        email: email.trim(),
      };

      let response: ApiResponse<Employee>;

      if (isEdit) {
        response = await updateEmployee(employeeId, employeeData);
      } else {
        response = await createEmployee(employeeData);
      }

      if (response.code === 200) {
        Alert.alert(
          '成功',
          isEdit ? '员工信息更新成功' : '员工创建成功',
          [
            {
              text: '确定',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('错误', response.message);
      }
    } catch (error) {
      Alert.alert('错误', isEdit ? '更新员工失败' : '创建员工失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isEdit ? '编辑员工' : '添加员工'}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>姓名 *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="请输入员工姓名 (1-20个字符)"
              maxLength={20}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>年龄 *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="请输入年龄 (18-60岁)"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>邮箱 *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱地址"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEdit ? '更新员工' : '创建员工'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmployeeFormScreen;