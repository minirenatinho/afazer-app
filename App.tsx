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

export default function App() {
  const [page, setPage] = useState<'afazer' | 'supermarket'>('afazer');
 
  const pages = [
    { id: 'afazer', title: 'Afazer' },
    { id: 'supermarket', title: 'Supermarket' },
  ];

  const renderPage = () => {
    if (page === 'supermarket') {
      return <SupermarketPage />;
    }
    
    if (page === 'afazer') {
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
        onPageChange={(pageId) => setPage(pageId as 'afazer' | 'supermarket')} 
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
