
import { Item, Supermarket, Country } from './types';
import Constants from 'expo-constants';
import { TokenService, TokenResponse } from './services/tokenService';
import { apiCall } from './services/apiInterceptor';


const API_URL = Constants.expoConfig?.extra?.EXPO_API_URL;
if (!API_URL) {
  throw new Error('API_URL is not set. Check .env and app.config.js');
}
const API_BASE = `${API_URL}/items`;
const AUTH_BASE = `${API_URL}/auth`;
const ITEMS_LIMIT = 200;

// --- Auth ---
// Login: POST /auth/token (username, password)
export async function login(username: string, password: string): Promise<void> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed');
  }
  
  const tokens: TokenResponse = await res.json();
  await TokenService.storeTokens(tokens);
}

// Logout: POST /auth/logout (if available, or clear tokens)
export async function logout(): Promise<void> {
  try {
    // Get the refresh token before clearing
    const refreshToken = await TokenService.getRefreshToken();
    
    if (refreshToken) {
      // Try to call logout endpoint with refresh token
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        }),
      });
    }
  } catch (error) {
    // Ignore errors if logout endpoint doesn't exist or fails
    console.warn('Logout endpoint call failed:', error);
  } finally {
    // Always clear stored tokens
    await TokenService.clearTokens();
  }
}

// Check if user is authenticated: GET /auth/me
export async function getCurrentUser(): Promise<any> {
  const res = await apiCall(`${API_URL}/auth/me`, {
    method: 'GET',
  });
  
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  
  return res.json();
}

// --- Item CRUD ---


export async function fetchItems(): Promise<Item[]> {
  const res = await apiCall(`${API_BASE}/?limit=${ITEMS_LIMIT}`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}


export async function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  const res = await apiCall(`${API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}


export async function updateItem(item: Item): Promise<Item> {
  const res = await apiCall(`${API_BASE}/${item.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}


export async function deleteItem(id: string): Promise<void> {
  const res = await apiCall(`${API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
}

// --- Supermarket CRUD ---


export async function fetchSupermarkets(): Promise<Supermarket[]> {
  const res = await apiCall(`${API_BASE}/?type=supermarket&limit=${ITEMS_LIMIT}`);
  if (!res.ok) throw new Error('Failed to fetch supermarkets');
  const supermarkets: Supermarket[] = await res.json();
  return supermarkets;
}


export async function createSupermarket(supermarket: Omit<Supermarket, 'id'>): Promise<Supermarket> {
  const supermarketData: Omit<Supermarket, 'id'> = {
    text: supermarket.text,
    type: 'supermarket',
    completed: supermarket.completed || false,
    createdAt: supermarket.createdAt || Date.now(),
    category: 'SUPERMARKET',
    color: 'BLUE',
    dynamics: {
      quantity: supermarket.dynamics?.quantity,
      unit: supermarket.dynamics?.unit,
      price: supermarket.dynamics?.price,
      notes: supermarket.dynamics?.notes,
    },
  };

  const res = await apiCall(`${API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supermarketData),
  });
  
  if (!res.ok) throw new Error('Failed to create supermarket');
  
  const createdSupermarket: Supermarket = await res.json();
  return {
    id: createdSupermarket.id,
    text: createdSupermarket.text,
    completed: createdSupermarket.completed,
    createdAt: createdSupermarket.createdAt,
    dynamics: createdSupermarket.dynamics,
    category: createdSupermarket.category,
    color: createdSupermarket.color,
    type: createdSupermarket.type,
  };
}


export async function updateSupermarket(supermarket: Supermarket): Promise<Supermarket> {
  const supermarketData: Supermarket = {
    id: supermarket.id,
    text: supermarket.text,
    type: 'supermarket',
    completed: supermarket.completed,
    createdAt: supermarket.createdAt,
    category: 'SUPERMARKET',
    color: 'BLUE',
    dynamics: {
      quantity: supermarket.dynamics?.quantity,
      unit: supermarket.dynamics?.unit,
      price: supermarket.dynamics?.price,
      notes: supermarket.dynamics?.notes,
    },
  };

  const res = await apiCall(`${API_BASE}/${supermarket.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supermarketData),
  });
  
  if (!res.ok) throw new Error('Failed to update supermarket');
  
  const updatedSupermarket: Supermarket = await res.json();
  return {
    id: updatedSupermarket.id,
    text: updatedSupermarket.text,
    completed: updatedSupermarket.completed,
    createdAt: updatedSupermarket.createdAt,
    dynamics: updatedSupermarket.dynamics,
    category: updatedSupermarket.category,
    color: updatedSupermarket.color,
    type: updatedSupermarket.type,
  };
}


export async function deleteSupermarket(id: string): Promise<void> {
  const res = await apiCall(`${API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete supermarket');
}

// --- Country CRUD ---


export async function fetchCountries(): Promise<Country[]> {
  const res = await apiCall(`${API_BASE}/?type=country&limit=${ITEMS_LIMIT}`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}


export async function createCountry(country: Omit<Country, 'id'>): Promise<Country> {
  const countryData: Omit<Country, 'id'> = {
    text: country.text,
    type: 'country',
    completed: country.completed || false,
    createdAt: country.createdAt || Date.now(),
    category: 'COUNTRY',
    color: 'GREEN',
    dynamics: {
      capital: country.dynamics?.capital,
      population: country.dynamics?.population,
      language: country.dynamics?.language,
      notes: country.dynamics?.notes,
    },
  };

  const res = await apiCall(`${API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(countryData),
  });
  
  if (!res.ok) throw new Error('Failed to create country');
  return res.json();
}


export async function updateCountry(country: Country): Promise<Country> {
  const countryData: Country = {
    id: country.id,
    text: country.text,
    type: 'country',
    completed: country.completed,
    createdAt: country.createdAt,
    category: 'COUNTRY',
    color: 'GREEN',
    dynamics: {
      capital: country.dynamics?.capital,
      population: country.dynamics?.population,
      language: country.dynamics?.language,
      notes: country.dynamics?.notes,
    },
  };

  const res = await apiCall(`${API_BASE}/${country.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(countryData),
  });
  
  if (!res.ok) throw new Error('Failed to update country');
  return res.json();
}


export async function deleteCountry(id: string): Promise<void> {
  const res = await apiCall(`${API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete country');
}