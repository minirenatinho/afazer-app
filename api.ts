// api.ts
import { Task } from './types';
import Constants from 'expo-constants';

// Get the API URL from app.config.js
const API_BASE = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.14:8000/api/v1/tasks/';
const SUPERMARKET_API_BASE = 'http://192.168.1.14:8000/api/v1/supermarket/';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(task: Task): Promise<Task> {
  const res = await fetch(`${API_BASE}${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete task');
} 

// --- Supermarket CRUD ---
export interface Supermarket {
  id: string;
  name: string;
  completed: boolean;
  createdAt: number;
  quantity?: number;
  unit?: string;
  price?: number;
  notes?: string;
}

export async function fetchSupermarkets(): Promise<Supermarket[]> {
  const res = await fetch(SUPERMARKET_API_BASE);
  if (!res.ok) throw new Error('Failed to fetch supermarkets');
  return res.json();
}

export async function createSupermarket(supermarket: Omit<Supermarket, 'id'>): Promise<Supermarket> {
  const res = await fetch(SUPERMARKET_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supermarket),
  });
  if (!res.ok) throw new Error('Failed to create supermarket');
  return res.json();
}

export async function updateSupermarket(supermarket: Supermarket): Promise<Supermarket> {
  const res = await fetch(`${SUPERMARKET_API_BASE}${supermarket.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supermarket),
  });
  if (!res.ok) throw new Error('Failed to update supermarket');
  return res.json();
}

export async function deleteSupermarket(id: string): Promise<void> {
  const res = await fetch(`${SUPERMARKET_API_BASE}${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete supermarket');
}