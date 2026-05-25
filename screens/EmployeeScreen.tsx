import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, Modal, ScrollView, Platform,
} from 'react-native';
import { Employee } from '../types';
import { apiClient } from '../apiClient';
import { AuthContext } from '../AuthContext';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const avatarColors = ['#1E3A8A', '#7C3AED', '#059669', '#D97706', '#DC2626', '#2563EB'];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

type FormErrors = {
  name?: string;
  email?: string;
  age?: string;
};

export default function EmployeeScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '', age: '', email: '', phone: '', department: '', position: '', employee_id: '',
  });

  const { user } = useContext(AuthContext)!;

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getEmployees();
      if (response.code === 200) setEmployees(response.data || []);
      else Alert.alert('加载失败', response.message || '无法获取员工列表');
    } catch (error) {
      Alert.alert('网络错误', '无法连接到服务器，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!formData.name.trim()) e.name = '请输入姓名';
    else if (formData.name.trim().length < 2) e.name = '姓名至少2个字符';

    if (!formData.email.trim()) e.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = '邮箱格式不正确，例如: user@example.com';

    if (!formData.age.trim()) e.age = '请输入年龄';
    else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum)) e.age = '年龄必须是数字';
      else if (ageNum < 18 || ageNum > 60) e.age = '年龄必须在 18 ~ 60 之间';
    }
    return e;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const newForm = { ...formData, [field]: value };
      const tempErrors = { ...errors };
      if (field === 'name') {
        if (!newForm.name.trim()) tempErrors.name = '请输入姓名';
        else if (newForm.name.trim().length < 2) tempErrors.name = '姓名至少2个字符';
        else delete tempErrors.name;
      }
      if (field === 'email') {
        if (!newForm.email.trim()) tempErrors.email = '请输入邮箱';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newForm.email)) tempErrors.email = '邮箱格式不正确';
        else delete tempErrors.email;
      }
      if (field === 'age') {
        if (!newForm.age.trim()) tempErrors.age = '请输入年龄';
        else {
          const n = parseInt(newForm.age);
          if (isNaN(n)) tempErrors.age = '年龄必须是数字';
          else if (n < 18 || n > 60) tempErrors.age = '年龄必须在 18 ~ 60';
          else delete tempErrors.age;
        }
      }
      setErrors(tempErrors);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validate();
    if (validation[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: validation[field as keyof FormErrors] }));
    }
  };

  const handleSave = async () => {
    setTouched({ name: true, email: true, age: true });
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    try {
      const payload = { ...formData, age: parseInt(formData.age) };
      if (editingEmployee) {
        await apiClient.updateEmployee(editingEmployee.id.toString(), payload);
      } else {
        await apiClient.createEmployee(payload);
      }
      setModalVisible(false);
      resetForm();
      fetchEmployees();
      Alert.alert('成功', `员工${editingEmployee ? '更新' : '创建'}成功`);
    } catch (error: any) {
      Alert.alert('保存失败', error?.message || '请稍后重试');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('确认删除', '删除后不可恢复，确定要删除该员工吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteEmployee(id.toString());
            fetchEmployees();
            Alert.alert('成功', '员工已删除');
          } catch (error) {
            Alert.alert('删除失败', '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      age: employee.age?.toString() || '',
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      employee_id: employee.employee_id || '',
    });
    setErrors({});
    setTouched({});
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({ name: '', age: '', email: '', phone: '', department: '', position: '', employee_id: '' });
    setEditingEmployee(null);
    setErrors({});
    setTouched({});
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          {item.position ? <Text style={styles.employeePosition}>{item.position}</Text> : null}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteBtnText}>Del</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.detailGrid}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{item.email}</Text>
        </View>
        {item.phone ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text style={styles.detailValue}>{item.phone}</Text></View> : null}
        {item.department ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Dept</Text><Text style={styles.detailValue}>{item.department}</Text></View> : null}
        {item.employee_id ? <View style={styles.detailRow}><Text style={styles.detailLabel}>ID</Text><Text style={styles.detailValue}>{item.employee_id}</Text></View> : null}
      </View>
    </View>
  );

  const inputStyle = (field: keyof FormErrors) => [
    styles.input,
    touched[field] && errors[field] ? styles.inputError : null,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Employees</Text>
          <Text style={styles.subtitle}>{employees.length} members</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchEmployees}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editingEmployee ? '编辑员工' : '添加员工'}</Text>

              <Text style={styles.inputLabel}>姓名 <Text style={styles.required}>*</Text></Text>
              <TextInput style={inputStyle('name')} placeholder="请输入姓名" placeholderTextColor="#94A3B8" value={formData.name} onChangeText={(t) => handleFieldChange('name', t)} onBlur={() => handleFieldBlur('name')} />
              {touched.name && errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              <Text style={styles.inputLabel}>邮箱 <Text style={styles.required}>*</Text></Text>
              <TextInput style={inputStyle('email')} placeholder="例如: zhangsan@company.com" placeholderTextColor="#94A3B8" value={formData.email} onChangeText={(t) => handleFieldChange('email', t)} onBlur={() => handleFieldBlur('email')} keyboardType="email-address" autoCapitalize="none" />
              {touched.email && errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

              <Text style={styles.inputLabel}>年龄 <Text style={styles.required}>*</Text></Text>
              <TextInput style={inputStyle('age')} placeholder="18 ~ 60 之间的整数" placeholderTextColor="#94A3B8" value={formData.age} onChangeText={(t) => handleFieldChange('age', t)} onBlur={() => handleFieldBlur('age')} keyboardType="numeric" />
              {touched.age && errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}

              <Text style={styles.inputLabel}>手机号</Text>
              <TextInput style={styles.input} placeholder="选填" placeholderTextColor="#94A3B8" value={formData.phone} onChangeText={(t) => setFormData({ ...formData, phone: t })} keyboardType="phone-pad" />

              <Text style={styles.inputLabel}>部门</Text>
              <TextInput style={styles.input} placeholder="选填" placeholderTextColor="#94A3B8" value={formData.department} onChangeText={(t) => setFormData({ ...formData, department: t })} />

              <Text style={styles.inputLabel}>职位</Text>
              <TextInput style={styles.input} placeholder="选填" placeholderTextColor="#94A3B8" value={formData.position} onChangeText={(t) => setFormData({ ...formData, position: t })} />

              <Text style={styles.inputLabel}>工号</Text>
              <TextInput style={styles.input} placeholder="选填" placeholderTextColor="#94A3B8" value={formData.employee_id} onChangeText={(t) => setFormData({ ...formData, employee_id: t })} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>{editingEmployee ? '保存修改' : '确认添加'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  addButton: { backgroundColor: '#1E3A8A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, ...shadows.md },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  listContainer: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  employeeName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  employeePosition: { fontSize: 13, color: '#64748B', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  editBtnText: { color: '#1E3A8A', fontSize: 13, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  detailGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', width: 52, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: '#64748B', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '92%', maxHeight: '85%', ...shadows.lg },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginLeft: 2 },
  required: { color: '#DC2626' },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
    marginBottom: 4, backgroundColor: '#F8FAFC', color: '#0F172A',
  },
  inputError: { borderColor: '#DC2626', borderWidth: 1.5, backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 12, color: '#DC2626', marginBottom: 10, marginLeft: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#1E3A8A', ...shadows.md },
  cancelBtnText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
