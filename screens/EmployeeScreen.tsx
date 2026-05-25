import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Employee } from '../types';
import { apiClient } from '../apiClient';
import { AuthContext } from '../AuthContext';
import { colors, spacing, borderRadius, shadows, typography } from '../styles/designSystem';

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

export default function EmployeeScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employee_id: '',
  });

  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getEmployees();
      if (response.code === 200) {
        setEmployees(response.data || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load employees');
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.email || !formData.age) {
        Alert.alert('Error', 'Name, age and email are required');
        return;
      }

      const ageNumber = parseInt(formData.age);
      if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 60) {
        Alert.alert('Error', 'Age must be between 18 and 60');
        return;
      }

      const payload = { ...formData, age: ageNumber };

      if (editingEmployee) {
        await apiClient.updateEmployee(editingEmployee.id.toString(), payload);
      } else {
        await apiClient.createEmployee(payload);
      }

      setModalVisible(false);
      resetForm();
      fetchEmployees();
      Alert.alert('Success', `Employee ${editingEmployee ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error('Failed to save employee:', error);
      Alert.alert('Error', error?.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this employee?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteEmployee(id.toString());
            fetchEmployees();
            Alert.alert('Success', 'Employee deleted successfully');
          } catch (error) {
            console.error('Failed to delete employee:', error);
            Alert.alert('Error', 'Failed to delete employee');
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
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({ name: '', age: '', email: '', phone: '', department: '', position: '', employee_id: '' });
    setEditingEmployee(null);
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          {item.position ? (
            <Text style={styles.employeePosition}>{item.position}</Text>
          ) : null}
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
        {item.phone ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{item.phone}</Text>
          </View>
        ) : null}
        {item.department ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dept</Text>
            <Text style={styles.detailValue}>{item.department}</Text>
          </View>
        ) : null}
        {item.employee_id ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID</Text>
            <Text style={styles.detailValue}>{item.employee_id}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Employees</Text>
          <Text style={styles.subtitle}>{employees.length} members</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
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
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </Text>

              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput style={styles.input} placeholder="Full name" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput style={styles.input} placeholder="email@example.com" value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput style={styles.input} placeholder="18 - 60" value={formData.age} onChangeText={(t) => setFormData({ ...formData, age: t })} keyboardType="numeric" />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput style={styles.input} placeholder="Optional" value={formData.phone} onChangeText={(t) => setFormData({ ...formData, phone: t })} keyboardType="phone-pad" />

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput style={styles.input} placeholder="Optional" value={formData.department} onChangeText={(t) => setFormData({ ...formData, department: t })} />

              <Text style={styles.inputLabel}>Position</Text>
              <TextInput style={styles.input} placeholder="Optional" value={formData.position} onChangeText={(t) => setFormData({ ...formData, position: t })} />

              <Text style={styles.inputLabel}>Employee ID</Text>
              <TextInput style={styles.input} placeholder="Optional" value={formData.employee_id} onChangeText={(t) => setFormData({ ...formData, employee_id: t })} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  employeePosition: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editBtnText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.md,
  },
  detailGrid: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    width: 52,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '92%',
    maxHeight: '85%',
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: '#1E3A8A',
    ...shadows.md,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
