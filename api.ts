import { Task } from './types';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_API_URL;
if (!API_URL) {
  throw new Error('API_URL is not set. Check .env and app.config.js');
}

const TASK_API_BASE = `${API_URL}/tasks`;

// --- Task CRUD ---
export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${TASK_API_BASE}/`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(`${TASK_API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(task: Task): Promise<Task> {
  const res = await fetch(`${TASK_API_BASE}/${task.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${TASK_API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

export async function fetchSupermarkets(): Promise<Task[]> {
  const res = await fetch(`${TASK_API_BASE}/?type=supermarket`);
  if (!res.ok) throw new Error('Failed to fetch supermarkets');
  const tasks: Task[] = await res.json();
  
  // Convert Task with dynamics to Supermarket format
  return tasks;
}

export async function createSupermarket(supermarket: Omit<Task, 'id'>): Promise<Task> {
  const taskData: Omit<Task, 'id'> = {
    text: supermarket.text, // Map name to text
    type: 'supermarket',
    completed: supermarket.completed || false,
    createdAt: supermarket.createdAt || Date.now(),
    category: 'SUPERMARKET', // Default category
    color: 'BLUE', // Default color
    dynamics: {
      quantity: supermarket.dynamics?.quantity,
      unit: supermarket.dynamics?.unit,
      price: supermarket.dynamics?.price,
      notes: supermarket.dynamics?.notes,
    },
  };

  const res = await fetch(`${TASK_API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  
  if (!res.ok) throw new Error('Failed to create supermarket');
  
  const createdTask: Task = await res.json();
  return {
    id: createdTask.id,
    text: createdTask.text, // Map text back to name
    completed: createdTask.completed,
    createdAt: createdTask.createdAt,
    dynamics: createdTask.dynamics,
    category: createdTask.category,
    color: createdTask.color,
    type: createdTask.type,
  };
}

export async function updateSupermarket(supermarket: Task): Promise<Task> {
  const taskData: Task = {
    id: supermarket.id,
    text: supermarket.text, // Map name to text
    type: 'supermarket',
    completed: supermarket.completed,
    createdAt: supermarket.createdAt,
    category: 'SUPERMARKET', // Default category
    color: 'BLUE', // Default color
    dynamics: {
      quantity: supermarket.dynamics?.quantity,
      unit: supermarket.dynamics?.unit,
      price: supermarket.dynamics?.price,
      notes: supermarket.dynamics?.notes,
    },
  };

  const res = await fetch(`${TASK_API_BASE}/${supermarket.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  
  if (!res.ok) throw new Error('Failed to update supermarket');
  
  const updatedTask: Task = await res.json();
  return {
    id: updatedTask.id,
    text: updatedTask.text, // Map text back to name
    completed: updatedTask.completed,
    createdAt: updatedTask.createdAt,
    dynamics: updatedTask.dynamics,
    category: updatedTask.category,
    color: updatedTask.color,
    type: updatedTask.type,
  };
}

export async function deleteSupermarket(id: string): Promise<void> {
  const res = await fetch(`${TASK_API_BASE}/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete supermarket');
}