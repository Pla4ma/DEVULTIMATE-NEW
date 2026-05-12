-- ============================================================
-- Noctra / BuildWorth — Supabase Schema
-- Run this in the Supabase SQL Editor to initialize all tables,
-- RLS policies, and indexes.
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- TABLE: profiles
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

create policy "profiles: delete own" on profiles
  for delete using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: projects
-- ─────────────────────────────────────────────────────────────
create table if not exists projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  idea       text,
  stage      text not null default 'idea',
  status     text not null default 'active',
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "projects: select own" on projects
  for select using (auth.uid() = user_id);

create policy "projects: insert own" on projects
  for insert with check (auth.uid() = user_id);

create policy "projects: update own" on projects
  for update using (auth.uid() = user_id);

create policy "projects: delete own" on projects
  for delete using (auth.uid() = user_id);

create index if not exists idx_projects_user_created
  on projects(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- TABLE: reports
-- ─────────────────────────────────────────────────────────────
create table if not exists reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  tool       text not null,
  title      text not null,
  summary    text,
  score      integer,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "reports: select own" on reports
  for select using (auth.uid() = user_id);

create policy "reports: insert own" on reports
  for insert with check (auth.uid() = user_id);

create policy "reports: update own" on reports
  for update using (auth.uid() = user_id);

create policy "reports: delete own" on reports
  for delete using (auth.uid() = user_id);

create index if not exists idx_reports_user_tool_created
  on reports(user_id, tool, created_at desc);

create index if not exists idx_reports_user_project
  on reports(user_id, project_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: tasks
-- ─────────────────────────────────────────────────────────────
create table if not exists tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  project_id         uuid references projects(id) on delete set null,
  source_report_id   uuid references reports(id) on delete set null,
  title              text not null,
  detail             text,
  priority           text not null default 'medium',
  status             text not null default 'todo',
  category           text not null default 'development',
  acceptance_criteria text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "tasks: select own" on tasks
  for select using (auth.uid() = user_id);

create policy "tasks: insert own" on tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks: update own" on tasks
  for update using (auth.uid() = user_id);

create policy "tasks: delete own" on tasks
  for delete using (auth.uid() = user_id);

create index if not exists idx_tasks_user_status_priority
  on tasks(user_id, status, priority);

create index if not exists idx_tasks_user_project
  on tasks(user_id, project_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: proof_signals
-- ─────────────────────────────────────────────────────────────
create table if not exists proof_signals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  label      text not null,
  kind       text not null,
  value      numeric,
  weight     integer not null default 1,
  source     text,
  evidence   text,
  created_at timestamptz not null default now()
);

alter table proof_signals enable row level security;

create policy "proof_signals: select own" on proof_signals
  for select using (auth.uid() = user_id);

create policy "proof_signals: insert own" on proof_signals
  for insert with check (auth.uid() = user_id);

create policy "proof_signals: update own" on proof_signals
  for update using (auth.uid() = user_id);

create policy "proof_signals: delete own" on proof_signals
  for delete using (auth.uid() = user_id);

create index if not exists idx_proof_signals_user_project
  on proof_signals(user_id, project_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: scans
-- ─────────────────────────────────────────────────────────────
create table if not exists scans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  report_id  uuid references reports(id) on delete set null,
  kind       text not null default 'zip',
  file_name  text not null,
  summary    text,
  score      integer,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table scans enable row level security;

create policy "scans: select own" on scans
  for select using (auth.uid() = user_id);

create policy "scans: insert own" on scans
  for insert with check (auth.uid() = user_id);

create policy "scans: update own" on scans
  for update using (auth.uid() = user_id);

create policy "scans: delete own" on scans
  for delete using (auth.uid() = user_id);

create index if not exists idx_scans_user_project_kind
  on scans(user_id, project_id, kind);

-- ─────────────────────────────────────────────────────────────
-- TABLE: prompt_packs
-- ─────────────────────────────────────────────────────────────
create table if not exists prompt_packs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  name       text not null,
  tool       text not null,
  prompts    jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table prompt_packs enable row level security;

create policy "prompt_packs: select own" on prompt_packs
  for select using (auth.uid() = user_id);

create policy "prompt_packs: insert own" on prompt_packs
  for insert with check (auth.uid() = user_id);

create policy "prompt_packs: update own" on prompt_packs
  for update using (auth.uid() = user_id);

create policy "prompt_packs: delete own" on prompt_packs
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: sprints
-- ─────────────────────────────────────────────────────────────
create table if not exists sprints (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  name       text not null,
  goal       text,
  status     text not null default 'active',
  starts_at  timestamptz,
  ends_at    timestamptz,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sprints enable row level security;

create policy "sprints: select own" on sprints
  for select using (auth.uid() = user_id);

create policy "sprints: insert own" on sprints
  for insert with check (auth.uid() = user_id);

create policy "sprints: update own" on sprints
  for update using (auth.uid() = user_id);

create policy "sprints: delete own" on sprints
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: score_events
-- ─────────────────────────────────────────────────────────────
create table if not exists score_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  tool       text not null,
  score      integer not null,
  delta      integer,
  context    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table score_events enable row level security;

create policy "score_events: select own" on score_events
  for select using (auth.uid() = user_id);

create policy "score_events: insert own" on score_events
  for insert with check (auth.uid() = user_id);

create policy "score_events: update own" on score_events
  for update using (auth.uid() = user_id);

create policy "score_events: delete own" on score_events
  for delete using (auth.uid() = user_id);
