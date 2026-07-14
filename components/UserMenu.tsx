import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { LanguageToggle } from './LanguageToggle';

type UserMenuProps = {
  onLogout?: () => void;
};

export function UserMenu({ onLogout }: UserMenuProps) {
  const { t } = useI18n();
  const { width: windowWidth } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 60, right: 12 });
  const triggerRef = useRef<View>(null);

  const openMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      setOpen(true);
      return;
    }
    trigger.measureInWindow((x, y, w, h) => {
      setAnchor({ top: y + h + 6, right: Math.max(windowWidth - (x + w), 8) });
      setOpen(true);
    });
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        accessibilityLabel={t('nav.menu')}
        style={({ pressed }) => [
          styles.trigger,
          pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
        ]}
        hitSlop={8}
      >
        <Ionicons name="ellipsis-vertical" size={18} color="white" />
      </Pressable>

      {/* animationType="none": react-native-web only unmounts fade/slide modals on the CSS
          animationend event, which never fires when animations are disabled (e.g. reduced
          motion), leaving invisible ghost overlays in the DOM. */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.menu, { top: anchor.top, right: anchor.right }]}>
          <View style={styles.menuRow}>
            <Text style={styles.menuLabel}>{t('nav.language')}</Text>
            <LanguageToggle />
          </View>
          <View style={styles.divider} />
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
            <Text style={styles.logoutText}>{t('nav.logout')}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    position: 'absolute',
    minWidth: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  menuLabel: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginHorizontal: 8,
  },
  logoutText: {
    flex: 1,
    color: '#e74c3c',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
