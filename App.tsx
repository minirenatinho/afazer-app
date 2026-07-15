import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';

import { PageCarousel } from './components/PageCarousel';
import { LanguageToggle } from './components/LanguageToggle';
import SupermarketPage from './pages/SupermarketPage';
import AfazerPage from './pages/AfazerPage';
import FinancesPage from './pages/FinancesPage';
import { login, logout, getCurrentUser, register } from './api';
import { LanguageProvider, useI18n } from './i18n';

// Alert.alert is a no-op on react-native-web, so auth feedback needs window.alert there
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}
${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { t } = useI18n();
  const [page, setPage] = useState<'afazer' | 'supermarket' | 'finances'>('afazer');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const usernameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const pages = [
    { id: 'afazer', title: t('nav.afazer') },
    { id: 'supermarket', title: t('nav.supermarket') },
    { id: 'finances', title: t('nav.finances') },
  ];

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await login(username, password);
      const u = await getCurrentUser();
      setUser(u);
      setUsername('');
      setPassword('');
    } catch (e: any) {
      showAlert(t('auth.loginFailed'), e?.message || t('auth.invalidCredentials'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password.length < 8) {
      showAlert(t('auth.registrationFailed'), t('auth.passwordTooShort'));
      return;
    }
    setLoginLoading(true);
    try {
      await register(username, email, password);
      await login(username, password);
      const u = await getCurrentUser();
      setUser(u);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (e: any) {
      showAlert(t('auth.registrationFailed'), e?.message || t('auth.couldNotCreateAccount'));
    } finally {
      setLoginLoading(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'supermarket':
        return <SupermarketPage />;
      case 'finances':
        return <FinancesPage />;
      case 'afazer':
      default:
        return <AfazerPage />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!user) {
    const isRegister = mode === 'register';
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <StatusBar barStyle="light-content" />
        <View style={{ width: 300, padding: 24, backgroundColor: '#1e1e1e', borderRadius: 12, elevation: 2 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#fff' }}>
            {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
          </Text>
          <TextInput
            ref={usernameInputRef}
            placeholder={t('auth.username')}
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            style={{ borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#2a2a2a', color: '#fff' }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => (isRegister ? emailInputRef : passwordInputRef).current?.focus()}
          />
          {isRegister && (
            <TextInput
              ref={emailInputRef}
              placeholder={t('auth.email')}
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              style={{ borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#2a2a2a', color: '#fff' }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          )}
          <TextInput
            ref={passwordInputRef}
            placeholder={t('auth.password')}
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 10, marginBottom: 16, backgroundColor: '#2a2a2a', color: '#fff' }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={isRegister ? handleRegister : handleLogin}
          />
          <Pressable
            onPress={isRegister ? handleRegister : handleLogin}
            style={({ pressed }) => [{
              backgroundColor: '#FF8C42',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
              opacity: loginLoading || pressed ? 0.7 : 1,
            }]}
            disabled={loginLoading}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              {isRegister ? t('auth.register') : t('auth.login')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode(isRegister ? 'login' : 'register')}
            style={{ marginTop: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#888', fontSize: 14 }}>
              {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
            </Text>
          </Pressable>
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <LanguageToggle />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />
      <PageCarousel 
        pages={pages} 
        currentPageId={page} 
        onPageChange={(pageId) => setPage(pageId as 'afazer' | 'supermarket' | 'finances')}
        username={user?.username}
        onLogout={handleLogout}
      />
      {renderPage()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
