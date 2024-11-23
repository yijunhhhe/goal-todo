"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  Loader2, 
  Plus, 
  Trash, 
  Calendar as CalendarIcon2,
  ArrowUpDown,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { CreateTodoInput, Todo } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.date().nullable(),
  estimated_time: z.number().min(0).nullable().optional(),
});

type SortOption = "priority" | "due_date" | "none";

interface TodoDialogProps {
  goalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTodosChange: () => void;
}

export function TodoDialog({
  goalId,
  open,
  onOpenChange,
  onTodosChange,
}: TodoDialogProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [showCompleted, setShowCompleted] = useState(true);
  const { toast } = useToast();

  const form = useForm<CreateTodoInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      priority: undefined,
      due_date: null,
      estimated_time: null,
    },
  });

  useEffect(() => {
    if (open) {
      fetchTodos();
    }
  }, [open, goalId]);

  const sortTodos = (todos: Todo[]) => {
    let filteredTodos = showCompleted 
      ? [...todos]
      : todos.filter(todo => !todo.completed);

    switch (sortBy) {
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
        return filteredTodos.sort((a, b) => 
          (priorityOrder[a.priority || "none"] || 3) - (priorityOrder[b.priority || "none"] || 3)
        );
      case "due_date":
        return filteredTodos.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      default:
        return filteredTodos;
    }
  };

  async function fetchTodos() {
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      toast({
        title: "Error fetching todos",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: CreateTodoInput) {
    setIsSubmitting(true);
    try {
      const newTodo = {
        goal_id: goalId,
        name: values.name,
        priority: values.priority || null,
        due_date: values.due_date?.toISOString() || null,
        estimated_time: values.estimated_time || null,
      };

      const { data, error } = await supabase
        .from("todos")
        .insert([newTodo])
        .select()
        .single();

      if (error) throw error;

      // Update local todos state
      const updatedTodos = [...todos, data];
      setTodos(updatedTodos);

      // Calculate new progress
      const totalTodos = updatedTodos.length;
      const completedTodos = updatedTodos.filter(t => t.completed).length;
      const newProgress = Math.round((completedTodos / totalTodos) * 100);

      // Update goal progress
      const { error: goalError } = await supabase
        .from("goals")
        .update({ progress: newProgress })
        .eq("id", goalId);

      if (goalError) throw goalError;

      // Update parent goal state
      onTodosChange();

      form.reset();
      form.setValue('priority', undefined);
    } catch (error) {
      toast({
        title: "Error creating todo",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleTodo(todo: Todo) {
    // Optimistic update for todos
    setTodos(prev => prev.map(t => 
      t.id === todo.id 
        ? { ...t, completed: !t.completed, completed_time: !t.completed ? new Date().toISOString() : null }
        : t
    ));

    try {
      // Calculate new progress
      const updatedTodos = todos.map(t => 
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      );
      const totalTodos = updatedTodos.length;
      const completedTodos = updatedTodos.filter(t => t.completed).length;
      const newProgress = Math.round((completedTodos / totalTodos) * 100);

      // Update todo
      const { error: todoError } = await supabase
        .from("todos")
        .update({ 
          completed: !todo.completed,
          completed_time: todo.completed ? null : new Date().toISOString()
        })
        .eq("id", todo.id);

      if (todoError) throw todoError;

      // Update goal progress
      const { error: goalError } = await supabase
        .from("goals")
        .update({ progress: newProgress })
        .eq("id", goalId);

      if (goalError) throw goalError;

      // Update parent goal state
      onTodosChange();
    } catch (error) {
      // Revert optimistic update
      setTodos(prev => prev.map(t => 
        t.id === todo.id ? todo : t
      ));
      toast({
        title: "Error updating todo",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function deleteTodo(todo: Todo) {
    // Optimistic update
    setTodos(prev => prev.filter(t => t.id !== todo.id));

    try {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", todo.id);

      if (error) throw error;

      // Calculate new progress after deletion
      const updatedTodos = todos.filter(t => t.id !== todo.id);
      const totalTodos = updatedTodos.length;
      const completedTodos = updatedTodos.filter(t => t.completed).length;
      const newProgress = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);

      // Update goal progress
      const { error: goalError } = await supabase
        .from("goals")
        .update({ progress: newProgress })
        .eq("id", goalId);

      if (goalError) throw goalError;

      // Update parent goal state
      onTodosChange();
    } catch (error) {
      // Revert optimistic update
      setTodos(prev => [...prev, todo]);
      toast({
        title: "Error deleting todo",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Tasks</DialogTitle>
          <DialogDescription>
            Add and manage tasks for this goal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Priority (Optional)</FormLabel>
                        <Select
                          onValueChange={onChange}
                          value={value || ""}
                          {...field}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_time"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Est. Time (mins)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Time in mins"
                            value={value || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              onChange(val ? parseInt(val, 10) : null);
                            }}
                            min={0}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Task
              </Button>
            </form>
          </Form>

          <div className="mt-4 flex flex-col min-h-0 flex-1">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Tasks</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showCompleted}
                    onCheckedChange={setShowCompleted}
                    id="show-completed"
                  />
                  <label
                    htmlFor="show-completed"
                    className="text-sm text-muted-foreground"
                  >
                    Show completed
                  </label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sort by
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("none")}>
                      Default
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("priority")}>
                      Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("due_date")}>
                      Due Date
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1 border rounded-md">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : todos.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No tasks yet. Add your first task above.
                  </p>
                ) : (
                  sortTodos(todos).map((todo) => (
                    <div
                      key={todo.id}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                        todo.completed && "bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo)}
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              todo.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {todo.name}
                          </span>
                          {todo.priority && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs capitalize",
                                getPriorityColor(todo.priority)
                              )}
                            >
                              {todo.priority}
                            </Badge>
                          )}
                        </div>
                        {todo.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarIcon2 className="h-3 w-3" />
                            <span>Due {format(new Date(todo.due_date), "PPP")}</span>
                          </div>
                        )}
                        {todo.estimated_time && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{todo.estimated_time} mins</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo(todo)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}