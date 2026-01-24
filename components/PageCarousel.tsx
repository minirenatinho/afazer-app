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
            style={({ pressed }) => [
              styles.arrowButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </Pressable>
          
          <Text style={styles.title}>{currentPage?.title}</Text>
          
          <Pressable 
            onPress={goToNext}
            style={({ pressed }) => [
              styles.arrowButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
            hitSlop={10}
          >
            <Ionicons name="chevron-forward" size={22} color="white" />
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
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
      },
    }),
    borderBottomWidth: 0,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 4,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)',
      },
      ios: {
        shadowColor: '#FF8C42',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  spacer: {
    width: 80,
  },
  carouselSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 80,
  },
  username: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(231, 76, 60, 0.4)',
        transition: 'all 0.2s ease',
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
  logoutText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: 'white',
    minWidth: 120,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  arrowButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
});
