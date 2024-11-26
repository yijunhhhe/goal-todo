"use client";

import { useState } from "react";
import { Todo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon, 
  Flag, 
  MoreHorizontal,
  Trash2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TodoQuickEditProps {
  todo: Todo;
  onDelete: () => void;
  onUpdate: (todo: Todo) => void;
}

export function TodoQuickEdit({ todo, onDelete, onUpdate }: TodoQuickEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(todo.name);
  const { toast } = useToast();

  const getPriorityColor = (priority: Todo["priority"] | "none") => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-orange-500";
      case "low":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  async function handleUpdate(updates: Partial<Todo>) {
    try {
      const { data, error } = await supabase
        .from("todos")
        .update(updates)
        .eq("id", todo.id)
        .select()
        .single();

      if (error) throw error;
      onUpdate(data);
    } catch (error) {
      toast({
        title: "Error updating todo",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (name.trim() !== todo.name) {
      handleUpdate({ name: name.trim() });
    }
    setIsEditing(false);
  }

  return (
    <div className={cn(
      "group flex items-center gap-3 px-4 py-2.5 transition-colors border-b last:border-b-0",
      "hover:bg-accent/50"
    )}>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => {
          handleUpdate({ 
            completed: checked as boolean,
            completed_time: checked ? new Date().toISOString() : null
          });
        }}
        className="h-5 w-5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className={cn(
                "text-sm bg-transparent border-none outline-none focus:ring-0 w-full",
                todo.completed && "line-through text-muted-foreground"
              )}
              autoFocus
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className={cn(
                "text-sm cursor-text",
                todo.completed && "line-through text-muted-foreground"
              )}
            >
              {todo.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {todo.priority && (
            <div className="flex items-center gap-1 text-xs">
              <Flag className={cn("h-3 w-3", getPriorityColor(todo.priority))} />
              <span className="text-muted-foreground capitalize">
                {todo.priority}
              </span>
            </div>
          )}
          {todo.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              <span>{format(new Date(todo.due_date), "MMM d")}</span>
            </div>
          )}
          {todo.estimated_time && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{todo.estimated_time}m</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={todo.due_date ? new Date(todo.due_date) : undefined}
              onSelect={(date) => handleUpdate({ due_date: date?.toISOString() || null })}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select
          value={todo.priority || "none"}
          onValueChange={(value) => 
            handleUpdate({ priority: value === "none" ? null : value as Todo["priority"] })
          }
        >
          <SelectTrigger className="w-8 h-8 p-0 border-0">
            <Flag className={cn(
              "h-4 w-4",
              getPriorityColor(todo.priority || "none")
            )} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="none">No Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                const time = window.prompt("Estimated time in minutes:", todo.estimated_time?.toString() || "");
                if (time !== null) {
                  handleUpdate({ 
                    estimated_time: time ? parseInt(time, 10) : null 
                  });
                }
              }}
            >
              Set Time Estimate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}