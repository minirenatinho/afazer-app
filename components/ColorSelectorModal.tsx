import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemColor } from '../types';

interface ColorOption {
  value: ItemColor;
  label: string;
  color: string;
}

interface ColorSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectColor: (color: ItemColor) => void;
  currentColor: ItemColor;
}

const colorOptions: ColorOption[] = [
  { value: 'BLUE', label: 'Blue', color: '#3498db' },
  { value: 'GREEN', label: 'Green', color: '#2ecc71' },
  { value: 'PINK', label: 'Pink', color: '#e84393' },
  { value: 'BROWN', label: 'Brown', color: '#8B4513' },
];

export const ColorSelectorModal: React.FC<ColorSelectorModalProps> = ({
  visible,
  onClose,
  onSelectColor,
  currentColor,
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
            <Text style={styles.modalTitle}>Change Color</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>
          <View style={styles.colorList}>
            {colorOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: option.color },
                  currentColor === option.value && styles.selectedColor,
                ]}
                onPress={() => {
                  onSelectColor(option.value);
                  onClose();
                }}
              >
                <Text style={styles.colorLabel}>{option.label}</Text>
                {currentColor === option.value && (
                  <Ionicons name="checkmark" size={18} color="white" style={{ marginLeft: 8 }} />
                )}
              </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    width: 300,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  colorList: {
    flexDirection: 'column',
    gap: 8,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#fff',
  },
  colorLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
