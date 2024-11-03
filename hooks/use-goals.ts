"use client";

import { useState, useEffect } from 'react';
import { Goal, Todo } from '@/lib/types';
import { getGoals } from '@/lib/database';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export function useGoals() {
  const [goals, setGoals] = useState<(Goal & { todos: Todo[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();

    // Subscribe to changes
    const goalsSubscription = supabase
      .channel('goals-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
        },
        () => fetchGoals()
      )
      .subscribe();

    const todosSubscription = supabase
      .channel('todos-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        () => fetchGoals()
      )
      .subscribe();

    return () => {
      goalsSubscription.unsubscribe();
      todosSubscription.unsubscribe();
    };
  }, []);

  async function fetchGoals() {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    goals,
    loading,
    refetch: fetchGoals,
  };
}