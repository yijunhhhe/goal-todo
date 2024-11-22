import { Goal, Todo, Category, CreateCategoryInput } from './types';
import { supabase } from './supabase';

// Categories API
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(category: CreateCategoryInput) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Goals API
export async function getGoals() {
  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      todos (*),
      categories (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createGoal(goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'progress'>) {
  const { data, error } = await supabase
    .from('goals')
    .insert([goal])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, goal: Partial<Goal>) {
  const { data, error } = await supabase
    .from('goals')
    .update(goal)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Todos API
export async function createTodo(todo: Omit<Todo, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('todos')
    .insert([todo])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTodo(id: string, todo: Partial<Todo>) {
  const { data, error } = await supabase
    .from('todos')
    .update(todo)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTodo(id: string) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}