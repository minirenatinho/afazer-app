export interface Item {
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

export interface Supermarket extends Omit<Item, 'dynamics'> {
  dynamics?: {
    quantity?: number;
    unit?: string;
    price?: number;
    notes?: string;
  };
}

export interface Country extends Omit<Item, 'dynamics'> {
  dynamics?: {
    capital?: string;
    population?: number;
    language?: string;
    notes?: string;
  };
}

export type FilterType = 'PRIORITY' | 'ON' | 'OFF' | 'PAY' | 'SUPERMARKET' | 'COUNTRY' | 'completed';
export type ItemCategory = 'PRIORITY' | 'ON' | 'OFF' | 'PAY';
export type ItemColor = 'BLUE' | 'GREEN' | 'PINK' | 'BROWN';