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
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';

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
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await createDevice({ name: name.trim(), category_id: selectedCategory!.id } as any);
      if (response.code === 200) {
        Alert.alert('成功', '设备创建成功', [{ text: '确定', onPress: () => navigation.goBack() }]);
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>添加设备</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>设备名称 *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="请输入设备名称" placeholderTextColor="#94A3B8" editable={!isLoading} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>设备分类 *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setIsCategoryModalVisible(true)} disabled={isLoading}>
              <Text style={[styles.pickerText, !selectedCategory && styles.pickerPlaceholder]}>
                {selectedCategory ? selectedCategory.name : '请选择设备分类'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>创建设备</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={isLoading}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={isCategoryModalVisible} transparent animationType="slide" onRequestClose={() => setIsCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>选择分类</Text>
              <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity key={category.id} style={styles.categoryItem} onPress={() => handleCategorySelect(category)}>
                    <Text style={styles.categoryItemText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsCategoryModalVisible(false)}>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  formContainer: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 32 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#FFFFFF', color: '#0F172A', ...shadows.sm },
  pickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', ...shadows.sm,
  },
  pickerText: { fontSize: 16, color: '#0F172A' },
  pickerPlaceholder: { color: '#94A3B8' },
  pickerArrow: { fontSize: 12, color: '#94A3B8' },
  submitButton: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24, ...shadows.md },
  submitButtonDisabled: { backgroundColor: '#CBD5E1' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  cancelButton: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  cancelButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '85%', maxHeight: '60%', ...shadows.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 16 },
  categoryList: { maxHeight: 250 },
  categoryItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  categoryItemText: { fontSize: 16, color: '#0F172A' },
  modalCloseButton: { backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 8, marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCloseButtonText: { textAlign: 'center', fontSize: 16, color: '#64748B', fontWeight: '600' },
});

export default DeviceFormScreen;
