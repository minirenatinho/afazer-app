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
import CountryPage from './pages/CountryPage';
import { login, logout, getCurrentUser } from './api';

export default function App() {
  const [page, setPage] = useState<'afazer' | 'supermarket' | 'country'>('afazer');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const pages = [
    { id: 'afazer', title: 'Afazer' },
    { id: 'supermarket', title: 'Supermarket' },
    { id: 'country', title: 'Countries' },
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

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'supermarket':
        return <SupermarketPage />;
      case 'country':
        return <CountryPage />;
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
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <StatusBar barStyle="light-content" />
        <View style={{ width: 300, padding: 24, backgroundColor: '#fff', borderRadius: 12, elevation: 2 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Afazer Account</Text>
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={{ borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 10, marginBottom: 12 }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 10, marginBottom: 16 }}
            secureTextEntry
          />
          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [{
              backgroundColor: '#FF8C42',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
              opacity: loginLoading || pressed ? 0.7 : 1,
            }]}
            disabled={loginLoading}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Login</Text>
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
        onPageChange={(pageId) => setPage(pageId as 'afazer' | 'supermarket' | 'country')}
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
    backgroundColor: '#f8f9fa',
  },
});
