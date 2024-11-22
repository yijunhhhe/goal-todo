export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string;
  due_date: string;
  created_at: string;
  progress: number;
  is_completed: boolean;
  todos: Todo[];
  categories?: Category; 
}

export interface Todo {
  id: string;
  created_at: string;
  goal_id: string;
  name: string;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  estimated_time: number | null;
  completed: boolean;
  completed_time: string | null;
}

export interface CreateGoalInput {
  name: string;
  description: string;
  due_date: Date;
  category_id?: string;
}

export interface CreateTodoInput {
  name: string;
  priority?: "low" | "medium" | "high";
  due_date: Date | null;
  estimated_time?: number | null;
}

export interface CreateCategoryInput {
  name: string;
}