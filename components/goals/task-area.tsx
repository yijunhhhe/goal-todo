"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Goal, Todo } from "@/lib/types";
import { CreateTodo } from "@/components/goals/create-todo";
import { TodoQuickEdit } from "@/components/goals/todo-quick-edit";
import { EditGoalDialog } from "@/components/goals/edit-goal-dialog";
import { DeleteGoalDialog } from "@/components/goals/delete-goal-dialog";
import { Target, Calendar, Tag, MoreVertical, Plus, Eye, EyeOff, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TaskAreaProps {
  selectedGoal: Goal | null;
  todos: Todo[];
  onCreateTodo: (data: {
    name: string;
    description?: string;
    priority?: "low" | "medium" | "high" | null;
    due_date?: string | null;
    estimated_time?: number | null;
  }) => Promise<void>;
  onDeleteTodo: (todoId: string) => Promise<void>;
  onUpdateTodo: (todo: Todo) => Promise<void>;
  onToggleComplete: () => Promise<void>;
  onGoalUpdate: () => void;
  onGoalDelete?: () => void;
}

export function TaskArea({
  selectedGoal,
  todos,
  onCreateTodo,
  onDeleteTodo,
  onUpdateTodo,
  onToggleComplete,
  onGoalUpdate,
  onGoalDelete,
}: TaskAreaProps) {
  const [showCreateTodo, setShowCreateTodo] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isDeleteGoalOpen, setIsDeleteGoalOpen] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const filteredTodos = todos.filter(todo => showCompletedTasks || !todo.completed);
  const completedTasksCount = todos.filter(todo => todo.completed).length;

  if (!selectedGoal) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
        <Target className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Select a goal</h2>
        <p>Choose a goal from the sidebar to view and manage its tasks</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
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
                <DropdownMenuItem onClick={onToggleComplete}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {selectedGoal.is_completed ? "Mark as Active" : "Mark as Complete"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteGoalOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            {showCreateTodo ? (
              <CreateTodo 
                onSubmit={async (data) => {
                  await onCreateTodo(data);
                  setShowCreateTodo(false);
                }}
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
          </div>

          {completedTasksCount > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showCompletedTasks ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide {completedTasksCount} completed {completedTasksCount === 1 ? 'task' : 'tasks'}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show {completedTasksCount} completed {completedTasksCount === 1 ? 'task' : 'tasks'}
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {filteredTodos.map((todo) => (
              <TodoQuickEdit
                key={todo.id}
                todo={todo}
                onDelete={() => onDeleteTodo(todo.id)}
                onUpdate={onUpdateTodo}
              />
            ))}
          </div>
        </div>
      </div>

      <EditGoalDialog
        goal={selectedGoal}
        open={isEditGoalOpen}
        onOpenChange={setIsEditGoalOpen}
        onSuccess={() => {
          onGoalUpdate();
          setIsEditGoalOpen(false);
        }}
        onCategoriesChange={() => {}}
      />

      <DeleteGoalDialog
        goal={selectedGoal}
        open={isDeleteGoalOpen}
        onOpenChange={setIsDeleteGoalOpen}
        onSuccess={() => {
          if (onGoalDelete) {
            onGoalDelete();
          }
          setIsDeleteGoalOpen(false);
        }}
      />
    </div>
  );
}