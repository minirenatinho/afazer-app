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
  };
}

export type FilterType = 'PRIORITY' | 'ON' | 'OFF' | 'PAY' | 'SUPERMARKET' | 'completed'; 