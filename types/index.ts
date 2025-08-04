export type TaskCategory = 'priority' | 'on' | 'off' | 'pay';
export type TaskColor = 'green' | 'pink' | 'blue' | 'brown';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  category: TaskCategory;
  color: TaskColor;
}

export type FilterType = 'priority' | 'on' | 'off' | 'pay' | 'completed'; 