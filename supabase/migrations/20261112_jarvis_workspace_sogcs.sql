-- ============================================================================
-- MIGRACIÓN SQL IDEMPOTENTE: ASISTENTE OPERATIVO "JARVIS" + SISTEMA DE CALIDAD
-- RESOLUCIÓN 3100 DE 2019 (SOGCS) + GOOGLE WORKSPACE + SUPABASE RLS
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. INFRAESTRUCTURA DE JARVIS Y GOOGLE WORKSPACE OAUTH 2.0
-- ----------------------------------------------------------------------------
create table if not exists public.user_google_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  connected_services jsonb not null default '{"drive":true,"docs":true,"sheets":true,"gmail":true,"calendar":true}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.jarvis_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  active_module text default 'dashboard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jarvis_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.jarvis_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb default '[]'::jsonb,
  approval_card jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.jarvis_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  tool_name text not null,
  domain text not null check (domain in ('docs', 'drive', 'sheets', 'gmail', 'calendar', 'supabase_quality')),
  target_resource text not null,
  previous_state jsonb,
  new_state jsonb,
  human_approved boolean not null default true,
  status text not null default 'executed',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. TABLAS DEL SISTEMA DE GESTIÓN DE CALIDAD Y HABILITACIÓN (RES. 3100)
-- ----------------------------------------------------------------------------
create table if not exists public.quality_documents (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  process_name text not null,
  doc_type text not null,
  current_version integer not null default 1,
  approval_date date not null,
  expiration_date date not null,
  google_doc_id text,
  drive_file_url text,
  status text not null default 'vigente',
  responsible_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quality_document_changes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.quality_documents(id) on delete cascade,
  previous_version integer not null,
  new_version integer not null,
  section_modified text not null,
  previous_text text,
  new_text text not null,
  change_justification text not null,
  archived_drive_file_id text,
  changed_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quality_audits (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  audit_type text not null check (audit_type in ('interna', 'externa_control', 'externa_eps', 'autoevaluacion_3100')),
  auditor_entity text not null,
  sede_id text not null,
  scheduled_date date not null,
  execution_date date,
  score numeric(5,2) check (score >= 0 and score <= 100),
  status text not null default 'Programada',
  report_summary text,
  drive_folder_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.quality_findings (
  id uuid primary key default gen_random_uuid(),
  finding_code text unique not null,
  audit_id uuid references public.quality_audits(id) on delete set null,
  sede_id text not null,
  origin text not null,
  standard_name text not null,
  title text not null,
  description text not null,
  criticality text not null default 'Mayor',
  five_whys jsonb not null default '{}'::jsonb,
  root_cause text not null,
  causal_factor text not null,
  status text not null default 'En gestión',
  effectiveness_score numeric(5,2),
  repeated_finding boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quality_action_plans (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid references public.quality_findings(id) on delete cascade,
  plan_code text unique not null,
  title text not null,
  process_target text not null,
  leader_name text not null,
  target_close_date date not null,
  status text not null default 'Activo',
  created_at timestamptz not null default now()
);

create table if not exists public.quality_activities (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references public.quality_action_plans(id) on delete cascade,
  activity_code text unique not null,
  title text not null,
  description text not null,
  origin_module text not null,
  sede_id text not null,
  responsible_name text not null,
  responsible_email text not null,
  due_date date not null,
  status text not null default 'programada',
  budget numeric(14,2) not null default 0,
  spent numeric(14,2) not null default 0,
  calendar_event_id text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
alter table public.user_google_integrations enable row level security;
alter table public.jarvis_conversations enable row level security;
alter table public.jarvis_messages enable row level security;
alter table public.jarvis_audit_logs enable row level security;
alter table public.quality_documents enable row level security;
alter table public.quality_document_changes enable row level security;
alter table public.quality_audits enable row level security;
alter table public.quality_findings enable row level security;
alter table public.quality_action_plans enable row level security;
alter table public.quality_activities enable row level security;

-- Políticas de seguridad por propietario para tokens y conversaciones
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'user_google_integrations' and policyname = 'Users manage own google tokens'
  ) then
    create policy "Users manage own google tokens"
      on public.user_google_integrations
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'jarvis_conversations' and policyname = 'Users manage own jarvis conversations'
  ) then
    create policy "Users manage own jarvis conversations"
      on public.jarvis_conversations
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'jarvis_audit_logs' and policyname = 'Authenticated users read and insert audit logs'
  ) then
    create policy "Authenticated users read and insert audit logs"
      on public.jarvis_audit_logs
      for select
      to authenticated
      using (true);

    create policy "Authenticated users insert audit logs"
      on public.jarvis_audit_logs
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;
