export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string;
  due_date: string;
  created_at: string;
  progress: number;
}

export interface Todo {
  id: string;
  goal_id: string;
  name: string;
  completed: boolean;
  priority: "none" | "low" | "medium" | "high" | null;
  due_date: string | null;
  created_at: string;
}

export interface CreateGoalInput {
  name: string;
  description: string;
  due_date: Date;
}

export interface CreateTodoInput {
  name: string;
  priority?: "none" | "low" | "medium" | "high";
  due_date?: Date | null;
}