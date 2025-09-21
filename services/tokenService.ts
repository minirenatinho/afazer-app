import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export class TokenService {
  static async storeTokens(tokens: TokenResponse): Promise<void> {
    try {
      // Validate that tokens are defined and have the required properties
      if (!tokens || !tokens.access_token) {
        throw new Error('Invalid tokens: access_token is required');
      }

      // Only store refresh_token if it's defined (some auth flows may not provide it)
      const hasRefreshToken = tokens.refresh_token !== undefined && tokens.refresh_token !== null;

      if (Platform.OS === 'web') {
        // For web platform, use localStorage as fallback
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        if (hasRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token!);
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      } else {
        // For native platforms, try SecureStore first, fallback to AsyncStorage
        try {
          if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
            if (hasRefreshToken) {
              await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token!);
            } else {
              await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            }
          } else {
            throw new Error('SecureStore not available');
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to AsyncStorage:', secureStoreError);
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
          if (hasRefreshToken) {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token!);
          } else {
            await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // For web platform, use localStorage as fallback
        return localStorage.getItem(ACCESS_TOKEN_KEY);
      } else {
        // For native platforms, try SecureStore first, fallback to AsyncStorage
        try {
          if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
            return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
          } else {
            throw new Error('SecureStore not available');
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to AsyncStorage:', secureStoreError);
          return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // For web platform, use localStorage as fallback
        return localStorage.getItem(REFRESH_TOKEN_KEY);
      } else {
        // For native platforms, try SecureStore first, fallback to AsyncStorage
        try {
          if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
            return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          } else {
            throw new Error('SecureStore not available');
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to AsyncStorage:', secureStoreError);
          return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static async clearTokens(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web platform, use localStorage as fallback
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        // For native platforms, try SecureStore first, fallback to AsyncStorage
        try {
          if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          } else {
            throw new Error('SecureStore not available');
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to AsyncStorage:', secureStoreError);
          await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
          await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  static async hasValidTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }
}
