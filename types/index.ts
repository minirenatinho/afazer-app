export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  category: string;
  color: string;
  type: string;
  dynamics?: {
    quantity?: number;
    unit?: string;
    price?: number;
    notes?: string;
    capital?: string;
    population?: number;
    language?: string;
  };
}

export interface Country extends Omit<Task, 'dynamics'> {
  dynamics?: {
    capital?: string;
    population?: number;
    language?: string;
    notes?: string;
  };
}

export type FilterType = 'PRIORITY' | 'ON' | 'OFF' | 'PAY' | 'SUPERMARKET' | 'COUNTRY' | 'completed';
export type TaskCategory = 'PRIORITY' | 'ON' | 'OFF' | 'PAY';