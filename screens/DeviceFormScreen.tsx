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
  Modal,
} from 'react-native';
import { Device, Category, ApiResponse } from '../types';
import { createDevice, getCategories } from '../mockApi';

interface DeviceFormScreenProps {
  navigation: any;
}

const DeviceFormScreen: React.FC<DeviceFormScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.code === 200) {
        setCategories(response.data || []);
      } else {
        Alert.alert('错误', response.message);
      }
    } catch (error) {
      Alert.alert('错误', '加载分类列表失败');
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入设备名称');
      return false;
    }

    if (!selectedCategory) {
      Alert.alert('错误', '请选择设备分类');
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
      const response = await createDevice({
        name: name.trim(),
        categoryId: selectedCategory!.id,
      });

      if (response.code === 200) {
        Alert.alert(
          '成功',
          '设备创建成功',
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
      Alert.alert('错误', '创建设备失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>添加设备</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>设备名称 *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="请输入设备名称"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>设备分类 *</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setIsCategoryModalVisible(true)}
              disabled={isLoading}
            >
              <Text style={[
                styles.categorySelectorText,
                !selectedCategory && styles.categorySelectorPlaceholder
              ]}>
                {selectedCategory ? selectedCategory.name : '请选择设备分类'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>创建设备</Text>
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

        <Modal
          visible={isCategoryModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>选择分类</Text>
              <ScrollView style={styles.categoryList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text style={styles.categoryItemText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsCategoryModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  categorySelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#333',
  },
  categorySelectorPlaceholder: {
    color: '#999',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  categoryList: {
    maxHeight: 200,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  modalCloseButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default DeviceFormScreen;