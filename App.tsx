import React, { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { PageCarousel } from './components/PageCarousel';
import SupermarketPage from './pages/SupermarketPage';
import AfazerPage from './pages/AfazerPage';
import CountryPage from './pages/CountryPage';

export default function App() {
  const [page, setPage] = useState<'afazer' | 'supermarket' | 'country'>('afazer');
 
  const pages = [
    { id: 'afazer', title: 'Afazer' },
    { id: 'supermarket', title: 'Supermarket' },
    { id: 'country', title: 'Countries' },
  ];

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
