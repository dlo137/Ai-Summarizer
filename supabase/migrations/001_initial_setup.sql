-- Create profiles table that extends the auth.users table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  full_name text,
  email text,
  subscription_plan text,
  subscription_status text default 'inactive',
  trial_end_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create RLS policies
create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Create documents table for storing user documents
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text,
  summary text,
  document_type text not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for documents
alter table public.documents enable row level security;

-- Create RLS policies for documents
create policy "Users can view their own documents"
  on public.documents for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own documents"
  on public.documents for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own documents"
  on public.documents for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own documents"
  on public.documents for delete
  using ( auth.uid() = user_id );

-- Create summaries table
create table public.summaries (
  id uuid default uuid_generate_v4() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for summaries
alter table public.summaries enable row level security;

-- Create RLS policies for summaries
create policy "Users can view their own summaries"
  on public.summaries for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own summaries"
  on public.summaries for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own summaries"
  on public.summaries for update
  using ( auth.uid() = user_id );

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.documents
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.summaries
  for each row
  execute procedure public.handle_updated_at();
