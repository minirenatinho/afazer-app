import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, StatusBar, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { UserMenu } from './UserMenu';

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
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  // Below this width the centered carousel and the user controls can't share one
  // row without overlapping, so they stack in two rows instead.
  const isCompact = width < 700;
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

  const carousel = (
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
  );

  const userControls = (
    <>
      <Text style={styles.username} numberOfLines={1}>{username || t('nav.user')}</Text>
      <UserMenu onLogout={onLogout} />
    </>
  );

  if (isCompact) {
    return (
      <View style={styles.container}>
        <View style={styles.compactCarouselRow}>{carousel}</View>
        <View style={styles.compactUserRow}>{userControls}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Left spacer — same flex as userSection so the carousel centers on the screen */}
        <View style={styles.sideSection} />
        {carousel}
        <View style={[styles.sideSection, styles.userSection]}>{userControls}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)',
      },
    }),
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 4,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
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
  compactCarouselRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  compactUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  sideSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  carouselSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  userSection: {
    justifyContent: 'flex-end',
    gap: 12,
  },
  username: {
    flexShrink: 1,
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    ...Platform.select({
      web: {
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: 'white',
    minWidth: 120,
    ...Platform.select({
      web: {
        textShadow: '0 2px 3px rgba(0, 0, 0, 0.15)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
      },
    }),
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
