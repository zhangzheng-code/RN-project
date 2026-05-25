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
  Platform,
} from 'react-native';
import { Device, Category, Employee } from '../types';
import { apiClient } from '../apiClient';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: '#F0FDF4', border: '#BBF7D0', text: '#059669', label: 'Available' },
  assigned: { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', label: 'Assigned' },
  maintenance: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Maintenance' },
  retired: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Retired' },
};

const getDeviceIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('laptop') || lower.includes('电脑') || lower.includes('macbook')) return '💻';
  if (lower.includes('phone') || lower.includes('手机') || lower.includes('iphone')) return '📱';
  if (lower.includes('monitor') || lower.includes('显示器') || lower.includes('screen')) return '🖥️';
  if (lower.includes('printer') || lower.includes('打印')) return '🖨️';
  if (lower.includes('camera') || lower.includes('摄像')) return '📷';
  if (lower.includes('headphone') || lower.includes('耳机')) return '🎧';
  if (lower.includes('keyboard') || lower.includes('键盘')) return '⌨️';
  if (lower.includes('mouse') || lower.includes('鼠标')) return '🖱️';
  if (lower.includes('server') || lower.includes('服务器')) return '🗄️';
  return '📦';
};

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
      if (response.code === 200) setDevices(response.data || []);
      else Alert.alert('Error', response.message || 'Failed to load devices');
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
      const deviceData = { ...formData, category_id: formData.category_id, assigned_to: formData.assigned_to };
      if (editingDevice) {
        await apiClient.updateDevice(editingDevice.id.toString(), deviceData);
      } else {
        await apiClient.createDevice(deviceData);
      }
      setModalVisible(false);
      resetForm();
      fetchDevices();
      Alert.alert('Success', `Device ${editingDevice ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error('Failed to save device:', error);
      Alert.alert('Error', error?.message || 'Failed to save device');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this device?', [
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
    ]);
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
    setFormData({ name: '', model: '', serial_number: '', category_id: null, assigned_to: null, status: 'available', purchase_date: '', notes: '' });
    setEditingDevice(null);
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'No Category';
    const c = categories.find((c) => c.id === categoryId);
    return c ? c.name : 'Unknown';
  };

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return 'Unassigned';
    const e = employees.find((e) => e.id === employeeId);
    return e ? e.name : 'Unknown';
  };

  const renderDevice = ({ item }: { item: Device }) => {
    const sc = statusConfig[item.status] || statusConfig.available;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{getDeviceIcon(item.name)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            {item.model ? <Text style={styles.deviceModel}>{item.model}</Text> : null}
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

        <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailGrid}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SN</Text>
            <Text style={styles.detailValue}>{item.serial_number || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{getCategoryName(item.category_id)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned</Text>
            <Text style={styles.detailValue}>{getEmployeeName(item.assigned_to)}</Text>
          </View>
          {item.purchase_date ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{item.purchase_date}</Text>
            </View>
          ) : null}
          {item.notes ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{item.notes}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Devices</Text>
          <Text style={styles.subtitle}>{devices.length} assets</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchDevices}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editingDevice ? 'Edit Device' : 'Add Device'}</Text>

              <Text style={styles.inputLabel}>Device Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. MacBook Pro 16" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />

              <Text style={styles.inputLabel}>Model</Text>
              <TextInput style={styles.input} placeholder="Optional" value={formData.model} onChangeText={(t) => setFormData({ ...formData, model: t })} />

              <Text style={styles.inputLabel}>Serial Number</Text>
              <TextInput style={styles.input} placeholder="Optional" value={formData.serial_number} onChangeText={(t) => setFormData({ ...formData, serial_number: t })} />

              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => {
                  const idx = categories.findIndex((c) => c.id === formData.category_id) + 1;
                  setFormData({ ...formData, category_id: idx < categories.length ? categories[idx].id : null });
                }}
              >
                <Text style={styles.pickerText}>{formData.category_id ? getCategoryName(formData.category_id) : 'Select Category'}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Assign to Employee</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => {
                  const idx = employees.findIndex((e) => e.id === formData.assigned_to) + 1;
                  setFormData({ ...formData, assigned_to: idx < employees.length ? employees[idx].id : null });
                }}
              >
                <Text style={styles.pickerText}>{formData.assigned_to ? getEmployeeName(formData.assigned_to) : 'Unassigned'}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Status</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => {
                  const statuses = ['available', 'assigned', 'maintenance', 'retired'] as const;
                  const idx = statuses.indexOf(formData.status);
                  setFormData({ ...formData, status: statuses[(idx + 1) % statuses.length] });
                }}
              >
                <Text style={styles.pickerText}>{formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Purchase Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={formData.purchase_date} onChangeText={(t) => setFormData({ ...formData, purchase_date: t })} />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Optional notes" value={formData.notes} onChangeText={(t) => setFormData({ ...formData, notes: t })} multiline numberOfLines={3} />

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
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  deviceName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  deviceModel: { fontSize: 13, color: '#64748B', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  editBtnText: { color: '#1E3A8A', fontSize: 13, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginTop: 12 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  detailGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', width: 72, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: '#64748B', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '92%', maxHeight: '85%', ...shadows.lg },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16, backgroundColor: '#F8FAFC', color: '#0F172A' },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, backgroundColor: '#F8FAFC' },
  pickerText: { fontSize: 16, color: '#0F172A' },
  pickerArrow: { fontSize: 12, color: '#94A3B8' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#1E3A8A', ...shadows.md },
  cancelBtnText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
