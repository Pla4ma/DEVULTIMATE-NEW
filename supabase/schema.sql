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
-- TABLE: projects (2026 enhanced)
-- ─────────────────────────────────────────────────────────────
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  idea         text,
  stage        text not null default 'idea',
  status       text not null default 'active',
  github_repo  text,
  github_branch text default 'main',
  last_scan_at timestamptz,
  meta         jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
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

create index if not exists idx_prompt_packs_user_project
  on prompt_packs(user_id, project_id);

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

create index if not exists idx_sprints_user_project
  on sprints(user_id, project_id);

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

create index if not exists idx_score_events_user_project_created
  on score_events(user_id, project_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- TABLE: user_plans (subscription state)
-- ─────────────────────────────────────────────────────────────
create table if not exists user_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade unique,
  plan              text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'active',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_ends_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table user_plans enable row level security;

create policy "user_plans: select own" on user_plans
  for select using (auth.uid() = user_id);

create policy "user_plans: insert own" on user_plans
  for insert with check (auth.uid() = user_id);

create policy "user_plans: update own" on user_plans
  for update using (auth.uid() = user_id);

create index if not exists idx_user_plans_user on user_plans(user_id);
create index if not exists idx_user_plans_plan on user_plans(plan);
create index if not exists idx_user_plans_stripe on user_plans(stripe_subscription_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: usage_logs (per-request usage tracking)
-- ─────────────────────────────────────────────────────────────
create table if not exists usage_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  route           text not null,
  tool            text,
  provider        text,
  model           text,
  tokens_estimated integer,
  cost_estimated  numeric,
  success         boolean not null default true,
  error_message   text,
  ip_address      text,
  created_at      timestamptz not null default now()
);

alter table usage_logs enable row level security;

create policy "usage_logs: select own" on usage_logs
  for select using (auth.uid() = user_id);

create policy "usage_logs: insert own" on usage_logs
  for insert with check (auth.uid() = user_id);

create index if not exists idx_usage_logs_user_created on usage_logs(user_id, created_at desc);
create index if not exists idx_usage_logs_user_route_date on usage_logs(user_id, route, created_at desc);
create index if not exists idx_usage_logs_created on usage_logs(created_at);

-- ─────────────────────────────────────────────────────────────
-- TABLE: billing_invoices (stripe invoice records)
-- ─────────────────────────────────────────────────────────────
create table if not exists billing_invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  stripe_invoice_id text unique,
  amount          integer not null,
  currency        text not null default 'usd',
  status          text not null,
  invoice_url     text,
  paid_at         timestamptz,
  period_start    timestamptz,
  period_end      timestamptz,
  created_at      timestamptz not null default now()
);

alter table billing_invoices enable row level security;

create policy "billing_invoices: select own" on billing_invoices
  for select using (auth.uid() = user_id);

create policy "billing_invoices: insert own" on billing_invoices
  for insert with check (auth.uid() = user_id);

create policy "billing_invoices: update own" on billing_invoices
  for update using (auth.uid() = user_id);

create policy "billing_invoices: delete own" on billing_invoices
  for delete using (auth.uid() = user_id);

create index if not exists idx_billing_invoices_user on billing_invoices(user_id);

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: automatically create user_plan on signup
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.user_plans (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: daily usage summary (for quota enforcement)
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_daily_usage(p_user_id uuid, p_date date default current_date)
returns table (
  route text,
  call_count bigint
)
language sql
security definer set search_path = ''
as $$
  select route, count(*)::bigint as call_count
  from usage_logs
  where user_id = p_user_id
    and created_at::date = p_date
  group by route;
$$;

-- ─────────────────────────────────────────────────────────────
-- TABLE: project_members (collaboration)
-- ─────────────────────────────────────────────────────────────
create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table project_members enable row level security;

create policy "project_members: select own" on project_members
  for select using (auth.uid() = user_id);

create policy "project_members: insert own" on project_members
  for insert with check (auth.uid() = user_id);

create policy "project_members: delete own" on project_members
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: ai_sessions (chat persistence)
-- ─────────────────────────────────────────────────────────────
create table if not exists ai_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  tool       text not null,
  messages   jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_sessions enable row level security;

create policy "ai_sessions: select own" on ai_sessions
  for select using (auth.uid() = user_id);

create policy "ai_sessions: insert own" on ai_sessions
  for insert with check (auth.uid() = user_id);

create policy "ai_sessions: update own" on ai_sessions
  for update using (auth.uid() = user_id);

create policy "ai_sessions: delete own" on ai_sessions
  for delete using (auth.uid() = user_id);

create index if not exists idx_ai_sessions_user_project
  on ai_sessions(user_id, project_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: github_webhooks (webhook tracking)
-- ─────────────────────────────────────────────────────────────
create table if not exists github_webhooks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  event_type  text not null,
  payload     jsonb not null default '{}',
  processed   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table github_webhooks enable row level security;

create policy "github_webhooks: select own" on github_webhooks
  for select using (auth.uid() = user_id);

create policy "github_webhooks: insert own" on github_webhooks
  for insert with check (auth.uid() = user_id);

create index if not exists idx_github_webhooks_user_project
  on github_webhooks(user_id, project_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: notifications (user notifications)
-- ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text,
  read       boolean not null default false,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "notifications: select own" on notifications
  for select using (auth.uid() = user_id);

create policy "notifications: update own" on notifications
  for update using (auth.uid() = user_id);

create policy "notifications: delete own" on notifications
  for delete using (auth.uid() = user_id);

create index if not exists idx_notifications_user_read
  on notifications(user_id, read, created_at desc);
