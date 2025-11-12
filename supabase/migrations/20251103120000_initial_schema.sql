-- migration: initial_schema
-- purpose: create core database schema for 10xCards application
-- affected tables: flashcards, generations, generation_error_logs
-- special considerations:
--   - users table is managed by supabase auth (not created here)
--   - rls policies are granular (one per operation and role)
--   - automatic updated_at trigger for flashcards table

-- ============================================================================
-- table: generations
-- description: tracks ai generation sessions with metadata and statistics
-- note: created first because flashcards table references it
-- ============================================================================

create table generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security
alter table generations enable row level security;

-- rls policy: allow authenticated users to select their own generations
create policy "authenticated users can select own generations"
  on generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own generations
create policy "authenticated users can insert own generations"
  on generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own generations
create policy "authenticated users can update own generations"
  on generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own generations
create policy "authenticated users can delete own generations"
  on generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: deny anonymous users from selecting generations
create policy "anonymous users cannot select generations"
  on generations
  for select
  to anon
  using (false);

-- rls policy: deny anonymous users from inserting generations
create policy "anonymous users cannot insert generations"
  on generations
  for insert
  to anon
  with check (false);

-- rls policy: deny anonymous users from updating generations
create policy "anonymous users cannot update generations"
  on generations
  for update
  to anon
  using (false);

-- rls policy: deny anonymous users from deleting generations
create policy "anonymous users cannot delete generations"
  on generations
  for delete
  to anon
  using (false);

-- ============================================================================
-- table: flashcards
-- description: stores user-generated flashcards with ai/manual source tracking
-- ============================================================================

create table flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generation_id bigint references generations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- enable row level security
alter table flashcards enable row level security;

-- rls policy: allow authenticated users to select their own flashcards
create policy "authenticated users can select own flashcards"
  on flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own flashcards
create policy "authenticated users can insert own flashcards"
  on flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own flashcards
create policy "authenticated users can update own flashcards"
  on flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own flashcards
create policy "authenticated users can delete own flashcards"
  on flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: deny anonymous users from selecting flashcards
create policy "anonymous users cannot select flashcards"
  on flashcards
  for select
  to anon
  using (false);

-- rls policy: deny anonymous users from inserting flashcards
create policy "anonymous users cannot insert flashcards"
  on flashcards
  for insert
  to anon
  with check (false);

-- rls policy: deny anonymous users from updating flashcards
create policy "anonymous users cannot update flashcards"
  on flashcards
  for update
  to anon
  using (false);

-- rls policy: deny anonymous users from deleting flashcards
create policy "anonymous users cannot delete flashcards"
  on flashcards
  for delete
  to anon
  using (false);

-- ============================================================================
-- table: generation_error_logs
-- description: logs errors from failed ai generation attempts
-- ============================================================================

create table generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- enable row level security
alter table generation_error_logs enable row level security;

-- rls policy: allow authenticated users to select their own error logs
create policy "authenticated users can select own error logs"
  on generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own error logs
create policy "authenticated users can insert own error logs"
  on generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own error logs
create policy "authenticated users can update own error logs"
  on generation_error_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own error logs
create policy "authenticated users can delete own error logs"
  on generation_error_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: deny anonymous users from selecting error logs
create policy "anonymous users cannot select error logs"
  on generation_error_logs
  for select
  to anon
  using (false);

-- rls policy: deny anonymous users from inserting error logs
create policy "anonymous users cannot insert error logs"
  on generation_error_logs
  for insert
  to anon
  with check (false);

-- rls policy: deny anonymous users from updating error logs
create policy "anonymous users cannot update error logs"
  on generation_error_logs
  for update
  to anon
  using (false);

-- rls policy: deny anonymous users from deleting error logs
create policy "anonymous users cannot delete error logs"
  on generation_error_logs
  for delete
  to anon
  using (false);

-- ============================================================================
-- indexes
-- description: optimize query performance for common access patterns
-- ============================================================================

-- index on flashcards.user_id for filtering user's flashcards
create index idx_flashcards_user_id on flashcards(user_id);

-- index on flashcards.generation_id for joining with generations
create index idx_flashcards_generation_id on flashcards(generation_id);

-- index on generations.user_id for filtering user's generations
create index idx_generations_user_id on generations(user_id);

-- index on generation_error_logs.user_id for filtering user's error logs
create index idx_generation_error_logs_user_id on generation_error_logs(user_id);

-- ============================================================================
-- trigger: auto_update_flashcards_updated_at
-- description: automatically update updated_at column on flashcards modification
-- ============================================================================

-- function to update updated_at timestamp
-- security: set search_path to prevent malicious schema injection
create or replace function update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- trigger to call the function before each update on flashcards
create trigger auto_update_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();
