import { TokenService, TokenResponse } from './tokenService';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_API_URL;
if (!API_URL) {
  throw new Error('API_URL is not set. Check .env and app.config.js');
}

const AUTH_BASE = `${API_URL.replace(/\/items$/, '')}/auth`;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

export const refreshToken = async (): Promise<string> => {
  const refreshToken = await TokenService.getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${AUTH_BASE}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens: TokenResponse = await response.json();
    await TokenService.storeTokens(tokens);
    
    return tokens.access_token;
  } catch (error) {
    await TokenService.clearTokens();
    throw error;
  }
};

export const apiCall = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  let accessToken = await TokenService.getAccessToken();

  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  };

  try {
    let response = await makeRequest(accessToken);

    if (response.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(async (token) => {
          return await makeRequest(token as string);
        }).catch((error) => {
          throw error;
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processQueue(null, newToken);
        
        response = await makeRequest(newToken);
        return response;
      } catch (error) {
        processQueue(error, null);
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const accessToken = await TokenService.getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }

  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};
