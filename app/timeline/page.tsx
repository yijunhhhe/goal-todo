"use client";

import { useEffect, useState } from "react";
import { format, isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Todo } from "@/lib/types";
import { Loader2, Target, Clock, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompletedTodo extends Todo {
  goals: {
    name: string;
  };
}

const ITEMS_PER_PAGE = 10;

type ViewMode = 'all' | 'weekly';

export default function TimelinePage() {
  const [todos, setTodos] = useState<CompletedTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const { toast } = useToast();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (viewMode === 'all') {
      fetchCompletedTodos();
    } else {
      fetchWeeklyTodos();
    }
  }, [viewMode, selectedWeek]);

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && viewMode === 'all') {
      loadMore();
    }
  }, [inView]);

  const groupTodosByDate = (todos: CompletedTodo[]) => {
    const groups: { [key: string]: CompletedTodo[] } = {};
    todos.forEach(todo => {
      const date = format(parseISO(todo.completed_time!), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(todo);
    });
    return groups;
  };

  async function fetchWeeklyTodos() {
    setIsLoading(true);
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Start week on Monday
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }); // End week on Sunday

      const { data, error } = await supabase
        .from("todos")
        .select(`
          *,
          goals (
            name
          )
        `)
        .eq("completed", true)
        .not("completed_time", "is", null)
        .gte("completed_time", weekStart.toISOString())
        .lte("completed_time", weekEnd.toISOString())
        .order("completed_time", { ascending: false });

      if (error) throw error;
      setTodos(data || []);
      setHasMore(false);
    } catch (error) {
      toast({
        title: "Error fetching timeline",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCompletedTodos() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("todos")
        .select(`
          *,
          goals (
            name
          )
        `)
        .eq("completed", true)
        .not("completed_time", "is", null)
        .order("completed_time", { ascending: false })
        .limit(ITEMS_PER_PAGE);

      if (error) throw error;
      setTodos(data || []);
      setHasMore(data?.length === ITEMS_PER_PAGE);
    } catch (error) {
      toast({
        title: "Error fetching timeline",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMore() {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const lastTodo = todos[todos.length - 1];
      const { data, error } = await supabase
        .from("todos")
        .select(`
          *,
          goals (
            name
          )
        `)
        .eq("completed", true)
        .not("completed_time", "is", null)
        .order("completed_time", { ascending: false })
        .lt("completed_time", lastTodo.completed_time)
        .limit(ITEMS_PER_PAGE);

      if (error) throw error;

      if (data) {
        setTodos(prev => [...prev, ...data]);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      toast({
        title: "Error loading more items",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  const getPriorityColor = (priority: Todo["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const groupedTodos = groupTodosByDate(todos);
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">Achievement Timeline</h1>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select
            value={viewMode}
            onValueChange={(value: ViewMode) => setViewMode(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === 'weekly' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedWeek(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-[150px] justify-center">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedWeek(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
                disabled={isSameDay(new Date(), selectedWeek)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {viewMode === 'weekly' 
              ? 'No completed tasks this week'
              : 'No completed tasks yet'}
          </h2>
          <p className="text-muted-foreground">
            {viewMode === 'weekly'
              ? 'Complete some tasks this week to see them here!'
              : 'Complete some tasks to start building your timeline!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTodos).map(([date, todos]) => (
            <div key={date} className="relative">
              <div className="sticky top-4 z-10 mb-4">
                <h2 className="inline-block bg-background px-4 py-2 text-sm font-semibold rounded-full border">
                  {format(parseISO(date), "MMMM d, yyyy")}
                </h2>
              </div>
              
              <div className="relative border-l-2 border-muted ml-4 md:ml-8 space-y-6">
                {todos.map((todo) => (
                  <div key={todo.id} className="relative">
                    {/* Timeline dot and time */}
                    <div className="absolute -left-[9px] mt-7 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <div className="absolute -left-36 mt-6 w-24 text-right">
                      <time className="text-sm text-muted-foreground">
                        {format(parseISO(todo.completed_time!), "h:mm a")}
                      </time>
                    </div>
                    
                    {/* Content */}
                    <div className="ml-8 md:ml-12">
                      <Card className="p-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-background">
                        <div className="space-y-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-lg">{todo.name}</h3>
                              {todo.priority && (
                                <Badge className={cn(
                                  "capitalize px-3 py-1",
                                  getPriorityColor(todo.priority)
                                )}>
                                  {todo.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1.5 px-2 py-1 transition-colors"
                              >
                                <Target className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                  {todo.goals.name}
                                </span>
                              </Badge>
                            </div>
                          </div>

                          {/* Additional details */}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {todo.due_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(parseISO(todo.due_date), "MMM d")}</span>
                              </div>
                            )}
                            {todo.estimated_time && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{todo.estimated_time} mins</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {viewMode === 'all' && hasMore && (
            <div
              ref={ref}
              className="flex justify-center mt-8"
            >
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="gap-2"
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}