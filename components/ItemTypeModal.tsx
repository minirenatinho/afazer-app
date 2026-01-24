import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ItemTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'PRIORITY' | 'ON' | 'PAY' | 'OFF', color: 'GREEN' | 'PINK' | 'BLUE' | 'BROWN') => void;
}

const { width } = Dimensions.get('window');

export const ItemTypeModal: React.FC<ItemTypeModalProps> = ({
  visible,
  onClose,
  onSelectType,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'PRIORITY' | 'ON' | 'OFF' | 'PAY' | null>(null);
  const [step, setStep] = useState<'category' | 'color'>('category');

  const itemTypes = [
    {
      type: 'PRIORITY' as const,
      title: 'Priority',
      description: 'High priority items that need immediate attention',
      icon: 'flag',
      color: '#ff88b2',
    },
    {
      type: 'ON' as const,
      title: 'On',
      description: 'Items that are currently in progress',
      icon: 'play',
      color: '#3498db',
    },
    {
      type: 'OFF' as const,
      title: 'Off',
      description: 'Items that are planned but not started',
      icon: 'pause',
      color: '#95a5a6',
    },
    {
      type: 'PAY' as const,
      title: 'Pay',
      description: 'Items related to payments or bills',
      icon: 'card',
      color: '#f1c40f',
    },
  ];

  const colorOptions = [
    {
      color: 'GREEN' as const,
      name: 'GREEN',
      backgroundColor: '#E8F5E8',
      borderColor: '#A8D5A8',
    },
    {
      color: 'PINK' as const,
      name: 'PINK',
      backgroundColor: '#FCE8F0',
      borderColor: '#F5B8D1',
    },
    {
      color: 'BLUE' as const,
      name: 'BLUE',
      backgroundColor: '#E8F2FC',
      borderColor: '#B8D5F5',
    },
    {
      color: 'BROWN' as const,
      name: 'BROWN',
      backgroundColor: '#F5F0E8',
      borderColor: '#D5C5B8',
    },
  ];

  const handleCategorySelect = (category: 'PRIORITY' | 'ON' | 'OFF' | 'PAY') => {
    setSelectedCategory(category);
    setStep('color');
  };

  const handleColorSelect = (color: 'GREEN' | 'PINK' | 'BLUE' | 'BROWN') => {
    if (selectedCategory) {
      onSelectType(selectedCategory, color);
      // Reset modal state
      setSelectedCategory(null);
      setStep('category');
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setStep('category');
    onClose();
  };

  const renderCategoryStep = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Select Item Type</Text>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </Pressable>
      </View>
      
      <Text style={styles.subtitle}>
        Choose the category for your new item:
      </Text>

      <View style={styles.optionsContainer}>
        {itemTypes.map((itemType) => (
          <Pressable
            key={itemType.type}
            style={styles.option}
            onPress={() => handleCategorySelect(itemType.type)}
          >
            <View style={[styles.iconContainer, { backgroundColor: itemType.color }]}>
              <Ionicons name={itemType.icon as any} size={24} color="white" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{itemType.title}</Text>
              <Text style={styles.optionDescription}>{itemType.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        ))}
      </View>
    </>
  );

  const renderColorStep = () => (
    <>
      <View style={styles.header}>
        <Pressable onPress={() => setStep('category')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </Pressable>
        <Text style={styles.title}>Select Color</Text>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </Pressable>
      </View>
      
      <Text style={styles.subtitle}>
        Choose a color for your item:
      </Text>

      <View style={styles.colorGrid}>
        {colorOptions.map((colorOption) => (
          <Pressable
            key={colorOption.color}
            style={[
              styles.colorOption,
              { backgroundColor: colorOption.backgroundColor, borderColor: colorOption.borderColor }
            ]}
            onPress={() => handleColorSelect(colorOption.color)}
          >
            <View style={[styles.colorCircle, { backgroundColor: colorOption.borderColor }]} />
            <Text style={styles.colorName}>{colorOption.name}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {step === 'category' ? renderCategoryStep() : renderColorStep()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? Math.min(width * 0.8, 500) : width * 0.9,
    maxWidth: Platform.OS === 'web' ? 500 : 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  backButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  colorOption: {
    width: Math.min((width * 0.9 - 60) / 2, 120),
    aspectRatio: 1,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
}); 