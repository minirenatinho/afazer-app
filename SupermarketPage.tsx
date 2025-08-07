import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
// SupermarketItem will be a copy of TaskItem but for supermarket
// We'll create it after this step
import { fetchSupermarkets, createSupermarket, updateSupermarket, deleteSupermarket } from './api';

export interface Supermarket {
  id: string;
  name: string;
  completed: boolean;
  createdAt: number;
  quantity?: number;
  unit?: string;
  price?: number;
  notes?: string;
}

type SupermarketPageProps = {
  onBack?: () => void;
};

export default function SupermarketPage({ onBack }: SupermarketPageProps) {
  const backPressRef = useRef(false);
  const [showItemModal, setShowItemModal] = useState(false);

  const handleBackPress = () => {
    if (backPressRef.current) return;
    backPressRef.current = true;
    if (onBack) onBack();
    setTimeout(() => {
      backPressRef.current = false;
    }, 1000); // 1 second debounce
  };

  const openNewItemModal = () => {
    if (Platform.OS !== 'web') {
      setShowItemModal(true);
    }
  };

  const closeNewItemModal = () => {
    setShowItemModal(false);
  };

  const handleAddItem = () => {
    if (Platform.OS === 'web') {
      handleAddSupermarket();
    } else {
      handleAddSupermarket();
      closeNewItemModal();
    }
  };
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [newSupermarketText, setNewSupermarketText] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadSupermarkets();
  }, []);

  const loadSupermarkets = async () => {
    try {
      const apiSupermarkets = await fetchSupermarkets();
      setSupermarkets(apiSupermarkets);
      await AsyncStorage.setItem('supermarkets', JSON.stringify(apiSupermarkets));
    } catch (error) {
      const stored = await AsyncStorage.getItem('supermarkets');
      if (stored) setSupermarkets(JSON.parse(stored));
    }
  };

  const saveSupermarketsToCache = async (newSupermarkets: Supermarket[]) => {
    try {
      await AsyncStorage.setItem('supermarkets', JSON.stringify(newSupermarkets));
    } catch {}
  };

  const handleAddSupermarket = async () => {
    if (!newSupermarketText.trim()) return;
    const newSupermarket = {
      name: newSupermarketText.trim(),
      completed: false,
      createdAt: Date.now(),
      quantity: newQuantity ? Number(newQuantity) : undefined,
      unit: newUnit || undefined,
      price: newPrice ? Number(newPrice) : undefined,
      notes: newNotes || undefined,
    };
    try {
      const created = await createSupermarket(newSupermarket);
      const updated = [...supermarkets, created];
      setSupermarkets(updated);
      saveSupermarketsToCache(updated);
    } catch (e) {
      Alert.alert('Error', 'Failed to create supermarket item.');
    }
    setNewSupermarketText('');
    setNewQuantity('');
    setNewUnit('');
    setNewPrice('');
    setNewNotes('');
  };

  const toggleSupermarket = async (id: string) => {
    const item = supermarkets.find(s => s.id === id);
    if (!item) return;
    const updated = { ...item, completed: !item.completed };
    try {
      const apiItem = await updateSupermarket(updated);
      const updatedList = supermarkets.map(s => s.id === id ? apiItem : s);
      setSupermarkets(updatedList);
      saveSupermarketsToCache(updatedList);
    } catch {
      Alert.alert('Error', 'Failed to update item.');
    }
  };

  const deleteSupermarketItem = async (id: string) => {
    try {
      await deleteSupermarket(id);
      const updated = supermarkets.filter(s => s.id !== id);
      setSupermarkets(updated);
      saveSupermarketsToCache(updated);
    } catch {
      Alert.alert('Error', 'Failed to delete item.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSupermarkets();
    setRefreshing(false);
  };

  const renderSupermarket = ({ item }: { item: Supermarket }) => {
    const isEditing = editingId === item.id;
    return (
      <View style={styles.itemContainer}>
        <Pressable onPress={() => toggleSupermarket(item.id)}>
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={24}
            color={item.completed ? '#4CAF50' : '#ccc'}
          />
        </Pressable>
        {isEditing ? (
          <View style={{ flex: 1, flexDirection: 'column', marginLeft: 12, pointerEvents: 'box-none' }}>
            <TextInput
              style={[styles.itemText, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8 }]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              placeholder="Name"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <TextInput
                style={[styles.itemText, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8 }]}
                value={editQuantity}
                onChangeText={setEditQuantity}
                placeholder="Quantity"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.itemText, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8 }]}
                value={editUnit}
                onChangeText={setEditUnit}
                placeholder="Unit"
              />
              <TextInput
                style={[styles.itemText, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8 }]}
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder="Price"
                keyboardType="numeric"
              />
            </View>
            <TextInput
              style={[styles.itemText, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8, marginTop: 6 }]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Notes"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Pressable
                style={[styles.addButton, { backgroundColor: '#4CAF50', width: 40, height: 40 }]}
                onPress={async () => {
                  try {
                    const updated = {
                      ...item,
                      name: editText.trim(),
                      quantity: editQuantity ? Number(editQuantity) : undefined,
                      unit: editUnit || undefined,
                      price: editPrice ? Number(editPrice) : undefined,
                      notes: editNotes || undefined,
                    };
                    const apiItem = await updateSupermarket(updated);
                    const updatedList = supermarkets.map(s => s.id === item.id ? apiItem : s);
                    setSupermarkets(updatedList);
                    saveSupermarketsToCache(updatedList);
                  } catch {
                    Alert.alert('Error', 'Failed to update item.');
                  }
                  setEditingId(null);
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </Pressable>
              <Pressable
                style={[styles.addButton, { backgroundColor: '#e74c3c', width: 40, height: 40 }]}
                onPress={() => {
                  setEditText(item.name);
                  setEditQuantity(item.quantity ? String(item.quantity) : '');
                  setEditUnit(item.unit || '');
                  setEditPrice(item.price ? String(item.price) : '');
                  setEditNotes(item.notes || '');
                  setEditingId(null);
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              if (!item.completed) {
                setEditingId(item.id);
                setEditText(item.name);
                setEditQuantity(item.quantity ? String(item.quantity) : '');
                setEditUnit(item.unit || '');
                setEditPrice(item.price ? String(item.price) : '');
                setEditNotes(item.notes || '');
              }
            }}
            disabled={item.completed}
          >
            <Text style={[styles.itemText, item.completed && styles.completedText]}>{item.name}</Text>
            {item.quantity !== undefined && (
              <Text style={{ marginLeft: 12, marginRight: 8, color: '#888' }}>Qty: {item.quantity} {item.unit}</Text>
            )}
            {item.price !== undefined && (
              <Text style={{ marginLeft: 12, marginRight: 8, color: '#888' }}>Unit price: ${ (item.price / 100).toFixed(2) }</Text>
            )}
            {item.price !== undefined && (
              <Text style={{ marginLeft: 12, marginRight: 8, color: '#888' }}>Total price: ${ ((item.price * (item.quantity || 1)) / 100).toFixed(2) }</Text>
            )}
            {item.notes && (
              <Text style={{ marginLeft: 12, color: '#888', marginTop: 2 }}>Notes: {item.notes}</Text>
            )}
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm('Are you sure you want to delete this supermarket item?')) {
                deleteSupermarketItem(item.id);
              }
            } else {
              Alert.alert(
                'Delete Item',
                'Are you sure you want to delete this supermarket item?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteSupermarketItem(item.id) },
                ],
                { cancelable: true }
              );
            }
          }}
        >
          <Ionicons name="trash" size={20} color="#e74c3c" />
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={handleBackPress}>
            <Text style={styles.title}>Supermarket</Text>
          </Pressable>
        ) : (
          <Text style={styles.title}>Supermarket</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, Platform.OS === 'web' && { flex: 2, marginRight: 8 }]}
          placeholder="Add a new item..."
          value={newSupermarketText}
          onChangeText={setNewSupermarketText}
          onSubmitEditing={Platform.OS === 'web' ? handleAddSupermarket : undefined}
          onFocus={Platform.OS !== 'web' ? openNewItemModal : undefined}
          returnKeyType="done"
        />
        
        {Platform.OS === 'web' ? (
          <>
            <TextInput
              style={[styles.input, { width: 80, marginRight: 8 }]}
              placeholder="Qty"
              value={newQuantity}
              onChangeText={setNewQuantity}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { width: 80, marginRight: 8 }]}
              placeholder="Unit"
              value={newUnit}
              onChangeText={setNewUnit}
            />
            <TextInput
              style={[styles.input, { width: 100, marginRight: 8 }]}
              placeholder="Price"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Notes"
              value={newNotes}
              onChangeText={setNewNotes}
            />
            <Pressable 
              style={[styles.addButton, { marginLeft: 8 }]}
              onPress={handleAddItem}
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </>
        ) : (
          <Pressable 
            style={[styles.addButton, { marginLeft: 8 }]}
            onPress={openNewItemModal}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        )}
      </View>

      {/* New Item Modal for Mobile */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeNewItemModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <Pressable onPress={closeNewItemModal}>
                <Ionicons name="close" size={24} color="#FF8C42" />
              </Pressable>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter item name"
                  value={newSupermarketText}
                  onChangeText={setNewSupermarketText}
                  autoFocus
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="1"
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="pcs, kg, g, etc."
                    value={newUnit}
                    onChangeText={setNewUnit}
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Price (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  value={newPrice}
                  onChangeText={setNewPrice}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  placeholder="Additional notes"
                  value={newNotes}
                  onChangeText={setNewNotes}
                  multiline
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Pressable 
                style={[styles.button, styles.cancelButton]} 
                onPress={closeNewItemModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.button, styles.saveButton]} 
                onPress={handleAddItem}
              >
                <Text style={styles.saveButtonText}>Add Item</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <FlatList
        data={supermarkets}
        renderItem={renderSupermarket}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#FF8C42',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Existing styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    ...(Platform.OS === 'web' ? {
      height: 100,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    } : {
      paddingTop: 40,
      paddingBottom: 15,
      paddingHorizontal: 20,
    }),
    backgroundColor: '#FF8C42',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: Platform.OS === 'web' ? 48 : 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FF8C42',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  list: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    // Deprecated shadow* props replaced by boxShadow for web
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        }),
    elevation: 2,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#34495e',
    marginLeft: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
});
