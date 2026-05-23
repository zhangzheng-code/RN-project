import React, { useState, useEffect } from 'react';
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
import { Device, Category, Employee } from '../types';
import { apiClient } from '../apiClient';
import { colors, spacing, borderRadius, typography } from '../styles/designSystem';

export default function DeviceScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    category_id: null as number | null,
    assigned_to: null as number | null,
    status: 'available' as 'available' | 'assigned' | 'maintenance' | 'retired',
    purchase_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchDevices();
    fetchCategories();
    fetchEmployees();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDevices();
      setDevices(response.data || []);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Device name is required');
        return;
      }

      const deviceData = {
        ...formData,
        category_id: formData.category_id ,
        assigned_to: formData.assigned_to ,
      };

      if (editingDevice) {
        await apiClient.updateDevice(editingDevice.id.toString(), deviceData);
      } else {
        await apiClient.createDevice(deviceData);
      }

      setModalVisible(false);
      resetForm();
      fetchDevices();
      Alert.alert('Success', `Device ${editingDevice ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Failed to save device:', error);
      Alert.alert('Error', 'Failed to save device');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteDevice(id.toString());
              fetchDevices();
              Alert.alert('Success', 'Device deleted successfully');
            } catch (error) {
              console.error('Failed to delete device:', error);
              Alert.alert('Error', 'Failed to delete device');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      model: device.model || '',
      serial_number: device.serial_number || '',
      category_id: device.category_id,
      assigned_to: device.assigned_to,
      status: device.status,
      purchase_date: device.purchase_date || '',
      notes: device.notes || '',
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      serial_number: '',
      category_id: null,
      assigned_to: null,
      status: 'available',
      purchase_date: '',
      notes: '',
    });
    setEditingDevice(null);
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'No Category';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return 'Unassigned';
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.success;
      case 'assigned': return colors.info;
      case 'maintenance': return colors.warning;
      case 'retired': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
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

      {item.model && <Text style={styles.deviceDetail}>Model: {item.model}</Text>}
      {item.serial_number && <Text style={styles.deviceDetail}>Serial: {item.serial_number}</Text>}
      <Text style={styles.deviceDetail}>Category: {getCategoryName(item.category_id)}</Text>
      <Text style={styles.deviceDetail}>Assigned to: {getEmployeeName(item.assigned_to)}</Text>
      {item.purchase_date && <Text style={styles.deviceDetail}>Purchase Date: {item.purchase_date}</Text>}
      {item.notes && <Text style={styles.deviceDetail}>Notes: {item.notes}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Devices</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>Add Device</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchDevices}
        contentContainerStyle={styles.listContainer}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingDevice ? 'Edit Device' : 'Add Device'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Device Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Model"
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Serial Number"
                value={formData.serial_number}
                onChangeText={(text) => setFormData({ ...formData, serial_number: text })}
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    // Simple category selection - in a real app, you'd use a proper dropdown
                    const nextIndex = categories.findIndex(c => c.id === formData.category_id) + 1;
                    const newCategoryId = nextIndex < categories.length ? categories[nextIndex].id : null;
                    setFormData({ ...formData, category_id: newCategoryId });
                  }}
                >
                  <Text style={styles.pickerText}>
                    {formData.category_id ? getCategoryName(formData.category_id) : 'Select Category'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Assign to Employee</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    // Simple employee selection - in a real app, you'd use a proper dropdown
                    const nextIndex = employees.findIndex(e => e.id === formData.assigned_to) + 1;
                    const newEmployeeId = nextIndex < employees.length ? employees[nextIndex].id : null;
                    setFormData({ ...formData, assigned_to: newEmployeeId });
                  }}
                >
                  <Text style={styles.pickerText}>
                    {formData.assigned_to ? getEmployeeName(formData.assigned_to) : 'Unassigned'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    const statuses = ['available', 'assigned', 'maintenance', 'retired'];
                    const currentIndex = statuses.indexOf(formData.status);
                    const nextIndex = (currentIndex + 1) % statuses.length;
                    setFormData({ ...formData, status: statuses[nextIndex] as any });
                  }}
                >
                  <Text style={styles.pickerText}>
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Purchase Date (YYYY-MM-DD)"
                value={formData.purchase_date}
                onChangeText={(text) => setFormData({ ...formData, purchase_date: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  deviceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
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
  deviceDetail: {
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
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  pickerText: {
    fontSize: 16,
    color: colors.textPrimary,
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
    backgroundColor: colors.textSecondary,
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
