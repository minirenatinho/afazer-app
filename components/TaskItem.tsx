import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';
import { CategorySelectorModal } from './CategorySelectorModal';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => Promise<void>;
  onUpdateText: (id: string, newText: string) => Promise<void>;
  onUpdateColor: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task,
  onToggle,
  onDelete,
  onUpdateCategory,
  onUpdateText,
  onUpdateColor,
}) => {
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  // Reset editText if task.text changes (e.g. after update)
  React.useEffect(() => {
    setEditText(task.text);
  }, [task.text]);
  const getCategoryConfig = (category: Task['category']) => {
    switch (category) {
      case 'PRIORITY':
        return { icon: 'flag', color: '#e74c3c', label: 'Priority' };
      case 'ON':
        return { icon: 'play', color: '#3498db', label: 'On' };
      case 'OFF':
        return { icon: 'pause', color: '#95a5a680', label: 'Off' };
      case 'PAY':
        return { icon: 'card', color: '#f1c40f', label: 'Pay' };
      default:
        return { icon: 'ellipse', color: '#95a5a6', label: 'Task' };
    }
  };

  const getColorConfig = (color: Task['color']) => {
    switch (color) {
      case 'GREEN':
        return { backgroundColor: '#E8F5E8', borderColor: '#A8D5A8' };
      case 'PINK':
        return { backgroundColor: '#FCE8F0', borderColor: '#F5B8D1' };
      case 'BLUE':
        return { backgroundColor: '#E8F2FC', borderColor: '#B8D5F5' };
      case 'BROWN':
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
      task.category === 'PRIORITY' && styles.priorityTaskItem,
      {
        backgroundColor: colorConfig.backgroundColor,
        borderColor: task.category === 'PRIORITY' ? '#e74c3c' : colorConfig.borderColor,
      },
    ]}>
      <Pressable
        style={[styles.taskCheckbox, { opacity: task.completed ? 0.7 : 1 }]}
        onPress={() => onToggle(task.id)}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        hitSlop={10}
        pressRetentionOffset={10}
      >
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={task.completed ? '#4CAF50' : '#666'}
        />
      </Pressable>

      <View style={styles.taskContent}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[
                styles.taskText,
                task.category === 'PRIORITY' && styles.priorityTaskText,
                task.completed && styles.completedTaskText,
                { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8 },
              ]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              enterKeyHint="done"
            />
            <View style={styles.editButtonsRow}>
              <Pressable
                style={[styles.editButton, styles.confirmButton]}
                onPress={async () => {
                  if (editText.trim() && editText !== task.text) {
                    await onUpdateText(task.id, editText.trim());
                  }
                  setIsEditing(false);
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </Pressable>
              <Pressable
                style={[styles.editButton, styles.discardButton]}
                onPress={() => {
                  setEditText(task.text);
                  setIsEditing(false);
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => !task.completed && setIsEditing(true)}
            disabled={task.completed}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            hitSlop={10}
            pressRetentionOffset={10}
          >
            <Text
              style={[
                styles.taskText,
                task.category === 'PRIORITY' && styles.priorityTaskText,
                task.completed && styles.completedTaskText,
              ]}
            >
              {task.text}
            </Text>
          </Pressable>
        )}

        {!task.completed && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              style={[styles.categoryBadge, { backgroundColor: categoryConfig.color }]}
              onPress={() => setIsCategoryModalVisible(true)}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              hitSlop={10}
              pressRetentionOffset={10}
            >
              <Ionicons name={categoryConfig.icon as any} size={12} color="white" />
              <Text style={styles.categoryText}>{categoryConfig.label}</Text>
            </Pressable>
            <Pressable
              style={[styles.colorBadge, { backgroundColor: colorConfig.backgroundColor, borderColor: colorConfig.borderColor }]}
              onPress={onUpdateColor}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              hitSlop={10}
              pressRetentionOffset={10}
            >
              <Ionicons name="color-palette" size={12} color="#555" />
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => onDelete(task.id)}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        hitSlop={10}
        pressRetentionOffset={10}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </Pressable>

      <CategorySelectorModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelectCategory={async (category) => {
          await onUpdateCategory(task.id, category);
        }}
        currentCategory={task.category as any}
      />
    </View>
  );
};

const colorBadgeStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 2,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginLeft: 4,
};

const styles = StyleSheet.create({
  editContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  discardButton: {
    backgroundColor: '#e74c3c',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 2,
    ...Platform.select({
      ios: {},
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
      },
    }),
  },
  priorityTaskItem: {
    padding: 18,
    marginVertical: 6,
    borderWidth: 2,
    elevation: 3,
    ...Platform.select({
      ios: {},
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0,0,0,0.2)',
      },
    }),
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
  priorityTaskText: {
    fontSize: 18,
    fontWeight: '600',
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
  colorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});