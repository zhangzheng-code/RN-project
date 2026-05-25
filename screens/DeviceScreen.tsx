import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, Modal, ScrollView, Platform,
} from 'react-native';
import { Device, Category, Employee } from '../types';
import { apiClient } from '../apiClient';
import { shadows } from '../styles/designSystem';

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: '#F0FDF4', border: '#BBF7D0', text: '#059669', label: '可用' },
  assigned: { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', label: '已分配' },
  maintenance: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: '维护中' },
  retired: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: '已退役' },
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

type FormErrors = {
  name?: string;
  category_id?: string;
};

export default function DeviceScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pickerModal, setPickerModal] = useState<'category' | 'employee' | 'status' | null>(null);
  const [formData, setFormData] = useState({
    name: '', model: '', serial_number: '',
    category_id: null as number | null,
    assigned_to: null as number | null,
    status: 'available' as 'available' | 'assigned' | 'maintenance' | 'retired',
    purchase_date: '', notes: '',
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
      else Alert.alert('加载失败', response.message || '无法获取设备列表');
    } catch (error) {
      Alert.alert('网络错误', '无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try { const r = await apiClient.getCategories(); setCategories(r.data || []); } catch {}
  };

  const fetchEmployees = async () => {
    try { const r = await apiClient.getEmployees(); setEmployees(r.data || []); } catch {}
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!formData.name.trim()) e.name = '请输入设备名称';
    if (!formData.category_id) e.category_id = '请选择设备分类';
    return e;
  };

  const handleSave = async () => {
    setTouched({ name: true, category_id: true });
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    try {
      const deviceData = { ...formData };
      if (editingDevice) {
        await apiClient.updateDevice(editingDevice.id.toString(), deviceData);
      } else {
        await apiClient.createDevice(deviceData);
      }
      setModalVisible(false);
      resetForm();
      fetchDevices();
      Alert.alert('成功', `设备${editingDevice ? '更新' : '创建'}成功`);
    } catch (error: any) {
      Alert.alert('保存失败', error?.message || '请稍后重试');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('确认删除', '删除后不可恢复，确定要删除该设备吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteDevice(id.toString());
            fetchDevices();
            Alert.alert('成功', '设备已删除');
          } catch (error) {
            Alert.alert('删除失败', '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name, model: device.model || '', serial_number: device.serial_number || '',
      category_id: device.category_id, assigned_to: device.assigned_to,
      status: device.status, purchase_date: device.purchase_date || '', notes: device.notes || '',
    });
    setErrors({});
    setTouched({});
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({ name: '', model: '', serial_number: '', category_id: null, assigned_to: null, status: 'available', purchase_date: '', notes: '' });
    setEditingDevice(null);
    setErrors({});
    setTouched({});
  };

  const getCategoryName = (id: number | null) => {
    if (!id) return '未选择';
    const c = categories.find((c) => c.id === id);
    return c ? c.name : '未知';
  };

  const getEmployeeName = (id: number | null) => {
    if (!id) return '未分配';
    const e = employees.find((e) => e.id === id);
    return e ? e.name : '未知';
  };

  const renderDevice = ({ item }: { item: Device }) => {
    const sc = statusConfig[item.status] || statusConfig.available;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}><Text style={styles.iconText}>{getDeviceIcon(item.name)}</Text></View>
          <View style={styles.cardInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            {item.model ? <Text style={styles.deviceModel}>{item.model}</Text> : null}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}><Text style={styles.deleteBtnText}>Del</Text></TouchableOpacity>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailGrid}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>SN</Text><Text style={styles.detailValue}>{item.serial_number || '—'}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>分类</Text><Text style={styles.detailValue}>{getCategoryName(item.category_id)}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>负责人</Text><Text style={styles.detailValue}>{getEmployeeName(item.assigned_to)}</Text></View>
          {item.purchase_date ? <View style={styles.detailRow}><Text style={styles.detailLabel}>日期</Text><Text style={styles.detailValue}>{item.purchase_date}</Text></View> : null}
          {item.notes ? <View style={styles.detailRow}><Text style={styles.detailLabel}>备注</Text><Text style={styles.detailValue} numberOfLines={2}>{item.notes}</Text></View> : null}
        </View>
      </View>
    );
  };

  const inputStyle = (field: keyof FormErrors) => [
    styles.input,
    touched[field] && errors[field] ? styles.inputError : null,
  ];

  const renderPickerModal = () => {
    if (!pickerModal) return null;

    let title = '';
    let items: { key: string; label: string; sub?: string; selected: boolean }[] = [];

    if (pickerModal === 'category') {
      title = '选择设备分类';
      items = categories.map((c) => ({
        key: String(c.id), label: c.name, sub: c.description,
        selected: formData.category_id === c.id,
      }));
    } else if (pickerModal === 'employee') {
      title = '选择负责人';
      items = [
        { key: 'null', label: '不分配', selected: !formData.assigned_to },
        ...employees.map((e) => ({
          key: String(e.id), label: e.name, sub: e.department || e.position,
          selected: formData.assigned_to === e.id,
        })),
      ];
    } else if (pickerModal === 'status') {
      title = '选择状态';
      const statuses = ['available', 'assigned', 'maintenance', 'retired'] as const;
      const labels = { available: '可用', assigned: '已分配', maintenance: '维护中', retired: '已退役' };
      items = statuses.map((s) => ({
        key: s, label: labels[s], selected: formData.status === s,
      }));
    }

    const handleSelect = (key: string) => {
      if (pickerModal === 'category') {
        const id = parseInt(key);
        setFormData((prev) => ({ ...prev, category_id: id }));
        if (touched.category_id) {
          const newErrors = { ...errors };
          delete newErrors.category_id;
          setErrors(newErrors);
        }
        setTouched((prev) => ({ ...prev, category_id: true }));
      } else if (pickerModal === 'employee') {
        setFormData((prev) => ({ ...prev, assigned_to: key === 'null' ? null : parseInt(key) }));
      } else if (pickerModal === 'status') {
        setFormData((prev) => ({ ...prev, status: key as any }));
      }
      setPickerModal(null);
    };

    return (
      <Modal visible transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setPickerModal(null)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.pickerItem, item.selected && styles.pickerItemSelected]}
                  onPress={() => handleSelect(item.key)}
                >
                  <View style={styles.pickerItemContent}>
                    <Text style={[styles.pickerItemText, item.selected && styles.pickerItemTextSelected]}>{item.label}</Text>
                    {item.sub ? <Text style={styles.pickerItemSub}>{item.sub}</Text> : null}
                  </View>
                  {item.selected ? <Text style={styles.pickerCheck}>✓</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
              <Text style={styles.modalTitle}>{editingDevice ? '编辑设备' : '添加设备'}</Text>

              <Text style={styles.inputLabel}>设备名称 <Text style={styles.required}>*</Text></Text>
              <TextInput style={inputStyle('name')} placeholder="例如: MacBook Pro 16" placeholderTextColor="#94A3B8" value={formData.name} onChangeText={(t) => { setFormData({ ...formData, name: t }); if (touched.name) { const e = { ...errors }; if (t.trim()) delete e.name; else e.name = '请输入设备名称'; setErrors(e); } }} onBlur={() => { setTouched((p) => ({ ...p, name: true })); if (!formData.name.trim()) setErrors((p) => ({ ...p, name: '请输入设备名称' })); }} />
              {touched.name && errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              <Text style={styles.inputLabel}>型号</Text>
              <TextInput style={styles.input} placeholder="选填，例如: M3 Max 64GB" placeholderTextColor="#94A3B8" value={formData.model} onChangeText={(t) => setFormData({ ...formData, model: t })} />

              <Text style={styles.inputLabel}>序列号</Text>
              <TextInput style={styles.input} placeholder="选填" placeholderTextColor="#94A3B8" value={formData.serial_number} onChangeText={(t) => setFormData({ ...formData, serial_number: t })} />

              <Text style={styles.inputLabel}>设备分类 <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.pickerBtn, touched.category_id && errors.category_id ? styles.inputError : null]}
                onPress={() => setPickerModal('category')}
              >
                <Text style={[styles.pickerText, !formData.category_id && { color: '#94A3B8' }]}>
                  {formData.category_id ? getCategoryName(formData.category_id) : '点击选择分类'}
                </Text>
                <Text style={styles.pickerArrow}>▸</Text>
              </TouchableOpacity>
              {touched.category_id && errors.category_id ? <Text style={styles.errorText}>{errors.category_id}</Text> : null}

              <Text style={styles.inputLabel}>负责人</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerModal('employee')}>
                <Text style={[styles.pickerText, !formData.assigned_to && { color: '#94A3B8' }]}>
                  {formData.assigned_to ? getEmployeeName(formData.assigned_to) : '点击选择（可不分配）'}
                </Text>
                <Text style={styles.pickerArrow}>▸</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>状态</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerModal('status')}>
                <Text style={styles.pickerText}>{statusConfig[formData.status]?.label || formData.status}</Text>
                <Text style={styles.pickerArrow}>▸</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>采购日期</Text>
              <TextInput style={styles.input} placeholder="格式: 2025-01-15" placeholderTextColor="#94A3B8" value={formData.purchase_date} onChangeText={(t) => setFormData({ ...formData, purchase_date: t })} />

              <Text style={styles.inputLabel}>备注</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="选填" placeholderTextColor="#94A3B8" value={formData.notes} onChangeText={(t) => setFormData({ ...formData, notes: t })} multiline numberOfLines={3} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>{editingDevice ? '保存修改' : '确认添加'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {renderPickerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF', ...shadows.sm,
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
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', width: 56, textTransform: 'uppercase', letterSpacing: 0.5 },
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
  pickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 4, backgroundColor: '#F8FAFC',
  },
  pickerText: { fontSize: 16, color: '#0F172A' },
  pickerArrow: { fontSize: 14, color: '#94A3B8' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#1E3A8A', ...shadows.md },
  cancelBtnText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  pickerModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%', ...shadows.lg },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  pickerClose: { fontSize: 20, color: '#94A3B8', padding: 4 },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    borderRadius: 8,
  },
  pickerItemSelected: { backgroundColor: '#EFF6FF' },
  pickerItemContent: { flex: 1 },
  pickerItemText: { fontSize: 16, color: '#0F172A' },
  pickerItemTextSelected: { color: '#1E3A8A', fontWeight: '600' },
  pickerItemSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  pickerCheck: { fontSize: 18, color: '#1E3A8A', fontWeight: '700' },
});
