"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Goal, Todo } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { GoalSidebar } from "@/components/goals/goal-sidebar";
import { TaskArea } from "@/components/goals/task-area";
import { useRouter } from "next/navigation";

export default function NewGoalPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    if (selectedGoal) {
      fetchTodos(selectedGoal.id);
    }
  }, [selectedGoal]);

  async function fetchGoals() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("goals")
        .select(`
          *,
          categories (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);

      // Update selectedGoal if it exists in the new data
      if (selectedGoal) {
        const updatedSelectedGoal = data?.find(g => g.id === selectedGoal.id);
        if (updatedSelectedGoal) {
          setSelectedGoal(updatedSelectedGoal);
        }
      } else if (data && data.length > 0) {
        const activeGoal = data.find(g => !g.is_completed);
        if (activeGoal) {
          setSelectedGoal(activeGoal);
        }
      }
    } catch (error) {
      toast({
        title: "Error fetching goals",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTodos(goalId: string) {
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("goal_id", goalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      toast({
        title: "Error fetching todos",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function handleCreateTodo(data: {
    name: string;
    description?: string;
    priority?: "low" | "medium" | "high" | null;
    due_date?: string | null;
    estimated_time?: number | null;
  }) {
    if (!selectedGoal) return;

    try {
      const { error } = await supabase
        .from("todos")
        .insert([{
          goal_id: selectedGoal.id,
          name: data.name,
          priority: data.priority || null,
          due_date: data.due_date || null,
          estimated_time: data.estimated_time || null,
          completed: false
        }]);

      if (error) throw error;

      fetchTodos(selectedGoal.id);
      toast({
        title: "Task created",
        description: "New task has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteTodo(todoId: string) {
    if (!selectedGoal) return;

    try {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", todoId);

      if (error) throw error;
      
      fetchTodos(selectedGoal.id);
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error deleting task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function handleTodoUpdate(todo: Todo) {
    if (!selectedGoal) return;

    try {
      const { error } = await supabase
        .from("todos")
        .update(todo)
        .eq("id", todo.id);

      if (error) throw error;
      
      fetchTodos(selectedGoal.id);
    } catch (error) {
      toast({
        title: "Error updating task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function handleToggleComplete() {
    if (!selectedGoal) return;

    try {
      const { error } = await supabase
        .from("goals")
        .update({ is_completed: !selectedGoal.is_completed })
        .eq("id", selectedGoal.id);

      if (error) throw error;

      toast({
        title: selectedGoal.is_completed ? "Goal marked as active" : "Goal marked as complete",
        description: selectedGoal.is_completed ? 
          "The goal has been moved to active goals" : 
          "The goal has been moved to completed goals",
      });

      fetchGoals();
    } catch (error) {
      toast({
        title: "Error updating goal",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function handleGoalUpdate() {
    await fetchGoals();
  }

  async function handleGoalDelete() {
    setSelectedGoal(null);
    await fetchGoals();
    router.push('/goals');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <GoalSidebar
        goals={goals}
        selectedGoal={selectedGoal}
        showCompleted={showCompleted}
        onShowCompletedChange={setShowCompleted}
        onSelectGoal={setSelectedGoal}
      />
      <TaskArea
        selectedGoal={selectedGoal}
        todos={todos}
        onCreateTodo={handleCreateTodo}
        onDeleteTodo={handleDeleteTodo}
        onUpdateTodo={handleTodoUpdate}
        onToggleComplete={handleToggleComplete}
        onGoalUpdate={handleGoalUpdate}
        onGoalDelete={handleGoalDelete}
      />
    </div>
  );
}