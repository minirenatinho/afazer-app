import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  RefreshControl,
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
}

type SupermarketPageProps = {
  onBack?: () => void;
};

export default function SupermarketPage({ onBack }: SupermarketPageProps) {
  const backPressRef = useRef(false);

  const handleBackPress = () => {
    if (backPressRef.current) return;
    backPressRef.current = true;
    if (onBack) onBack();
    setTimeout(() => {
      backPressRef.current = false;
    }, 1000); // 1 second debounce
  };
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [newSupermarketText, setNewSupermarketText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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
        <TouchableOpacity onPress={() => toggleSupermarket(item.id)}>
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={24}
            color={item.completed ? '#4CAF50' : '#ccc'}
          />
        </TouchableOpacity>
        {isEditing ? (
          <View style={{ flex: 1, flexDirection: 'column', marginLeft: 12, pointerEvents: 'box-none' }}>
            <TextInput
              style={[styles.itemText, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8 }]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              onSubmitEditing={async () => {
                if (editText.trim() && editText !== item.name) {
                  try {
                    const updated = { ...item, name: editText.trim() };
                    const apiItem = await updateSupermarket(updated);
                    const updatedList = supermarkets.map(s => s.id === item.id ? apiItem : s);
                    setSupermarkets(updatedList);
                    saveSupermarketsToCache(updatedList);
                  } catch {
                    Alert.alert('Error', 'Failed to update item.');
                  }
                }
                setEditingId(null);
              }}
              returnKeyType="done"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#4CAF50', width: 40, height: 40 }]}
                onPress={async () => {
                  if (editText.trim() && editText !== item.name) {
                    try {
                      const updated = { ...item, name: editText.trim() };
                      const apiItem = await updateSupermarket(updated);
                      const updatedList = supermarkets.map(s => s.id === item.id ? apiItem : s);
                      setSupermarkets(updatedList);
                      saveSupermarketsToCache(updatedList);
                    } catch {
                      Alert.alert('Error', 'Failed to update item.');
                    }
                  }
                  setEditingId(null);
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#e74c3c', width: 40, height: 40 }]}
                onPress={() => {
                  setEditText(item.name);
                  setEditingId(null);
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              if (!item.completed) {
                setEditingId(item.id);
                setEditText(item.name);
              }
            }}
            disabled={item.completed}
          >
            <Text style={[styles.itemText, item.completed && styles.completedText]}>{item.name}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
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
        </TouchableOpacity>
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
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={styles.title}>Supermarket</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.title}>Supermarket</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new item..."
          value={newSupermarketText}
          onChangeText={setNewSupermarketText}
          onSubmitEditing={handleAddSupermarket}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddSupermarket}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
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
