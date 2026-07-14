import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useI18n, Locale } from '../i18n';

const OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'en', label: 'EN' },
  { locale: 'pt-BR', label: 'PT' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <View style={styles.container}>
      {OPTIONS.map(option => {
        const isActive = locale === option.locale;
        return (
          <Pressable
            key={option.locale}
            onPress={() => setLocale(option.locale)}
            style={({ pressed }) => [
              styles.option,
              isActive && styles.activeOption,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={6}
          >
            <Text style={[styles.optionText, isActive && styles.activeOptionText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  activeOption: {
    backgroundColor: '#FF8C42',
  },
  optionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeOptionText: {
    color: '#1a1a1a',
  },
});
