"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Calendar, ChevronRight, Target, MoreVertical, Clock, ChevronDown, CheckCircle2, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Goal, Todo, Category } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateTodo } from "@/components/goals/create-todo";
import { TodoQuickEdit } from "@/components/goals/todo-quick-edit";
import { Badge } from "@/components/ui/badge";
import { EditGoalDialog } from "@/components/goals/edit-goal-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type GroupedGoals = {
  [key: string]: Goal[];
};

export default function NewGoalPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTodo, setShowCreateTodo] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

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
      if (data && data.length > 0 && !selectedGoal) {
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

  const groupGoalsByCategory = (goals: Goal[]) => {
    const filtered = goals.filter(goal => showCompleted || !goal.is_completed);
    return filtered.reduce((acc: GroupedGoals, goal) => {
      const categoryName = goal.categories?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(goal);
      return acc;
    }, {});
  };

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
      setShowCreateTodo(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const groupedGoals = groupGoalsByCategory(goals);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Goals Sidebar - Fixed width */}
      <div className="w-[300px] flex-shrink-0 border-r bg-muted/30">
        <div className="p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <ChevronDown className={cn(
              "h-4 w-4 mr-2 transition-transform",
              showCompleted && "rotate-180"
            )} />
            {showCompleted ? "Hide completed goals" : "Show completed goals"}
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <div className="space-y-4 p-2">
            {Object.entries(groupedGoals).map(([category, goals]) => (
              <Collapsible key={category} defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                  <Tag className="h-4 w-4" />
                  {category}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        selectedGoal?.id === goal.id && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className={cn(
                            "font-medium truncate",
                            goal.is_completed && "line-through text-muted-foreground"
                          )}>
                            {goal.name}
                          </h3>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Tasks Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedGoal ? (
          <>
            <div className="p-6 border-b">
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h1 className={cn(
                      "text-2xl font-bold",
                      selectedGoal.is_completed && "line-through text-muted-foreground"
                    )}>
                      {selectedGoal.name}
                    </h1>
                    <p className="text-muted-foreground">{selectedGoal.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due {format(new Date(selectedGoal.due_date), "PP")}</span>
                      </div>
                      {selectedGoal.categories && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {selectedGoal.categories.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditGoalOpen(true)}>
                        Edit Goal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleToggleComplete}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {selectedGoal.is_completed ? "Mark as Active" : "Mark as Complete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                {showCreateTodo ? (
                  <CreateTodo 
                    onSubmit={handleCreateTodo} 
                    onCancel={() => setShowCreateTodo(false)}
                  />
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowCreateTodo(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                )}

                <div className="space-y-1">
                  {todos.map((todo) => (
                    <TodoQuickEdit
                      key={todo.id}
                      todo={todo}
                      onDelete={() => handleDeleteTodo(todo.id)}
                      onUpdate={handleTodoUpdate}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
            <Target className="w-12 h-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a goal</h2>
            <p>Choose a goal from the sidebar to view and manage its tasks</p>
          </div>
        )}
      </div>

      {selectedGoal && (
        <EditGoalDialog
          goal={selectedGoal}
          open={isEditGoalOpen}
          onOpenChange={setIsEditGoalOpen}
          onSuccess={() => {
            fetchGoals();
            setIsEditGoalOpen(false);
          }}
          onCategoriesChange={() => {}}
        />
      )}
    </div>
  );
}