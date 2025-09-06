import { Task, Supermarket, Country } from './types';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_API_URL;
if (!API_URL) {
  throw new Error('API_URL is not set. Check .env and app.config.js');
}
const API_BASE = `${API_URL}/tasks`;

// --- Task CRUD ---

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(task: Task): Promise<Task> {
  const res = await fetch(`${API_BASE}/${task.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

// --- Supermarket CRUD ---

export async function fetchSupermarkets(): Promise<Supermarket[]> {
  const res = await fetch(`${API_BASE}/?type=supermarket`);
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

  const res = await fetch(`${API_BASE}/`, {
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

  const res = await fetch(`${API_BASE}/${supermarket.id}/`, {
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
  const res = await fetch(`${API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete supermarket');
}

// --- Country CRUD ---

export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${API_BASE}/?type=country`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

export async function createCountry(country: Omit<Country, 'id'>): Promise<Country> {
  const taskData: Omit<Country, 'id'> = {
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

  const res = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  
  if (!res.ok) throw new Error('Failed to create country');
  return res.json();
}

export async function updateCountry(country: Country): Promise<Country> {
  const taskData: Country = {
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

  const res = await fetch(`${API_BASE}/${country.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  
  if (!res.ok) throw new Error('Failed to update country');
  return res.json();
}

export async function deleteCountry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete country');
}