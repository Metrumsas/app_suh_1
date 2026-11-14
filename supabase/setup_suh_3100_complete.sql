-- ============================================================================
-- SCRIPT MAESTRO E IDEMPOTENTE DE BASE DE DATOS Y POLÍTICAS RLS EN SUPABASE
-- APP HABILITACIÓN Y CALIDAD EN SALUD (SOGCS · RESOLUCIÓN 3100 DE 2019 · METRUM)
-- ============================================================================
-- Instrucciones:
-- 1. Abre tu proyecto en Supabase -> SQL Editor -> New Query.
-- 2. Pega y ejecuta este script completo (rol postgres).
-- 3. Crea todas las tablas, índices, funciones de seguridad, políticas RLS,
--    el bucket privado de Storage y la semilla inicial de Sedes (incluida NACIONAL).
-- ============================================================================

begin;

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TIPOS ENUMERADOS Y PERFILES DE USUARIO (CONTROL DE SÚPER USUARIO ÚNICO)
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rol_usuario_suh') then
    create type public.rol_usuario_suh as enum (
      'superusuario',
      'lider_calidad',
      'auditor',
      'lider_infraestructura',
      'lider_talento_humano',
      'consulta'
    );
  end if;
end $$;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null default 'Integrante Calidad',
  correo text unique not null,
  cargo text not null default 'Profesional de Calidad',
  rol public.rol_usuario_suh not null default 'consulta',
  sede_asignada text not null default 'TODAS',
  estado text not null default 'activo' check (estado in ('activo', 'pendiente', 'suspendido')),
  bloqueado boolean not null default false,
  modulos_permitidos text[] not null default array['*']::text[],
  invitado_en timestamptz not null default now(),
  ultimo_acceso timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Garantizar que SOLO pueda existir UN único Súper Usuario activo en toda la institución
create unique index if not exists perfiles_superusuario_unico_idx
  on public.perfiles ((true))
  where rol = 'superusuario' and not bloqueado;

create table if not exists public.usuarios_eventos (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.perfiles(id) on delete set null,
  destino_id uuid references public.perfiles(id) on delete set null,
  destino_correo text,
  accion text not null check (accion in ('invitar', 'reenviar', 'rol', 'suspender', 'habilitar', 'eliminar', 'permisos')),
  antes jsonb,
  despues jsonb,
  creado_en timestamptz not null default now()
);

-- Trigger automático para crear perfil cuando se registra un usuario en auth.users
create or replace function public.suh_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existe_super boolean;
begin
  select exists(
    select 1 from public.perfiles where rol = 'superusuario'::public.rol_usuario_suh and not bloqueado
  ) into existe_super;

  insert into public.perfiles (
    id,
    nombre_completo,
    correo,
    cargo,
    rol,
    sede_asignada,
    estado,
    bloqueado,
    modulos_permitidos
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nombre_completo', split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'cargo', case when not existe_super then 'Director Nacional de Calidad (Súper Usuario)' else 'Integrante Equipo de Calidad' end),
    case when not existe_super then 'superusuario'::public.rol_usuario_suh else 'lider_calidad'::public.rol_usuario_suh end,
    'TODAS',
    'activo',
    false,
    array['*']::text[]
  )
  on conflict (id) do update
    set correo = excluded.correo,
        ultimo_acceso = now();

  return new;
end $$;

drop trigger if exists on_auth_user_created_suh on auth.users;
create trigger on_auth_user_created_suh
  after insert on auth.users
  for each row execute function public.suh_handle_new_auth_user();

-- ============================================================================
-- 2. FUNCIONES HELPER DE SEGURIDAD PARA POLÍTICAS RLS
-- ============================================================================
create or replace function public.suh_rol_actual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol::text
  from public.perfiles p
  where p.id = (select auth.uid())
    and not p.bloqueado
    and p.estado = 'activo'
$$;

create or replace function public.suh_es_superusuario()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = (select auth.uid())
      and p.rol = 'superusuario'::public.rol_usuario_suh
      and not p.bloqueado
      and p.estado = 'activo'
  )
$$;

create or replace function public.suh_usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = (select auth.uid())
      and not p.bloqueado
      and p.estado = 'activo'
  )
$$;

create or replace function public.suh_puede_escribir()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.suh_rol_actual(), '') in (
    'superusuario',
    'lider_calidad',
    'auditor',
    'lider_infraestructura',
    'lider_talento_humano'
  )
$$;

revoke all on function public.suh_rol_actual() from public, anon;
revoke all on function public.suh_es_superusuario() from public, anon;
revoke all on function public.suh_usuario_activo() from public, anon;
revoke all on function public.suh_puede_escribir() from public, anon;

grant execute on function public.suh_rol_actual() to authenticated;
grant execute on function public.suh_es_superusuario() to authenticated;
grant execute on function public.suh_usuario_activo() to authenticated;
grant execute on function public.suh_puede_escribir() to authenticated;

-- ============================================================================
-- 3. TABLA TRANSVERSAL DE SEDES (CON GEORREFERENCIACIÓN GPS Y SEDE "NACIONAL")
-- ============================================================================
create table if not exists public.sedes (
  id text primary key,
  codigo_reps text unique not null,
  nombre text not null,
  departamento text not null default 'Cundinamarca',
  municipio text not null default 'Bogotá D.C.',
  ciudad text not null,
  direccion text not null,
  latitud numeric(10,6) default 4.6768,
  longitud numeric(10,6) default -74.0482,
  telefono text not null default '',
  director_responsable text not null default '',
  fecha_inscripcion_reps date default current_date,
  fecha_vencimiento_habilitacion date default (current_date + interval '1 year')::date,
  es_nacional boolean not null default false,
  activa boolean not null default true,
  descripcion_infraestructura text not null default '',
  capacidad_instalada_resumen text not null default '',
  area_m2 numeric(10,2) not null default 0,
  pisos_niveles integer not null default 1,
  consultorios_totales integer not null default 0,
  salas_procedimientos integer not null default 0,
  camas_camillas integer not null default 0,
  servicios_habilitados jsonb not null default '[]'::jsonb,
  areas_sede jsonb not null default '[]'::jsonb,
  planos_archivos jsonb not null default '[]'::jsonb,
  fotos_sede jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- 4. MÓDULO 1: ADMINISTRACIÓN (CATÁLOGO DE CRITERIOS, EJECUCIÓN Y ALERTAS CORREO)
-- ============================================================================
create table if not exists public.admin_catalogo (
  id text primary key,
  codigo text unique not null,
  categoria text not null,
  titulo text not null,
  descripcion_normativa text not null default '',
  periodicidad text not null default 'Mensual',
  programacion_anual text default 'No aplica',
  dias_vigencia_default integer not null default 30,
  aplica_todas_sedes boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists public.admin_criterios (
  id text primary key,
  criterio_catalogo_id text not null,
  codigo text not null,
  categoria text not null,
  titulo text not null,
  descripcion_normativa text not null default '',
  periodicidad text not null default 'Mensual',
  programacion_anual text default 'No aplica',
  presupuesto numeric(14,2) default 0,
  sede_id text not null references public.sedes(id) on delete restrict,
  fecha_programada_inicial date not null,
  fecha_vencimiento date not null,
  responsable text not null,
  responsable_correo text not null default 'calidad@calidadips.co',
  observaciones text not null default '',
  ultima_notificacion_fecha date,
  notificaciones_enviadas_count integer not null default 0,
  soportes jsonb not null default '[]'::jsonb,
  historial jsonb not null default '[]'::jsonb,
  plan_trabajo_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.admin_notificaciones (
  id text primary key,
  fecha_hora text not null,
  criterio_id text not null references public.admin_criterios(id) on delete cascade,
  criterio_codigo text not null,
  criterio_titulo text not null,
  sede_nombre text not null,
  destinatario_nombre text not null,
  destinatario_correo text not null,
  tipo_alerta text not null,
  asunto text not null,
  mensaje text not null,
  estado_criterio_momento text not null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_admin_criterios_sede on public.admin_criterios(sede_id);
create index if not exists idx_admin_criterios_vencimiento on public.admin_criterios(fecha_vencimiento);

-- ============================================================================
-- 5. MÓDULO 2: TALENTO HUMANO (CAPACIDAD INSTALADA VS SERVICIOS PRESTADOS)
-- ============================================================================
create table if not exists public.th_capacidad (
  id text primary key,
  sede_id text not null references public.sedes(id) on delete cascade,
  codigo_servicio text not null,
  nombre_servicio text not null,
  grupo_servicio text not null,
  complejidad text not null check (complejidad in ('Baja', 'Media', 'Alta')),
  modalidad text not null check (modalidad in ('Intramural', 'Extramural', 'Telemedicina')),
  tipo_espacio_fisico text not null default 'Consultorios',
  cantidad_espacios_fisicos integer not null default 1,
  horas_lunes_viernes_dia numeric(5,2) not null default 7,
  horas_sabado_dia numeric(5,2) not null default 0,
  dias_habiles_lv_mes integer not null default 20,
  sabados_mes integer not null default 4,
  numero_profesionales integer not null default 1,
  perfil_profesional text not null default '',
  horas_contratadas_mes_por_prof numeric(6,2) not null default 160,
  tiempo_atencion_minutos integer not null default 30,
  incluye_transporte boolean not null default false,
  observaciones text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.th_prestados (
  id text primary key,
  servicio_capacidad_id text not null references public.th_capacidad(id) on delete cascade,
  sede_id text not null references public.sedes(id) on delete cascade,
  nombre_servicio text not null,
  modalidad text not null,
  periodo text not null, -- YYYY-MM
  atenciones_realizadas integer not null default 0,
  capacidad_calculada_mes integer not null default 0,
  actualizado_en date not null default current_date,
  responsable_registro text not null default '',
  observacion text,
  unique (servicio_capacidad_id, periodo)
);

-- ============================================================================
-- 6. MÓDULO 3: INFRAESTRUCTURA (MANTENIMIENTO 1-4 FOTOS Y EVALUACIÓN FÍSICA)
-- ============================================================================
create table if not exists public.infra_mantenimientos (
  id text primary key,
  sede_id text not null references public.sedes(id) on delete cascade,
  clasificacion text not null,
  titulo text not null,
  descripcion text not null default '',
  plazo_ejecucion date not null,
  responsable text not null,
  estado text not null default 'Programada' check (estado in ('Programada', 'En ejecución', 'Ejecutada', 'Reprogramada')),
  seguimientos jsonb not null default '[]'::jsonb, -- Cada seguimiento valida min 1, max 4 fotos
  historial jsonb not null default '[]'::jsonb,
  plan_trabajo_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.infra_evaluaciones (
  id text primary key,
  sede_id text not null references public.sedes(id) on delete cascade,
  fecha_evaluacion date not null default current_date,
  evaluador text not null,
  observacion_general text not null default '',
  items jsonb not null default '[]'::jsonb, -- 14 condiciones físicas de la sede
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- 7. MÓDULO 4: EQUIPOS FIJOS (INVENTARIO Y CRONOGRAMA ANUAL POR FRECUENCIA)
-- ============================================================================
create table if not exists public.equipos_fijos (
  id text primary key,
  codigo_inventario text unique not null,
  nombre text not null,
  marca text not null default '',
  modelo text not null default '',
  serie text not null default '',
  tipo_tecnologia text not null check (tipo_tecnologia in (
    'Aires acondicionados',
    'Equipos industriales de uso hospitalario',
    'Cómputo y comunicación'
  )),
  sede_id text not null references public.sedes(id) on delete cascade,
  localizacion text not null,
  estado_operativo text not null default 'Activo' check (estado_operativo in ('Activo', 'Inactivo', 'Fallando', 'Inoperativo')),
  frecuencia_mantenimiento text not null default 'Semestral' check (frecuencia_mantenimiento in ('Mensual', 'Trimestral', 'Semestral', 'Anual')),
  anio_programa integer not null default extract(year from current_date)::integer,
  responsable text not null,
  foto_url text not null default '',
  observaciones text not null default '',
  cronograma_anual jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- 8. MÓDULO 5 Y 6: INFORMACIÓN DOCUMENTADA (2 AÑOS) Y COMITÉS MENSUALES
-- ============================================================================
create table if not exists public.documentos (
  id text primary key,
  codigo text unique not null,
  proceso text not null,
  tipo_documento text not null,
  titulo text not null,
  objetivo_descripcion text not null default '',
  sede_id text not null references public.sedes(id) on delete restrict,
  version_actual integer not null default 1,
  fecha_aprobacion date not null,
  fecha_vencimiento date not null, -- +2 años desde fecha_aprobacion
  responsable text not null,
  archivo_pdf_nombre text not null,
  archivo_pdf_url text not null default '',
  google_doc_id text,
  historial_versiones jsonb not null default '[]'::jsonb, -- Conserva PDFs anteriores
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.comites (
  id text primary key,
  codigo text unique not null,
  tipo_comite text not null,
  nombre text not null,
  sede_id text not null references public.sedes(id) on delete restrict,
  fecha_conformacion date not null,
  resolucion_acta_conformacion text not null,
  archivo_conformacion_pdf text not null,
  periodicidad text not null default 'Mensual',
  dia_programado_mes integer not null default 15 check (dia_programado_mes between 1 and 28),
  objetivo_funciones text not null default '',
  integrantes jsonb not null default '[]'::jsonb,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.actas (
  id text primary key,
  comite_id text not null references public.comites(id) on delete cascade,
  tipo_comite text not null,
  sede_id text not null references public.sedes(id) on delete restrict,
  numero_acta text not null,
  anio integer not null,
  periodo_mes text not null, -- YYYY-MM
  fecha_reunion date not null,
  asistentes jsonb not null default '[]'::jsonb,
  resumen text not null,
  compromisos jsonb not null default '[]'::jsonb, -- Vinculados a plan_trabajo
  archivo_pdf_nombre text not null,
  archivo_pdf_url text not null default '',
  version integer not null default 1,
  historial_versiones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- 9. MÓDULO 7: PLAN DE TRABAJO ANUAL (MODELO SARLAFT CENTRALIZADOR)
-- ============================================================================
create table if not exists public.plan_trabajo (
  id text primary key,
  codigo text unique not null,
  titulo text not null,
  descripcion text not null default '',
  sede_id text not null references public.sedes(id) on delete restrict,
  modulo_origen text not null,
  referencia_origen_id text,
  responsable text not null,
  responsable_correo text not null default '',
  fecha_original date not null,
  fecha_limite date not null,
  estado text not null default 'programada' check (estado in ('programada', 'en_ejecucion', 'completa', 'atrasada', 'reprogramada')),
  reprogramaciones integer not null default 0,
  presupuesto numeric(14,2) not null default 0,
  ejecutado numeric(14,2) not null default 0,
  observaciones text not null default '',
  eventos jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_plan_trabajo_fecha on public.plan_trabajo(fecha_limite);
create index if not exists idx_plan_trabajo_origen on public.plan_trabajo(modulo_origen);

-- ============================================================================
-- 10. MÓDULO 8: GESTIÓN DEL CAMBIO Y HALLAZGOS (5 PORQUÉS + EFECTIVIDAD)
-- ============================================================================
create table if not exists public.planes_accion (
  id text primary key,
  codigo text unique not null,
  nombre text not null,
  sede_id text not null references public.sedes(id) on delete restrict,
  proceso_objetivo text not null,
  origen_principal text not null,
  fecha_apertura date not null,
  fecha_meta_cierre date not null,
  lider_plan text not null,
  descripcion text not null default '',
  estado text not null default 'Activo' check (estado in ('Activo', 'En verificación de efectividad', 'Cerrado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.hallazgos (
  id text primary key,
  codigo text unique not null,
  plan_accion_id text not null references public.planes_accion(id) on delete cascade,
  sede_id text not null references public.sedes(id) on delete restrict,
  origen text not null,
  estandar_relacionado text not null,
  titulo text not null,
  descripcion_hallazgo text not null,
  fecha_identificacion date not null default current_date,
  responsable_lider text not null,
  criticidad text not null default 'Mayor' check (criticidad in ('Crítico', 'Mayor', 'Menor / Observación')),
  cinco_porques jsonb not null default '{}'::jsonb,
  acciones jsonb not null default '[]'::jsonb,
  estado_hallazgo text not null default 'Identificado' check (estado_hallazgo in ('Identificado', 'En gestión', 'Acciones ejecutadas', 'Cerrado')),
  efectividad jsonb not null default '{"evaluado":false,"se_repite_hallazgo":false,"porcentaje_efectividad":0,"concepto":"Pendiente de cierre"}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- 11. MÓDULO 9: AUDITORÍA INTERNA (ISO 19011) Y EXTERNA (CONTROL / EPS 0-100)
-- ============================================================================
create table if not exists public.auditorias_internas (
  id text primary key,
  codigo text unique not null,
  titulo_programa text not null,
  sede_id text not null references public.sedes(id) on delete restrict,
  proceso_auditado text not null,
  estandar_norma text not null,
  equipo_auditor text not null,
  auditado_lider text not null,
  fecha_programada date not null,
  fecha_ejecucion date,
  estado text not null default 'Programada' check (estado in ('Programada', 'En curso', 'Informe emitido', 'Cerrada')),
  resultado_puntaje numeric(5,2) check (resultado_puntaje is null or (resultado_puntaje >= 0 and resultado_puntaje <= 100)),
  resumen_informe text not null default '',
  informe_pdf_nombre text,
  hallazgos_ids text[] not null default '{}',
  plan_trabajo_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.auditorias_externas (
  id text primary key,
  codigo text unique not null,
  tipo_ente text not null check (tipo_ente in ('Ente de Control', 'Cliente / EPS')),
  nombre_ente_auditor text not null,
  sede_id text not null references public.sedes(id) on delete restrict,
  alcance_visita text not null,
  fecha_visita date not null,
  fecha_entrega_informe date not null,
  auditor_externo_lider text not null,
  recibido_por text not null,
  resultado_puntaje numeric(5,2) not null check (resultado_puntaje >= 0 and resultado_puntaje <= 100),
  concepto_visita text not null,
  resumen_informe text not null,
  informe_pdf_nombre text not null,
  hallazgos_ids text[] not null default '{}',
  plan_trabajo_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- 12. MÓDULO 10: CUMPLIMIENTO RESOLUCIÓN 3100 (LISTA DE CHEQUEO VARIABLE)
-- ============================================================================
create table if not exists public.evaluaciones_3100 (
  id text primary key,
  codigo text unique not null,
  nombre text not null,
  sede_id text not null references public.sedes(id) on delete cascade,
  periodo text not null,
  fecha_evaluacion date not null default current_date,
  evaluador text not null,
  estado text not null default 'borrador' check (estado in ('borrador', 'cerrada_vigente', 'historica')),
  servicios_evaluados jsonb not null default '[]'::jsonb,
  respuestas jsonb not null default '[]'::jsonb,
  observacion_general text not null default '',
  cerrada_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ============================================================================
-- 13. INFRAESTRUCTURA DE JARVIS + OPENJARVIS + GOOGLE WORKSPACE
-- ============================================================================
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
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_name text not null default '',
  tool_name text not null,
  domain text not null check (domain in ('docs', 'drive', 'sheets', 'gmail', 'calendar', 'supabase_quality')),
  target_resource text not null,
  summary text not null default '',
  previous_state text,
  new_state text,
  human_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.openjarvis_skills (
  id text primary key,
  name text unique not null,
  version text not null default '1.0.0',
  description text not null,
  author text not null default 'openjarvis-suh',
  source text not null default 'openjarvis:suh-3100',
  tags text[] not null default '{}',
  required_capabilities text[] not null default '{}',
  skill_md text not null,
  skill_toml text not null,
  steps jsonb not null default '[]'::jsonb,
  invocations_count integer not null default 0,
  overlay_learned_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.openjarvis_monitors (
  id text primary key,
  name text not null,
  cron_expression text not null,
  human_schedule text not null,
  agent_type text not null default 'operative',
  skill_id text not null,
  prompt text not null,
  tools text[] not null default '{}',
  enabled boolean not null default true,
  last_run_at text,
  last_result_summary text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 14. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS) Y POLÍTICAS POR TABLA
-- ============================================================================
do $$
declare
  t text;
  tablas_operativas text[] := array[
    'sedes',
    'admin_catalogo',
    'admin_criterios',
    'admin_notificaciones',
    'th_capacidad',
    'th_prestados',
    'infra_mantenimientos',
    'infra_evaluaciones',
    'equipos_fijos',
    'documentos',
    'comites',
    'actas',
    'plan_trabajo',
    'planes_accion',
    'hallazgos',
    'auditorias_internas',
    'auditorias_externas',
    'evaluaciones_3100',
    'openjarvis_skills',
    'openjarvis_monitors'
  ];
begin
  -- 1. Políticas para cada tabla operativa del SOGCS
  foreach t in array tablas_operativas loop
    execute format('alter table public.%I enable row level security', t);

    -- Lectura para cualquier usuario autenticado y activo de la IPS
    execute format('drop policy if exists suh_select_policy on public.%I', t);
    execute format(
      'create policy suh_select_policy on public.%I for select to authenticated using ((select public.suh_usuario_activo()))',
      t
    );

    -- Inserción y Actualización para roles operativos autorizados
    execute format('drop policy if exists suh_insert_policy on public.%I', t);
    execute format(
      'create policy suh_insert_policy on public.%I for insert to authenticated with check ((select public.suh_puede_escribir()))',
      t
    );

    execute format('drop policy if exists suh_update_policy on public.%I', t);
    execute format(
      'create policy suh_update_policy on public.%I for update to authenticated using ((select public.suh_puede_escribir())) with check ((select public.suh_puede_escribir()))',
      t
    );

    -- Eliminación exclusiva para Súper Usuario o Líder de Calidad
    execute format('drop policy if exists suh_delete_policy on public.%I', t);
    execute format(
      'create policy suh_delete_policy on public.%I for delete to authenticated using ((select public.suh_rol_actual()) in (''superusuario'', ''lider_calidad''))',
      t
    );
  end loop;
end $$;

-- 2. Políticas estrictas para `perfiles` y `usuarios_eventos` (Exclusivo Súper Usuario para administrar)
alter table public.perfiles enable row level security;
alter table public.usuarios_eventos enable row level security;

drop policy if exists perfiles_select_authenticated on public.perfiles;
create policy perfiles_select_authenticated
  on public.perfiles
  for select
  to authenticated
  using ((select public.suh_usuario_activo()));

drop policy if exists perfiles_superusuario_all on public.perfiles;
create policy perfiles_superusuario_all
  on public.perfiles
  for all
  to authenticated
  using ((select public.suh_es_superusuario()))
  with check ((select public.suh_es_superusuario()));

drop policy if exists usuarios_eventos_select_super on public.usuarios_eventos;
create policy usuarios_eventos_select_super
  on public.usuarios_eventos
  for select
  to authenticated
  using ((select public.suh_es_superusuario()));

drop policy if exists usuarios_eventos_insert_super on public.usuarios_eventos;
create policy usuarios_eventos_insert_super
  on public.usuarios_eventos
  for insert
  to authenticated
  with check ((select public.suh_es_superusuario()));

-- 3. Políticas para Jarvis y Bitácora Inmutable (`jarvis_audit_logs`)
alter table public.user_google_integrations enable row level security;
alter table public.jarvis_conversations enable row level security;
alter table public.jarvis_messages enable row level security;
alter table public.jarvis_audit_logs enable row level security;

drop policy if exists google_tokens_owner_policy on public.user_google_integrations;
create policy google_tokens_owner_policy
  on public.user_google_integrations
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists jarvis_conv_owner_policy on public.jarvis_conversations;
create policy jarvis_conv_owner_policy
  on public.jarvis_conversations
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists jarvis_msg_owner_policy on public.jarvis_messages;
create policy jarvis_msg_owner_policy
  on public.jarvis_messages
  for all
  to authenticated
  using (
    exists (
      select 1 from public.jarvis_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Bitácora inmutable: Se permite leer e insertar, pero NUNCA editar ni borrar desde el cliente
drop policy if exists jarvis_logs_select_policy on public.jarvis_audit_logs;
create policy jarvis_logs_select_policy
  on public.jarvis_audit_logs
  for select
  to authenticated
  using ((select public.suh_usuario_activo()));

drop policy if exists jarvis_logs_insert_policy on public.jarvis_audit_logs;
create policy jarvis_logs_insert_policy
  on public.jarvis_audit_logs
  for insert
  to authenticated
  with check ((select public.suh_usuario_activo()));

-- ============================================================================
-- 15. BUCKET PRIVADO DE STORAGE PARA SOPORTES PDF, PLANOS Y FOTOS (1-4 FOTOS)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'suh-soportes',
  'suh-soportes',
  false,
  26214400, -- 25 MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists suh_storage_select on storage.objects;
create policy suh_storage_select
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'suh-soportes' and (select public.suh_usuario_activo()));

drop policy if exists suh_storage_insert on storage.objects;
create policy suh_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'suh-soportes' and (select public.suh_puede_escribir()));

-- ============================================================================
-- 16. SEMILLA INICIAL DE SEDES (SEDE NACIONAL + BOGOTÁ + MEDELLÍN + CALI)
-- ============================================================================
insert into public.sedes (
  id, codigo_reps, nombre, ciudad, direccion, telefono, director_responsable,
  es_nacional, activa, descripcion_infraestructura, capacidad_instalada_resumen,
  area_m2, pisos_niveles, consultorios_totales, salas_procedimientos, camas_camillas
) values
  (
    'sede-nacional',
    'NAC-00000000',
    'NACIONAL (Transversal Todas las Sedes)',
    'Nacional (Corporativo)',
    'Dirección General Corporativa · Aplica a toda la red de sedes',
    '(601) 745 8000',
    'Dr. Jorge E. Administrador',
    true,
    true,
    'Sede virtual/administrativa que concentra los soportes legales, financieros, contables y políticas corporativas aplicables a todas las sedes operativas.',
    'Transversal a toda la institución',
    450, 1, 0, 0, 0
  ),
  (
    'sede-bogota',
    '110010984501',
    'Sede Bogotá Norte',
    'Bogotá D.C.',
    'Autopista Norte # 104 - 32, Edificio Médico Santa Bárbara',
    '(601) 620 4500',
    'Dra. Carolina Méndez',
    false,
    true,
    'Edificación de uso exclusivo en salud de 3 niveles con ascensor camillero, rampa PMR, planta eléctrica de 150 kVA y cuarto técnico PGIRASA.',
    '12 consultorios intramurales, 1 módulo de Telemedicina, 1 Laboratorio Clínico y 2 salas de procedimientos.',
    1420, 3, 12, 2, 8
  ),
  (
    'sede-medellin',
    '050010763202',
    'Sede Medellín Poblado',
    'Medellín',
    'Cra. 43A # 14 - 55, Centro Médico El Poblado',
    '(604) 444 9210',
    'Dra. Laura Restrepo',
    false,
    true,
    'Sede ambulatoria con doble ascensor, pisos hospitalarios antideslizantes y cuarto temporal PGIRASA.',
    '6 consultorios de consulta externa, 2 unidades odontológicas y 1 toma de muestras.',
    680, 1, 6, 1, 3
  ),
  (
    'sede-cali',
    '760010542103',
    'Sede Cali Sur',
    'Cali',
    'Calle 5B # 38 - 14, Barrio Tequendama',
    '(602) 555 3100',
    'Dr. Mauricio Caicedo',
    false,
    true,
    'Sede ambulatoria de primer nivel con 4 consultorios, sala de fisioterapia y base domiciliaria.',
    '4 consultorios intramurales y base operativa extramural.',
    510, 2, 4, 1, 2
  )
on conflict (id) do nothing;

commit;
