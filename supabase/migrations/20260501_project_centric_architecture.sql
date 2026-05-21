-- DEVULTIMATE Project-Centric Architecture Migration
-- This migration adds blockers, scan_snapshots tables and enhances projects/tasks.

-- Step 1: Enhance projects table with lifecycle stages and scan tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launch_readiness_score integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scan_count integer NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_scan_at timestamp with time zone;

-- Step 2: Create blockers table with RLS
CREATE TABLE IF NOT EXISTS blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scan_id uuid,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'P1' CHECK (severity IN ('P0', 'P1', 'P2')),
  category text NOT NULL DEFAULT 'code' CHECK (category IN ('security', 'performance', 'testing', 'deployment', 'docs', 'code', 'privacy', 'billing')),
  evidence text,
  why_it_matters text,
  recommended_fix text,
  acceptance_criteria text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'ignored')),
  linked_task_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blockers: select own" ON blockers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "blockers: insert own" ON blockers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blockers: update own" ON blockers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "blockers: delete own" ON blockers FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_blockers_project_id ON blockers(project_id);
CREATE INDEX IF NOT EXISTS idx_blockers_user_id ON blockers(user_id);
CREATE INDEX IF NOT EXISTS idx_blockers_status ON blockers(status);
CREATE INDEX IF NOT EXISTS idx_blockers_severity ON blockers(severity);

-- Step 3: Enhance tasks table with Product Doctor fix task fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_blocker_id uuid REFERENCES blockers(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS evidence text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS target_files_or_areas text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_difficulty text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS suggested_ai_prompt text;
CREATE INDEX IF NOT EXISTS idx_tasks_linked_blocker ON tasks(linked_blocker_id);

-- Step 4: Create scan_snapshots table with RLS
CREATE TABLE IF NOT EXISTS scan_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_id uuid,
  score integer,
  blockers jsonb NOT NULL DEFAULT '[]'::jsonb,
  static_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_index jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE scan_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_snapshots: select own" ON scan_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scan_snapshots: insert own" ON scan_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scan_snapshots: update own" ON scan_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scan_snapshots: delete own" ON scan_snapshots FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_scan_snapshots_project_id ON scan_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_scan_snapshots_user_id ON scan_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_snapshots_created_at ON scan_snapshots(created_at DESC);

-- Step 5: Add reports table if not exists with project_id enforcement
ALTER TABLE reports ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);

-- Step 6: Ensure scans table has project_id
ALTER TABLE scans ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scans_project_id ON scans(project_id);
