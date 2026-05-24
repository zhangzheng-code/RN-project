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
} from 'react-native';
import { Employee } from '../types';
import { apiClient } from '../apiClient';
import { AuthContext } from '../AuthContext';
import { colors, spacing, borderRadius, typography } from '../styles/designSystem';

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

      const payload = {
        ...formData,
        age: ageNumber,
      };

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
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this employee?',
      [
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
      ]
    );
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
    setFormData({
      name: '',
      age: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      employee_id: '',
    });
    setEditingEmployee(null);
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.employeeDetail}>Email: {item.email}</Text>
      {item.phone && <Text style={styles.employeeDetail}>Phone: {item.phone}</Text>}
      {item.department && <Text style={styles.employeeDetail}>Department: {item.department}</Text>}
      {item.position && <Text style={styles.employeeDetail}>Position: {item.position}</Text>}
      {item.employee_id && <Text style={styles.employeeDetail}>Employee ID: {item.employee_id}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>Add Employee</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchEmployees}
        contentContainerStyle={styles.listContainer}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Age *"
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Department"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Position"
                value={formData.position}
                onChangeText={(text) => setFormData({ ...formData, position: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Employee ID"
                value={formData.employee_id}
                onChangeText={(text) => setFormData({ ...formData, employee_id: text })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.warning,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  employeeDetail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
});