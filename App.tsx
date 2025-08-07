import React, { useState, useEffect } from 'react';
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
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from './components/TaskItem';
import { TaskTypeModal } from './components/TaskTypeModal';
import { Task, FilterType, TaskCategory } from './types';
import { fetchTasks, createTask, updateTask, deleteTask as apiDeleteTask } from './api';
import SupermarketPage from './SupermarketPage';

export default function App() {
  const [page, setPage] = useState<'afazer' | 'supermarket'>('afazer');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState<FilterType>('completed');
  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [pendingTaskText, setPendingTaskText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Web-specific state for category and color selection
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('on');
  const [selectedColor, setSelectedColor] = useState<'green' | 'pink' | 'blue' | 'brown'>('blue');
  // State to control visibility of each category column
  const [categoryVisibility, setCategoryVisibility] = useState({
    priority: true,
    on: true,
    pay: true,
    off: false, // 'off' column hidden by default
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      // Try to fetch from API
      const apiTasks = await fetchTasks();
      setTasks(apiTasks);
      await AsyncStorage.setItem('tasks', JSON.stringify(apiTasks));
    } catch (error) {
      // If API fails, load from cache
      console.error('Error fetching from API, loading from cache:', error);
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        const tasksWithColor = parsedTasks.map((task: Task) => ({
          ...task,
          color: task.color || 'blue',
        }));
        setTasks(tasksWithColor);
      }
    }
  };

  const saveTasksToCache = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving tasks to cache:', error);
    }
  };

  const handleAddTask = () => {
    const text = newTaskText.trim();
    if (text) {
      if (Platform.OS === 'web') {
        // On web, use the selected category and color directly
        const newTask = {
          text,
          completed: false,
          createdAt: Date.now(),
          category: selectedCategory,
          color: selectedColor,
        };
        
        (async () => {
          try {
            const created = await createTask(newTask);
            const updatedTasks = [...tasks, created];
            setTasks(updatedTasks);
            saveTasksToCache(updatedTasks);
            setNewTaskText('');
          } catch (error) {
            Alert.alert('Error', 'Failed to create task.');
          }
        })();
      } else {
        // On mobile, show the type selection modal
        setPendingTaskText(text);
        setShowTaskTypeModal(true);
      }
    }
  };

  const handleTaskTypeSelect = async (category: 'priority' | 'on' | 'off' | 'pay', color: 'green' | 'pink' | 'blue' | 'brown') => {
    const newTask = {
      text: pendingTaskText,
      completed: false,
      createdAt: Date.now(),
      category,
      color,
    };
    try {
      const created = await createTask(newTask);
      const updatedTasks = [...tasks, created];
      setTasks(updatedTasks);
      saveTasksToCache(updatedTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to create task.');
    }
    setNewTaskText('');
    setPendingTaskText('');
    setShowTaskTypeModal(false);
  };

  // Edit task text handler
  const handleUpdateText = async (id: string, newText: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, text: newText };
    try {
      const apiTask = await updateTask(updatedTask);
      const updatedTasks = tasks.map(t => t.id === id ? apiTask : t);
      setTasks(updatedTasks);
      saveTasksToCache(updatedTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task text.');
    }
  };

  const handleUpdateCategory = async (id: string, category: TaskCategory) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, category };
    try {
      const apiTask = await updateTask(updatedTask);
      const updatedTasks = tasks.map(t => t.id === id ? apiTask : t);
      setTasks(updatedTasks);
      saveTasksToCache(updatedTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task category.');
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    try {
      const apiTask = await updateTask(updatedTask);
      const updatedTasks = tasks.map(t => t.id === id ? apiTask : t);
      setTasks(updatedTasks);
      saveTasksToCache(updatedTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  const deleteTask = (id: string) => {
    const doDelete = async () => {
      try {
        await apiDeleteTask(id);
        const updatedTasks = tasks.filter(task => task.id !== id);
        setTasks(updatedTasks);
        saveTasksToCache(updatedTasks);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete task.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this task?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const clearCompleted = () => {
    const doClear = async () => {
      const completedTasks = tasks.filter(task => task.completed);
      try {
        await Promise.all(completedTasks.map(task => apiDeleteTask(task.id)));
        const updatedTasks = tasks.filter(task => !task.completed);
        setTasks(updatedTasks);
        saveTasksToCache(updatedTasks);
      } catch (error) {
        Alert.alert('Error', 'Failed to clear completed tasks.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear all completed tasks?')) {
        doClear();
      }
    } else {
      Alert.alert(
        'Clear Completed',
        'Are you sure you want to clear all completed tasks?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: doClear },
        ]
      );
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!showFilter) {
      // When filter is hidden, show all non-completed tasks
      return !task.completed;
    }
    if (filter === 'completed') return task.completed;
    return !task.completed && task.category === filter;
  });

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'completed') {
      return tasks.filter(task => task.completed).length;
    }
    return tasks.filter(task => !task.completed && task.category === filterType).length;
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      onToggle={toggleTask}
      onDelete={deleteTask}
      onUpdateCategory={handleUpdateCategory}
      onUpdateText={handleUpdateText}
    />
  );

  const renderAllCategoriesView = () => {
    // Only use categories that are valid for visibility toggling
    const categories: Array<'priority' | 'on' | 'pay' | 'off'> = ['priority', 'on', 'pay', 'off']; // 'off' last
    const tasksByCategory = categories.map(category =>
      tasks.filter(task => !task.completed && task.category === category)
    );

    // Handler to toggle visibility of a category column
    const handleToggleCategoryVisibility = (category: FilterType) => {
      setCategoryVisibility(prev => ({
        ...prev,
        [category]: !prev[category as 'priority' | 'on' | 'off' | 'pay'],
      }));
    };

    return (
      <ScrollView
        style={styles.allCategoriesContainer}
        contentContainerStyle={styles.allCategoriesContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF8C42"]}
          />
        }
      >
        <View style={styles.categoriesRow}>
          {categories.map((category, index) => (
            <View key={category} style={[
              styles.categoryColumn,
              category === 'off' && styles.offCategoryColumn
            ]}>
              {/* Touchable title to toggle visibility */}
              <Pressable
                style={({ pressed }) => [
                  styles.categoryHeader,
                  category === 'off' && styles.offCategoryHeader,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => handleToggleCategoryVisibility(category)}
              >
                <Ionicons
                  name={category === 'priority' ? 'flag' : category === 'on' ? 'play' : category === 'off' ? 'pause' : 'card'}
                  size={16}
                  color={category === 'priority' ? '#e74c3c' : category === 'on' ? '#3498db' : category === 'off' ? '#95a5a6' : '#f1c40f'}
                />
                <Text style={[
                  styles.categoryTitle,
                  category === 'off' && styles.offCategoryText
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={[
                  styles.categoryCount,
                  category === 'off' && styles.offCategoryText
                ]}>
                  ({tasksByCategory[index].length})
                </Text>
                <Ionicons
                  name={categoryVisibility[category as 'priority' | 'on' | 'off' | 'pay'] ? 'eye' : 'eye-off'}
                  size={16}
                  color="#FF8C42"
                  style={{ marginLeft: 8 }}
                />
              </Pressable>
              {/* Only show tasks if visible */}
              {categoryVisibility[category as 'priority' | 'on' | 'off' | 'pay'] && (
                <View style={styles.categoryTasksContainer}>
                  {tasksByCategory[index].map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onUpdateCategory={handleUpdateCategory}
                      onUpdateText={handleUpdateText}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Add onRefresh handler for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  if (page === 'supermarket') {
    return <SupermarketPage onBack={() => setPage('afazer')} />;
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => setPage('supermarket')}>
          <Text style={styles.title}>Afazer</Text>
        </Pressable>
      </View>
      {/* Add Task Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { flex: 2, marginRight: 8 }]}
          placeholder="Add a new task..."
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
        />
        
        {Platform.OS === 'web' ? (
          <View style={styles.webControlsContainer}>
            {/* Category Selection */}
            <View style={styles.selectionGroup}>
              <Text style={styles.selectionLabel}>Category:</Text>
              <View style={styles.checkboxGroup}>
                {['priority', 'on', 'pay', 'off'].map((category) => (
                  <Pressable
                    key={category}
                    style={({ pressed }) => ({
                      ...styles.categoryOption,
                      ...(selectedCategory === category ? styles[`${category}Selected` as keyof typeof styles] : {}),
                      ...(pressed ? { opacity: 0.7 } : {}),
                    })}
                    onPress={() => setSelectedCategory(category as TaskCategory)}
                  >
                    <Ionicons 
                      name={
                        category === 'priority' ? 'flag' : 
                        category === 'on' ? 'play' : 
                        category === 'pay' ? 'card' : 'pause'
                      } 
                      size={16} 
                      color={
                        selectedCategory === category ? 'white' : 
                        category === 'priority' ? '#e74c3c' :
                        category === 'on' ? '#3498db' :
                        category === 'pay' ? '#f1c40f' : '#95a5a6'
                      } 
                    />
                  </Pressable>
                ))}
              </View>
            </View>
            
            {/* Color Selection */}
            <View style={styles.selectionGroup}>
              <Text style={styles.selectionLabel}>Color:</Text>
              <View style={styles.checkboxGroup}>
                {[
                  { id: 'blue', color: '#3498db' },
                  { id: 'green', color: '#2ecc71' },
                  { id: 'pink', color: '#e84393' },
                  { id: 'brown', color: '#8B4513' }
                ].map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => ({
                      ...styles.colorOption,
                      backgroundColor: selectedColor === item.id ? item.color : `${item.color}33`,
                      ...(selectedColor === item.id ? styles[`${item.id}ColorSelected` as keyof typeof styles] : {}),
                      ...(pressed ? { opacity: 0.7 } : {}),
                    })}
                    onPress={() => setSelectedColor(item.id as 'green' | 'pink' | 'blue' | 'brown')}
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
          onPress={handleAddTask}
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>
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
            {showFilter ? 'Show All Categories' : 'Show Filtered'}
          </Text>
        </Pressable>
      </View>
      {showFilter && (
        <View style={styles.filterContainer}>
          <View style={styles.filterTabsRow}>
            <Pressable
              style={[styles.filterTab, filter === 'priority' && styles.activeFilterTab]}
              onPress={() => setFilter('priority')}
            >
              <Ionicons 
                name="flag" 
                size={16} 
                color={filter === 'priority' ? 'white' : '#e74c3c'} 
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, filter === 'priority' && styles.activeFilterText]}>
                Priority ({getFilterCount('priority')})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'on' && styles.activeFilterTab]}
              onPress={() => setFilter('on')}
            >
              <Ionicons 
                name="play" 
                size={16} 
                color={filter === 'on' ? 'white' : '#3498db'} 
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, filter === 'on' && styles.activeFilterText]}>
                On ({getFilterCount('on')})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'pay' && styles.activeFilterTab]}
              onPress={() => setFilter('pay')}
            >
              <Ionicons 
                name="card" 
                size={16} 
                color={filter === 'pay' ? 'white' : '#f1c40f'} 
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, filter === 'pay' && styles.activeFilterText]}>
                Pay ({getFilterCount('pay')})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'off' && styles.activeFilterTab]}
              onPress={() => setFilter('off')}
            >
              <Ionicons 
                name="pause" 
                size={16} 
                color={filter === 'off' ? 'white' : '#95a5a6'} 
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, filter === 'off' && styles.activeFilterText]}>
                Off ({getFilterCount('off')})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'completed' && styles.activeFilterTab]}
              onPress={() => setFilter('completed')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={filter === 'completed' ? 'white' : '#4CAF50'} 
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
                Done ({getFilterCount('completed')})
              </Text>
            </Pressable>
          </View>
        </View>
      )}
      {!showFilter ? (
        renderAllCategoriesView()
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
      {showFilter && filter === 'completed' && getFilterCount('completed') > 0 && (
        <Pressable style={styles.clearButton} onPress={clearCompleted}>
          <Text style={styles.clearButtonText}>Clear Completed</Text>
        </Pressable>
      )}
      <TaskTypeModal
        visible={showTaskTypeModal}
        onClose={() => {
          setShowTaskTypeModal(false);
          setPendingTaskText('');
        }}
        onSelectType={handleTaskTypeSelect}
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
  // Web Controls
  webControlsContainer: {
    flex: 1,
    flexDirection: 'column',
    marginRight: 8,
  },
  selectionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectionLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 8,
    minWidth: 60,
  },
  checkboxGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  // Category selected states
  prioritySelected: {
    backgroundColor: '#e74c3c',
  },
  onSelected: {
    backgroundColor: '#3498db',
  },
  paySelected: {
    backgroundColor: '#f1c40f',
  },
  offSelected: {
    backgroundColor: '#95a5a6',
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
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  allCategoriesContainer: {
    flex: 1,
  },
  allCategoriesContent: {
    paddingBottom: 20,
  },
  categoriesRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  categoryColumn: {
    flex: Platform.OS === 'web' ? 1 : undefined,
    marginHorizontal: Platform.OS === 'web' ? 5 : 0,
    marginBottom: Platform.OS === 'web' ? 0 : 20,
    minHeight: Platform.OS === 'web' ? undefined : 'auto',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: Platform.OS === 'web' ? 10 : 20,
  },
  categoryTasksContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 10 : 20,
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
