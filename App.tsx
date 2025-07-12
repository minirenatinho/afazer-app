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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from './components/TaskItem';
import { TaskTypeModal } from './components/TaskTypeModal';
import { Task, FilterType } from './types';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState<FilterType>('completed');
  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [pendingTaskText, setPendingTaskText] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        // Add default color for existing tasks that don't have a color property
        const tasksWithColor = parsedTasks.map((task: Task) => ({
          ...task,
          color: task.color || 'blue', // Default to blue for existing tasks
        }));
        setTasks(tasksWithColor);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      setPendingTaskText(newTaskText.trim());
      setShowTaskTypeModal(true);
    }
  };

  const handleTaskTypeSelect = (category: 'priority' | 'on' | 'off', color: 'green' | 'pink' | 'blue' | 'brown') => {
    const newTask: Task = {
      id: Date.now().toString(),
      text: pendingTaskText,
      completed: false,
      createdAt: Date.now(),
      category,
      color,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTaskText('');
    setPendingTaskText('');
    setShowTaskTypeModal(false);
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
    if (Platform.OS === 'web') {
      // For web, use browser's confirm dialog
      if (window.confirm('Are you sure you want to delete this task?')) {
        const updatedTasks = tasks.filter(task => task.id !== id);
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
      }
    } else {
      // For mobile, use React Native Alert
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              const updatedTasks = tasks.filter(task => task.id !== id);
              setTasks(updatedTasks);
              saveTasks(updatedTasks);
            },
          },
        ]
      );
    }
  };

  const clearCompleted = () => {
    if (Platform.OS === 'web') {
      // For web, use browser's confirm dialog
      if (window.confirm('Are you sure you want to clear all completed tasks?')) {
        const updatedTasks = tasks.filter(task => !task.completed);
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
      }
    } else {
      // For mobile, use React Native Alert
      Alert.alert(
        'Clear Completed',
        'Are you sure you want to clear all completed tasks?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              const updatedTasks = tasks.filter(task => !task.completed);
              setTasks(updatedTasks);
              saveTasks(updatedTasks);
            },
          },
        ]
      );
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (showAllCategories) {
      // When showing all categories, only filter out completed tasks
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
    />
  );

  const renderAllCategoriesView = () => {
    const categories: FilterType[] = ['priority', 'on', 'off'];
    const tasksByCategory = categories.map(category => 
      tasks.filter(task => !task.completed && task.category === category)
    );

    return (
      <ScrollView style={styles.allCategoriesContainer} contentContainerStyle={styles.allCategoriesContent}>
        <View style={styles.categoriesRow}>
          {categories.map((category, index) => (
            <View key={category} style={styles.categoryColumn}>
              <View style={styles.categoryHeader}>
                <Ionicons 
                  name={category === 'priority' ? 'flag' : category === 'on' ? 'play' : 'pause'} 
                  size={16} 
                  color={category === 'priority' ? '#e74c3c' : category === 'on' ? '#3498db' : '#95a5a6'} 
                />
                <Text style={styles.categoryTitle}>
                  {category === 'priority' ? 'Priority' : category === 'on' ? 'On' : 'Off'}
                </Text>
                <Text style={styles.categoryCount}>({tasksByCategory[index].length})</Text>
              </View>
              <View style={styles.categoryTasksContainer}>
                {tasksByCategory[index].map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
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

      {/* Filter Tabs */}
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
        
        {/* Show All Button */}
        <TouchableOpacity
          style={[styles.showAllButton, showAllCategories && styles.showAllButtonActive]}
          onPress={() => setShowAllCategories(!showAllCategories)}
        >
          <Ionicons 
            name="grid" 
            size={16} 
            color={showAllCategories ? 'white' : '#FF8C42'} 
          />
          <Text style={[styles.showAllText, showAllCategories && styles.showAllTextActive]}>
            {showAllCategories ? 'Show Filtered' : 'Show All Categories'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List or All Categories View */}
      {showAllCategories ? (
        renderAllCategoriesView()
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Clear Completed Button */}
      {getFilterCount('completed') > 0 && (
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
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
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#FF8C42',
    alignSelf: 'center',
    minWidth: 140,
  },
  showAllButtonActive: {
    backgroundColor: '#e74c3c',
  },
  showAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  showAllTextActive: {
    color: 'white',
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
    fontSize: Platform.OS === 'web' ? 14 : 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginLeft: 5,
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
});
