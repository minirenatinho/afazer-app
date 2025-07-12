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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from './components/TaskItem';
import { Task, FilterType } from './types';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
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

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        createdAt: Date.now(),
      };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      setNewTaskText('');
    }
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
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
  };

  const clearCompleted = () => {
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
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;
  const activeCount = tasks.filter(task => !task.completed).length;

  const renderTask = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      onToggle={toggleTask}
      onDelete={deleteTask}
    />
  );

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
          onSubmitEditing={addTask}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({tasks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.activeFilterTab]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.activeFilterTab]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
      />

      {/* Clear Completed Button */}
      {completedCount > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearCompleted}>
          <Text style={styles.clearButtonText}>Clear Completed</Text>
        </TouchableOpacity>
      )}
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeFilterTab: {
    backgroundColor: '#FF8C42',
  },
  filterText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
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
