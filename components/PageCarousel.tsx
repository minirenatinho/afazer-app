import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Page = {
  id: string;
  title: string;
};

type PageCarouselProps = {
  pages: Page[];
  currentPageId: string;
  onPageChange: (pageId: string) => void;
};

export const PageCarousel: React.FC<PageCarouselProps> = ({
  pages,
  currentPageId,
  onPageChange,
}) => {
  const currentIndex = pages.findIndex(page => page.id === currentPageId);
  const currentPage = pages[currentIndex];
  
  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + pages.length) % pages.length;
    onPageChange(pages[newIndex].id);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % pages.length;
    onPageChange(pages[newIndex].id);
  };

  return (
    <View style={styles.container}>
      <Pressable 
        onPress={goToPrevious}
        style={styles.arrowButton}
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
      
      <Text style={styles.title}>{currentPage?.title}</Text>
      
      <Pressable 
        onPress={goToNext}
        style={styles.arrowButton}
        hitSlop={10}
      >
        <Ionicons name="chevron-forward" size={24} color="white" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
    paddingBottom: 10,
    backgroundColor: '#FF8C42',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    textAlign: 'center',
    minWidth: 150,
    color: 'white',
  },
  arrowButton: {
    padding: 8,
  },
});
