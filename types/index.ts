export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  category: 'priority' | 'on' | 'off';
  color: 'green' | 'pink' | 'blue' | 'brown';
}

export type FilterType = 'priority' | 'on' | 'off' | 'completed'; 