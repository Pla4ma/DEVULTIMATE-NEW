# Noctra — Developer Intelligence OS

A full-stack AI-powered founder intelligence platform that helps builders validate ideas, stress-test assumptions, plan MVPs, scan codebases, and track launch readiness.

## Run & Operate

- `pnpm --filter @workspace/noctra run dev` — run the Noctra frontend (port 18565)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase connection (frontend)
- Optional env: `OPENAI_API_KEY`, `GROQ_API_KEY`, `AI_INTEGRATIONS_OPENAI_API_KEY` — AI providers

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter + Supabase Auth
- API: Express 5 with multer (zip uploads), pino logging
- DB: Supabase (PostgreSQL) — no Drizzle for app data, Supabase client only
- AI: Multi-provider fallback (OpenAI-compatible, OpenAI, Groq, Lovable)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle) for API, Vite for frontend

## Where things live

- `artifacts/noctra/` — React frontend (main app)
- `artifacts/noctra/src/lib/repository.ts` — all Supabase data access
- `artifacts/noctra/src/integrations/supabase/client.ts` — Supabase client config
- `artifacts/api-server/src/routes/` — Express API routes (health, ai, projects)
- `artifacts/api-server/src/lib/ai-client.ts` — multi-provider AI client
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `supabase/schema.sql` — Supabase database schema with RLS

## Architecture decisions

- Passport scores are computed dynamically from reports/tasks/signals — no dedicated table
- AI calls use a waterfall fallback: openai-compatible → openai → groq → lovable
- Frontend uses Supabase directly for auth and data (no proxy through API server for CRUD)
- API server handles AI inference and ZIP scanning (stateless, compute-heavy endpoints)
- All Supabase tables have RLS — every query must filter by user_id

## Product

- Signal Chamber — validate product ideas with AI scoring
- Pressure Matrix — stress-test assumptions with a reality compiler
- Proof Reactor — collect and score market validation evidence
- Swarm Field — simulate target market reactions
- Blueprint Board — design ruthless MVP scope
- Diagnostic Bay — scan codebase for launch blockers (ZIP upload)
- Launch Control — go/no-go signal before launch
- Memory Constellation — AI digital twin synthesizing all reports
- Projects — workspace to link reports, tasks, and signals
- Passport — dynamic founder score computed from all intelligence

## User preferences

- Do not add new features without being asked
- Do not redesign the UI without being asked
- Always run typecheck and build before claiming complete

## Gotchas

- `pnpm run build` requires PORT and BASE_PATH env vars for individual artifact builds; root build works without them
- mockup-sandbox vite.config defaults PORT to 5173 and BASE_PATH to /__mockup/ if env vars are missing
- The `analyzeCodebaseAlignment` function takes `{ reports, tasks }` not a bare array

## Pointers

- See `supabase/README.md` for database setup instructions
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
