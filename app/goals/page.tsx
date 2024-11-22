"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { GoalGrid } from "@/components/goals/goal-grid";
import { useToast } from "@/components/ui/use-toast";
import { Goal, Todo, Category } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectContentWithDelete } from "@/components/ui/select-with-delete";

export default function GoalsPage() {
  const [goals, setGoals] = useState<(Goal & { todos: Todo[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to view your goals",
            variant: "destructive",
          });
          return;
        }

        await Promise.all([fetchGoals(), fetchCategories()]);
      } catch (error) {
        console.error("Error in initial data fetch:", error);
      }
    };

    fetchData();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function fetchGoals() {
    setIsLoading(true);
    try {
      console.log("Fetching goals...");
      const { data, error } = await supabase
        .from("goals")
        .select(`
          *,
          todos (*),
          categories (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched goals:", data);
      setGoals(data || []);
    } catch (error: any) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Error fetching goals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredGoals = goals.filter(goal => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "uncategorized") return !goal.category_id;
    return goal.category_id === selectedCategory;
  });

  const activeGoals = filteredGoals.filter(goal => !goal.is_completed);
  const completedGoals = filteredGoals.filter(goal => goal.is_completed);

  async function handleDeleteCategory(categoryId: string) {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
      
      // Refresh categories and goals (since goals might have been updated)
      await Promise.all([fetchCategories(), fetchGoals()]);
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">My Goals</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContentWithDelete>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <SelectItem value={category.id}>
                    {category.name}
                  </SelectItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent select from closing
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete category</span>
                  </Button>
                </div>
              ))}
            </SelectContentWithDelete>
          </Select>
          <Button onClick={() => setIsCreateGoalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </header>

      {goals.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No goals yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first goal to get started tracking your progress.
          </p>
          <Button onClick={() => setIsCreateGoalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-semibold mb-4">Active Goals ({activeGoals.length})</h2>
            <GoalGrid 
              goals={activeGoals} 
              isLoading={isLoading} 
              onGoalsChange={fetchGoals} 
              onCategoriesChange={fetchCategories} 
            />
          </section>

          {completedGoals.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Completed Goals ({completedGoals.length})</h2>
              <GoalGrid 
                goals={completedGoals} 
                isLoading={isLoading} 
                onGoalsChange={fetchGoals} 
                onCategoriesChange={fetchCategories} 
              />
            </section>
          )}
        </div>
      )}

      <CreateGoalDialog
        open={isCreateGoalOpen}
        onOpenChange={setIsCreateGoalOpen}
        onGoalCreated={fetchGoals}
        onCategoriesChange={fetchCategories}
      />
    </div>
  );
}