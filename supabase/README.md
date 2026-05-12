# Supabase Setup

Follow these steps to initialize the Noctra database schema in your Supabase project.

## Steps

1. **Open the Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click "SQL Editor" in the left sidebar

2. **Run schema.sql**
   - Click "New query"
   - Paste the full contents of `supabase/schema.sql`
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - All tables, RLS policies, and indexes will be created

3. **Add Replit Secrets**
   In your Replit project, add these secrets (Tools → Secrets):
   - `VITE_SUPABASE_URL` — Your Supabase project URL (e.g. `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — Your Supabase anon/public key

   Both values are found in your Supabase project under **Settings → API**.

4. **Restart the app**
   - In Replit, restart the workflow for Noctra
   - The app will connect to your Supabase project automatically

## Tables

| Table | Purpose |
|---|---|
| `profiles` | User profile data linked to auth.users |
| `projects` | Founder project workspaces |
| `reports` | Tool-generated intelligence reports |
| `tasks` | Action items generated from reports |
| `proof_signals` | Market validation evidence signals |
| `scans` | Code/repo scan results |
| `prompt_packs` | Saved AI prompt collections |
| `sprints` | Sprint planning periods |
| `score_events` | Score history for tracking progress over time |

## Notes

- All tables use Row Level Security (RLS) — users can only access their own rows
- Passport data is computed dynamically from reports/tasks/signals — no dedicated table
- The `scans` table supports the Doctor tool's ZIP upload feature
