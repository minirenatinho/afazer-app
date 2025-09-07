import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ItemItem } from '../components/ItemItem';
import { ItemTypeModal } from '../components/ItemTypeModal';
import { ColorSelectorModal } from '../components/ColorSelectorModal';
import { Item, FilterType, ItemColor } from '../types';
import { fetchItems, createItem, updateItem, deleteItem as apiDeleteItem } from '../api';

export default function AfazerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [filter, setFilter] = useState<FilterType>('completed');
  const [showItemTypeModal, setShowItemTypeModal] = useState(false);
  const [pendingItemText, setPendingItemText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Web-specific state for category and color selection
  const [selectedCategory, setSelectedCategory] = useState<string>('ON');
  const [selectedColor, setSelectedColor] = useState<string>('BLUE');
  // State to control visibility of each category column
  const [categoryVisibility, setCategoryVisibility] = useState({
    PRIORITY: true,
    ON: true,
    PAY: false,
    OFF: false,
  });

  // State for color modal
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorItemId, setColorItemId] = useState<string | null>(null);
  const [colorItemCurrent, setColorItemCurrent] = useState<ItemColor>('BLUE');
  // Handler to update color
  const handleUpdateColor = async (id: string, color: ItemColor) => {
    const item = items.find(t => t.id === id);
    if (!item) return;
    const updatedItem = { ...item, color };
    try {
      const apiItem = await updateItem(updatedItem);
      const updatedItems = items.map(t => t.id === id ? apiItem : t);
      setItems(updatedItems);
      saveItemsToCache(updatedItems);
    } catch (error) {
      Alert.alert('Error', 'Failed to update item color.');
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      // Try to fetch from API
      const apiItems = await fetchItems();
      const priorityItems = apiItems.filter(i => i.category === 'PRIORITY');
      setItems(apiItems);
      await AsyncStorage.setItem('items', JSON.stringify(apiItems));
    } catch (error) {
      // If API fails, load from cache
      console.error('Error fetching from API, loading from cache:', error);
      const storedItems = await AsyncStorage.getItem('items');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        const itemsWithColor = parsedItems.map((item: Item) => ({
          ...item,
          color: item.color || 'BLUE',
        }));
        setItems(itemsWithColor);
      }
    }
  };

  const saveItemsToCache = async (newItems: Item[]) => {
    try {
      await AsyncStorage.setItem('items', JSON.stringify(newItems));
    } catch (error) {
      console.error('Error saving items to cache:', error);
    }
  };

  const handleAddItem = () => {
    const text = newItemText.trim();
    if (text) {
      if (Platform.OS === 'web') {
        // On web, use the selected category and color directly
        const newItem = {
          text,
          completed: false,
          createdAt: Date.now(),
          category: selectedCategory,
          color: selectedColor,
          type: 'item',
        };
        
        (async () => {
          try {
            const created = await createItem(newItem);
            const updatedItems = [...items, created];
            setItems(updatedItems);
            saveItemsToCache(updatedItems);
            setNewItemText('');
          } catch (error) {
            Alert.alert('Error', 'Failed to create item.');
          }
        })();
      } else {
        // On mobile, show the type selection modal
        setPendingItemText(text);
        setShowItemTypeModal(true);
      }
    }
  };

  const handleItemTypeSelect = async (category: 'PRIORITY' | 'ON' | 'OFF' | 'PAY', color: 'GREEN' | 'PINK' | 'BLUE' | 'BROWN') => {
    const newItem = {
      text: pendingItemText,
      completed: false,
      createdAt: Date.now(),
      category,
      color,
      type: 'item',
    };
    try {
      const created = await createItem(newItem);
      const updatedItems = [...items, created];
      setItems(updatedItems);
      saveItemsToCache(updatedItems);
    } catch (error) {
      Alert.alert('Error', 'Failed to create item.');
    }
    setNewItemText('');
    setPendingItemText('');
    setShowItemTypeModal(false);
  };

  // Edit item text handler
  const handleUpdateText = async (id: string, newText: string) => {
    const item = items.find(t => t.id === id);
    if (!item) return;
    const updatedItem = { ...item, text: newText };
    try {
      const apiItem = await updateItem(updatedItem);
      const updatedItems = items.map(t => t.id === id ? apiItem : t);
      setItems(updatedItems);
      saveItemsToCache(updatedItems);
    } catch (error) {
      Alert.alert('Error', 'Failed to update item text.');
    }
  };

  const handleUpdateCategory = async (id: string, category: string) => {
    const item = items.find(t => t.id === id);
    if (!item) return;
    const updatedItem = { ...item, category };
    try {
      const apiItem = await updateItem(updatedItem);
      const updatedItems = items.map(t => t.id === id ? apiItem : t);
      setItems(updatedItems);
      saveItemsToCache(updatedItems);
    } catch (error) {
      Alert.alert('Error', 'Failed to update item category.');
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find(t => t.id === id);
    if (!item) return;
    const updatedItem = { ...item, completed: !item.completed };
    try {
      const apiItem = await updateItem(updatedItem);
      const updatedItems = items.map(t => t.id === id ? apiItem : t);
      setItems(updatedItems);
      saveItemsToCache(updatedItems);
    } catch (error) {
      Alert.alert('Error', 'Failed to update item.');
    }
  };

  const deleteItem = (id: string) => {
    const doDelete = async () => {
      try {
        await apiDeleteItem(id);
        const updatedItems = items.filter(item => item.id !== id);
        setItems(updatedItems);
        saveItemsToCache(updatedItems);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete item.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this item?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Item',
        'Are you sure you want to delete this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const clearCompleted = () => {
    const doClear = async () => {
      const completedItems = items.filter(item => item.completed);
      try {
        await Promise.all(completedItems.map(item => apiDeleteItem(item.id)));
        const updatedItems = items.filter(item => !item.completed);
        setItems(updatedItems);
        saveItemsToCache(updatedItems);
      } catch (error) {
        Alert.alert('Error', 'Failed to clear completed items.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear all completed items?')) {
        doClear();
      }
    } else {
      Alert.alert(
        'Clear Completed',
        'Are you sure you want to clear all completed items?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: doClear },
        ]
      );
    }
  };

  const filteredItems = items.filter(item => {
    if (!showFilter) {
      // When filter is hidden, show all non-completed items
      return !item.completed;
    }
    if (filter === 'completed') return item.completed;
    const result = !item.completed && item.category === filter;
    if (filter === 'PRIORITY' && result) {
    }
    return result;
  });

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'completed') {
      return items.filter(item => item.completed).length;
    }
    return items.filter(item => !item.completed && item.category === filterType).length;
  };

  // Pass isHistory=true if filter is 'completed' (history list)
  const renderItem = ({ item }: { item: Item }) => (
    <ItemItem
      item={item}
      onToggle={toggleItem}
      onDelete={deleteItem}
      onUpdateCategory={handleUpdateCategory}
      onUpdateText={handleUpdateText}
      onUpdateColor={() => {
        setColorItemId(item.id);
        setColorItemCurrent(item.color as ItemColor);
        setShowColorModal(true);
      }}
      isHistory={filter === 'completed'}
    />
  );

  const renderAllCategoriesView = () => {
    // Only use categories that are valid for visibility toggling
    const categories: Array<'PRIORITY' | 'ON' | 'PAY' | 'OFF'> = ['PRIORITY', 'ON', 'PAY', 'OFF'];
    const itemsByCategory = categories.map(category => {
      const filtered = items.filter(item => !item.completed && item.category === category);
      if (category === 'PRIORITY') {
      }
      return filtered;
    });

    // Calculate visible categories count for web layout
    const visibleCategories = Platform.OS === 'web' 
      ? categories.filter(cat => categoryVisibility[cat as 'PRIORITY' | 'ON' | 'OFF' | 'PAY']).length 
      : 1; // For mobile, we'll use full width
    const columnFlex = Platform.OS === 'web' ? 1 : 1;

    // Handler to toggle visibility of a category column
    const handleToggleCategoryVisibility = (category: FilterType) => {
      setCategoryVisibility(prev => ({
        ...prev,
        [category]: !prev[category as 'PRIORITY' | 'ON' | 'OFF' | 'PAY'],
      }));
    };

    // Web-specific header with all category toggles
    const renderWebHeader = () => (
      <View style={styles.webCategoriesHeader}>
        {categories.map((category, index) => {
          const isVisible = categoryVisibility[category as 'PRIORITY' | 'ON' | 'OFF' | 'PAY'];
          const iconName = category === 'PRIORITY' ? 'flag' : 
                         category === 'ON' ? 'play' : 
                         category === 'OFF' ? 'pause' : 'card';
          const iconColor = category === 'PRIORITY' ? '#e74c3c' : 
                          category === 'ON' ? '#3498db' : 
                          category === 'OFF' ? '#95a5a6' : '#f1c40f';
          
          return (
            <Pressable
              key={category}
              style={({ pressed }) => [
                styles.webCategoryHeaderItem,
                { 
                  borderBottomWidth: isVisible ? 2 : 1,
                  borderBottomColor: isVisible ? iconColor : '#e9ecef',
                  opacity: isVisible ? 1 : 0.5,
                  width: `${100 / categories.length}%`,
                  ...(pressed && { opacity: 0.7 })
                }
              ]}
              onPress={() => handleToggleCategoryVisibility(category)}
            >
              <Ionicons name={iconName} size={16} color={iconColor} />
              <Text style={[
                styles.webCategoryHeaderText,
                { color: iconColor }
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Text style={styles.webCategoryHeaderCount}>
                ({itemsByCategory[index].length})
              </Text>
              <Ionicons
                name={isVisible ? 'eye' : 'eye-off'}
                size={14}
                color="#7f8c8d"
                style={{ marginLeft: 4 }}
              />
            </Pressable>
          );
        })}
      </View>
    );

    // Render the main content
    return (
      <View style={styles.allCategoriesContainer}>
        {Platform.OS === 'web' && renderWebHeader()}
        <ScrollView
          style={styles.allCategoriesScrollView}
          contentContainerStyle={styles.allCategoriesContent}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF8C42"]}
            />
          }
        >
          <View style={styles.categoriesRow}>
            {categories.map((category, index) => {
              if (Platform.OS === 'web' && !categoryVisibility[category as 'PRIORITY' | 'ON' | 'OFF' | 'PAY']) {
                return null; // Skip rendering hidden categories on web
              }
              
              return (
                <View 
                  key={category} 
                  style={[
                    styles.categoryColumn,
                    { flex: columnFlex },
                    category === 'OFF' && styles.offCategoryColumn
                  ]}
                >
                                  {/* Category header for mobile */}
                  {Platform.OS !== 'web' && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.categoryHeader,
                        category === 'OFF' && styles.offCategoryHeader,
                        pressed && { backgroundColor: '#f8f9fa' }
                      ]}
                      onPress={() => handleToggleCategoryVisibility(category)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons
                          name={category === 'PRIORITY' ? 'flag' : category === 'ON' ? 'play' : category === 'OFF' ? 'pause' : 'card'}
                          size={20}
                          color={category === 'PRIORITY' ? '#e74c3c' : category === 'ON' ? '#3498db' : category === 'OFF' ? '#95a5a6' : '#f1c40f'}
                        />
                        <Text style={[
                          styles.categoryTitle,
                          category === 'OFF' && styles.offCategoryText,
                          { marginLeft: 12 }
                        ]}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                        <Text style={[
                          styles.categoryCount,
                          category === 'OFF' && styles.offCategoryText
                        ]}>
                          ({itemsByCategory[index].length})
                        </Text>
                      </View>
                      <Ionicons
                        name={categoryVisibility[category as 'PRIORITY' | 'ON' | 'OFF' | 'PAY'] ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#95a5a6"
                      />
                    </Pressable>
                  )}
                  
                  {/* Items list */}
                  <View style={[styles.categoryItemsContainer, { display: categoryVisibility[category as 'PRIORITY' | 'ON' | 'OFF' | 'PAY'] ? 'flex' : 'none' }]}>
                    {itemsByCategory[index].map(item => (
                      <ItemItem
                        key={item.id}
                        item={item}
                        onToggle={toggleItem}
                        onDelete={deleteItem}
                        onUpdateCategory={handleUpdateCategory}
                        onUpdateText={handleUpdateText}
                        onUpdateColor={() => {
                          setColorItemId(item.id);
                          setColorItemCurrent(item.color as ItemColor);
                          setShowColorModal(true);
                        }}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Add onRefresh handler for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const renderItemInput = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, { flex: 2, marginRight: 8 }]}
        placeholder="Add a new item..."
        value={newItemText}
        onChangeText={setNewItemText}
        onSubmitEditing={handleAddItem}
        returnKeyType="done"
      />
      
      {Platform.OS === 'web' ? (
        <View style={styles.webControlsContainer}>
          {/* Category Selection */}
          <View style={styles.selectionGroup}>
            <Text style={styles.selectionLabel}>Category:</Text>
            <View style={styles.checkboxGroup}>
              {['PRIORITY', 'ON', 'PAY', 'OFF'].map((category) => {
                const isSelected = selectedCategory === category;
                const iconName = 
                  category === 'PRIORITY' ? 'flag' : 
                  category === 'ON' ? 'play' : 
                  category === 'PAY' ? 'card' : 'pause';
                const iconColor = 
                  isSelected ? 'white' :
                  category === 'PRIORITY' ? '#e74c3c' :
                  category === 'ON' ? '#3498db' :
                  category === 'PAY' ? '#f1c40f' : '#95a5a6';
                
                return (
                  <Pressable
                    key={category}
                    style={({ pressed }) => ({
                      ...styles.categoryOption,
                      ...(isSelected ? styles[`${category}Selected` as keyof typeof styles] : {}),
                      ...(pressed ? { opacity: 0.8, transform: [{ scale: 0.95 }] } : {}),
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.1)',
                      boxShadow: isSelected ? `0 2px 4px ${iconColor}4D` : 'none',
                      elevation: isSelected ? 3 : 0,
                    })}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Ionicons 
                      name={iconName}
                      size={16} 
                      color={iconColor}
                      style={{
                        opacity: isSelected ? 1 : 0.8,
                        transform: [{ scale: isSelected ? 1.2 : 1 }]
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
          
          {/* Color Selection */}
          <View style={styles.selectionGroup}>
            <Text style={styles.selectionLabel}>Color:</Text>
            <View style={styles.checkboxGroup}>
              {[
                { id: 'BLUE', color: '#3498db' },
                { id: 'GREEN', color: '#2ecc71' },
                { id: 'PINK', color: '#e84393' },
                { id: 'BROWN', color: '#8B4513' }
              ].map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => ({
                    ...styles.colorOption,
                    backgroundColor: selectedColor === item.id ? item.color : `${item.color}33`,
                    ...(selectedColor === item.id ? styles[`${item.id}ColorSelected` as keyof typeof styles] : {}),
                    ...(pressed ? { opacity: 0.7 } : {}),
                  })}
                  onPress={() => setSelectedColor(item.id as 'GREEN' | 'PINK' | 'BLUE' | 'BROWN')}
                >
                  {selectedColor === item.id && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}
      
      <Pressable 
        style={[styles.addButton, { marginLeft: 8 }]} 
        onPress={handleAddItem}
      >
        <Ionicons name="add" size={24} color="white" />
      </Pressable>
    </View>
  );

  const renderPage = () => {
    return (
      <>
        {renderItemInput()}
        <View style={styles.filterToggleContainer}>
          <Pressable
            style={styles.filterToggleButton}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Ionicons 
              name={showFilter ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#FF8C42" 
            />
            <Text style={styles.filterToggleText}>
              {showFilter ? 'Show All Categories' : 'Show History'}
            </Text>
          </Pressable>
        </View>
        {showFilter ? (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={styles.itemList}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : (
          renderAllCategoriesView()
        )}
        {showFilter && filter === 'completed' && getFilterCount('completed') > 0 && (
          <Pressable style={styles.clearButton} onPress={clearCompleted}>
            <Text style={styles.clearButtonText}>Clear Completed</Text>
          </Pressable>
        )}
      </>
    );
  };

  return (
    <>
    {renderPage()}
    <ItemTypeModal
          visible={showItemTypeModal}
          onClose={() => {
            setShowItemTypeModal(false);
            setPendingItemText('');
          }}
          onSelectType={handleItemTypeSelect}
        />
    <ColorSelectorModal
      visible={showColorModal}
      onClose={() => setShowColorModal(false)}
      onSelectColor={(color) => {
        if (colorItemId) handleUpdateColor(colorItemId, color);
        setShowColorModal(false);
      }}
      currentColor={colorItemCurrent}
    />
    </>);
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
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...(Platform.OS === 'web' ? {
      alignItems: 'center',
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 20,
      height: 82, // Match height with other pages
    } : {}),
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
    ...(Platform.OS === 'web' ? {
      height: 50, // Ensure consistent height on web
    } : {}),
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
  // Web Controls
  webControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    margin: 0,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  selectionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    gap: 8,
  },
  selectionLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 8,
  },
  checkboxGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  // Category selected states
  PRIORITYSelected: {
    backgroundColor: '#e74c3c',
    transform: [{ scale: 1.1 }],
  },
  ONSelected: {
    backgroundColor: '#3498db',
    transform: [{ scale: 1.1 }],
  },
  PAYSelected: {
    backgroundColor: '#f1c40f',
    transform: [{ scale: 1.1 }],
  },
  OFFSelected: {
    backgroundColor: '#95a5a6',
    transform: [{ scale: 1.1 }],
  },
  // Color selected states
  blueColorSelected: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  greenColorSelected: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  pinkColorSelected: {
    backgroundColor: '#e84393',
    borderColor: '#fd79a8',
  },
  brownColorSelected: {
    backgroundColor: '#8B4513',
    borderColor: '#654321',
  },
  filterToggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignSelf: 'center',
  },
  filterToggleText: {
    color: '#FF8C42',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#FF8C42',
  },
  filterText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    marginLeft: 4,
  },
  activeFilterText: {
    color: 'white',
  },
  filterIcon: {
    marginRight: 4,
  },
  itemList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  allCategoriesContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  allCategoriesScrollView: {
    flex: 1,
  },
  allCategoriesContent: {
    paddingBottom: 20,
    ...(Platform.OS === 'web' ? { minHeight: '100%' } : {}),
  },
  // Categories header - different styles for web and mobile
  webCategoriesHeader: {
    display: 'flex',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: Platform.OS === 'web' ? 10 : 0,
  },
  webCategoryHeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: Platform.OS === 'web' ? 'center' : 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Platform.OS === 'web' ? 8 : 20,
    marginHorizontal: Platform.OS === 'web' ? 2 : 0,
    borderBottomWidth: Platform.OS === 'web' ? 0 : 1,
    borderBottomColor: '#e9ecef',
  },
  webCategoryHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  webCategoryHeaderCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  categoriesRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'stretch',
    flex: 1,
  },
  categoryColumn: {
    ...(Platform.OS === 'web' 
      ? { 
          height: '100%',
          paddingHorizontal: 8,
        } 
      : {
          width: '100%',
          marginBottom: 0,
          paddingHorizontal: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e9ecef',
        }
    ),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryItemsContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 10 : 12,
  },
  categoryTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 24,
    fontWeight: '900',
    color: '#34495e',
    marginLeft: 8,
  },
  categoryCount: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#7f8c8d',
    marginLeft: 5,
  },
  clearButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  offCategoryColumn: {
    opacity: 0.7,  // Make the entire column more transparent
  },
  offCategoryHeader: {
    opacity: 0.7,  // Make the header match the column transparency
  },
  offCategoryText: {
    color: '#95a5a6',  // Use a lighter gray for the text
  },
});
