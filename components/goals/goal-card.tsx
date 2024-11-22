"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Goal, Todo, Category } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TodoDialog } from "./todo-dialog";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, MoreVertical, Pencil, Tag, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { EditGoalDialog } from "./edit-goal-dialog";
import { DeleteGoalDialog } from "./delete-goal-dialog";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface GoalCardProps {
  goal: Goal & { todos: Todo[]; category?: Category };
  onGoalChange: () => void;
  onCategoriesChange: () => void;
}

export function GoalCard({ goal, onGoalChange, onCategoriesChange }: GoalCardProps) {
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const daysRemaining = Math.ceil(
    (new Date(goal.due_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysRemaining < 0;

  const toggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: !goal.is_completed })
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: goal.is_completed ? "Goal marked as active" : "Goal marked as complete",
        description: goal.is_completed ? 
          "The goal has been moved to active goals" : 
          "The goal has been moved to completed goals",
      });

      onGoalChange();
    } catch (error: any) {
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTotalEstimatedTime = () => {
    if (!goal.todos?.length) return 0;
    return goal.todos
      .filter(todo => !todo.completed)
      .reduce((total, todo) => total + (todo.estimated_time || 0), 0);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <>
      <Card className="relative">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">
              {goal.name}
              {goal.is_completed && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{goal.description}</p>
            {goal.category && (
              <Badge variant="secondary" className="mt-2 gap-1">
                <Tag className="h-3 w-3" />
                {goal.category.name}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleComplete}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {goal.is_completed ? "Mark as Active" : "Mark as Complete"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Due {format(new Date(goal.due_date), "PP")}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Clock
                className={cn(
                  "w-4 h-4",
                  isOverdue ? "text-red-500" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  isOverdue ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {isOverdue
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : `${daysRemaining} days remaining`}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Estimated: {formatTime(getTotalEstimatedTime())}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {goal.progress}%
              </span>
            </div>
            <Progress value={goal.progress} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsTodoDialogOpen(true)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Manage Tasks
          </Button>
        </CardFooter>
      </Card>

      <TodoDialog
        goalId={goal.id}
        open={isTodoDialogOpen}
        onOpenChange={setIsTodoDialogOpen}
        onTodosChange={onGoalChange}
      />

      <EditGoalDialog
        goal={goal}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onGoalChange}
        onCategoriesChange={onCategoriesChange}
      />

      <DeleteGoalDialog
        goal={goal}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={onGoalChange}
      />
    </>
  );
}