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
  return (
    <View style={styles.taskItem}>
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
      <Text
        style={[
          styles.taskText,
          task.completed && styles.completedTaskText,
        ]}
      >
        {task.text}
      </Text>
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
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
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
  taskText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
  },
  deleteButton: {
    padding: 5,
  },
}); 