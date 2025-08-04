import React, { useState, useEffect } from 'react';
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
  ScrollView,
  RefreshControl, // <-- Add this import
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from './components/TaskItem';
import { TaskTypeModal } from './components/TaskTypeModal';
import { Task, FilterType, TaskCategory } from './types';
import { fetchTasks, createTask, updateTask, deleteTask as apiDeleteTask } from './api';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState<FilterType>('completed');
  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [pendingTaskText, setPendingTaskText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
    if (newTaskText.trim()) {
      setPendingTaskText(newTaskText.trim());
      setShowTaskTypeModal(true);
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
              <TouchableOpacity
                style={[
                  styles.categoryHeader,
                  category === 'off' && styles.offCategoryHeader
                ]}
                onPress={() => handleToggleCategoryVisibility(category)}
                activeOpacity={0.7}
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
              </TouchableOpacity>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Afazer</Text>
      </View>

      {/* Add Task Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Toggle Button */}
      <View style={styles.filterToggleContainer}>
        <TouchableOpacity
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
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {showFilter && (
        <View style={styles.filterContainer}>
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
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
            </TouchableOpacity>
            <TouchableOpacity
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
            </TouchableOpacity>
            <TouchableOpacity
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
            </TouchableOpacity>
            <TouchableOpacity
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
            </TouchableOpacity>
            <TouchableOpacity
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
            </TouchableOpacity>
          </View>
          

        </View>
      )}

      {/* Tasks List or All Categories View */}
      {!showFilter ? (
        renderAllCategoriesView()
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing} // <-- Add this line
          onRefresh={onRefresh}   // <-- Add this line
        />
      )}

      {/* Clear Completed Button */}
      {showFilter && filter === 'completed' && getFilterCount('completed') > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearCompleted}>
          <Text style={styles.clearButtonText}>Clear Completed</Text>
        </TouchableOpacity>
      )}

      {/* Task Type Modal */}
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
