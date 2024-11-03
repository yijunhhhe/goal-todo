"use client";

import { Goal } from "@/lib/types";
import { GoalCard } from "./goal-card";
import { Skeleton } from "@/components/ui/skeleton";

interface GoalGridProps {
  goals: Goal[];
  isLoading: boolean;
  onGoalsChange: () => void;
}

export function GoalGrid({ goals, isLoading, onGoalsChange }: GoalGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          No goals yet
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Create your first goal to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onGoalChange={onGoalsChange} />
      ))}
    </div>
  );
}