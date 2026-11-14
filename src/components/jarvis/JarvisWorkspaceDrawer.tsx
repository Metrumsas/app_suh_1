import { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Mail,
  Play,
  Plus,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react'
import type { AppUser, SuhDatabase } from '../../lib/types'
import {
  getGoogleWorkspaceConnection,
  GOOGLE_WORKSPACE_SCOPES,
  setGoogleWorkspaceConnection,
} from '../../lib/google/auth'
import {
  executeApprovedJarvisAction,
  getJarvisAuditLogs,
  JARVIS_18_TOOLS_CATALOG,
  processJarvisPrompt,
} from '../../lib/jarvis/tools'
import type {
  JarvisAuditLogEntry,
  JarvisChatMessage,
  JarvisPendingApproval,
} from '../../lib/jarvis/tools'
import {
  buildAvailableSkillsXmlCatalog,
  generateMorningDigest,
  getOpenJarvisSkills,
  getScheduledMonitors,
  saveOpenJarvisSkills,
  saveScheduledMonitors,
  speakMorningDigestTTS,
  stopMorningDigestTTS,
} from '../../lib/jarvis/openjarvis-skills'
import type {
  OpenJarvisScheduledMonitor,
  OpenJarvisSkill,
} from '../../lib/jarvis/openjarvis-skills'
import { todayISO } from '../../lib/calculations'

const QUICK_CHIPS = [
  'Actualizar un protocolo o documento en Drive (ej. PRO-BIO-004 o MAN-SP-001)',
  'Analizar hallazgo y crear plan de acción (CAPA + 5 Porqués)',
  'Revisar actividades vencidas y enviar recordatorios por Gmail',
  'Programar Comité de Calidad / Tecnovigilancia en Google Calendar',
  'Preparar paquete de evidencias para auditoría Res. 3100 en Google Drive',
  'Sincronizar indicadores KPI y Capacidad Instalada en Google Sheets',
]

export default function JarvisWorkspaceDrawer({
  db,
  currentUser,
  activeModule,
  isOpen,
  onClose,
  embeddedMode = false,
}: {
  db: SuhDatabase
  currentUser: AppUser
  activeModule: string
  isOpen: boolean
  onClose?: () => void
  embeddedMode?: boolean
}) {
  const [tab, setTab] = useState<'chat' | 'skills' | 'digest' | 'monitors' | 'tools' | 'audit'>('chat')
  const [conn, setConn] = useState(() => getGoogleWorkspaceConnection(currentUser.correo))
  const [auditLogs, setAuditLogs] = useState<JarvisAuditLogEntry[]>(() => getJarvisAuditLogs())
  const [skills, setSkills] = useState<OpenJarvisSkill[]>(() => getOpenJarvisSkills())
  const [selectedSkill, setSelectedSkill] = useState<OpenJarvisSkill | null>(null)
  const [showCreateSkill, setShowCreateSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillDesc, setNewSkillDesc] = useState('')
  const [newSkillMd, setNewSkillMd] = useState('')
  const [monitors, setMonitors] = useState<OpenJarvisScheduledMonitor[]>(() => getScheduledMonitors())
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<JarvisChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      role: 'assistant',
      timestamp: todayISO(),
      content: `Hola **${currentUser.nombre_completo.split(' ')[0]}**. Soy **JARVIS**, el Copiloto Operativo de Gestión de Calidad y Seguridad del Paciente (Resolución 3100 de 2019).\n\nEstoy conectado en tiempo real con tus **10 módulos de SUH-1** y con tu ecosistema **Google Workspace (Docs, Sheets, Drive, Gmail y Calendar)**.\n\nToda acción de lectura es automática y toda acción de edición documental, creación de CAPA o envío de correos/reuniones requiere tu **aprobación humana (*Human-in-the-Loop*)** antes de ejecutarse.`,
    },
  ])

  if (!isOpen && !embeddedMode) return null

  const handleSendPrompt = (promptText: string) => {
    const clean = promptText.trim()
    if (!clean) return

    const userMsg: JarvisChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: clean,
      timestamp: todayISO(),
    }

    const result = processJarvisPrompt(clean, db, currentUser)
    const assistantMsg: JarvisChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      content: result.replyText,
      timestamp: todayISO(),
      toolsExecuted: result.toolsExecuted,
      approvalCard: result.approvalCard,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setAuditLogs(getJarvisAuditLogs())
    setInput('')
  }

  const handleDecision = (msgId: string, approval: JarvisPendingApproval, approve: boolean) => {
    if (!approve) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.approvalCard
            ? { ...m, approvalCard: { ...m.approvalCard, status: 'rejected' } }
            : m,
        ),
      )
      return
    }

    const confirmationText = executeApprovedJarvisAction(approval, currentUser)
    setMessages((prev) => [
      ...prev.map((m) =>
        m.id === msgId && m.approvalCard
          ? { ...m, approvalCard: { ...m.approvalCard, status: 'approved' as const } }
          : m,
      ),
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: confirmationText,
        timestamp: todayISO(),
      },
    ])
    setAuditLogs(getJarvisAuditLogs())
  }

  const renderApprovalCard = (msgId: string, card: JarvisPendingApproval) => {
    const isPending = card.status === 'pending'

    return (
      <div
        style={{
          marginTop: 12,
          border:
            card.status === 'approved'
              ? '1.5px solid #15966a'
              : card.status === 'rejected'
                ? '1.5px solid #d94f56'
                : '1.5px solid #3269dd',
          borderRadius: 12,
          padding: 14,
          background: '#ffffff',
          boxShadow: '0 6px 18px rgba(30, 58, 138, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <span className="plan-badge plan-future">
              HUMAN-IN-THE-LOOP · {card.toolName}
            </span>
            <h4 style={{ margin: '6px 0 2px', fontSize: 13.5, color: '#172033' }}>{card.title}</h4>
            <small style={{ color: '#68778b' }}>{card.subtitle}</small>
          </div>
          <span
            className={`plan-badge ${
              card.status === 'approved'
                ? 'plan-complete'
                : card.status === 'rejected'
                  ? 'plan-overdue'
                  : 'plan-month'
            }`}
          >
            {card.status === 'approved'
              ? 'Aprobado y Ejecutado'
              : card.status === 'rejected'
                ? 'Cancelado'
                : 'Requiere Aprobación'}
          </span>
        </div>

        {/* 1. Tarjeta Edición Quirúrgica Google Docs */}
        {card.docEdit && (
          <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 12 }}>
            <div>
              <strong>Sección intervenida:</strong> {card.docEdit.sectionTitle}
            </div>
            <div style={{ padding: 8, borderRadius: 6, background: '#fff5f5', border: '1px solid #fecaca' }}>
              <strong style={{ color: '#991b1b', fontSize: 11 }}>
                TEXTO ANTERIOR (v{card.docEdit.currentVersion}.0):
              </strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 3 }}>{card.docEdit.previousText}</div>
            </div>
            <div style={{ padding: 8, borderRadius: 6, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <strong style={{ color: '#065f46', fontSize: 11 }}>
                TEXTO NUEVO PROPUESTO (v{card.docEdit.newVersion}.0):
              </strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 3 }}>{card.docEdit.newText}</div>
            </div>
            <small style={{ color: '#475569' }}>
              Archivo anterior pasa a: <code>{card.docEdit.obsoleteFileMove}</code>
            </small>
          </div>
        )}

        {/* 2. Tarjeta Hallazgo 5 Porqués + CAPA */}
        {card.findingCapa && (
          <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 12 }}>
            <div style={{ padding: 8, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <strong>Análisis de los 5 Porqués:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {card.findingCapa.cincoPorques.map((pq, i) => (
                  <li key={i}>{pq}</li>
                ))}
              </ul>
              <div style={{ marginTop: 6, color: '#1e40af', fontWeight: 600 }}>
                Causa Raíz: {card.findingCapa.causaRaiz}
              </div>
            </div>
            <div>
              <strong>Acciones Correctivas (CAPA) a crear en Plan de Trabajo:</strong>
              {card.findingCapa.accionesPropuestas.map((a, i) => (
                <div
                  key={i}
                  style={{
                    marginTop: 4,
                    padding: '6px 8px',
                    background: '#eff6ff',
                    borderRadius: 6,
                  }}
                >
                  • <strong>{a.titulo}</strong> (Resp: {a.responsable} · Plazo: {a.fechaLimite})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Tarjeta Google Calendar + Meet */}
        {card.calendarMeeting && (
          <div style={{ marginTop: 10, display: 'grid', gap: 6, fontSize: 12 }}>
            <div>
              <strong>Fecha y Hora:</strong> {card.calendarMeeting.fechaReunion} ({card.calendarMeeting.horaInicio} -{' '}
              {card.calendarMeeting.horaFin})
            </div>
            <div>
              <strong>Enlace Google Meet:</strong>{' '}
              <u style={{ color: '#2563eb' }}>{card.calendarMeeting.meetLink}</u>
            </div>
            <div>
              <strong>Asistentes ({card.calendarMeeting.asistentes.length}):</strong>{' '}
              {card.calendarMeeting.asistentes.join(', ')}
            </div>
            <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
              {card.calendarMeeting.ordenDelDia}
            </div>
          </div>
        )}

        {/* 4. Tarjeta Gmail */}
        {card.gmailNotification && (
          <div style={{ marginTop: 10, display: 'grid', gap: 6, fontSize: 12 }}>
            <div>
              <strong>Destinatarios ({card.gmailNotification.destinatarios.length}):</strong>{' '}
              {card.gmailNotification.destinatarios.join(', ')}
            </div>
            <div>
              <strong>Asunto:</strong> {card.gmailNotification.asunto}
            </div>
            <div
              style={{
                padding: 8,
                background: '#f8fafc',
                borderRadius: 6,
                whiteSpace: 'pre-wrap',
                maxHeight: 150,
                overflowY: 'auto',
              }}
            >
              {card.gmailNotification.cuerpoMensaje}
            </div>
          </div>
        )}

        {/* 5. Tarjeta Google Sheets */}
        {card.sheetsSync && (
          <div style={{ marginTop: 10, display: 'grid', gap: 6, fontSize: 12 }}>
            <div>
              <strong>Hoja destino:</strong> <code>{card.sheetsSync.sheetTab}</code> (
              {card.sheetsSync.rowsUpdated} filas)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {card.sheetsSync.summaryMetrics.map((m, idx) => (
                <div key={idx} style={{ padding: 6, background: '#f8fafc', borderRadius: 6 }}>
                  <small style={{ color: '#68778b', display: 'block' }}>{m.label}</small>
                  <strong>{m.value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Tarjeta Google Drive Paquete Pre-Auditoría */}
        {card.driveFolder && (
          <div style={{ marginTop: 10, display: 'grid', gap: 6, fontSize: 12 }}>
            <div>
              <strong>Carpeta Raíz en Drive:</strong> <code>{card.driveFolder.rootFolderName}</code>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {card.driveFolder.subfolders.map((sf, idx) => (
                <li key={idx}>{sf}</li>
              ))}
            </ul>
          </div>
        )}

        {isPending && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className="button button-secondary button-danger"
              onClick={() => handleDecision(msgId, card, false)}
            >
              <XCircle size={14} /> Rechazar / Cancelar
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => handleDecision(msgId, card, true)}
            >
              <CheckCircle2 size={14} /> Aprobar y Ejecutar en SUH-1 + Google Workspace
            </button>
          </div>
        )}
      </div>
    )
  }

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: embeddedMode ? 'calc(100vh - 180px)' : '100vh',
        background: '#f8fafc',
      }}
    >
      {/* Cabecera de Jarvis */}
      <header
        style={{
          padding: '16px 20px',
          background: '#111d32',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/metrum-logo-blanco.png"
            alt="Metrum"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 15 }}>JARVIS · Copiloto Operativo SOGCS</strong>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 99,
                  background: '#15966a',
                  color: '#fff',
                }}
              >
                Gemini + Google Workspace + Supabase
              </span>
            </div>
            <small style={{ color: '#94a3b8', fontSize: 11 }}>
              Contexto activo: Módulo "{activeModule}" · Human-in-the-Loop habilitado
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="view-toggle" style={{ background: '#1e293b', borderColor: '#334155', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={tab === 'chat' ? 'view-selected' : ''}
              onClick={() => setTab('chat')}
            >
              Copiloto Chat
            </button>
            <button
              type="button"
              className={tab === 'skills' ? 'view-selected' : ''}
              onClick={() => setTab('skills')}
            >
              OpenJarvis Skills ({skills.length})
            </button>
            <button
              type="button"
              className={tab === 'digest' ? 'view-selected' : ''}
              onClick={() => setTab('digest')}
            >
              Morning Digest (Voz)
            </button>
            <button
              type="button"
              className={tab === 'monitors' ? 'view-selected' : ''}
              onClick={() => setTab('monitors')}
            >
              Monitores Cron ({monitors.length})
            </button>
            <button
              type="button"
              className={tab === 'tools' ? 'view-selected' : ''}
              onClick={() => setTab('tools')}
            >
              18 Tools
            </button>
            <button
              type="button"
              className={tab === 'audit' ? 'view-selected' : ''}
              onClick={() => setTab('audit')}
            >
              Bitácora ({auditLogs.length})
            </button>
          </div>
          {!embeddedMode && onClose && (
            <button
              type="button"
              className="icon-button"
              style={{ color: '#fff' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Banner de Conexión Google Workspace OAuth 2.0 */}
      <div
        style={{
          padding: '9px 20px',
          background: conn.connected ? '#ecfdf5' : '#fffbeb',
          borderBottom: '1px solid #d1fae5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 11.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ color: conn.connected ? '#065f46' : '#92400e' }}>
            {conn.connected
              ? `Google Workspace Conectado (${conn.googleEmail})`
              : 'Google Workspace pendiente de reconexión OAuth'}
          </strong>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155' }}>
            <FileText size={13} color="#2563eb" /> Docs API
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155' }}>
            <FolderKanban size={13} color="#16a34a" /> Drive API
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155' }}>
            <FileSpreadsheet size={13} color="#15803d" /> Sheets API
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155' }}>
            <Mail size={13} color="#dc2626" /> Gmail API
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155' }}>
            <Calendar size={13} color="#0284c7" /> Calendar API
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155' }}>
            <Database size={13} color="#7c3aed" /> Supabase RLS
          </span>
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            const next = { ...conn, connected: !conn.connected, googleEmail: currentUser.correo }
            setConn(next)
            setGoogleWorkspaceConnection(next)
          }}
        >
          {conn.connected ? 'Verificar Scopes OAuth' : 'Conectar Google Workspace'}
        </button>
      </div>

      {/* Contenido según pestaña */}
      {tab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'grid', gap: 14, alignContent: 'start' }}>
            {/* Chips de acciones rápidas de calidad */}
            <div>
              <small style={{ fontWeight: 700, color: '#52617a', display: 'block', marginBottom: 6 }}>
                ACCIONES RÁPIDAS PARA PROFESIONALES DE CALIDAD (CLIC PARA EJECUTAR):
              </small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUICK_CHIPS.map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    className="button button-secondary"
                    onClick={() => handleSendPrompt(chip)}
                  >
                    <Sparkles size={13} color="#2563eb" /> {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Historial de mensajes */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  justifySelf: msg.role === 'user' ? 'end' : 'start',
                  maxWidth: '90%',
                  padding: 14,
                  borderRadius: 12,
                  background: msg.role === 'user' ? '#2563eb' : '#ffffff',
                  color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                  border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                }}
              >
                {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {msg.toolsExecuted.map((t, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10.5,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 600,
                        }}
                      >
                        {t.toolName} ({t.domain}): {t.label}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: 12.5 }}>
                  {msg.content}
                </div>

                {msg.approvalCard && renderApprovalCard(msg.id, msg.approvalCard)}
              </div>
            ))}
          </div>

          {/* Barra de entrada de instrucciones a Jarvis */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendPrompt(input)
            }}
            style={{
              padding: 14,
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: Abre el protocolo PRO-BIO-004 e incluye barreras de medicamentos, o analiza un hallazgo con 5 porqués..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12.5,
              }}
            />
            <button type="submit" className="button button-primary">
              <Send size={15} /> Enviar a Jarvis
            </button>
          </form>
        </>
      )}

      {tab === 'skills' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'grid', gap: 14, alignContent: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span className="plan-badge plan-future">GITHUB.COM/OPEN-JARVIS/OPENJARVIS · AGENTSKILLS.IO</span>
              <h3 style={{ margin: '6px 0 2px' }}>
                SkillManager · Habilidades e Instrucciones Especializadas (<code>SKILL.md</code> + <code>skill.toml</code>)
              </h3>
              <small style={{ color: '#64748b' }}>
                Las Skills le enseñan a Jarvis cómo razonar paso a paso y encadenar herramientas sobre tus módulos de Calidad en Salud.
              </small>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setNewSkillName('')
                setNewSkillDesc('')
                setNewSkillMd(
                  `---\nname: mi-skill-calidad\ndescription: Instrucciones especializadas para calidad en salud\nlicense: MIT\n---\n\nCuando se invoque esta skill, sigue estos pasos:\n1. Verificar criterios normativos de la Resolución 3100.\n2. Generar acciones en el Plan de Trabajo.`,
                )
                setShowCreateSkill((v) => !v)
              }}
            >
              <Plus size={14} /> Crear / Importar Skill (SKILL.md)
            </button>
          </div>

          {showCreateSkill && (
            <div className="panel" style={{ padding: 14, background: '#fff', border: '1.5px solid #2563eb' }}>
              <h4 style={{ margin: '0 0 8px' }}>Crear Nueva Skill bajo Estándar OpenJarvis (SKILL.md)</h4>
              <div className="plan-form-grid">
                <label className="form-field">
                  <span>Nombre identificador (kebab-case) *</span>
                  <input
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="ej. auditor-farmacovigilancia"
                  />
                </label>
                <label className="form-field">
                  <span>Descripción corta para el catálogo XML *</span>
                  <input
                    value={newSkillDesc}
                    onChange={(e) => setNewSkillDesc(e.target.value)}
                    placeholder="Audita cadena de frío, lotes y reportes RAM..."
                  />
                </label>
                <label className="form-field plan-wide">
                  <span>Contenido de Instrucciones (SKILL.md con YAML frontmatter) *</span>
                  <textarea
                    value={newSkillMd}
                    onChange={(e) => setNewSkillMd(e.target.value)}
                    style={{ minHeight: 110, fontFamily: 'monospace', fontSize: 11.5 }}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowCreateSkill(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    if (!newSkillName.trim() || !newSkillDesc.trim()) return
                    const slug = newSkillName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    const created: OpenJarvisSkill = {
                      id: slug,
                      name: slug,
                      version: '1.0.0',
                      description: newSkillDesc.trim(),
                      author: currentUser.nombre_completo,
                      source: 'custom:user',
                      tags: ['custom', 'sogcs', 'calidad'],
                      required_capabilities: ['supabase:read', 'supabase:write'],
                      skill_md: newSkillMd,
                      skill_toml: `[skill]\nname = "${slug}"\nversion = "1.0.0"\ndescription = "${newSkillDesc.trim()}"`,
                      steps: [
                        {
                          stepNumber: 1,
                          tool_name: 'quality_manage_activities',
                          arguments_template: '{"skill": "' + slug + '"}',
                          output_key: 'result',
                        },
                      ],
                      invocations_count: 0,
                      overlay_learned_notes: ['Creada por el equipo de calidad de la IPS.'],
                    }
                    const next = [created, ...skills]
                    setSkills(next)
                    saveOpenJarvisSkills(next)
                    setShowCreateSkill(false)
                  }}
                >
                  Guardar Skill en Catálogo
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {skills.map((sk) => (
              <div
                key={sk.id}
                className="panel"
                style={{ padding: 14, background: '#fff', display: 'grid', gap: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <span className="plan-badge plan-complete">{sk.source}</span>{' '}
                    <strong style={{ fontSize: 13.5 }}>
                      <code>{sk.name}</code> (v{sk.version})
                    </strong>
                    <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 12 }}>{sk.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setSelectedSkill(selectedSkill?.id === sk.id ? null : sk)}
                    >
                      <Code2 size={13} /> Ver SKILL.md / skill.toml
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        const updated = skills.map((x) =>
                          x.id === sk.id ? { ...x, invocations_count: x.invocations_count + 1 } : x,
                        )
                        setSkills(updated)
                        saveOpenJarvisSkills(updated)
                        setTab('chat')
                        if (sk.id === 'autoevaluador-res-3100') {
                          handleSendPrompt('Preparar paquete de evidencias para auditoría Res. 3100 en Google Drive')
                        } else if (sk.id === 'investigador-5-porques-londres') {
                          handleSendPrompt('Analizar hallazgo y crear plan de acción (CAPA + 5 Porqués)')
                        } else if (sk.id === 'editor-quirurgico-documental') {
                          handleSendPrompt('Actualizar un protocolo o documento en Drive (ej. PRO-BIO-004 o MAN-SP-001)')
                        } else if (sk.id === 'auditor-capacidad-instalada') {
                          handleSendPrompt('Sincronizar indicadores KPI y Capacidad Instalada en Google Sheets')
                        } else {
                          handleSendPrompt('Programar Comité de Calidad / Tecnovigilancia en Google Calendar')
                        }
                      }}
                    >
                      <Play size={13} /> Ejecutar Skill
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, color: '#64748b' }}>
                  <span>Invocaciones: <strong>{sk.invocations_count}</strong></span>
                  <span>·</span>
                  <span>Pasos pipeline: <strong>{sk.steps.length}</strong></span>
                  <span>·</span>
                  <span>Overlays aprendidos: <strong>{sk.overlay_learned_notes.length}</strong></span>
                </div>

                {selectedSkill?.id === sk.id && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                    <div style={{ padding: 10, background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 11, overflowX: 'auto' }}>
                      <strong style={{ color: '#38bdf8', display: 'block', marginBottom: 4 }}>
                        .github/skills/{sk.name}/SKILL.md
                      </strong>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sk.skill_md}</pre>
                    </div>
                    <div style={{ padding: 10, background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 11, overflowX: 'auto' }}>
                      <strong style={{ color: '#34d399', display: 'block', marginBottom: 4 }}>
                        .github/skills/{sk.name}/skill.toml (Pipeline)
                      </strong>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sk.skill_toml}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 11 }}>
            <strong style={{ color: '#93c5fd', display: 'block', marginBottom: 4 }}>
              Catálogo XML inyectado automáticamente en el System Prompt de Jarvis:
            </strong>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{buildAvailableSkillsXmlCatalog(skills)}</pre>
          </div>
        </div>
      )}

      {tab === 'digest' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'grid', gap: 14, alignContent: 'start' }}>
          {(() => {
            const digest = generateMorningDigest(db, currentUser)
            return (
              <>
                <div className="panel" style={{ padding: 16, background: '#1e293b', color: '#fff', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span className="plan-badge plan-complete">OPENJARVIS PRESET · MORNING-DIGEST</span>
                      <h3 style={{ margin: '6px 0 2px', color: '#fff' }}>
                        Briefing Matutino de Calidad y Habilitación ({digest.generatedAt})
                      </h3>
                      <small style={{ color: '#cbd5e1' }}>
                        Síntesis ejecutiva hablada y escrita conectada a los 10 módulos de SUH-1 y Google Workspace.
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isSpeaking ? (
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => {
                            const ok = speakMorningDigestTTS(digest.spokenNarrative)
                            if (ok) setIsSpeaking(true)
                          }}
                        >
                          <Volume2 size={15} /> Escuchar Briefing en Voz (TTS)
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button-secondary button-danger"
                          onClick={() => {
                            stopMorningDigestTTS()
                            setIsSpeaking(false)
                          }}
                        >
                          <VolumeX size={15} /> Detener Audio
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8, lineHeight: 1.6, fontSize: 12.5 }}>
                    <em>"{digest.spokenNarrative}"</em>
                  </p>
                </div>

                <div className="panel" style={{ padding: 14, background: '#fff' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#991b1b' }}>
                    1. Soportes Administrativos y Financieros en Alerta ({digest.sections.soportesCriticos.length})
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    {digest.sections.soportesCriticos.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="panel" style={{ padding: 14, background: '#fff' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#92400e' }}>
                    2. Estado de Comités Mensuales — Regla 10 Primeros Días Hábiles ({digest.sections.comitesAlerta10Dias.length})
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    {digest.sections.comitesAlerta10Dias.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="panel" style={{ padding: 14, background: '#fff' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#1e40af' }}>
                    3. Novedades de Capacidad Instalada vs. Servicios Prestados ({digest.sections.capacidadInstaladaAlertas.length})
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    {digest.sections.capacidadInstaladaAlertas.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="panel" style={{ padding: 14, background: '#fff' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#065f46' }}>
                    4. Estado de Evaluaciones Resolución 3100 por Sede
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    {digest.sections.cumplimiento3100Resumen.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {tab === 'monitors' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
          <div>
            <span className="plan-badge plan-future">OPENJARVIS PRESET · SCHEDULED-MONITOR & OPERATIVE AGENT</span>
            <h3 style={{ margin: '6px 0 2px' }}>
              Monitores Operativos Programados (Cron) con Estado Persistente
            </h3>
            <small style={{ color: '#64748b' }}>
              Agentes autónomos tipo <code>operative</code> y <code>monitor_operative</code> que vigilan vencimientos, regla de comités y capacidad instalada.
            </small>
          </div>

          {monitors.map((mon) => (
            <div key={mon.id} className="panel" style={{ padding: 14, background: '#fff', display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <span className="plan-badge plan-complete">
                    <Clock size={11} /> Cron: {mon.cronExpression} ({mon.humanSchedule})
                  </span>{' '}
                  <span className="plan-badge plan-future">Agente: {mon.agentType}</span>
                  <strong style={{ display: 'block', marginTop: 6, fontSize: 13.5 }}>{mon.name}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>{mon.prompt}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className={`button ${mon.enabled ? 'button-secondary' : 'button-primary'}`}
                    onClick={() => {
                      const next = monitors.map((m) =>
                        m.id === mon.id ? { ...m, enabled: !m.enabled } : m,
                      )
                      setMonitors(next)
                      saveScheduledMonitors(next)
                    }}
                  >
                    {mon.enabled ? 'Pausar Monitor' : 'Activar Monitor'}
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      const next = monitors.map((m) =>
                        m.id === mon.id ? { ...m, lastRunAt: `${todayISO()} Ahora` } : m,
                      )
                      setMonitors(next)
                      saveScheduledMonitors(next)
                      setTab('chat')
                      handleSendPrompt(mon.prompt)
                    }}
                  >
                    <Play size={13} /> Ejecutar Ahora
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11.5, padding: 8, background: '#f8fafc', borderRadius: 6, color: '#334155' }}>
                <strong>Última ejecución ({mon.lastRunAt}):</strong> {mon.lastResultSummary}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tools' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          <h3 style={{ margin: '0 0 6px' }}>
            Catálogo de 18 Herramientas Operativas de Jarvis (Google Workspace + Supabase)
          </h3>
          <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 12 }}>
            Scopes OAuth 2.0 activos: <code>{GOOGLE_WORKSPACE_SCOPES.join(', ')}</code>
          </p>
          <div className="plan-table-wrap">
            <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Herramienta (Tool ID)</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Módulo Funcional</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Seguridad (Human-in-the-Loop)</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {JARVIS_18_TOOLS_CATALOG.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 10 }}>
                      <code>
                        <strong>{t.id}</strong>
                      </code>
                    </td>
                    <td style={{ padding: 10 }}>{t.module}</td>
                    <td style={{ padding: 10 }}>
                      <span
                        className={`plan-badge ${
                          t.mode.includes('Aprobación') ? 'plan-month' : 'plan-complete'
                        }`}
                      >
                        {t.mode}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>{t.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          <h3 style={{ margin: '0 0 6px' }}>
            Bitácora Inmutable de Auditoría de Jarvis (<code>jarvis_audit_logs</code>)
          </h3>
          <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 12 }}>
            Registro auditable con texto anterior, texto nuevo y confirmación de aprobación humana para visitas de verificación.
          </p>
          <ul className="case-files">
            {auditLogs.map((log) => (
              <li key={log.id} style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span>
                  <span className="plan-badge plan-future">{log.domain.toUpperCase()}</span>{' '}
                  <strong>
                    {log.tool_name} · {log.timestamp}
                  </strong>{' '}
                  ({log.user_name})
                  <br />
                  <strong>Recurso intervenido:</strong> {log.target_resource}
                  <br />
                  {log.summary}
                  {log.previous_state && (
                    <>
                      <br />
                      <small style={{ color: '#991b1b' }}>Estado anterior: {log.previous_state}</small>
                    </>
                  )}
                  {log.new_state && (
                    <>
                      <br />
                      <small style={{ color: '#065f46' }}>Estado nuevo: {log.new_state}</small>
                    </>
                  )}
                </span>
                <span className={`plan-badge ${log.human_approved ? 'plan-complete' : 'plan-future'}`}>
                  {log.human_approved ? 'Aprobado por Humano' : 'Lectura Automática'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  if (embeddedMode) {
    return <div className="panel" style={{ overflow: 'hidden' }}>{content}</div>
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(15, 23, 42, 0.52)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(780px, 100vw)',
          height: '100dvh',
          background: '#fff',
          boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  )
}
