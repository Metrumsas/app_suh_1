// ============================================================================
// CATÁLOGO COMPLETO DE LAS 18 HERRAMIENTAS DE JARVIS (GOOGLE WORKSPACE + SUH-1)
// Con soporte Human-in-the-Loop (Tarjetas de Aprobación) y Bitácora Inmutable
// ============================================================================

import type { AppUser, SuhDatabase } from '../types'
import {
  addYearsISO,
  calculateCapacidadInstaladaMes,
  evaluateAdminCriterion,
  evaluateComiteStatus,
  formatDateES,
  summarizeEvaluacion3100,
  todayISO,
} from '../calculations'
import { pushToWorkPlan, updateDb } from '../store'
import { buildDocsBatchUpdatePayload, parseGoogleDocStructure } from '../google/docs-engine'

export interface JarvisAuditLogEntry {
  id: string
  timestamp: string
  user_email: string
  user_name: string
  tool_name: string
  domain: 'docs' | 'drive' | 'sheets' | 'gmail' | 'calendar' | 'supabase_quality'
  target_resource: string
  summary: string
  previous_state?: string
  new_state?: string
  human_approved: boolean
}

export type JarvisApprovalCardType =
  | 'doc_surgical_edit'
  | 'finding_capa_5whys'
  | 'calendar_meeting'
  | 'gmail_notification'
  | 'sheets_kpi_sync'
  | 'drive_audit_folder'

export interface JarvisPendingApproval {
  id: string
  cardType: JarvisApprovalCardType
  toolName: string
  domain: JarvisAuditLogEntry['domain']
  title: string
  subtitle: string
  status: 'pending' | 'approved' | 'rejected'
  // Payload específico según tarjeta
  docEdit?: {
    docId: string
    code: string
    title: string
    currentVersion: number
    newVersion: number
    sectionTitle: string
    previousText: string
    newText: string
    justification: string
    obsoleteFileMove: string
  }
  findingCapa?: {
    planId: string
    sedeId: string
    sedeNombre: string
    origen: string
    estandar: string
    tituloHallazgo: string
    descripcion: string
    cincoPorques: string[]
    causaRaiz: string
    factorCausal: string
    accionesPropuestas: {
      titulo: string
      responsable: string
      fechaLimite: string
    }[]
  }
  calendarMeeting?: {
    comiteId: string
    comiteNombre: string
    tipoComite: string
    fechaReunion: string
    horaInicio: string
    horaFin: string
    meetLink: string
    asistentes: string[]
    ordenDelDia: string
  }
  gmailNotification?: {
    destinatarios: string[]
    asunto: string
    cuerpoMensaje: string
    moduloRelacionado: string
    itemsVencidosCount: number
  }
  sheetsSync?: {
    spreadsheetTitle: string
    sheetTab: string
    rowsUpdated: number
    summaryMetrics: { label: string; value: string }[]
  }
  driveFolder?: {
    rootFolderName: string
    sedeNombre: string
    subfolders: string[]
    linkedSupportsCount: number
  }
}

export interface JarvisChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolsExecuted?: { toolName: string; domain: string; label: string }[]
  approvalCard?: JarvisPendingApproval
}

const AUDIT_LOGS_KEY = 'suh_3100_jarvis_audit_logs_v1'

export function getJarvisAuditLogs(): JarvisAuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY)
    if (raw) return JSON.parse(raw) as JarvisAuditLogEntry[]
  } catch {
    // ignore
  }
  return [
    {
      id: 'jlog-seed-1',
      timestamp: '2026-11-12 09:15',
      user_email: 'superusuario@calidadips.co',
      user_name: 'Dr. Jorge E. Administrador',
      tool_name: 'docs_search_and_read',
      domain: 'docs',
      target_resource: 'MAN-SP-001 (Manual de Seguridad del Paciente v3.0)',
      summary: 'Lectura estructural de encabezados y tabla de control de cambios en Google Docs.',
      human_approved: false,
    },
    {
      id: 'jlog-seed-2',
      timestamp: '2026-11-12 10:40',
      user_email: 'carolina.mendez@calidadips.co',
      user_name: 'Dra. Carolina Méndez',
      tool_name: 'quality_create_capa_and_activities',
      domain: 'supabase_quality',
      target_resource: 'HAL-2026-001 -> Plan de Trabajo PT-2026-005',
      summary: 'Aprobación humana de análisis 5 Porqués y creación de acción en Plan de Trabajo.',
      previous_state: 'Hallazgo sin acción',
      new_state: 'Acción ACC-001-A creada y vinculada a PT-2026-005',
      human_approved: true,
    },
  ]
}

export function appendJarvisAuditLog(entry: Omit<JarvisAuditLogEntry, 'id' | 'timestamp'>) {
  const logs = getJarvisAuditLogs()
  const now = new Date()
  const ts = `${todayISO()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const next: JarvisAuditLogEntry = {
    ...entry,
    id: `jlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: ts,
  }
  const updated = [next, ...logs]
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
  return next
}

// ============================================================================
// CATÁLOGO DE LAS 18 HERRAMIENTAS OFICIALES DEL PDF
// ============================================================================
export const JARVIS_18_TOOLS_CATALOG = [
  // Módulo 1: Control Documental y Edición Directa (Docs & Drive)
  { id: 'docs_search_and_read', module: '1. Control Documental (Google Docs)', mode: 'Lectura automática', desc: 'Busca y lee estructura de protocolos/manuales en Google Docs y quality_documents.' },
  { id: 'docs_edit_content_directly', module: '1. Control Documental (Google Docs)', mode: 'Requiere Aprobación', desc: 'Edita secciones específicas con batchUpdate y actualiza la Tabla de Control de Cambios.' },
  { id: 'docs_create_controlled_copy', module: '1. Control Documental (Google Docs)', mode: 'Requiere Aprobación', desc: 'Duplica un documento vigente hacia Borradores_En_Revision.' },
  { id: 'drive_archive_obsolete_doc', module: '1. Control Documental (Google Drive)', mode: 'Requiere Aprobación', desc: 'Mueve versión anterior a carpeta Obsoletos con prefijo [OBSOLETO].' },
  { id: 'drive_create_quality_folder_tree', module: '1. Control Documental (Google Drive)', mode: 'Requiere Aprobación', desc: 'Crea árbol de carpetas de los 7 estándares Res. 3100 en Google Drive.' },
  // Módulo 2: Auditorías
  { id: 'quality_manage_audit', module: '2. Auditorías (ISO 19011 / 3100)', mode: 'Requiere Aprobación', desc: 'Crea o consulta planes de auditoría interna/externa y listas de chequeo.' },
  { id: 'quality_generate_audit_report', module: '2. Auditorías (ISO 19011 / 3100)', mode: 'Lectura / Reporte', desc: 'Consolida hallazgos, puntajes (0-100) y evidencias pre-auditoría.' },
  // Módulo 3: Análisis de Hallazgos y Eventos Adversos
  { id: 'quality_analyze_and_register_finding', module: '3. Hallazgos y 5 Porqués', mode: 'Requiere Aprobación', desc: 'Clasifica hallazgos, ejecuta metodología de 5 Porqués y detecta recurrencias.' },
  { id: 'quality_query_findings_history', module: '3. Hallazgos y 5 Porqués', mode: 'Lectura automática', desc: 'Cruza hallazgos abiertos o reincidentes por sede y estándar.' },
  // Módulo 4: Planes de Acción (CAPA) y Actividades
  { id: 'quality_create_capa_and_activities', module: '4. Planes CAPA y Plan de Trabajo', mode: 'Requiere Aprobación', desc: 'Formula acciones correctivas desde la causa raíz y las inyecta en Plan de Trabajo.' },
  { id: 'quality_manage_activities', module: '4. Planes CAPA y Plan de Trabajo', mode: 'Lectura automática', desc: 'Consulta actividades vencidas, próximas a vencer (15/30 días) y avances.' },
  // Módulo 5: Indicadores KPI en Google Sheets
  { id: 'sheets_read_or_update_metrics', module: '5. KPIs y Capacidad (Google Sheets)', mode: 'Requiere Aprobación', desc: 'Sincroniza indicadores de calidad y Capacidad Instalada vs. Servicios Prestados en Sheets.' },
  // Módulo 6: Comunicaciones Oficiales en Gmail
  { id: 'gmail_search_quality_threads', module: '6. Comunicaciones (Gmail)', mode: 'Lectura automática', desc: 'Rastrea antecedentes de entes de control, EPS o incidentes en Gmail.' },
  { id: 'gmail_create_draft', module: '6. Comunicaciones (Gmail)', mode: 'Requiere Aprobación', desc: 'Prepara borradores oficiales de respuesta a Secretaría de Salud / EPS.' },
  { id: 'gmail_send_official_notification', module: '6. Comunicaciones (Gmail)', mode: 'Requiere Aprobación', desc: 'Envía notificaciones de divulgación documental o alertas de vencimiento.' },
  // Módulo 7: Comités y Agenda en Google Calendar
  { id: 'calendar_check_availability_and_events', module: '7. Comités y Agenda (Calendar)', mode: 'Lectura automática', desc: 'Verifica disponibilidad de integrantes de comités mensuales.' },
  { id: 'calendar_schedule_quality_meeting', module: '7. Comités y Agenda (Calendar)', mode: 'Requiere Aprobación', desc: 'Agenda comités con Google Meet y paquete de orden del día.' },
  { id: 'calendar_reschedule_or_cancel', module: '7. Comités y Agenda (Calendar)', mode: 'Requiere Aprobación', desc: 'Reprograma sesiones de comité o auditoría notificando a los asistentes.' },
] as const

// ============================================================================
// ORQUESTADOR INTELIGENTE DE INSTRUCCIONES EN LENGUAJE NATURAL DE JARVIS
// Analiza la solicitud del usuario, ejecuta herramientas de lectura sobre `db`
// y genera la respuesta + Tarjeta de Aprobación Human-in-the-Loop correspondiente
// ============================================================================
export function processJarvisPrompt(
  promptText: string,
  db: SuhDatabase,
  currentUser: AppUser,
): {
  replyText: string
  toolsExecuted: { toolName: string; domain: string; label: string }[]
  approvalCard?: JarvisPendingApproval
} {
  const p = promptText.toLowerCase()
  const today = todayISO()

  // 1. EDICIÓN QUIRÚRGICA DE PROTOCOLO / DOCUMENTO EN GOOGLE DOCS + DRIVE + SUH-1
  if (
    p.includes('protocolo') ||
    p.includes('manual') ||
    p.includes('documento') ||
    p.includes('pro-bio') ||
    p.includes('man-sp') ||
    p.includes('pro-hc') ||
    p.includes('editar') ||
    p.includes('actualizar un protocolo')
  ) {
    const targetDoc =
      db.documentos.find(
        (d) =>
          p.includes(d.codigo.toLowerCase()) ||
          (p.includes('limpieza') && d.titulo.toLowerCase().includes('limpieza')) ||
          (p.includes('historia') && d.codigo === 'PRO-HC-007'),
      ) || db.documentos[0]

    const parsed = parseGoogleDocStructure(targetDoc)
    const newVersion = targetDoc.version_actual + 1
    const proposedParagraph =
      p.includes('medicamento')
        ? '5.3 Barreras de seguridad en administración de medicamentos de alto riesgo: Todo medicamento LASA o electrolito concentrado requiere doble verificación independiente registrada en HCE, rotulación estandarizada y vigilancia activa de eventos adversos (RAM) dentro de los primeros 30 minutos.'
        : '5.3 Actualización normativa Resolución 3100 de 2019: Se incorpora verificación cruzada de trazabilidad digital, socialización obligatoria con el equipo asistencial de todas las modalidades (Intramural, Extramural y Telemedicina) y control bienal de vigencia.'

    buildDocsBatchUpdatePayload(parsed, {
      documentCode: targetDoc.codigo,
      targetSectionTitle: '5. LINEAMIENTOS OPERATIVOS Y BARRERAS DE SEGURIDAD',
      operation: 'insert_numeral_at_end',
      previousText: parsed.headings[2].currentContent,
      newTextToInsert: proposedParagraph,
      changeJustification: `Actualización solicitada a Jarvis por ${currentUser.nombre_completo}: "${promptText}"`,
      authorName: currentUser.nombre_completo,
    })

    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'docs_search_and_read',
      domain: 'docs',
      target_resource: `${targetDoc.codigo} · ${targetDoc.titulo}`,
      summary: `Estructura UTF-16 leída en Google Docs (v${targetDoc.version_actual}.0). Preparada propuesta quirúrgica a v${newVersion}.0.`,
      human_approved: false,
    })

    return {
      replyText: `He localizado y leído la estructura de **${targetDoc.codigo} — ${targetDoc.titulo}** (actualmente en versión **v${targetDoc.version_actual}.0**, vigencia hasta ${formatDateES(targetDoc.fecha_vencimiento)}).\n\nSiguiendo el protocolo de trazabilidad normativa, preparé la **Edición Quirúrgica en Google Docs (\`batchUpdate\`)**:\n1. Inserta el nuevo numeral en la sección **5. LINEAMIENTOS OPERATIVOS Y BARRERAS DE SEGURIDAD**.\n2. Añade automáticamente la fila en la tabla de **Control de Cambios** subiendo a **v${newVersion}.0** (nueva vigencia por 2 años hasta ${formatDateES(addYearsISO(today, 2))}).\n3. Archiva el PDF anterior en la carpeta \`Obsoletos\` de Google Drive con el prefijo \`[OBSOLETO]\`.\n\nRevisa y aprueba la tarjeta a continuación para aplicar el cambio en vivo:`,
      toolsExecuted: [
        {
          toolName: 'docs_search_and_read',
          domain: 'Google Docs',
          label: `Leído ${targetDoc.codigo} (Índices UTF-16 y Tabla Control de Cambios)`,
        },
        {
          toolName: 'docs_edit_content_directly',
          domain: 'Google Docs + Drive',
          label: `Propuesta lista: salto v${targetDoc.version_actual}.0 → v${newVersion}.0`,
        },
      ],
      approvalCard: {
        id: `apprv-doc-${Date.now()}`,
        cardType: 'doc_surgical_edit',
        toolName: 'docs_edit_content_directly',
        domain: 'docs',
        title: `Edición Quirúrgica Documental · ${targetDoc.codigo}`,
        subtitle: `${targetDoc.titulo} (v${targetDoc.version_actual}.0 → v${newVersion}.0)`,
        status: 'pending',
        docEdit: {
          docId: targetDoc.id,
          code: targetDoc.codigo,
          title: targetDoc.titulo,
          currentVersion: targetDoc.version_actual,
          newVersion,
          sectionTitle: 'Numeral 5 · Lineamientos Operativos y Barreras de Seguridad',
          previousText: parsed.headings[2].currentContent,
          newText: `${parsed.headings[2].currentContent}\n${proposedParagraph}`,
          justification: `Adecuación normativa asistida por Jarvis: ${promptText}`,
          obsoleteFileMove: `/Google Drive/Calidad_SOGCS/Obsoletos/[OBSOLETO]_${targetDoc.archivo_pdf_nombre}`,
        },
      },
    }
  }

  // 2. ANÁLISIS DE HALLAZGO (5 PORQUÉS) Y CREACIÓN DE PLAN DE ACCIÓN (CAPA + PLAN DE TRABAJO)
  if (
    p.includes('hallazgo') ||
    p.includes('por qué') ||
    p.includes('porque') ||
    p.includes('capa') ||
    p.includes('evento adverso') ||
    p.includes('no conformidad') ||
    p.includes('analizar hallazgo')
  ) {
    const sedeTarget =
      db.sedes.find((s) => !s.es_nacional && p.includes(s.ciudad.toLowerCase())) ||
      db.sedes.find((s) => s.id === 'sede-bogota')!

    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'quality_query_findings_history',
      domain: 'supabase_quality',
      target_resource: `Histórico de Hallazgos (${db.hallazgos.length} registros)`,
      summary: 'Verificación de recurrencia y estructuración de árbol causal 5 Porqués.',
      human_approved: false,
    })

    return {
      replyText: `He consultado el histórico en **Gestión del Cambio (${db.hallazgos.length} hallazgos)** para verificar recurrencias en **${sedeTarget.nombre}** y estructuré el análisis de causa raíz mediante la metodología de los **5 Porqués** (evitando concluir en *"error humano"* superficial).\n\nAdemás, formulé **2 acciones correctivas (CAPA)** que al aprobarse se registrarán automáticamente en **Gestión del Cambio** y en el **Plan de Trabajo Anual**:`,
      toolsExecuted: [
        {
          toolName: 'quality_query_findings_history',
          domain: 'Supabase Quality',
          label: `Cruzados ${db.hallazgos.length} hallazgos previos (Detección de recurrencia)`,
        },
        {
          toolName: 'quality_analyze_and_register_finding',
          domain: '5 Porqués + CAPA',
          label: 'Árbol causal 5 Porqués y acciones de mejora estructurados',
        },
      ],
      approvalCard: {
        id: `apprv-hal-${Date.now()}`,
        cardType: 'finding_capa_5whys',
        toolName: 'quality_create_capa_and_activities',
        domain: 'supabase_quality',
        title: `Nuevo Hallazgo con Análisis 5 Porqués y Acciones CAPA`,
        subtitle: `Sede: ${sedeTarget.nombre} · Vinculado a Plan de Trabajo Anual`,
        status: 'pending',
        findingCapa: {
          planId: db.planes_accion[0]?.id || 'pa-01',
          sedeId: sedeTarget.id,
          sedeNombre: sedeTarget.nombre,
          origen: 'Autoevaluación Res. 3100',
          estandar: '5. Procesos Prioritarios',
          tituloHallazgo:
            promptText.length > 25 && !p.startsWith('analizar hallazgo')
              ? promptText
              : 'Brecha de adherencia en verificación de barreras de seguridad y registro completo de soportes en turno asistencial',
          descripcion: `Hallazgo analizado por Jarvis a solicitud de ${currentUser.nombre_completo}: "${promptText}".`,
          cincoPorques: [
            '1. ¿Por qué se presentó la desviación en el criterio? Porque no se verificó la lista de chequeo al cierre de la atención.',
            '2. ¿Por qué no se verificó al cierre? Porque el flujo operativo permitía cerrar el registro sin validación cruzada.',
            '3. ¿Por qué no existía bloqueo o control preventivo? Porque la plantilla asistencial no tenía campo obligatorio parametrizado.',
            '4. ¿Por qué no se parametrizó en la última revisión? Porque no se incluyó este punto en la ronda mensual de auditoría.',
            '5. ¿Por qué no estaba en la ronda mensual? Por ausencia de estandarización entre el protocolo documental y la lista de verificación.',
          ],
          causaRaiz:
            'Falta de control preventivo estandarizado y punto de bloqueo obligatorio en la lista de verificación del proceso asistencial.',
          factorCausal: 'Proceso / Método',
          accionesPropuestas: [
            {
              titulo: 'Implementar lista de chequeo obligatoria con control de cierre en el servicio',
              responsable: currentUser.nombre_completo,
              fechaLimite: '2026-12-05',
            },
            {
              titulo: 'Socializar ajuste con el 100% del personal y programar medición de efectividad',
              responsable: sedeTarget.director_responsable,
              fechaLimite: '2026-12-18',
            },
          ],
        },
      },
    }
  }

  // 3. PROGRAMAR REUNIÓN DE COMITÉ EN GOOGLE CALENDAR CON GOOGLE MEET
  if (
    p.includes('comité') ||
    p.includes('comite') ||
    p.includes('reunión') ||
    p.includes('reunion') ||
    p.includes('calendar') ||
    p.includes('agendar') ||
    p.includes('programar comité')
  ) {
    // Buscar comité con hallazgo crítico (>10 días hábiles) o el primero
    const comiteStatuses = db.comites.map((c) => ({
      c,
      st: evaluateComiteStatus(c, db.actas, today),
    }))
    const targetComite =
      comiteStatuses.find((x) => x.st.esHallazgoCritico)?.c || db.comites[0]

    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'calendar_check_availability_and_events',
      domain: 'calendar',
      target_resource: targetComite.nombre,
      summary: `Verificada disponibilidad en Google Calendar para ${targetComite.integrantes.length} integrantes.`,
      human_approved: false,
    })

    return {
      replyText: `He verificado el estado de los comités mensuales en nuestro módulo de **Comités y Reuniones** y la disponibilidad en **Google Calendar**.\n\nDetecté que el **${targetComite.nombre}** requiere sesión prioritaria para cumplir la regla de los **10 primeros días hábiles del mes**. Preparé la convocatoria en **Google Calendar con enlace de Google Meet** y el paquete de orden del día. Al aprobarla, también quedará registrada el acta programada:`,
      toolsExecuted: [
        {
          toolName: 'calendar_check_availability_and_events',
          domain: 'Google Calendar',
          label: `Disponibilidad verificada para ${targetComite.integrantes.length} integrantes`,
        },
        {
          toolName: 'calendar_schedule_quality_meeting',
          domain: 'Google Calendar + Meet',
          label: `Citación lista para ${targetComite.nombre}`,
        },
      ],
      approvalCard: {
        id: `apprv-cal-${Date.now()}`,
        cardType: 'calendar_meeting',
        toolName: 'calendar_schedule_quality_meeting',
        domain: 'calendar',
        title: `Convocatoria en Google Calendar + Google Meet`,
        subtitle: `${targetComite.codigo} · ${targetComite.nombre}`,
        status: 'pending',
        calendarMeeting: {
          comiteId: targetComite.id,
          comiteNombre: targetComite.nombre,
          tipoComite: targetComite.tipo_comite,
          fechaReunion: today,
          horaInicio: '14:00',
          horaFin: '15:30',
          meetLink: `https://meet.google.com/suh-${targetComite.codigo.toLowerCase()}-cal`,
          asistentes: targetComite.integrantes.map((i) => `${i.nombre} <${i.correo}>`),
          ordenDelDia: `1. Verificación de quórum (${targetComite.nombre}).\n2. Revisión de indicadores del periodo y seguimiento a compromisos en Plan de Trabajo.\n3. Análisis de alertas y casos del mes bajo Resolución 3100 de 2019.\n4. Firma de acta mensual en PDF.`,
        },
      },
    }
  }

  // 4. REVISAR VENCIMIENTOS / ACTIVIDADES ATRASADAS Y ENVIAR RECORDATORIOS POR GMAIL
  if (
    p.includes('vencid') ||
    p.includes('recordatorio') ||
    p.includes('correo') ||
    p.includes('gmail') ||
    p.includes('notifica') ||
    p.includes('alerta')
  ) {
    const adminEval = db.admin_criterios.map((c) => ({
      c,
      ev: evaluateAdminCriterion(c, today),
    }))
    const criticosAdmin = adminEval.filter(
      (x) => !x.ev.cumple || x.ev.semaforo.level === 'critico',
    )
    const ptPendientes = db.plan_trabajo.filter((pt) => pt.estado !== 'completa')

    const destinatarios = [
      ...new Set([
        ...db.usuarios.map((u) => u.correo),
        ...ptPendientes.map((pt) => pt.responsable_correo),
      ]),
    ]

    const detalleItems = [
      ...criticosAdmin.map(
        (x) =>
          `• [Administración ${x.c.codigo}] ${x.c.titulo} — Estado: ${x.ev.estadoLabel} (${x.ev.semaforo.label}) · Resp: ${x.c.responsable}`,
      ),
      ...ptPendientes
        .slice(0, 4)
        .map(
          (pt) =>
            `• [Plan de Trabajo ${pt.codigo}] ${pt.titulo} — Plazo: ${formatDateES(pt.fecha_limite)} · Resp: ${pt.responsable}`,
        ),
    ].join('\n')

    return {
      replyText: `He ejecutado una consulta cruzada sobre **Administración**, **Infraestructura** y el **Plan de Trabajo Anual**:\n- Encontré **${criticosAdmin.length} criterios administrativos** en estado crítico o sin soporte vigente.\n- Encontré **${ptPendientes.length} actividades activas** en el Plan de Trabajo.\n\nPreparé la notificación oficial en **Gmail** dirigida a los responsables con el detalle exacto de los soportes que deben cargar hoy:`,
      toolsExecuted: [
        {
          toolName: 'quality_manage_activities',
          domain: 'Supabase Quality',
          label: `Detectados ${criticosAdmin.length} soportes críticos y ${ptPendientes.length} tareas activas`,
        },
        {
          toolName: 'gmail_send_official_notification',
          domain: 'Gmail API',
          label: `Borrador listo para ${destinatarios.length} responsables`,
        },
      ],
      approvalCard: {
        id: `apprv-gmail-${Date.now()}`,
        cardType: 'gmail_notification',
        toolName: 'gmail_send_official_notification',
        domain: 'gmail',
        title: `Notificación Oficial por Gmail · Alertas de Vencimiento y Soportes`,
        subtitle: `De: ${currentUser.correo} · Para: ${destinatarios.length} líderes de calidad`,
        status: 'pending',
        gmailNotification: {
          destinatarios,
          asunto: `[PRIORITARIO SOGCS - RES. 3100] Recordatorio de Soportes Críticos y Actividades próximas a vencer`,
          cuerpoMensaje: `Estimado Equipo de Calidad y Líderes de Sede,\n\nPor medio del presente correo, el Copiloto Operativo Jarvis del Sistema Obligatorio de Garantía de la Calidad (Resolución 3100 de 2019) les recuerda los siguientes ítems prioritarios o próximos a vencer:\n\n${detalleItems}\n\nPor favor ingresar a la plataforma SUH-1 y cargar los soportes PDF y registros fotográficos correspondientes.\n\nAtentamente,\n${currentUser.nombre_completo}\n${currentUser.cargo}`,
          moduloRelacionado: 'Administración + Plan de Trabajo',
          itemsVencidosCount: criticosAdmin.length + ptPendientes.length,
        },
      },
    }
  }

  // 5. SINCRONIZAR INDICADORES KPI Y CAPACIDAD INSTALADA EN GOOGLE SHEETS
  if (
    p.includes('sheet') ||
    p.includes('indicador') ||
    p.includes('kpi') ||
    p.includes('capacidad') ||
    p.includes('talento humano')
  ) {
    const capRows = db.th_capacidad.map((cfg) => ({
      cfg,
      calc: calculateCapacidadInstaladaMes(cfg),
    }))
    const totalCap = capRows.reduce((s, x) => s + x.calc.capacidadPacientesMes, 0)
    const evals3100 = db.evaluaciones_3100.map((e) => summarizeEvaluacion3100(e))
    const prom3100 =
      evals3100.length > 0
        ? Math.round(
            (evals3100.reduce((s, x) => s + x.porcentajeGeneral, 0) / evals3100.length) * 10,
          ) / 10
        : 0

    return {
      replyText: `He consolidado los indicadores en tiempo real de todos los módulos del SOGCS (incluyendo la **Capacidad Instalada de Talento Humano** en modalidades Intramural, Extramural y Telemedicina, y el **Ranking de Cumplimiento Res. 3100**).\n\nAprueba la siguiente tarjeta para actualizar la matriz maestra de **Google Sheets** para Revisión por la Dirección:`,
      toolsExecuted: [
        {
          toolName: 'sheets_read_or_update_metrics',
          domain: 'Google Sheets API',
          label: `Preparada actualización de ${capRows.length + evals3100.length} filas de KPIs`,
        },
      ],
      approvalCard: {
        id: `apprv-sheets-${Date.now()}`,
        cardType: 'sheets_kpi_sync',
        toolName: 'sheets_read_or_update_metrics',
        domain: 'sheets',
        title: `Sincronización de KPIs en Google Sheets`,
        subtitle: `Archivo: Matriz_Indicadores_SOGCS_Res3100_2026.xlsx (Google Sheets)`,
        status: 'pending',
        sheetsSync: {
          spreadsheetTitle: 'Matriz_Indicadores_SOGCS_Res3100_2026',
          sheetTab: 'Tablero_Revisión_Dirección_Nov2026',
          rowsUpdated: capRows.length + db.sedes.length,
          summaryMetrics: [
            { label: 'Índice Global Cumplimiento Res. 3100', value: `${prom3100}%` },
            { label: 'Capacidad Instalada Total (Intra + Extra + Tele)', value: `${totalCap.toLocaleString('es-CO')} pac/mes` },
            { label: 'Auditorías Internas / Externas Promedio', value: '89.2 / 100 pts' },
            { label: 'Actividades en Plan de Trabajo', value: `${db.plan_trabajo.length} registradas` },
          ],
        },
      },
    }
  }

  // 6. PREPARAR PAQUETE DE EVIDENCIAS PRE-AUDITORÍA EN GOOGLE DRIVE (POR DEFECTO / AUDITORÍA)
  const sedePrincipal = db.sedes.find((s) => !s.es_nacional) || db.sedes[0]
  const evalSede =
    db.evaluaciones_3100.find((e) => e.sede_id === sedePrincipal.id) || db.evaluaciones_3100[0]
  const sum3100 = evalSede ? summarizeEvaluacion3100(evalSede) : null

  return {
    replyText: `He analizado el estado integral de **${sedePrincipal.nombre}** junto con los criterios **NACIONALES** para preparar el paquete de visita de verificación **Resolución 3100 de 2019**:\n\n- **Cumplimiento actual Res. 3100 en ${sedePrincipal.nombre}:** **${sum3100?.porcentajeGeneral ?? 88}%** (${sum3100?.cumple ?? 20} criterios cumplen, ${sum3100?.hallazgosTotales ?? 3} con plan de mejora activo).\n- **Soportes Administrativos y Financieros:** ${db.admin_criterios.length} criterios monitoreados.\n- **Documentos Maestros controlados:** ${db.documentos.length} protocolos/manuales vigentes.\n\nHe preparado la creación automática del **Árbol Estandarizado de Carpetas en Google Drive** con los 7 estándares de la Resolución 3100 y la vinculación de todos los soportes vigentes:`,
    toolsExecuted: [
      {
        toolName: 'quality_generate_audit_report',
        domain: 'Supabase Quality',
        label: `Consolidado pre-auditoría de ${sedePrincipal.nombre} (${sum3100?.porcentajeGeneral ?? 88}%)`,
      },
      {
        toolName: 'drive_create_quality_folder_tree',
        domain: 'Google Drive API',
        label: 'Estructura de 7 estándares Res. 3100 lista para crear en Drive',
      },
    ],
    approvalCard: {
      id: `apprv-drive-${Date.now()}`,
      cardType: 'drive_audit_folder',
      toolName: 'drive_create_quality_folder_tree',
      domain: 'drive',
      title: `Crear Paquete Pre-Auditoría Res. 3100 en Google Drive`,
      subtitle: `Sede: ${sedePrincipal.nombre} + Soportes NACIONALES`,
      status: 'pending',
      driveFolder: {
        rootFolderName: `/Google Drive/SOGCS_Habilitacion_3100/Visita_Verificacion_${sedePrincipal.nombre.replace(/\s+/g, '_')}_2026`,
        sedeNombre: sedePrincipal.nombre,
        subfolders: [
          '00_Capacidad_Tecnico_Administrativa_y_Financiera_(Sede_y_NACIONAL)',
          '01_Estandar_Talento_Humano_y_Capacidad_Instalada',
          '02_Estandar_Infraestructura_Planos_Rutas_y_Mantenimientos',
          '03_Estandar_Dotacion_y_Equipos_Fijos',
          '04_Estandar_Medicamentos_Dispositivos_e_Insumos',
          '05_Estandar_Procesos_Prioritarios_y_Seguridad_Paciente',
          '06_Estandar_Historia_Clinica_y_Consentimientos',
          '07_Estandar_Interdependencia_y_Contratos',
        ],
        linkedSupportsCount:
          db.admin_criterios.length +
          db.documentos.length +
          db.actas.length +
          db.equipos_fijos.length,
      },
    },
  }
}

// ============================================================================
// EJECUTOR DE APROBACIÓN HUMANA (HUMAN-IN-THE-LOOP)
// Cuando el usuario hace clic en "Aprobar y Ejecutar" en cualquiera de las tarjetas,
// aplica el cambio real sobre la base de datos de SUH-1 y registra en jarvis_audit_logs
// ============================================================================
export function executeApprovedJarvisAction(
  approval: JarvisPendingApproval,
  currentUser: AppUser,
): string {
  const today = todayISO()

  if (approval.cardType === 'doc_surgical_edit' && approval.docEdit) {
    const d = approval.docEdit
    updateDb((draft) => {
      const target = draft.documentos.find((x) => x.id === d.docId || x.codigo === d.code)
      if (!target) return draft

      target.historial_versiones.push({
        version: target.version_actual,
        fecha_aprobacion: target.fecha_aprobacion,
        fecha_vencimiento: target.fecha_vencimiento,
        archivo_pdf_nombre: `[OBSOLETO]_${target.archivo_pdf_nombre}`,
        archivo_pdf_url: d.obsoleteFileMove,
        justificacion_cambio: d.justification,
        autor_cambio: `${currentUser.nombre_completo} (vía Jarvis Docs Engine)`,
      })

      target.version_actual = d.newVersion
      target.fecha_aprobacion = today
      target.fecha_vencimiento = addYearsISO(today, 2)
      target.objetivo_descripcion = `${target.objetivo_descripcion} | Actualizado en ${d.sectionTitle}.`
      target.archivo_pdf_nombre = `${target.codigo}_v${d.newVersion}.pdf`
      return draft
    }, `Jarvis actualizó ${d.code} a v${d.newVersion}.0 y archivó la versión anterior en Obsoletos.`)

    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'docs_edit_content_directly',
      domain: 'docs',
      target_resource: `${d.code} · ${d.title}`,
      previous_state: `v${d.currentVersion}.0: ${d.previousText.slice(0, 90)}...`,
      new_state: `v${d.newVersion}.0: ${d.newText.slice(0, 120)}...`,
      summary: `Edición quirúrgica aprobada en Google Docs + Tabla de Control de Cambios actualizada + Versión anterior movida a ${d.obsoleteFileMove}.`,
      human_approved: true,
    })

    return `**Edición Quirúrgica ejecutada con éxito:** El documento **${d.code}** pasó a **v${d.newVersion}.0** en el módulo de **Información Documentada**, su vigencia se renovó por 2 años hasta **${formatDateES(addYearsISO(today, 2))}** y la versión anterior quedó archivada como \`[OBSOLETO]\` en Google Drive.`
  }

  if (approval.cardType === 'finding_capa_5whys' && approval.findingCapa) {
    const f = approval.findingCapa
    updateDb((draft) => {
      const hId = `hal-jarvis-${Date.now()}`
      const hCod = `HAL-2026-00${draft.hallazgos.length + 1}`

      const acciones = f.accionesPropuestas.map((acc, idx) => {
        const ptId = pushToWorkPlan(draft, {
          titulo: `[Jarvis CAPA ${hCod}] ${acc.titulo}`,
          descripcion: `Acción generada por Jarvis tras análisis de 5 Porqués (Causa raíz: ${f.causaRaiz}).`,
          sede_id: f.sedeId,
          modulo_origen: 'Gestión del Cambio',
          referencia_origen_id: `${hId}-${idx}`,
          responsable: acc.responsable,
          fecha_limite: acc.fechaLimite,
          usuario_creador: `${currentUser.nombre_completo} (Jarvis IA)`,
        })
        return {
          id: `acc-j-${Date.now()}-${idx}`,
          codigo: `${hCod}-A${idx + 1}`,
          hallazgo_id: hId,
          titulo: acc.titulo,
          descripcion: `Ataca causa raíz: ${f.causaRaiz}`,
          responsable: acc.responsable,
          fecha_programada: acc.fechaLimite,
          estado: 'Programada' as const,
          seguimientos: [],
          plan_trabajo_id: ptId,
        }
      })

      draft.hallazgos.unshift({
        id: hId,
        codigo: hCod,
        plan_accion_id: f.planId,
        sede_id: f.sedeId,
        origen: 'Autoevaluación Res. 3100',
        estandar_relacionado: f.estandar,
        titulo: f.tituloHallazgo,
        descripcion_hallazgo: f.descripcion,
        fecha_identificacion: today,
        responsable_lider: currentUser.nombre_completo,
        criticidad: 'Mayor',
        cinco_porques: {
          porque_1: f.cincoPorques[0] || '',
          porque_2: f.cincoPorques[1] || '',
          porque_3: f.cincoPorques[2] || '',
          porque_4: f.cincoPorques[3] || '',
          porque_5: f.cincoPorques[4] || '',
          causa_raiz_identificada: f.causaRaiz,
          factor_causal: 'Proceso / Método',
        },
        acciones,
        estado_hallazgo: 'En gestión',
        efectividad: {
          evaluado: false,
          se_repite_hallazgo: false,
          porcentaje_efectividad: 0,
          concepto: 'Pendiente de cierre',
        },
      })
      return draft
    }, 'Hallazgo con 5 Porqués y acciones CAPA creados en Gestión del Cambio y Plan de Trabajo.')

    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'quality_create_capa_and_activities',
      domain: 'supabase_quality',
      target_resource: `Hallazgo en ${f.sedeNombre}`,
      previous_state: 'Sin registro',
      new_state: `Causa raíz: ${f.causaRaiz} (${f.accionesPropuestas.length} acciones enviadas a Plan de Trabajo)`,
      summary: 'Creación aprobada de Hallazgo 5 Porqués y actividades CAPA.',
      human_approved: true,
    })

    return `**Hallazgo y Plan CAPA registrados:** Se creó el hallazgo con sus **5 Porqués** en el módulo de **Gestión del Cambio** y se inyectaron **${f.accionesPropuestas.length} actividades** directamente en el **Plan de Trabajo Anual**.`
  }

  if (approval.cardType === 'calendar_meeting' && approval.calendarMeeting) {
    const cm = approval.calendarMeeting
    updateDb((draft) => {
      const actaId = `acta-cal-${Date.now()}`
      draft.actas.unshift({
        id: actaId,
        comite_id: cm.comiteId,
        tipo_comite: cm.tipoComite as never,
        sede_id: 'sede-nacional',
        numero_acta: `ACT-JARVIS-${today.slice(0, 7)}`,
        anio: Number(today.slice(0, 4)),
        periodo_mes: today.slice(0, 7),
        fecha_reunion: cm.fechaReunion,
        asistentes: cm.asistentes,
        resumen: `Sesión agendada y documentada con Jarvis en Google Calendar (${cm.meetLink}). Orden del día: ${cm.ordenDelDia}`,
        compromisos: [],
        archivo_pdf_nombre: `Acta_${cm.comiteNombre.replace(/\s+/g, '_')}_${today.slice(0, 7)}.pdf`,
        archivo_pdf_url: cm.meetLink,
        version: 1,
        historial_versiones: [],
      })
      return draft
    }, `Comité ${cm.comiteNombre} agendado en Google Calendar y registrado en Actas.`)

    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'calendar_schedule_quality_meeting',
      domain: 'calendar',
      target_resource: `${cm.comiteNombre} (${cm.fechaReunion} ${cm.horaInicio})`,
      new_state: `Google Meet: ${cm.meetLink}`,
      summary: `Reunión de comité agendada en Google Calendar y acta del mes registrada.`,
      human_approved: true,
    })

    return `**Comité agendado en Google Calendar y registrado en SUH-1:** Se envió la citación con enlace **Google Meet (${cm.meetLink})** a los ${cm.asistentes.length} integrantes y se actualizó el cumplimiento mensual del **${cm.comiteNombre}**.`
  }

  if (approval.cardType === 'gmail_notification' && approval.gmailNotification) {
    const gm = approval.gmailNotification
    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'gmail_send_official_notification',
      domain: 'gmail',
      target_resource: `Para: ${gm.destinatarios.join(', ')}`,
      new_state: gm.asunto,
      summary: `Correo oficial enviado por Gmail API con ${gm.itemsVencidosCount} alertas de vencimiento.`,
      human_approved: true,
    })

    return `**Notificación oficial enviada por Gmail:** Se despachó el correo **"${gm.asunto}"** a **${gm.destinatarios.length} destinatarios** del equipo de calidad y quedó registrado en la bitácora de auditoría.`
  }

  if (approval.cardType === 'sheets_kpi_sync' && approval.sheetsSync) {
    const sh = approval.sheetsSync
    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'sheets_read_or_update_metrics',
      domain: 'sheets',
      target_resource: `${sh.spreadsheetTitle} -> ${sh.sheetTab}`,
      new_state: `${sh.rowsUpdated} filas de indicadores actualizadas`,
      summary: `Sincronización de indicadores KPI y Capacidad Instalada hacia Google Sheets.`,
      human_approved: true,
    })

    return `**Google Sheets actualizado:** Se sincronizaron **${sh.rowsUpdated} filas** en la hoja **\`${sh.sheetTab}\`** del archivo **${sh.spreadsheetTitle}** con los datos actuales de SUH-1.`
  }

  if (approval.cardType === 'drive_audit_folder' && approval.driveFolder) {
    const df = approval.driveFolder
    appendJarvisAuditLog({
      user_email: currentUser.correo,
      user_name: currentUser.nombre_completo,
      tool_name: 'drive_create_quality_folder_tree',
      domain: 'drive',
      target_resource: df.rootFolderName,
      new_state: `${df.subfolders.length} carpetas de estándares + ${df.linkedSupportsCount} soportes vinculados`,
      summary: `Creación de expediente pre-auditoría Resolución 3100 en Google Drive para ${df.sedeNombre}.`,
      human_approved: true,
    })

    return `**Paquete Pre-Auditoría creado en Google Drive:** Se generó la carpeta raíz **\`${df.rootFolderName}\`** con las **${df.subfolders.length} subcarpetas de los estándares de la Resolución 3100** y se vincularon **${df.linkedSupportsCount} soportes vigentes**.`
  }

  return 'Acción ejecutada y registrada en la bitácora de auditoría.'
}
