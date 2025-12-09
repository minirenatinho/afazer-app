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
      <View style={styles.headerRow}>
        {/* Left spacer */}
        <View style={styles.spacer} />
        
        {/* Center carousel */}
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
        
        {/* Right user section */}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  spacer: {
    width: 80,
  },
  carouselSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  username: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: 'white',
    minWidth: 120,
  },
  arrowButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
