import { useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  Copy,
  Eye,
  ListTodo,
  Pencil,
  Plus,
  RefreshCw,
  Wallet,
  X,
} from 'lucide-react'
import type { ActividadPlanTrabajo, AppUser, EstadoActividadPlan, SuhDatabase } from '../lib/types'
import { diffDays, formatCOP, formatDateES, todayISO } from '../lib/calculations'
import { updateDb } from '../lib/store'

const PLAN_STATE_LABELS: Record<EstadoActividadPlan, string> = {
  programada: 'Programada',
  en_ejecucion: 'En ejecución',
  completa: 'Cumplida',
  atrasada: 'Atrasada',
  reprogramada: 'Reprogramada',
}

function getDeadlineBadge(item: ActividadPlanTrabajo, today: string) {
  if (item.estado === 'completa') {
    return { label: 'Cumplida', tone: 'complete', countdown: 'Ejecución cerrada' }
  }
  const days = diffDays(item.fecha_limite, today)
  if (days < 0) {
    return {
      label: 'Vencida',
      tone: 'overdue',
      countdown: `Atrasada por ${Math.abs(days)} días`,
    }
  }
  if (days <= 15) {
    return {
      label: 'Prioritaria (≤15d)',
      tone: 'urgent',
      countdown: days === 0 ? 'Vence hoy' : `Faltan ${days} días`,
    }
  }
  if (days <= 45) {
    return {
      label: 'En término (Mes)',
      tone: 'month',
      countdown: `Faltan ${days} días`,
    }
  }
  return {
    label: 'Programada',
    tone: 'future',
    countdown: `Faltan ${days} días`,
  }
}

export default function WorkPlanModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const today = todayISO()
  const [year, setYear] = useState('TODOS')
  const [sedeFilter, setSedeFilter] = useState('')
  const [moduloFilter, setModuloFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [month, setMonth] = useState(today.slice(0, 7))

  const [selectedActivity, setSelectedActivity] = useState<ActividadPlanTrabajo | null>(null)
  const [modalMode, setModalMode] = useState<'ver' | 'crear' | 'editar' | 'reprogramar' | 'seguimiento' | null>(null)

  // Form states
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [sedeId, setSedeId] = useState(db.sedes[1]?.id || 'sede-bogota')
  const [moduloOrigen, setModuloOrigen] = useState<ActividadPlanTrabajo['modulo_origen']>('Plan de Trabajo')
  const [responsable, setResponsable] = useState(currentUser.nombre_completo)
  const [responsableCorreo, setResponsableCorreo] = useState(currentUser.correo)
  const [fechaLimite, setFechaLimite] = useState(today)
  const [presupuesto, setPresupuesto] = useState('0')
  const [ejecutado, setEjecutado] = useState('0')
  const [estadoForm, setEstadoForm] = useState<EstadoActividadPlan>('programada')
  const [justificacion, setJustificacion] = useState('')
  const [soporteNombre, setSoporteNombre] = useState('')

  const years = [
    ...new Set([
      today.slice(0, 4),
      ...db.plan_trabajo.map((r) => r.fecha_limite.slice(0, 4)).filter(Boolean),
    ]),
  ]
    .sort()
    .reverse()

  const q = query.trim().toLowerCase()
  const items = db.plan_trabajo
    .filter((r) => year === 'TODOS' || r.fecha_limite.startsWith(`${year}-`))
    .filter((r) => !sedeFilter || r.sede_id === sedeFilter)
    .filter((r) => !moduloFilter || r.modulo_origen === moduloFilter)
    .filter((r) => !statusFilter || r.estado === statusFilter)
    .filter(
      (r) =>
        !q ||
        `${r.codigo} ${r.titulo} ${r.descripcion} ${r.responsable} ${r.modulo_origen}`
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite))

  // KPIs
  const total = items.length
  const completed = items.filter((r) => r.estado === 'completa').length
  const running = items.filter((r) => r.estado === 'en_ejecucion').length
  const programmed = items.filter((r) => r.estado === 'programada' || r.estado === 'reprogramada').length
  const late = items.filter((r) => r.estado !== 'completa' && diffDays(r.fecha_limite, today) < 0).length
  const upcoming = items.filter((r) => {
    const d = diffDays(r.fecha_limite, today)
    return r.estado !== 'completa' && d >= 0 && d <= 15
  }).length
  const pct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0
  const totalBudget = items.reduce((s, r) => s + (Number(r.presupuesto) || 0), 0)
  const totalSpent = items.reduce((s, r) => s + (Number(r.ejecutado) || 0), 0)

  // Calendario del mes
  const start = new Date(`${month}-01T12:00:00Z`)
  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  const offset = (start.getUTCDay() + 6) % 7
  const moveMonth = (delta: number) => {
    const next = new Date(start)
    next.setUTCMonth(next.getUTCMonth() + delta)
    setMonth(next.toISOString().slice(0, 7))
  }

  const monthlyEvents = items.filter((r) => r.fecha_limite.startsWith(`${month}-`))
  const priorityItems = items
    .filter((r) => r.estado !== 'completa' && diffDays(r.fecha_limite, today) <= 30)
    .sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite))

  const openCreate = (dup?: ActividadPlanTrabajo) => {
    setSelectedActivity(null)
    setTitulo(dup ? `${dup.titulo} (Copia)` : '')
    setDescripcion(dup?.descripcion || '')
    setSedeId(dup?.sede_id || db.sedes[1]?.id || 'sede-bogota')
    setModuloOrigen(dup?.modulo_origen || 'Plan de Trabajo')
    setResponsable(dup?.responsable || currentUser.nombre_completo)
    setResponsableCorreo(dup?.responsable_correo || currentUser.correo)
    setFechaLimite(dup?.fecha_limite || today)
    setPresupuesto(String(dup?.presupuesto ?? 0))
    setEjecutado('0')
    setEstadoForm('programada')
    setJustificacion('')
    setModalMode('crear')
  }

  const openActionModal = (act: ActividadPlanTrabajo, mode: 'ver' | 'editar' | 'reprogramar' | 'seguimiento') => {
    setSelectedActivity(act)
    setTitulo(act.titulo)
    setDescripcion(act.descripcion)
    setSedeId(act.sede_id)
    setModuloOrigen(act.modulo_origen)
    setResponsable(act.responsable)
    setResponsableCorreo(act.responsable_correo)
    setFechaLimite(act.fecha_limite)
    setPresupuesto(String(act.presupuesto))
    setEjecutado(String(act.ejecutado))
    setEstadoForm(act.estado)
    setJustificacion('')
    setSoporteNombre('')
    setModalMode(mode)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    if (modalMode === 'crear') {
      updateDb((draft) => {
        const nextNum = draft.plan_trabajo.length + 1
        draft.plan_trabajo.unshift({
          id: `pt-${Date.now()}`,
          codigo: `PT-2026-${String(nextNum).padStart(3, '0')}`,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          sede_id: sedeId,
          modulo_origen: moduloOrigen,
          responsable: responsable.trim(),
          responsable_correo: responsableCorreo.trim(),
          fecha_original: fechaLimite,
          fecha_limite: fechaLimite,
          estado: estadoForm,
          reprogramaciones: 0,
          presupuesto: Number(presupuesto) || 0,
          ejecutado: Number(ejecutado) || 0,
          observaciones: justificacion.trim(),
          eventos: [
            {
              id: `ev-${Date.now()}`,
              fecha: today,
              tipo: 'creacion',
              descripcion: 'Actividad registrada en el Plan de Trabajo Institucional.',
              usuario: currentUser.nombre_completo,
            },
          ],
        })
        return draft
      }, 'Actividad agregada al Plan de Trabajo.')
      setModalMode(null)
      return
    }

    if (!selectedActivity) return

    if (modalMode === 'reprogramar' && !justificacion.trim()) {
      alert('Debes ingresar la justificación obligatoria para reprogramar la actividad.')
      return
    }

    updateDb((draft) => {
      const target = draft.plan_trabajo.find((x) => x.id === selectedActivity.id)
      if (!target) return draft

      if (modalMode === 'editar') {
        target.titulo = titulo.trim()
        target.descripcion = descripcion.trim()
        target.sede_id = sedeId
        target.responsable = responsable.trim()
        target.presupuesto = Number(presupuesto) || 0
        target.ejecutado = Number(ejecutado) || 0
        target.eventos.unshift({
          id: `ev-${Date.now()}`,
          fecha: today,
          tipo: 'edicion',
          descripcion: `Actualización de datos de la actividad. ${justificacion}`,
          justificacion: justificacion.trim(),
          usuario: currentUser.nombre_completo,
        })
      } else if (modalMode === 'reprogramar') {
        const anterior = target.fecha_limite
        target.fecha_limite = fechaLimite
        target.estado = 'reprogramada'
        target.reprogramaciones = (target.reprogramaciones || 0) + 1
        target.eventos.unshift({
          id: `ev-${Date.now()}`,
          fecha: today,
          tipo: 'reprogramacion',
          descripcion: `Plazo reprogramado de ${formatDateES(anterior)} a ${formatDateES(fechaLimite)}.`,
          justificacion: justificacion.trim(),
          usuario: currentUser.nombre_completo,
        })
      } else if (modalMode === 'seguimiento') {
        target.estado = estadoForm
        target.ejecutado = Number(ejecutado) || target.ejecutado
        target.observaciones = justificacion.trim() || target.observaciones
        target.eventos.unshift({
          id: `ev-${Date.now()}`,
          fecha: today,
          tipo: estadoForm === 'completa' ? 'cierre' : 'seguimiento',
          descripcion: justificacion.trim() || `Cambio de estado a ${PLAN_STATE_LABELS[estadoForm]}`,
          soporte_nombre: soporteNombre.trim() || undefined,
          usuario: currentUser.nombre_completo,
        })
      }
      return draft
    }, 'Plan de Trabajo actualizado correctamente.')

    setModalMode(null)
  }

  return (
    <div className="work-plan">
      <div className="plan-kpis">
        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>Actividades del Plan</h2>
            <span className="complaint-kpi-icon">
              <ListTodo size={19} />
            </span>
          </div>
          <strong>{total}</strong>
          <p>
            {programmed} pendientes · {running} en ejecución · {completed} cumplidas
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Cumplimiento</h2>
            <span className="complaint-kpi-icon">
              <ClipboardCheck size={19} />
            </span>
          </div>
          <strong>{pct.toLocaleString('es-CO', { minimumFractionDigits: 1 })} %</strong>
          <p>
            {completed} de {total} actividades cumplidas en el plan de trabajo.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-amber">
          <div className="complaint-kpi-heading">
            <h2>Atrasos y Prioridades</h2>
            <span className="complaint-kpi-icon">
              <CalendarClock size={19} />
            </span>
          </div>
          <strong>{late + upcoming}</strong>
          <p>
            {late} vencidas sin cumplir · {upcoming} en próximos 15 días.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Presupuesto del Plan</h2>
            <span className="complaint-kpi-icon">
              <Wallet size={19} />
            </span>
          </div>
          <strong>{formatCOP(totalBudget)}</strong>
          <p>
            Ejecutado: {formatCOP(totalSpent)}
            <br />
            Saldo: {formatCOP(totalBudget - totalSpent)}
          </p>
        </article>
      </div>

      <div className="plan-controls">
        <div>
          <label>
            Año{' '}
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="TODOS">Todos los años</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sede{' '}
            <select value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)}>
              <option value="">Todas las sedes</option>
              {db.sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Módulo origen{' '}
            <select value={moduloFilter} onChange={(e) => setModuloFilter(e.target.value)}>
              <option value="">Todos los módulos</option>
              {[
                'Administración',
                'Talento Humano',
                'Infraestructura',
                'Equipos Fijos',
                'Información Documentada',
                'Comités y Reuniones',
                'Gestión del Cambio',
                'Auditoría Interna/Externa',
                'Cumplimiento Res. 3100',
                'Plan de Trabajo',
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado{' '}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(PLAN_STATE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="button button-primary" onClick={() => openCreate()}>
          <Plus size={15} /> Agregar actividad al Plan
        </button>
      </div>

      <section className="plan-schedule">
        <div className="panel plan-calendar">
          <div className="plan-controls">
            <h2>Programación del mes ({month})</h2>
            <div>
              <button type="button" className="button button-secondary" onClick={() => moveMonth(-1)}>
                ‹
              </button>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="Seleccionar mes"
              />
              <button type="button" className="button button-secondary" onClick={() => moveMonth(1)}>
                ›
              </button>
            </div>
          </div>

          <div className="plan-calendar-grid">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <strong key={d}>{d}</strong>
            ))}
            {Array.from({ length: offset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="plan-day" style={{ background: '#f9fafc' }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = String(i + 1).padStart(2, '0')
              const dateISO = `${month}-${dayNum}`
              const dayActivities = monthlyEvents.filter((r) => r.fecha_limite === dateISO)
              return (
                <div
                  key={dateISO}
                  className={`plan-day ${dateISO === today ? 'plan-day-today' : ''}`}
                >
                  <span>{i + 1}</span>
                  {dayActivities.map((act) => {
                    const dl = getDeadlineBadge(act, today)
                    return (
                      <button
                        type="button"
                        key={act.id}
                        className={`plan-calendar-event plan-${dl.tone}`}
                        onClick={() => openActionModal(act, 'ver')}
                      >
                        {act.titulo}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="panel plan-priorities">
          <h2>Prioridades y Próximos Vencimientos ({priorityItems.length})</h2>
          <p>Actividades originadas en todos los módulos del SOGCS que requieren atención inmediata.</p>
          {priorityItems.length === 0 ? (
            <p>No hay actividades vencidas ni próximas a vencer en los próximos 30 días.</p>
          ) : (
            priorityItems.map((act) => {
              const dl = getDeadlineBadge(act, today)
              const sede = db.sedes.find((s) => s.id === act.sede_id)
              return (
                <button
                  type="button"
                  key={act.id}
                  onClick={() => openActionModal(act, 'ver')}
                >
                  <strong>
                    [{act.modulo_origen}] {act.titulo}
                  </strong>
                  <div className="plan-deadline">
                    <span className={`plan-badge plan-${dl.tone}`}>{dl.label}</span>
                    <small>
                      {formatDateES(act.fecha_limite)} · {dl.countdown}
                    </small>
                    <small style={{ color: '#52617a' }}>
                      {sede?.nombre ?? act.sede_id} · Resp: {act.responsable}
                    </small>
                  </div>
                </button>
              )
            })
          )}
        </aside>
      </section>

      <section className="panel plan-table-panel">
        <div className="plan-controls">
          <h2>Matriz Consolidada del Plan de Trabajo ({items.length} actividades)</h2>
        </div>
        <div className="plan-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Actividad / Código</th>
                <th>Módulo Origen / Sede</th>
                <th>Responsable</th>
                <th>Plazo y Semáforo</th>
                <th>Estado</th>
                <th>Presupuesto / Ejecutado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const dl = getDeadlineBadge(item, today)
                const sede = db.sedes.find((s) => s.id === item.sede_id)
                return (
                  <tr key={item.id}>
                    <td data-label="Actividad">
                      <strong>{item.titulo}</strong>
                      <br />
                      <small style={{ color: '#68778b' }}>{item.codigo}</small>
                      <p style={{ margin: '4px 0 0', color: '#52617a' }}>{item.descripcion}</p>
                    </td>
                    <td data-label="Origen / Sede">
                      <span className="plan-badge plan-future">{item.modulo_origen}</span>
                      <br />
                      <small style={{ display: 'block', marginTop: 5, fontWeight: 600 }}>
                        {sede?.nombre ?? item.sede_id}
                      </small>
                    </td>
                    <td data-label="Responsable">
                      <strong>{item.responsable}</strong>
                      <br />
                      <small>{item.responsable_correo}</small>
                    </td>
                    <td data-label="Plazo">
                      <div className="plan-deadline">
                        <span className={`plan-badge plan-${dl.tone}`}>{dl.label}</span>
                        <strong>{formatDateES(item.fecha_limite)}</strong>
                        <small>{dl.countdown}</small>
                        {item.reprogramaciones > 0 && (
                          <span className="plan-reprogrammed">
                            Reprogramada · {item.reprogramaciones}{' '}
                            {item.reprogramaciones > 1 ? 'veces' : 'vez'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Estado">
                      <span className={`plan-badge plan-${dl.tone}`}>
                        {PLAN_STATE_LABELS[item.estado]}
                      </span>
                    </td>
                    <td data-label="Presupuesto">
                      <strong>{formatCOP(item.presupuesto)}</strong>
                      <br />
                      <small>Ejec: {formatCOP(item.ejecutado)}</small>
                    </td>
                    <td data-label="Acciones">
                      <div className="user-actions">
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => openActionModal(item, 'ver')}
                        >
                          <Eye size={13} /> Ficha
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => openActionModal(item, 'seguimiento')}
                        >
                          <CalendarCheck size={13} /> Seguimiento
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => openActionModal(item, 'reprogramar')}
                        >
                          <RefreshCw size={13} /> Reprogramar
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => openActionModal(item, 'editar')}
                        >
                          <Pencil size={13} /> Editar
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => openCreate(item)}
                        >
                          <Copy size={13} /> Duplicar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Ficha Técnica / Creación / Seguimiento / Reprogramación */}
      {modalMode && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <ListTodo size={20} />
                </span>
                <div>
                  <small>PLAN DE TRABAJO ANUAL SOGCS · MODELO SARLAFT</small>
                  <h2>
                    {modalMode === 'crear' && 'Registrar Actividad en el Plan de Trabajo'}
                    {modalMode === 'ver' && `Ficha Técnica · ${selectedActivity?.codigo}`}
                    {modalMode === 'editar' && `Editar Actividad · ${selectedActivity?.codigo}`}
                    {modalMode === 'reprogramar' && `Reprogramar Plazo · ${selectedActivity?.codigo}`}
                    {modalMode === 'seguimiento' && `Registrar Seguimiento / Cierre · ${selectedActivity?.codigo}`}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {modalMode === 'ver' && selectedActivity ? (
                <>
                  <section className="case-section">
                    <h3>Información General de la Actividad</h3>
                    <dl className="record-fields">
                      <div className="record-field-wide">
                        <dt>Título de la actividad</dt>
                        <dd>
                          <strong>{selectedActivity.titulo}</strong>
                        </dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Descripción y alcance</dt>
                        <dd>{selectedActivity.descripcion}</dd>
                      </div>
                      <div>
                        <dt>Módulo de origen</dt>
                        <dd>{selectedActivity.modulo_origen}</dd>
                      </div>
                      <div>
                        <dt>Sede asociada</dt>
                        <dd>{db.sedes.find((s) => s.id === selectedActivity.sede_id)?.nombre ?? selectedActivity.sede_id}</dd>
                      </div>
                      <div>
                        <dt>Responsable</dt>
                        <dd>
                          {selectedActivity.responsable} ({selectedActivity.responsable_correo})
                        </dd>
                      </div>
                      <div>
                        <dt>Fecha original programada</dt>
                        <dd>{formatDateES(selectedActivity.fecha_original)}</dd>
                      </div>
                      <div>
                        <dt>Fecha límite vigente</dt>
                        <dd>{formatDateES(selectedActivity.fecha_limite)}</dd>
                      </div>
                      <div>
                        <dt>Estado y Reprogramaciones</dt>
                        <dd>
                          {PLAN_STATE_LABELS[selectedActivity.estado]} ({selectedActivity.reprogramaciones} reprogramaciones)
                        </dd>
                      </div>
                      <div>
                        <dt>Presupuesto asignado</dt>
                        <dd>{formatCOP(selectedActivity.presupuesto)}</dd>
                      </div>
                      <div>
                        <dt>Presupuesto ejecutado</dt>
                        <dd>{formatCOP(selectedActivity.ejecutado)}</dd>
                      </div>
                      <div>
                        <dt>Observaciones vigentes</dt>
                        <dd>{selectedActivity.observaciones || 'Sin observaciones'}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="case-section">
                    <h3>Historial de Seguimientos, Cambios y Reprogramaciones ({selectedActivity.eventos.length})</h3>
                    {selectedActivity.eventos.length === 0 ? (
                      <p>Sin eventos adicionales registrados.</p>
                    ) : (
                      <ul className="case-files">
                        {selectedActivity.eventos.map((ev) => (
                          <li key={ev.id}>
                            <span>
                              <strong>
                                [{ev.tipo.toUpperCase()}] {formatDateES(ev.fecha)} · {ev.usuario}
                              </strong>
                              <br />
                              {ev.descripcion}
                              {ev.justificacion && (
                                <>
                                  <br />
                                  <small>Justificación: {ev.justificacion}</small>
                                </>
                              )}
                              {ev.soporte_nombre && (
                                <>
                                  <br />
                                  <small style={{ color: '#245dcc' }}>Soporte adjunto: {ev.soporte_nombre}</small>
                                </>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : (
                <form onSubmit={handleSave}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      {(modalMode === 'crear' || modalMode === 'editar') && (
                        <>
                          <label className="form-field plan-wide">
                            <span>
                              Título de la actividad <b>*</b>
                            </span>
                            <input
                              required
                              value={titulo}
                              onChange={(e) => setTitulo(e.target.value)}
                            />
                          </label>
                          <label className="form-field plan-wide">
                            <span>
                              Descripción detallada <b>*</b>
                            </span>
                            <textarea
                              required
                              value={descripcion}
                              onChange={(e) => setDescripcion(e.target.value)}
                            />
                          </label>
                          <label className="form-field">
                            <span>Sede</span>
                            <select value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
                              {db.sedes.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nombre}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="form-field">
                            <span>Módulo origen</span>
                            <select
                              value={moduloOrigen}
                              onChange={(e) =>
                                setModuloOrigen(e.target.value as ActividadPlanTrabajo['modulo_origen'])
                              }
                            >
                              {[
                                'Plan de Trabajo',
                                'Administración',
                                'Talento Humano',
                                'Infraestructura',
                                'Equipos Fijos',
                                'Información Documentada',
                                'Comités y Reuniones',
                                'Gestión del Cambio',
                                'Auditoría Interna/Externa',
                                'Cumplimiento Res. 3100',
                              ].map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="form-field">
                            <span>Responsable</span>
                            <input
                              required
                              value={responsable}
                              onChange={(e) => setResponsable(e.target.value)}
                            />
                          </label>
                          <label className="form-field">
                            <span>Correo del responsable</span>
                            <input
                              type="email"
                              value={responsableCorreo}
                              onChange={(e) => setResponsableCorreo(e.target.value)}
                            />
                          </label>
                          {modalMode === 'crear' && (
                            <label className="form-field">
                              <span>
                                Fecha límite programada <b>*</b>
                              </span>
                              <input
                                type="date"
                                required
                                value={fechaLimite}
                                onChange={(e) => setFechaLimite(e.target.value)}
                              />
                            </label>
                          )}
                          <label className="form-field">
                            <span>Presupuesto asignado (COP)</span>
                            <input
                              type="number"
                              value={presupuesto}
                              onChange={(e) => setPresupuesto(e.target.value)}
                            />
                          </label>
                          <label className="form-field">
                            <span>Presupuesto ejecutado (COP)</span>
                            <input
                              type="number"
                              value={ejecutado}
                              onChange={(e) => setEjecutado(e.target.value)}
                            />
                          </label>
                        </>
                      )}

                      {modalMode === 'reprogramar' && (
                        <label className="form-field plan-wide">
                          <span>
                            Nueva Fecha Límite Programada <b>*</b>
                          </span>
                          <input
                            type="date"
                            required
                            value={fechaLimite}
                            onChange={(e) => setFechaLimite(e.target.value)}
                          />
                        </label>
                      )}

                      {modalMode === 'seguimiento' && (
                        <>
                          <label className="form-field">
                            <span>Estado de la actividad</span>
                            <select
                              value={estadoForm}
                              onChange={(e) => setEstadoForm(e.target.value as EstadoActividadPlan)}
                            >
                              <option value="programada">Programada</option>
                              <option value="en_ejecucion">En ejecución</option>
                              <option value="completa">Cumplida / Cerrada</option>
                              <option value="atrasada">Atrasada</option>
                            </select>
                          </label>
                          <label className="form-field">
                            <span>Valor ejecutado acumulado (COP)</span>
                            <input
                              type="number"
                              value={ejecutado}
                              onChange={(e) => setEjecutado(e.target.value)}
                            />
                          </label>
                          <label className="form-field plan-wide">
                            <span>Archivo o soporte de ejecución (opcional)</span>
                            <input
                              type="file"
                              onChange={(e) => setSoporteNombre(e.target.files?.[0]?.name || '')}
                            />
                          </label>
                        </>
                      )}

                      <label className="form-field plan-wide">
                        <span>
                          {modalMode === 'reprogramar'
                            ? 'Justificación obligatoria de la reprogramación *'
                            : 'Descripción del seguimiento / Justificación del cambio *'}
                        </span>
                        <textarea
                          required={modalMode !== 'crear'}
                          value={justificacion}
                          onChange={(e) => setJustificacion(e.target.value)}
                          placeholder="Registra la justificación o el avance detallado para conservar en la trazabilidad..."
                        />
                      </label>
                    </div>
                  </section>

                  <div className="case-save-actions">
                    <span>Todo cambio queda registrado en la bitácora de auditoría del Plan de Trabajo.</span>
                    <button type="button" className="button button-secondary" onClick={() => setModalMode(null)}>
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar registro
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
