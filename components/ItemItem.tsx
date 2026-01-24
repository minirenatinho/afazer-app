import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '../types';
import { CategorySelectorModal } from './CategorySelectorModal';

interface ItemItemProps {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => Promise<void>;
  onUpdateText: (id: string, newText: string) => Promise<void>;
  onUpdateColor: () => void;
}

export const ItemItem: React.FC<ItemItemProps> = ({ 
  item,
  onToggle,
  onDelete,
  onUpdateCategory,
  onUpdateText,
  onUpdateColor,
}) => {
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  // Reset editText if item.text changes (e.g. after update)
  React.useEffect(() => {
    setEditText(item.text);
  }, [item.text]);
  const getCategoryConfig = (category: Item['category']) => {
    switch (category) {
      case 'PRIORITY':
        return { icon: 'flag', color: '#ff88b2', label: 'Priority' };
      case 'ON':
        return { icon: 'play', color: '#3498db', label: 'On' };
      case 'OFF':
        return { icon: 'pause', color: '#95a5a680', label: 'Off' };
      case 'PAY':
        return { icon: 'card', color: '#f1c40f', label: 'Pay' };
      default:
        return { icon: 'ellipse', color: '#95a5a6', label: 'Item' };
    }
  };

  const getColorConfig = (color: Item['color']) => {
    switch (color) {
      case 'GREEN':
        return { backgroundColor: '#1a3a1a', borderColor: '#2ecc71' };
      case 'PINK':
        return { backgroundColor: '#3a1a2a', borderColor: '#ff88b2' };
      case 'BLUE':
        return { backgroundColor: '#1a2a3a', borderColor: '#3498db' };
      case 'BROWN':
        return { backgroundColor: '#3a2a1a', borderColor: '#8B4513' };
      default:
        return { backgroundColor: '#2a2a2a', borderColor: '#444' };
    }
  };

  const categoryConfig = getCategoryConfig(item.category);
  const colorConfig = getColorConfig(item.color);

  return (
    <View style={[
      styles.itemItem,
      item.category === 'PRIORITY' && !item.completed && styles.priorityItemItem,
      {
        backgroundColor: colorConfig.backgroundColor,
        borderColor: item.category === 'PRIORITY' && !item.completed ? '#e74c3c' : colorConfig.borderColor,
      },
    ]}>
      <Pressable
        style={({ pressed }) => [
          styles.itemCheckbox, 
          { opacity: item.completed ? 0.7 : 1 },
          pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] }
        ]}
        onPress={() => onToggle(item.id)}
        hitSlop={10}
        pressRetentionOffset={10}
      >
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={item.completed ? '#27ae60' : '#7f8c8d'}
        />
      </Pressable>

      <View style={styles.itemContent}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[
                styles.itemText,
                item.category === 'PRIORITY' && styles.priorityItemText,
                item.completed && styles.completedItemText,
                { backgroundColor: '#333', borderWidth: 1, borderColor: '#444', borderRadius: 6, paddingHorizontal: 8, color: '#fff' },
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
                  if (editText.trim() && editText !== item.text) {
                    await onUpdateText(item.id, editText.trim());
                  }
                  setIsEditing(false);
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </Pressable>
              <Pressable
                style={[styles.editButton, styles.discardButton]}
                onPress={() => {
                  setEditText(item.text);
                  setIsEditing(false);
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => !item.completed && setIsEditing(true)}
            disabled={item.completed}
            hitSlop={10}
            pressRetentionOffset={10}
          >
            <Text
              style={[ 
                styles.itemText,
                item.category === 'PRIORITY' && !item.completed && styles.priorityItemText,
                item.completed && styles.completedItemText,
              ]}
            >
              {item.text}
            </Text>
          </Pressable>
        )}

        {!item.completed && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              style={[styles.categoryBadge, { backgroundColor: categoryConfig.color }]}
              onPress={() => setIsCategoryModalVisible(true)}
              hitSlop={10}
              pressRetentionOffset={10}
            >
              <Ionicons name={categoryConfig.icon as any} size={12} color="white" />
              <Text style={styles.categoryText}>{categoryConfig.label}</Text>
            </Pressable>
            <Pressable
              style={[styles.colorBadge, { backgroundColor: colorConfig.backgroundColor, borderColor: colorConfig.borderColor }]}
              onPress={onUpdateColor}
              hitSlop={10}
              pressRetentionOffset={10}
            >
              <Ionicons name="color-palette" size={12} color="#555" />
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
        ]}
        onPress={() => onDelete(item.id)}
        hitSlop={10}
        pressRetentionOffset={10}
      >
        <Ionicons name="trash-outline" size={22} color="#ff6b6b" />
      </Pressable>

      <CategorySelectorModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelectCategory={async (category) => {
          await onUpdateCategory(item.id, category);
        }}
        currentCategory={item.category as any}
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
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  confirmButton: {
    backgroundColor: '#27ae60',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)',
      },
      ios: {
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  discardButton: {
    backgroundColor: '#e74c3c',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)',
      },
      ios: {
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  itemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        cursor: 'default',
      },
    }),
  },
  priorityItemItem: {
    padding: 20,
    marginVertical: 8,
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 16px rgba(231, 76, 60, 0.25)',
        transition: 'all 0.2s ease',
      },
    }),
  },
  itemCheckbox: {
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 6,
    lineHeight: 22,
    fontWeight: '500',
  },
  priorityItemText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  completedItemText: {
    textDecorationLine: 'line-through',
    color: '#666',
    opacity: 0.7,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  categoryText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
    marginLeft: 5,
    letterSpacing: 0.3,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  colorBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
});