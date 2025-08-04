import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskCategory } from '../types';

interface CategoryOption {
  value: TaskCategory;
  label: string;
  icon: string;
  color: string;
}

interface CategorySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: TaskCategory) => void;
  currentCategory: TaskCategory;
}

const categoryOptions: CategoryOption[] = [
  { value: 'priority', label: 'Priority', icon: 'flag', color: '#e74c3c' },
  { value: 'on', label: 'On', icon: 'play', color: '#3498db' },
  { value: 'off', label: 'Off', icon: 'pause', color: '#95a5a6' },
];

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
  visible,
  onClose,
  onSelectCategory,
  currentCategory,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryList}>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryOption,
                  currentCategory === option.value && styles.selectedCategory,
                ]}
                onPress={() => {
                  onSelectCategory(option.value);
                  onClose();
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon as any} size={16} color="white" />
                </View>
                <Text style={styles.categoryLabel}>{option.label}</Text>
                {currentCategory === option.value && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    padding: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedCategory: {
    backgroundColor: '#f5f5f5',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  checkmark: {
    marginLeft: 8,
  },
});
