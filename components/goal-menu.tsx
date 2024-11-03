"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Goal } from "@/lib/types";
import { EditGoalDialog } from "@/components/goals/edit-goal-dialog";
import { DeleteGoalDialog } from "@/components/goals/delete-goal-dialog";

interface GoalMenuProps {
  goal: Goal;
  onSuccess: () => void;
}

export function GoalMenu({ goal, onSuccess }: GoalMenuProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            setShowEditDialog(true);
          }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Goal
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Goal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditGoalDialog
        goal={goal}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onSuccess}
      />

      <DeleteGoalDialog
        goal={goal}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onSuccess}
      />
    </>
  );
}