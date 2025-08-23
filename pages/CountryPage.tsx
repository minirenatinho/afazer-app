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
import { fetchCountries, createCountry, updateCountry, deleteCountry } from '../api';

export interface Country {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  category: string;
  color: string;
  type: string;
  dynamics?: {
    capital?: string;
    population?: number;
    language?: string;
    notes?: string;
  };
  capital?: string;
  population?: number;
  language?: string;
  notes?: string;
}

type CountryPageProps = {
  onBack?: () => void;
};

export default function CountryPage({ onBack }: CountryPageProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [newCountryText, setNewCountryText] = useState('');
  const [newPopulation, setNewPopulation] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const backPressRef = useRef(false);

  // Load countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const apiCountries = await fetchCountries();
      setCountries(apiCountries);
      await AsyncStorage.setItem('countries', JSON.stringify(apiCountries));
    } catch (error) {
      const stored = await AsyncStorage.getItem('countries');
      if (stored) setCountries(JSON.parse(stored));
    }
  };

  const handleAddCountry = async () => {
    if (!newCountryText.trim()) return;
    const newCountry = {
      text: newCountryText.trim(),
      completed: false,
      createdAt: Date.now(),
      type: 'country',
      category: 'COUNTRY',
      color: 'GREEN',
      dynamics: {
        population: newPopulation ? Number(newPopulation) : undefined,
        language: newLanguage || undefined,
        notes: newNotes || undefined,
      },
    };
    try {
      const created = await createCountry(newCountry);
      setCountries([...countries, created]);
      setNewCountryText('');
      setNewPopulation('');
      setNewLanguage('');
      setNewNotes('');
      setShowItemModal(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create country');
    }
  };

  const toggleCountry = async (id: string) => {
    const country = countries.find(c => c.id === id);
    if (!country) return;
    const updated = { ...country, completed: !country.completed };
    try {
      const updatedCountry = await updateCountry(updated);
      setCountries(countries.map(c => c.id === id ? updatedCountry : c));
    } catch {
      Alert.alert('Error', 'Failed to update country');
    }
  };

  const deleteCountryItem = async (id: string) => {
    try {
      await deleteCountry(id);
      setCountries(countries.filter(c => c.id !== id));
    } catch {
      Alert.alert('Error', 'Failed to delete country');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCountries();
    setRefreshing(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, Platform.OS === 'web' && { flex: 2, marginRight: 8 }]}
          placeholder="Add a new country..."
          value={newCountryText}
          onChangeText={setNewCountryText}
          onSubmitEditing={Platform.OS === 'web' ? handleAddCountry : undefined}
          onFocus={Platform.OS !== 'web' ? () => setShowItemModal(true) : undefined}
          returnKeyType="done"
        />
        
        {Platform.OS === 'web' ? (
          <>
            <Pressable style={styles.addButton} onPress={handleAddCountry}>
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.addButton} onPress={() => setShowItemModal(true)}>
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={countries}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Pressable onPress={() => toggleCountry(item.id)}>
              <Ionicons
                name={item.completed ? 'checkbox' : 'square-outline'}
                size={24}
                color={item.completed ? '#4CAF50' : '#ccc'}
              />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.itemText, item.completed && styles.completedText]}>{item.text}</Text>
              {item.dynamics?.capital && (
                <Text style={styles.detailText}>Capital: {item.dynamics.capital}</Text>
              )}
              {item.dynamics?.population && (
                <Text style={styles.detailText}>Population: {item.dynamics.population.toLocaleString()}</Text>
              )}
              {item.dynamics?.language && (
                <Text style={styles.detailText}>Language: {item.dynamics.language}</Text>
              )}
              {item.dynamics?.notes && (
                <Text style={[styles.detailText, { color: '#666', marginTop: 4 }]}>
                  {item.dynamics.notes}
                </Text>
              )}
            </View>
            <Pressable onPress={() => deleteCountryItem(item.id)}>
              <Ionicons name="trash" size={20} color="#e74c3c" />
            </Pressable>
          </View>
        )}
        keyExtractor={item => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
});
