"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';
import { Todo, Goal } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

const encouragements = [
  "You've got this! 💪",
  "Making progress feels great! 🌟",
  "Stay focused, you're doing great! 🎯",
  "Every step counts! 🚀",
];

interface StoredState {
  selectedGoalId?: string;
  currentTaskId?: string;
}

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [currentTask, setCurrentTask] = useState<Todo | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const storedState = localStorage.getItem('dashboardState');
        if (storedState) {
          const { selectedGoalId, currentTaskId } = JSON.parse(storedState) as StoredState;
          
          if (selectedGoalId) {
            const { data: goals } = await supabase
              .from('goals')
              .select(`
                *,
                todos (*)
              `)
              .eq('is_completed', false);

            if (goals && goals.length > 0) {
              const goal = goals.find(g => g.id === selectedGoalId);
              if (goal) {
                setSelectedGoal(goal);
                if (currentTaskId) {
                  const task = goal.todos?.find((todo: Todo) => todo.id === currentTaskId && !todo.completed);
                  if (task) {
                    setCurrentTask(task);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error restoring state:', error);
      } finally {
        await fetchGoals();
        setIsInitialLoading(false);
      }
    };

    restoreState();
  }, []);

  useEffect(() => {
    if (selectedGoal?.id || currentTask?.id) {
      const state: StoredState = {
        selectedGoalId: selectedGoal?.id,
        currentTaskId: currentTask?.id
      };
      localStorage.setItem('dashboardState', JSON.stringify(state));
    }
  }, [selectedGoal?.id, currentTask?.id]);

  async function fetchGoals() {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          todos (
            *
          )
        `)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      toast({
        title: "Error fetching goals",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleStartTask = (task: Todo) => {
    setCurrentTask(task);
  };

  const handleBack = () => {
    if (currentTask) {
      setCurrentTask(null);
      setSelectedGoal(null);
      localStorage.removeItem('dashboardState');
    } else if (selectedGoal) {
      setSelectedGoal(null);
      localStorage.removeItem('dashboardState');
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ 
          completed: true,
          completed_time: new Date().toISOString()
        })
        .eq('id', currentTask.id);

      if (error) throw error;

      localStorage.removeItem('dashboardState');

      setShowCelebration(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => {
        setShowCelebration(false);
        setCurrentTask(null);
        setSelectedGoal(null);
        fetchGoals();
      }, 3000);

    } catch (error) {
      toast({
        title: "Error completing task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const randomEncouragement = () => {
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {(selectedGoal || currentTask) && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <Link href="/goals">
          <Button>View Goals</Button>
        </Link>
      </header>

      <AnimatePresence mode="wait">
        {!selectedGoal && !currentTask && !showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6"
          >
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Which goal would you like to work on?</h2>
              {goals.length === 0 ? (
                <p className="text-gray-600">
                  No active goals available. Create some goals to get started!
                </p>
              ) : (
                <div className="grid gap-4">
                  {goals.map((goal) => {
                    const incompleteTodos = goal.todos?.filter(todo => !todo.completed) || [];
                    if (incompleteTodos.length === 0) return null;

                    return (
                      <button
                        key={goal.id}
                        onClick={() => handleSelectGoal(goal)}
                        className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                      >
                        <h3 className="font-medium">{goal.name}</h3>
                        <p className="text-sm text-gray-600">{goal.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {incompleteTodos.length} tasks remaining
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {selectedGoal && !currentTask && !showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6"
          >
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">{selectedGoal.name}</h2>
              <p className="text-gray-600 mb-4">{selectedGoal.description}</p>
              <h3 className="font-medium mb-3">Choose a task to work on:</h3>
              <div className="grid gap-4">
                {selectedGoal.todos
                  ?.filter(todo => !todo.completed)
                  .map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => handleStartTask(todo)}
                      className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{todo.name}</h3>
                        {todo.priority && (
                          <span className={`text-xs px-2 py-1 rounded-full
                            ${todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                              todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'}`}>
                            {todo.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                        {todo.due_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>Due: {format(new Date(todo.due_date), "PP")}</span>
                          </div>
                        )}
                        {todo.estimated_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{todo.estimated_time} mins</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentTask && !showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentTask.name}
                </h2>
                <div className="flex items-center justify-between">
                  <p className="text-indigo-600">
                    From goal: {selectedGoal?.name}
                  </p>
                  <p className="text-indigo-600 font-medium italic">
                    {randomEncouragement()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentTask.due_date && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Due Date</p>
                      <p className="text-gray-900">
                        {format(new Date(currentTask.due_date), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                
                {currentTask.estimated_time && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Estimated Time</p>
                      <p className="text-gray-900">
                        {currentTask.estimated_time} minutes
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {currentTask.priority && (
                <div className="flex justify-center">
                  <span className={`
                    px-4 py-1.5 rounded-full text-sm font-medium
                    ${currentTask.priority === 'high' ? 'bg-red-50 text-red-700' :
                      currentTask.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-green-50 text-green-700'}
                  `}>
                    {currentTask.priority.charAt(0).toUpperCase() + currentTask.priority.slice(1)} Priority
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleCompleteTask} 
                className="w-full h-14 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Complete Task ✨
              </Button>

              <button
                onClick={handleBack}
                className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Choose a different task
              </button>
            </div>

            <div className="mt-8 bg-blue-50 rounded-xl p-6">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span> Quick Tips
              </h4>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Break your task into smaller steps
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Take short breaks every 25 minutes
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Remove distractions from your environment
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {showCelebration && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="p-6 border rounded-lg text-center"
          >
            <h2 className="text-2xl font-bold text-indigo-600 mb-2">
              🎉 Wonderful Job! 🎉
            </h2>
            <p className="text-gray-600">
              You've completed your task. Get ready for the next one!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}