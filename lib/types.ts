export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string;
  due_date: string;
  created_at: string;
  progress: number;
  is_completed: boolean;
  todos: Todo[]; 
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
}

export interface CreateTodoInput {
  name: string;
  priority?: "low" | "medium" | "high";
  due_date: Date | null;
  estimated_time?: number | null;
}