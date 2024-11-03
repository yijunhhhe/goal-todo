-- Enable RLS (Row Level Security)
alter database postgres set "auth.jwt.claims.sub" to 'user_id';

-- Create tables
create table public.goals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text not null,
    due_date timestamp with time zone not null,
    created_at timestamp with time zone default now() not null,
    progress integer default 0
);

create table public.todos (
    id uuid default gen_random_uuid() primary key,
    goal_id uuid references public.goals(id) on delete cascade not null,
    name text not null,
    completed boolean default false not null,
    priority text check (priority in ('none', 'low', 'medium', 'high', null)),
    due_date timestamp with time zone,
    created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.goals enable row level security;
alter table public.todos enable row level security;

-- Create policies
create policy "Users can view their own goals"
    on public.goals for select
    using (auth.uid() = user_id);

create policy "Users can insert their own goals"
    on public.goals for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own goals"
    on public.goals for update
    using (auth.uid() = user_id);

create policy "Users can delete their own goals"
    on public.goals for delete
    using (auth.uid() = user_id);

create policy "Users can view todos of their goals"
    on public.todos for select
    using (
        exists (
            select 1 from public.goals
            where goals.id = todos.goal_id
            and goals.user_id = auth.uid()
        )
    );

create policy "Users can insert todos to their goals"
    on public.todos for insert
    with check (
        exists (
            select 1 from public.goals
            where goals.id = todos.goal_id
            and goals.user_id = auth.uid()
        )
    );

create policy "Users can update todos of their goals"
    on public.todos for update
    using (
        exists (
            select 1 from public.goals
            where goals.id = todos.goal_id
            and goals.user_id = auth.uid()
        )
    );

create policy "Users can delete todos of their goals"
    on public.todos for delete
    using (
        exists (
            select 1 from public.goals
            where goals.id = todos.goal_id
            and goals.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
create index goals_user_id_idx on public.goals(user_id);
create index todos_goal_id_idx on public.todos(goal_id);
create index goals_due_date_idx on public.goals(due_date);
create index todos_due_date_idx on public.todos(due_date);

-- Create function to update goal progress
create or replace function public.update_goal_progress()
returns trigger as $$
begin
    update public.goals
    set progress = (
        select
            case
                when count(*) = 0 then 0
                else round((count(*) filter (where completed = true)::numeric / count(*)::numeric) * 100)
            end
        from public.todos
        where goal_id = new.goal_id
    )
    where id = new.goal_id;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically update goal progress
create trigger update_goal_progress_after_todo_change
    after insert or update or delete
    on public.todos
    for each row
    execute function public.update_goal_progress();