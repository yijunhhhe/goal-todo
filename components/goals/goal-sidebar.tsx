"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Goal } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type GroupedGoals = {
  [key: string]: Goal[];
};

interface GoalSidebarProps {
  goals: Goal[];
  selectedGoal: Goal | null;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  onSelectGoal: (goal: Goal) => void;
}

export function GoalSidebar({
  goals,
  selectedGoal,
  showCompleted,
  onShowCompletedChange,
  onSelectGoal,
}: GoalSidebarProps) {
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

  const groupedGoals = groupGoalsByCategory(goals);

  return (
    <div className="w-[300px] flex-shrink-0 border-r bg-muted/30">
      <div className="p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => onShowCompletedChange(!showCompleted)}
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
                    onClick={() => onSelectGoal(goal)}
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
  );
}