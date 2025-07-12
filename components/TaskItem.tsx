import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const getCategoryConfig = (category: Task['category']) => {
    switch (category) {
      case 'priority':
        return { icon: 'flag', color: '#e74c3c', label: 'Priority' };
      case 'on':
        return { icon: 'play', color: '#3498db', label: 'On' };
      case 'off':
        return { icon: 'pause', color: '#95a5a6', label: 'Off' };
      default:
        return { icon: 'ellipse', color: '#95a5a6', label: 'Task' };
    }
  };

  const getColorConfig = (color: Task['color']) => {
    switch (color) {
      case 'green':
        return { backgroundColor: '#E8F5E8', borderColor: '#A8D5A8' };
      case 'pink':
        return { backgroundColor: '#FCE8F0', borderColor: '#F5B8D1' };
      case 'blue':
        return { backgroundColor: '#E8F2FC', borderColor: '#B8D5F5' };
      case 'brown':
        return { backgroundColor: '#F5F0E8', borderColor: '#D5C5B8' };
      default:
        return { backgroundColor: '#f8f9fa', borderColor: '#e9ecef' };
    }
  };

  const categoryConfig = getCategoryConfig(task.category);
  const colorConfig = getColorConfig(task.color);

  return (
    <View style={[
      styles.taskItem,
      { backgroundColor: colorConfig.backgroundColor, borderColor: colorConfig.borderColor }
    ]}>
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={() => onToggle(task.id)}
      >
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={task.completed ? '#4CAF50' : '#666'}
        />
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskText,
            task.completed && styles.completedTaskText,
          ]}
        >
          {task.text}
        </Text>
        
        {!task.completed && (
          <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color }]}>
            <Ionicons name={categoryConfig.icon as any} size={12} color="white" />
            <Text style={styles.categoryText}>{categoryConfig.label}</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(task.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCheckbox: {
    marginRight: 15,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 5,
  },
}); 