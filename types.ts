export interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO string
  completed: boolean;
  createdAt: number;
  isRecurring?: boolean;
  recurrenceInterval?: 'weekly' | 'biweekly';
}

export interface Ingredient {
  item: string;
  amount: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: string;
  imageUrl?: string; // Base64 or URL
  notes?: string; // Personal comments/recommendations
}

export enum ViewState {
  TASKS = 'TASKS',
  RECIPES = 'RECIPES',
  FAVORITES = 'FAVORITES'
}

export interface AIState {
  isLoading: boolean;
  error: string | null;
}