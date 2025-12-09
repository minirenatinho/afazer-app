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
  username?: string;
  onLogout?: () => void;
};

export const PageCarousel: React.FC<PageCarouselProps> = ({
  pages,
  currentPageId,
  onPageChange,
  username,
  onLogout,
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
      <View style={styles.userSection}>
        <Text style={styles.username}>{username || 'User'}</Text>
        <Pressable 
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.7 }
          ]}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
      <View style={styles.carouselSection}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF8C42',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
  },
  userSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  username: {
    marginRight: 10,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  carouselSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingBottom: 10,
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
