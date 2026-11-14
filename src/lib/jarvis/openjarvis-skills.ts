// ============================================================================
// MOTOR OPENJARVIS (github.com/open-jarvis/OpenJarvis) INTEGRADO EN SUH-1
// Incluye:
// 1. SkillManager (Estándar agentskills.io: SKILL.md + skill.toml pipelines)
// 2. Agente Morning Digest (Briefing diario hablado con TTS + escrito)
// 3. Agente Scheduled Monitor / Operative (Monitores con expresiones Cron)
// 4. Aprendizaje por Trazas (Overlays / Few-shot optimization)
// ============================================================================

import type { AppUser, SuhDatabase } from '../types'
import {
  calculateCapacidadInstaladaMes,
  evaluateAdminCriterion,
  evaluateComiteStatus,
  formatDateES,
  summarizeEvaluacion3100,
  todayISO,
} from '../calculations'

export interface OpenJarvisPipelineStep {
  stepNumber: number
  tool_name?: string
  skill_name?: string
  arguments_template: string
  output_key: string
}

export interface OpenJarvisSkill {
  id: string
  name: string
  version: string
  description: string
  author: string
  source: 'openjarvis:suh-3100' | 'hermes:healthcare' | 'custom:user'
  tags: string[]
  required_capabilities: string[]
  skill_md: string
  skill_toml: string
  steps: OpenJarvisPipelineStep[]
  invocations_count: number
  overlay_learned_notes: string[]
}

export interface OpenJarvisScheduledMonitor {
  id: string
  name: string
  cronExpression: string
  humanSchedule: string
  agentType: 'operative' | 'monitor_operative' | 'morning_digest'
  skillId: string
  prompt: string
  tools: string[]
  enabled: boolean
  lastRunAt: string | null
  lastResultSummary: string | null
}

export interface MorningDigestBriefing {
  generatedAt: string
  persona: 'jarvis'
  honorific: string
  spokenNarrative: string
  sections: {
    soportesCriticos: string[]
    comitesAlerta10Dias: string[]
    capacidadInstaladaAlertas: string[]
    hallazgosYPlanTrabajo: string[]
    cumplimiento3100Resumen: string[]
  }
}

const CUSTOM_SKILLS_KEY = 'suh_3100_openjarvis_skills_v1'
const MONITORS_KEY = 'suh_3100_openjarvis_monitors_v1'

export const DEFAULT_OPENJARVIS_SKILLS: OpenJarvisSkill[] = [
  {
    id: 'autoevaluador-res-3100',
    name: 'autoevaluador-res-3100',
    version: '1.0.0',
    description:
      'Evalúa sedes y servicios según la Resolución 3100 de 2019 generando listas de chequeo variables por grupo, modalidad (Intramural, Extramural, Telemedicina) y complejidad.',
    author: 'openjarvis-suh',
    source: 'openjarvis:suh-3100',
    tags: ['resolucion-3100', 'habilitacion', 'reps', 'autoevaluacion'],
    required_capabilities: ['supabase:read', 'supabase:write', 'drive:create_folder'],
    invocations_count: 14,
    overlay_learned_notes: [
      'Siempre incluir los criterios de Todos los Servicios antes de los específicos del servicio.',
      'Exigir justificación técnica obligatoria cuando un criterio se marque como No Aplica.',
    ],
    skill_md: `---
name: autoevaluador-res-3100
description: Evalúa sedes y servicios según la Resolución 3100 de 2019 con lista de chequeo variable
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [resolucion-3100, habilitacion, reps]
---

Cuando el usuario solicite auditar o autoevaluar una sede bajo la Resolución 3100 de 2019:
1. **Identifica la Sede y los Servicios habilitados** verificando grupo de servicio, modalidad (Intramural, Extramural, Telemedicina) y nivel de complejidad (Baja, Media, Alta).
2. **Construye la Lista de Chequeo Variable** agrupada en los 7 estándares (Talento Humano, Infraestructura, Dotación, Medicamentos/Dispositivos, Procesos Prioritarios, Historia Clínica e Interdependencia).
3. **Prioriza los No Cumplimientos**: Todo criterio en "No cumple" o "Cumple parcialmente" debe generar acción de mejora vinculada al Plan de Trabajo.
4. **Valida No Aplica**: Nunca permitas calificar "No aplica" sin justificación normativa explícita.`,
    skill_toml: `[skill]
name = "autoevaluador-res-3100"
version = "1.0.0"
description = "Autoevaluación dinámica por sede y servicio Res. 3100"
author = "openjarvis-suh"
tags = ["resolucion-3100", "habilitacion", "reps"]
required_capabilities = ["supabase:read", "supabase:write"]

[[skill.steps]]
tool_name = "quality_manage_audit"
arguments_template = '{"sede": "{sede}", "mode": "variable_checklist_3100"}'
output_key = "checklist_evaluation"

[[skill.steps]]
tool_name = "quality_generate_audit_report"
arguments_template = '{"evaluation": "{checklist_evaluation}"}'
output_key = "audit_report"

[[skill.steps]]
tool_name = "drive_create_quality_folder_tree"
arguments_template = '{"sede": "{sede}", "report": "{audit_report}"}'
output_key = "drive_package"`,
    steps: [
      {
        stepNumber: 1,
        tool_name: 'quality_manage_audit',
        arguments_template: '{"sede": "{sede}", "mode": "variable_checklist_3100"}',
        output_key: 'checklist_evaluation',
      },
      {
        stepNumber: 2,
        tool_name: 'quality_generate_audit_report',
        arguments_template: '{"evaluation": "{checklist_evaluation}"}',
        output_key: 'audit_report',
      },
      {
        stepNumber: 3,
        tool_name: 'drive_create_quality_folder_tree',
        arguments_template: '{"sede": "{sede}", "report": "{audit_report}"}',
        output_key: 'drive_package',
      },
    ],
  },
  {
    id: 'investigador-5-porques-londres',
    name: 'investigador-5-porques-londres',
    version: '1.0.0',
    description:
      'Ejecuta análisis de causa raíz mediante metodología de los 5 Porqués y Protocolo de Londres para hallazgos y eventos adversos, formulando planes CAPA y midiendo efectividad.',
    author: 'openjarvis-suh',
    source: 'openjarvis:suh-3100',
    tags: ['5-porques', 'pamec', 'capa', 'seguridad-paciente'],
    required_capabilities: ['supabase:read', 'supabase:write', 'calendar:schedule'],
    invocations_count: 19,
    overlay_learned_notes: [
      'Prohibido concluir "error humano" como causa raíz; llegar siempre a la falla sistémica o barrera ausente.',
      'Vincular cada acción CAPA al Plan de Trabajo Anual con fecha límite y único responsable.',
    ],
    skill_md: `---
name: investigador-5-porques-londres
description: Análisis causal 5 Porqués, planes CAPA y medición cuantitativa de efectividad
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [5-porques, pamec, capa]
---

Cuando se reporte un hallazgo de auditoría, incumplimiento locativo o evento adverso:
1. **Cruza contra el histórico** para detectar si el hallazgo es recurrente o reincidente.
2. **Aplica los 5 Porqués en cadena lógica** hasta identificar el factor causal sistémico (Proceso, Infraestructura, Sistemas de Información, Talento Humano u Organizacional).
3. **Formula acciones correctivas (CAPA)** orientadas a eliminar la causa raíz y envíalas al Plan de Trabajo.
4. **Define la medición cuantitativa de efectividad post-cierre** verificando que el hallazgo NO se repita (50% ejecución en plazo + 50% cero reincidencia).`,
    skill_toml: `[skill]
name = "investigador-5-porques-londres"
version = "1.0.0"
description = "Metodología 5 Porqués + CAPA + Efectividad"
author = "openjarvis-suh"
tags = ["5-porques", "capa", "pamec"]

[[skill.steps]]
tool_name = "quality_query_findings_history"
arguments_template = '{"query": "{hallazgo}"}'
output_key = "recurrence_check"

[[skill.steps]]
tool_name = "quality_analyze_and_register_finding"
arguments_template = '{"hallazgo": "{hallazgo}", "history": "{recurrence_check}"}'
output_key = "five_whys_tree"

[[skill.steps]]
tool_name = "quality_create_capa_and_activities"
arguments_template = '{"finding": "{five_whys_tree}"}'
output_key = "workplan_activities"`,
    steps: [
      {
        stepNumber: 1,
        tool_name: 'quality_query_findings_history',
        arguments_template: '{"query": "{hallazgo}"}',
        output_key: 'recurrence_check',
      },
      {
        stepNumber: 2,
        tool_name: 'quality_analyze_and_register_finding',
        arguments_template: '{"hallazgo": "{hallazgo}", "history": "{recurrence_check}"}',
        output_key: 'five_whys_tree',
      },
      {
        stepNumber: 3,
        tool_name: 'quality_create_capa_and_activities',
        arguments_template: '{"finding": "{five_whys_tree}"}',
        output_key: 'workplan_activities',
      },
    ],
  },
  {
    id: 'editor-quirurgico-documental',
    name: 'editor-quirurgico-documental',
    version: '1.0.0',
    description:
      'Interviene protocolos, manuales y guías en Google Docs sin dañar formato, actualiza la tabla de Control de Cambios (vigencia 2 años) y archiva obsoletos en Drive.',
    author: 'openjarvis-suh',
    source: 'openjarvis:suh-3100',
    tags: ['google-docs', 'control-documental', 'vigencia-2-anos'],
    required_capabilities: ['docs:read', 'docs:batchUpdate', 'drive:move'],
    invocations_count: 11,
    overlay_learned_notes: [
      'Calcular siempre nueva vigencia sumando exactamente 2 años desde la fecha de aprobación.',
      'Mover el PDF anterior a /Obsoletos con el prefijo [OBSOLETO] conservando su enlace de consulta.',
    ],
    skill_md: `---
name: editor-quirurgico-documental
description: Edición quirúrgica de documentos en Google Docs con control de versiones bienal
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [google-docs, documentos, sogcs]
---

Cuando el usuario solicite modificar o actualizar un protocolo, manual o procedimiento:
1. **Lee primero la estructura del documento** (\`docs_search_and_read\`) identificando encabezados e índices UTF-16.
2. **Prepara el bloque exacto a insertar o reemplazar** respetando la numeración técnica.
3. **Incrementa la versión y actualiza la Tabla de Control de Cambios** exigiendo justificación obligatoria.
4. **Conserva la versión anterior y su PDF** en el historial para consulta de auditoría.`,
    skill_toml: `[skill]
name = "editor-quirurgico-documental"
version = "1.0.0"
description = "Edición quirúrgica Google Docs + Archivo de Obsoletos"
author = "openjarvis-suh"
tags = ["google-docs", "drive"]

[[skill.steps]]
tool_name = "docs_search_and_read"
arguments_template = '{"code": "{codigo_documento}"}'
output_key = "doc_structure"

[[skill.steps]]
tool_name = "docs_edit_content_directly"
arguments_template = '{"structure": "{doc_structure}", "instruction": "{instruccion}"}'
output_key = "updated_doc"

[[skill.steps]]
tool_name = "drive_archive_obsolete_doc"
arguments_template = '{"previous_doc": "{doc_structure}"}'
output_key = "archived_obsolete"`,
    steps: [
      {
        stepNumber: 1,
        tool_name: 'docs_search_and_read',
        arguments_template: '{"code": "{codigo_documento}"}',
        output_key: 'doc_structure',
      },
      {
        stepNumber: 2,
        tool_name: 'docs_edit_content_directly',
        arguments_template: '{"structure": "{doc_structure}", "instruction": "{instruccion}"}',
        output_key: 'updated_doc',
      },
      {
        stepNumber: 3,
        tool_name: 'drive_archive_obsolete_doc',
        arguments_template: '{"previous_doc": "{doc_structure}"}',
        output_key: 'archived_obsolete',
      },
    ],
  },
  {
    id: 'auditor-capacidad-instalada',
    name: 'auditor-capacidad-instalada',
    version: '1.0.0',
    description:
      'Calcula y audita la Capacidad Instalada de Talento Humano separada por modalidad (Intramural, Extramural con transporte y Telemedicina) frente a los servicios prestados mensuales.',
    author: 'openjarvis-suh',
    source: 'hermes:healthcare',
    tags: ['talento-humano', 'capacidad-instalada', 'telemedicina'],
    required_capabilities: ['supabase:read', 'sheets:write'],
    invocations_count: 8,
    overlay_learned_notes: [
      'En modalidad Extramural verificar siempre que el tiempo de atención incluya el desplazamiento entre pacientes (ej. 45 min).',
      'Advertir inmediatamente si un servicio no ha registrado las atenciones prestadas del mes en curso.',
    ],
    skill_md: `---
name: auditor-capacidad-instalada
description: Cálculo normativo de capacidad instalada (Intramural, Extramural y Telemedicina) vs demanda
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [talento-humano, capacidad-instalada]
---

Cuando se consulte o audite la capacidad instalada de Talento Humano:
1. **Separa el cálculo por modalidad**:
   - **Intramural**: Consultorios/espacios físicos × horas disponibles (L-V y Sábados) ÷ tiempo de atención.
   - **Extramural**: Número de profesionales × horas contratadas/mes ÷ tiempo de atención (incluyendo transporte).
   - **Telemedicina**: Personal/módulos asignados × horas disponibles ÷ tiempo de atención.
2. **Compara contra los servicios prestados del mes** identificando Deficiencias (sobreocupación) u Holguras.
3. **Alerta cualquier servicio sin actualización mensual** y sincroniza la matriz con Google Sheets.`,
    skill_toml: `[skill]
name = "auditor-capacidad-instalada"
version = "1.0.0"
description = "Auditoría de capacidad instalada vs servicios prestados"
author = "openjarvis-suh"
tags = ["talento-humano", "sheets"]

[[skill.steps]]
tool_name = "quality_manage_activities"
arguments_template = '{"module": "talento-humano"}'
output_key = "capacity_balance"

[[skill.steps]]
tool_name = "sheets_read_or_update_metrics"
arguments_template = '{"data": "{capacity_balance}"}'
output_key = "sheets_updated"`,
    steps: [
      {
        stepNumber: 1,
        tool_name: 'quality_manage_activities',
        arguments_template: '{"module": "talento-humano"}',
        output_key: 'capacity_balance',
      },
      {
        stepNumber: 2,
        tool_name: 'sheets_read_or_update_metrics',
        arguments_template: '{"data": "{capacity_balance}"}',
        output_key: 'sheets_updated',
      },
    ],
  },
  {
    id: 'vigilante-comites-y-soportes',
    name: 'vigilante-comites-y-soportes',
    version: '1.0.0',
    description:
      'Vigila la regla crítica de los 10 primeros días hábiles del mes para comités mensuales y el semáforo 30/60/+60 días de soportes administrativos, infraestructura y equipos fijos.',
    author: 'openjarvis-suh',
    source: 'openjarvis:suh-3100',
    tags: ['comites', 'semaforo-30-60', 'calendar', 'gmail'],
    required_capabilities: ['calendar:schedule', 'gmail:send'],
    invocations_count: 22,
    overlay_learned_notes: [
      'Si un comité mensual supera el 10.º día hábil del mes siguiente sin acta ejecutada, marcarlo como HALLAZGO CRÍTICO y convocar sesión urgente.',
    ],
    skill_md: `---
name: vigilante-comites-y-soportes
description: Control de regla de 10 días hábiles en comités y semáforo 30/60/+60 días
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [comites, semaforo, alertas]
---

Cuando ejecutes vigilancia de comités y cronogramas:
1. **Verifica todos los comités mensuales**: Si el mes vencido no tiene acta cargada dentro de los primeros 10 días hábiles del mes siguiente, márcalo como Hallazgo Crítico.
2. **Evalúa el semáforo de vencimientos**: Crítico (≤30 días), Prioridad (31-60 días), Sin prioridad (>60 días).
3. **Agenda automáticamente en Google Calendar** los comités pendientes y envía recordatorios por Gmail a los responsables.`,
    skill_toml: `[skill]
name = "vigilante-comites-y-soportes"
version = "1.0.0"
description = "Vigilancia de comités mensuales y semáforos 30/60 días"
author = "openjarvis-suh"
tags = ["comites", "calendar", "gmail"]

[[skill.steps]]
tool_name = "calendar_check_availability_and_events"
arguments_template = '{"check": "comites_10_dias_habiles"}'
output_key = "comites_status"

[[skill.steps]]
tool_name = "calendar_schedule_quality_meeting"
arguments_template = '{"comites": "{comites_status}"}'
output_key = "scheduled_meetings"

[[skill.steps]]
tool_name = "gmail_send_official_notification"
arguments_template = '{"alerts": "{comites_status}"}'
output_key = "sent_notifications"`,
    steps: [
      {
        stepNumber: 1,
        tool_name: 'calendar_check_availability_and_events',
        arguments_template: '{"check": "comites_10_dias_habiles"}',
        output_key: 'comites_status',
      },
      {
        stepNumber: 2,
        tool_name: 'calendar_schedule_quality_meeting',
        arguments_template: '{"comites": "{comites_status}"}',
        output_key: 'scheduled_meetings',
      },
      {
        stepNumber: 3,
        tool_name: 'gmail_send_official_notification',
        arguments_template: '{"alerts": "{comites_status}"}',
        output_key: 'sent_notifications',
      },
    ],
  },
]

export const DEFAULT_SCHEDULED_MONITORS: OpenJarvisScheduledMonitor[] = [
  {
    id: 'mon-digest-01',
    name: 'Morning Digest SOGCS (Briefing Matutino de Calidad)',
    cronExpression: '0 7 * * 1-5',
    humanSchedule: 'Lunes a Viernes · 7:00 AM',
    agentType: 'morning_digest',
    skillId: 'vigilante-comites-y-soportes',
    prompt:
      'Sintetiza el resumen matutino de soportes críticos (<=30 días), comités en regla de 10 días hábiles, capacidad instalada sin actualizar y tareas del Plan de Trabajo.',
    tools: ['quality_manage_activities', 'calendar_check_availability_and_events', 'gmail_search_quality_threads'],
    enabled: true,
    lastRunAt: '2026-11-12 07:00',
    lastResultSummary: '2 soportes críticos en Bogotá, 1 comité en alerta de 10 días hábiles y 1 servicio pendiente de reporte mensual.',
  },
  {
    id: 'mon-comites-02',
    name: 'Vigilante Regla 10 Días Hábiles de Comités Mensuales',
    cronExpression: '0 8 1-15 * *',
    humanSchedule: 'Días 1 al 15 de cada mes · 8:00 AM',
    agentType: 'monitor_operative',
    skillId: 'vigilante-comites-y-soportes',
    prompt:
      'Verifica si algún comité mensual no ha ejecutado su acta del mes vencido dentro de los primeros 10 días hábiles y prepara convocatoria urgente en Google Calendar.',
    tools: ['calendar_check_availability_and_events', 'calendar_schedule_quality_meeting'],
    enabled: true,
    lastRunAt: '2026-11-12 08:00',
    lastResultSummary: 'Detectado Comité de Tecnovigilancia sin acta de octubre; tarjeta de citación Google Meet generada.',
  },
  {
    id: 'mon-th-03',
    name: 'Monitor Mensual de Capacidad Instalada vs. Servicios Prestados',
    cronExpression: '0 9 5 * *',
    humanSchedule: 'Día 5 de cada mes · 9:00 AM',
    agentType: 'operative',
    skillId: 'auditor-capacidad-instalada',
    prompt:
      'Revisa qué servicios (Intramural, Extramural, Telemedicina) no han actualizado los servicios prestados del mes y calcula holguras o deficiencias.',
    tools: ['sheets_read_or_update_metrics', 'gmail_send_official_notification'],
    enabled: true,
    lastRunAt: '2026-11-05 09:00',
    lastResultSummary: 'Odontología General Medellín pendiente de actualizar datos de noviembre 2026.',
  },
  {
    id: 'mon-docs-04',
    name: 'Vigilante de Vigencia Bienal Documental (2 Años)',
    cronExpression: '0 8 * * 1',
    humanSchedule: 'Todos los Lunes · 8:00 AM',
    agentType: 'monitor_operative',
    skillId: 'editor-quirurgico-documental',
    prompt:
      'Identifica protocolos, manuales y procedimientos que cumplen 2 años desde su fecha de aprobación en los próximos 60 días.',
    tools: ['docs_search_and_read', 'docs_create_controlled_copy'],
    enabled: true,
    lastRunAt: '2026-11-09 08:00',
    lastResultSummary: 'PRO-HC-007 vencido y PRO-BIO-004 próximo a vencer en menos de 30 días.',
  },
]

export function getOpenJarvisSkills(): OpenJarvisSkill[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SKILLS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as OpenJarvisSkill[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return DEFAULT_OPENJARVIS_SKILLS
}

export function saveOpenJarvisSkills(skills: OpenJarvisSkill[]) {
  try {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(skills))
  } catch {
    // ignore
  }
}

export function getScheduledMonitors(): OpenJarvisScheduledMonitor[] {
  try {
    const raw = localStorage.getItem(MONITORS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as OpenJarvisScheduledMonitor[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return DEFAULT_SCHEDULED_MONITORS
}

export function saveScheduledMonitors(monitors: OpenJarvisScheduledMonitor[]) {
  try {
    localStorage.setItem(MONITORS_KEY, JSON.stringify(monitors))
  } catch {
    // ignore
  }
}

// ============================================================================
// GENERADOR DEL CATÁLOGO XML <available_skills> EN EL SYSTEM PROMPT
// (Idéntico al estándar de OpenJarvis)
// ============================================================================
export function buildAvailableSkillsXmlCatalog(skills: OpenJarvisSkill[]): string {
  const lines = skills.map(
    (s) => `  <skill name="${s.name}" version="${s.version}" source="${s.source}" description="${s.description}" />`,
  )
  return `<available_skills>\n${lines.join('\n')}\n</available_skills>`
}

// ============================================================================
// GENERADOR DE MORNING DIGEST (RESUMEN MATUTINO CON NARRATIVA HABLADA TTS)
// ============================================================================
export function generateMorningDigest(db: SuhDatabase, currentUser: AppUser): MorningDigestBriefing {
  const today = todayISO()

  // 1. Soportes críticos en Administración
  const adminEval = db.admin_criterios.map((c) => ({
    c,
    ev: evaluateAdminCriterion(c, today),
  }))
  const soportesCriticos = adminEval
    .filter((x) => !x.ev.cumple || x.ev.semaforo.level === 'critico')
    .map(
      (x) =>
        `${x.c.codigo} (${x.c.titulo}): ${x.ev.estadoLabel} — ${x.ev.semaforo.label} [Resp: ${x.c.responsable}]`,
    )

  // 2. Comités con alerta de 10 días hábiles
  const comitesAlerta10Dias = db.comites
    .map((c) => ({ c, st: evaluateComiteStatus(c, db.actas, today) }))
    .filter((x) => x.st.esHallazgoCritico || !x.st.tieneActaMesActual)
    .map((x) => `${x.c.nombre}: ${x.st.semaforoLabel}`)

  // 3. Capacidad instalada y alertas del mes
  const periodo = today.slice(0, 7)
  const capacidadInstaladaAlertas = db.th_capacidad
    .map((cfg) => {
      const calc = calculateCapacidadInstaladaMes(cfg)
      const reg = db.th_prestados.find(
        (p) => p.servicio_capacidad_id === cfg.id && p.periodo === periodo,
      )
      if (!reg) {
        return `${cfg.nombre_servicio} (${cfg.modalidad}) en ${
          db.sedes.find((s) => s.id === cfg.sede_id)?.nombre ?? cfg.sede_id
        }: Sin actualizar servicios prestados de ${periodo}.`
      }
      if (reg.atenciones_realizadas > calc.capacidadPacientesMes) {
        return `Deficiencia en ${cfg.nombre_servicio} (${cfg.modalidad}): ${reg.atenciones_realizadas} prestados vs. ${calc.capacidadPacientesMes} de capacidad.`
      }
      return null
    })
    .filter((x): x is string => Boolean(x))

  // 4. Hallazgos y Plan de Trabajo
  const ptPendientes = db.plan_trabajo
    .filter((p) => p.estado !== 'completa')
    .map((p) => `${p.codigo} [${p.modulo_origen}]: ${p.titulo} (Vence: ${formatDateES(p.fecha_limite)})`)

  // 5. Ranking Res. 3100
  const cumplimiento3100Resumen = db.evaluaciones_3100.map((ev) => {
    const sum = summarizeEvaluacion3100(ev)
    const sede = db.sedes.find((s) => s.id === ev.sede_id)
    return `${sede?.nombre ?? ev.sede_id}: ${sum.porcentajeGeneral}% cumplimiento general (${sum.noCumple} No cumple, ${sum.parcial} Parciales)`
  })

  const spokenNarrative = `Buenos días, ${currentUser.nombre_completo}. Este es su resumen matutino de calidad OpenJarvis para hoy ${formatDateES(today)}. En el módulo de Administración tenemos ${soportesCriticos.length} criterios en estado crítico o pendientes de soporte vigente. En Comités Institucionales, recuerde verificar el Comité de Tecnovigilancia frente a la regla de los primeros diez días hábiles del mes. En Talento Humano, existen ${capacidadInstaladaAlertas.length} novedades entre capacidad instalada y servicios prestados. Finalmente, en el Plan de Trabajo Anual hay ${ptPendientes.length} actividades activas en seguimiento.Todas las tarjetas de acción están listas para su aprobación.`

  return {
    generatedAt: `${today} 07:00 AM`,
    persona: 'jarvis',
    honorific: currentUser.nombre_completo.split(' ')[0],
    spokenNarrative,
    sections: {
      soportesCriticos,
      comitesAlerta10Dias,
      capacidadInstaladaAlertas,
      hallazgosYPlanTrabajo: ptPendientes,
      cumplimiento3100Resumen,
    },
  }
}

export function speakMorningDigestTTS(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-CO'
  utterance.rate = 1.05
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopMorningDigestTTS() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
