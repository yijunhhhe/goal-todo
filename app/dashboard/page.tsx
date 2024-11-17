"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { GoalGrid } from "@/components/goals/goal-grid";
import { useToast } from "@/components/ui/use-toast";
import { Goal, Todo } from "@/lib/types";

export default function DashboardPage() {
  const [goals, setGoals] = useState<(Goal & { todos: Todo[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*, todos(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching goals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const activeGoals = goals.filter(goal => !goal.is_completed);
  const completedGoals = goals.filter(goal => goal.is_completed);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Goals</h1>
        <Button onClick={() => setIsCreateGoalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
          <GoalGrid 
            goals={activeGoals} 
            isLoading={isLoading} 
            onGoalsChange={fetchGoals} 
          />
        </section>

        {completedGoals.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Completed Goals</h2>
            <GoalGrid 
              goals={completedGoals} 
              isLoading={isLoading} 
              onGoalsChange={fetchGoals} 
            />
          </section>
        )}
      </div>

      <CreateGoalDialog
        open={isCreateGoalOpen}
        onOpenChange={setIsCreateGoalOpen}
        onGoalCreated={fetchGoals}
      />
    </div>
  );
}