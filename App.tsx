import React, { useState, useEffect } from 'react';
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
import SupermarketPage from './pages/SupermarketPage';
import AfazerPage from './pages/AfazerPage';
import { login, logout, getCurrentUser, register } from './api';

export default function App() {
  const [page, setPage] = useState<'afazer' | 'supermarket'>('afazer');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const pages = [
    { id: 'afazer', title: 'Afazer' },
    { id: 'supermarket', title: 'Supermarket' },
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
      Alert.alert('Login failed', e?.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
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
      Alert.alert('Registration failed', e?.message || 'Could not create account');
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
      case 'afazer':
      default:
        return <AfazerPage />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <Text>Loading...</Text>
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
            {isRegister ? 'Create Account' : 'Afazer Account'}
          </Text>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            style={{ borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#2a2a2a', color: '#fff' }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isRegister && (
            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              style={{ borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#2a2a2a', color: '#fff' }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          )}
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 10, marginBottom: 16, backgroundColor: '#2a2a2a', color: '#fff' }}
            secureTextEntry
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
              {isRegister ? 'Register' : 'Login'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode(isRegister ? 'login' : 'register')}
            style={{ marginTop: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#888', fontSize: 14 }}>
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </Text>
          </Pressable>
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
        onPageChange={(pageId) => setPage(pageId as 'afazer' | 'supermarket')}
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
