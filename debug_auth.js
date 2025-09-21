// Debug script to check and clear authentication tokens
// Run this in your app's development environment

import { TokenService } from './services/tokenService';
import { getCurrentUser } from './api';

export const debugAuth = async () => {
  console.log('=== Authentication Debug ===');
  
  // Check current tokens
  const accessToken = await TokenService.getAccessToken();
  const refreshToken = await TokenService.getRefreshToken();
  
  console.log('Access Token:', accessToken ? 'Present' : 'Missing');
  console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
  
  // Test authentication
  try {
    const user = await getCurrentUser();
    console.log('Current User:', user);
    console.log('Authentication: SUCCESS');
  } catch (error) {
    console.log('Authentication: FAILED');
    console.log('Error:', error.message);
    
    // Clear tokens if authentication fails
    console.log('Clearing corrupted tokens...');
    await TokenService.clearTokens();
    console.log('Tokens cleared. Please log in again.');
  }
};

// For web debugging - run in browser console
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  console.log('Run debugAuth() in console to check authentication status');
}
