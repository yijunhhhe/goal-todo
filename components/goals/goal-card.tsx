"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Goal } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TodoDialog } from "./todo-dialog";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
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

interface GoalCardProps {
  goal: Goal;
  onGoalChange: () => void;
}

export function GoalCard({ goal, onGoalChange }: GoalCardProps) {
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const daysRemaining = Math.ceil(
    (new Date(goal.due_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysRemaining < 0;

  return (
    <>
      <Card className="relative">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">
              {goal.name}
            </h3>
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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