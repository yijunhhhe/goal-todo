"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon, 
  Flag,
  Clock,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface CreateTodoProps {
  onSubmit: (data: {
    name: string;
    description?: string;
    priority?: "low" | "medium" | "high" | null;
    due_date?: string | null;
    estimated_time?: number | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CreateTodo({ onSubmit, onCancel }: CreateTodoProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const { toast } = useToast();

  const getPriorityColor = (priority: "low" | "medium" | "high" | null) => {
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

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate?.toISOString() || null,
        estimated_time: estimatedTime,
      });
    } catch (error) {
      toast({
        title: "Error creating task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-4 space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Task name"
          className="w-full text-lg bg-transparent border-none outline-none focus:ring-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          autoFocus
        />
        
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="min-h-[60px] resize-none bg-transparent border-none focus:ring-0"
        />

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2",
                  dueDate && "text-primary"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {dueDate ? format(dueDate, "MMM d") : "Due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate || undefined}
                onSelect={(date: Date | undefined) => setDueDate(date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select
            value={priority || "none"}
            onValueChange={(value) => setPriority(value === "none" ? null : value as typeof priority)}
          >
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center gap-2">
                <Flag className={getPriorityColor(priority)} />
                <span>{priority ? `${priority} priority` : "Priority"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const time = window.prompt("Estimated time in minutes:", estimatedTime?.toString() || "");
              if (time !== null) {
                setEstimatedTime(time ? parseInt(time, 10) : null);
              }
            }}
          >
            <Clock className="h-4 w-4" />
            {estimatedTime ? `${estimatedTime}m` : "Estimate"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Add task
        </Button>
      </div>
    </div>
  );
}