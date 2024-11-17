export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string;
  due_date: string;
  created_at: string;
  progress: number;
  is_completed: boolean;
}

export interface Todo {
  id: string;
  goal_id: string;
  name: string;
  completed: boolean;
  priority: "none" | "low" | "medium" | "high" | null;
  due_date: string | null;
  created_at: string;
  estimated_time?: number | null;
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