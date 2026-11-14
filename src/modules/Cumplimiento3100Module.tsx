import { useState } from 'react'
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileDown,
  Lock,
  Pencil,
  Plus,
  Save,
  X,
} from 'lucide-react'
import type {
  AppUser,
  Calificacion3100,
  ComplejidadServicio,
  Evaluacion3100Sede,
  GrupoServicio3100,
  ModalidadServicio,
  RespuestaCriterio3100,
  SuhDatabase,
} from '../lib/types'
import {
  buildVariableChecklist3100,
  CATALOGO_SERVICIOS_SALUD,
  ESTANDARES_3100,
} from '../lib/normativa-3100'
import { formatDateES, summarizeEvaluacion3100, todayISO } from '../lib/calculations'
import { pushToWorkPlan, updateDb } from '../lib/store'
import { generateCumplimiento3100Pdf } from '../lib/pdf-reports'

export default function Cumplimiento3100Module({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const today = todayISO()
  const sedesOperativas = db.sedes.filter((s) => !s.es_nacional)
  const [windowView, setWindowView] = useState<'ranking' | 'evaluaciones'>('ranking')

  // Modales
  const [showNewEvalWizard, setShowNewEvalWizard] = useState(false)
  const [activeEval, setActiveEval] = useState<Evaluacion3100Sede | null>(null)
  const [evalModalMode, setEvalModalMode] = useState<'diligenciar' | 'ficha' | null>(null)

  // Paso 1: Configurador de Lista de Chequeo Variable
  const [wSedeId, setWSedeId] = useState(sedesOperativas[0]?.id || 'sede-bogota')
  const [wPeriodo, setWPeriodo] = useState('Vigencia 2026 - Ciclo Autoevaluación REPS')
  const [wSelectedServices, setWSelectedServices] = useState<
    {
      codigo: string
      nombre: string
      grupo: GrupoServicio3100
      modalidad: ModalidadServicio
      complejidad: ComplejidadServicio
    }[]
  >([
    {
      codigo: '328',
      nombre: 'Medicina General',
      grupo: 'Consulta Externa',
      modalidad: 'Intramural',
      complejidad: 'Baja',
    },
    {
      codigo: '328',
      nombre: 'Medicina General',
      grupo: 'Consulta Externa',
      modalidad: 'Extramural',
      complejidad: 'Baja',
    },
    {
      codigo: '312',
      nombre: 'Enfermería',
      grupo: 'Consulta Externa',
      modalidad: 'Intramural',
      complejidad: 'Baja',
    },
  ])

  // Controles para agregar servicio al configurador variable
  const [addSrvCodigo, setAddSrvCodigo] = useState(CATALOGO_SERVICIOS_SALUD[0].codigo)
  const [addSrvModalidad, setAddSrvModalidad] = useState<ModalidadServicio>('Intramural')
  const [addSrvComplejidad, setAddSrvComplejidad] = useState<ComplejidadServicio>('Baja')

  // Respuestas editables en modal de diligenciamiento
  const [draftRespuestas, setDraftRespuestas] = useState<RespuestaCriterio3100[]>([])
  const [draftObsGeneral, setDraftObsGeneral] = useState('')

  const q = query.trim().toLowerCase()
  const evaluaciones = db.evaluaciones_3100.filter(
    (e) =>
      !q ||
      `${e.codigo} ${e.nombre} ${e.periodo} ${e.evaluador}`.toLowerCase().includes(q),
  )

  // Construir Ranking por Sede (tomando la evaluación vigente o la más reciente de cada sede)
  const rankingSedes = sedesOperativas
    .map((sede) => {
      const evalsSede = db.evaluaciones_3100.filter((e) => e.sede_id === sede.id)
      const vigente =
        evalsSede.find((e) => e.estado === 'cerrada_vigente') || evalsSede[0] || null
      const summary = vigente ? summarizeEvaluacion3100(vigente) : null
      return { sede, vigente, summary }
    })
    .sort((a, b) => (b.summary?.porcentajeGeneral ?? 0) - (a.summary?.porcentajeGeneral ?? 0))

  // KPIs Superiores del Módulo
  const promedioRed =
    rankingSedes.length > 0
      ? Math.round(
          (rankingSedes.reduce((s, r) => s + (r.summary?.porcentajeGeneral ?? 0), 0) /
            rankingSedes.length) *
            10,
        ) / 10
      : 0

  const totalHallazgosRed = rankingSedes.reduce(
    (s, r) => s + (r.summary?.hallazgosTotales ?? 0),
    0,
  )
  const totalNoCumpleRed = rankingSedes.reduce((s, r) => s + (r.summary?.noCumple ?? 0), 0)
  const borradoresCount = db.evaluaciones_3100.filter((e) => e.estado === 'borrador').length
  const vigentesCount = db.evaluaciones_3100.filter((e) => e.estado === 'cerrada_vigente').length

  const handleLoadServicesFromSedeTH = (sedeId: string) => {
    setWSedeId(sedeId)
    const fromTH = db.th_capacidad
      .filter((t) => t.sede_id === sedeId)
      .map((t) => ({
        codigo: t.codigo_servicio,
        nombre: t.nombre_servicio,
        grupo: t.grupo_servicio,
        modalidad: t.modalidad,
        complejidad: t.complejidad,
      }))
    if (fromTH.length > 0) {
      setWSelectedServices(fromTH)
    }
  }

  const handleCreateVariableEvaluation = (e: React.FormEvent) => {
    e.preventDefault()
    if (wSelectedServices.length === 0) {
      alert('Selecciona al menos un servicio para generar la lista de chequeo variable.')
      return
    }
    const sede = db.sedes.find((s) => s.id === wSedeId)
    const checklist = buildVariableChecklist3100(wSelectedServices)

    let createdEval: Evaluacion3100Sede | null = null
    updateDb((draft) => {
      const id = `ev3100-${Date.now()}`
      const cod = `AUTO-3100-${(sede?.ciudad || 'SEDE').slice(0, 3).toUpperCase()}-${draft.evaluaciones_3100.length + 1}`
      createdEval = {
        id,
        codigo: cod,
        nombre: `Autoevaluación Res. 3100 ${sede?.nombre ?? ''} (${wSelectedServices.length} Servicios)`,
        sede_id: wSedeId,
        periodo: wPeriodo,
        fecha_evaluacion: today,
        evaluador: currentUser.nombre_completo,
        estado: 'borrador',
        servicios_evaluados: wSelectedServices,
        respuestas: checklist,
        observacion_general: 'Lista de chequeo variable generada según servicios, grupo, modalidad y complejidad.',
      }
      draft.evaluaciones_3100.unshift(createdEval)
      return draft
    }, `Lista de chequeo variable creada con ${checklist.length} criterios específicos para ${sede?.nombre}.`)

    setShowNewEvalWizard(false)
    if (createdEval) {
      setActiveEval(createdEval)
      setDraftRespuestas((createdEval as Evaluacion3100Sede).respuestas)
      setDraftObsGeneral((createdEval as Evaluacion3100Sede).observacion_general)
      setEvalModalMode('diligenciar')
    }
  }

  const handleSaveDraftProgress = () => {
    if (!activeEval) return
    updateDb((draft) => {
      const target = draft.evaluaciones_3100.find((x) => x.id === activeEval.id)
      if (!target) return draft
      target.respuestas = draftRespuestas
      target.observacion_general = draftObsGeneral

      // Sincronizar acciones de mejora con Plan de Trabajo
      for (const r of draftRespuestas) {
        if (
          (r.calificacion === 'no_cumple' || r.calificacion === 'parcial') &&
          r.accion_mejora_titulo?.trim()
        ) {
          r.plan_trabajo_id = pushToWorkPlan(draft, {
            titulo: `[Res. 3100 ${r.codigo}] ${r.accion_mejora_titulo.trim()}`,
            descripcion: `Hallazgo en ${r.servicio_asociado} (${r.modalidad_asociada}): ${r.descripcion_cumplimiento}`,
            sede_id: target.sede_id,
            modulo_origen: 'Cumplimiento Res. 3100',
            referencia_origen_id: `${target.id}-${r.criterio_id}`,
            responsable: r.accion_mejora_responsable || currentUser.nombre_completo,
            fecha_limite: r.accion_mejora_fecha || '2026-12-20',
            usuario_creador: currentUser.nombre_completo,
          })
        }
      }
      return draft
    }, 'Avance de la autoevaluación guardado en borrador y acciones sincronizadas con Plan de Trabajo.')
  }

  const handleCloseEvaluation = () => {
    if (!activeEval) return

    // Validaciones antes de cerrar evaluación y convertirla en Evaluación Vigente de la Sede
    const sinCalificar = draftRespuestas.filter((r) => !r.calificacion)
    if (sinCalificar.length > 0) {
      alert(
        `Faltan ${sinCalificar.length} criterios por calificar (ej. ${sinCalificar[0].codigo}). Para cerrar la evaluación debes completar el 100% de los ítems.`,
      )
      return
    }

    const sinJustificarNA = draftRespuestas.find(
      (r) => r.calificacion === 'no_aplica' && !r.justificacion_no_aplica?.trim(),
    )
    if (sinJustificarNA) {
      alert(
        `El criterio ${sinJustificarNA.codigo} fue marcado como "No aplica". Debes justificar obligatoriamente por qué no aplica.`,
      )
      return
    }

    const sinAccionMejora = draftRespuestas.find(
      (r) =>
        (r.calificacion === 'no_cumple' || r.calificacion === 'parcial') &&
        !r.accion_mejora_titulo?.trim(),
    )
    if (sinAccionMejora) {
      alert(
        `El criterio ${sinAccionMejora.codigo} está calificado como "${sinAccionMejora.calificacion}". Debes registrar la acción de mejora para enviarla al Plan de Trabajo.`,
      )
      return
    }

    updateDb((draft) => {
      // Pasar anteriores vigentes de esa misma sede a históricas
      draft.evaluaciones_3100.forEach((ev) => {
        if (ev.sede_id === activeEval.sede_id && ev.estado === 'cerrada_vigente') {
          ev.estado = 'historica'
        }
      })

      const target = draft.evaluaciones_3100.find((x) => x.id === activeEval.id)
      if (!target) return draft
      target.respuestas = draftRespuestas
      target.observacion_general = draftObsGeneral
      target.estado = 'cerrada_vigente'
      target.cerrada_en = new Date().toISOString()

      for (const r of draftRespuestas) {
        if (r.calificacion === 'no_cumple' || r.calificacion === 'parcial') {
          r.plan_trabajo_id = pushToWorkPlan(draft, {
            titulo: `[Res. 3100 ${r.codigo}] ${r.accion_mejora_titulo || 'Subsanar criterio Res. 3100'}`,
            descripcion: `Hallazgo (${r.calificacion}) en ${r.servicio_asociado}: ${r.descripcion_cumplimiento}`,
            sede_id: target.sede_id,
            modulo_origen: 'Cumplimiento Res. 3100',
            referencia_origen_id: `${target.id}-${r.criterio_id}`,
            responsable: r.accion_mejora_responsable || currentUser.nombre_completo,
            fecha_limite: r.accion_mejora_fecha || '2026-12-20',
            usuario_creador: currentUser.nombre_completo,
          })
        }
      }
      return draft
    }, 'Evaluación cerrada oficialmente como Evaluación Vigente de la Sede. Generando reporte PDF...')

    const updatedObj: Evaluacion3100Sede = {
      ...activeEval,
      respuestas: draftRespuestas,
      observacion_general: draftObsGeneral,
      estado: 'cerrada_vigente',
    }
    generateCumplimiento3100Pdf(
      [updatedObj],
      db.sedes,
      `EVALUACIÓN VIGENTE CERRADA — ${activeEval.codigo}`,
    )
    setEvalModalMode(null)
  }

  return (
    <div className="work-plan audit-module">
      {/* KPIs Superiores */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Cumplimiento Promedio Red IPS</h2>
            <span className="complaint-kpi-icon">
              <Award size={19} />
            </span>
          </div>
          <strong>{promedioRed} %</strong>
          <p>Consolidado de los 7 estándares de la Resolución 3100 de 2019.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-red">
          <div className="complaint-kpi-heading">
            <h2>Hallazgos e Incumplimientos</h2>
            <span className="complaint-kpi-icon">
              <AlertTriangle size={19} />
            </span>
          </div>
          <strong>{totalHallazgosRed} Hallazgos</strong>
          <p>
            {totalNoCumpleRed} No cumplen · {totalHallazgosRed - totalNoCumpleRed} Parciales vinculados a Plan de Trabajo.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Evaluaciones Vigentes y Borradores</h2>
            <span className="complaint-kpi-icon">
              <ClipboardCheck size={19} />
            </span>
          </div>
          <strong>
            {vigentesCount} Vigentes / {borradoresCount} Borrador
          </strong>
          <p>Historial completo de autoevaluaciones por sede y servicio.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-amber">
          <div className="complaint-kpi-heading">
            <h2>PDF General de Cumplimiento</h2>
            <span className="complaint-kpi-icon">
              <FileDown size={19} />
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() =>
                generateCumplimiento3100Pdf(
                  db.evaluaciones_3100,
                  db.sedes,
                  'REPORTE GENERAL CONSOLIDADO DE EVALUACIONES RESOLUCIÓN 3100 (PRIORIDAD NO CUMPLIMIENTOS)',
                )
              }
            >
              <FileDown size={14} /> Descargar PDF Consolidado General
            </button>
          </div>
          <p style={{ marginTop: 6 }}>
            Incluye todas las evaluaciones priorizando los No Cumplimientos.
          </p>
        </article>
      </div>

      {/* Selector de Ventanas y botón Nueva Evaluación */}
      <div className="plan-controls">
        <div className="view-toggle">
          <button
            type="button"
            className={windowView === 'ranking' ? 'view-selected' : ''}
            onClick={() => setWindowView('ranking')}
          >
            1. Ranking y Resumen por Sede y por Estándar (Res. 3100)
          </button>
          <button
            type="button"
            className={windowView === 'evaluaciones' ? 'view-selected' : ''}
            onClick={() => setWindowView('evaluaciones')}
          >
            2. Ventana de Evaluaciones, Lista de Chequeo Variable y Fichas Técnicas
          </button>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            handleLoadServicesFromSedeTH(sedesOperativas[0]?.id || 'sede-bogota')
            setShowNewEvalWizard(true)
          }}
        >
          <Plus size={15} /> Iniciar Nueva Evaluación (Lista de Chequeo Variable)
        </button>
      </div>

      {/* ====================================================================
          VENTANA 1: RANKING Y RESUMEN POR SEDE CON LOS 7 ESTÁNDARES DE LA RES. 3100
         ==================================================================== */}
      {windowView === 'ranking' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {rankingSedes.map(({ sede, vigente, summary }, index) => (
            <section key={sede.id} className="panel" style={{ padding: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingBottom: 14,
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span className="plan-badge plan-future">
                    RANKING #{index + 1} · REPS {sede.codigo_reps}
                  </span>
                  <h2 style={{ margin: '6px 0 3px', fontSize: 18 }}>
                    {sede.nombre.toUpperCase()} — Cumplimiento General:{' '}
                    <span style={{ color: '#2563eb' }}>
                      {summary ? `${summary.porcentajeGeneral}%` : 'Sin evaluar'}
                    </span>
                  </h2>
                  <small style={{ color: '#68778b' }}>
                    {vigente
                      ? `Evaluación: ${vigente.codigo} (${
                          vigente.estado === 'cerrada_vigente' ? 'EVALUACIÓN VIGENTE' : 'EN BORRADOR'
                        }) · ${vigente.servicios_evaluados.length} servicios evaluados · ${
                          summary?.hallazgosTotales ?? 0
                        } hallazgos existentes`
                      : 'Sin evaluación registrada'}
                  </small>
                </div>

                {vigente && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        setActiveEval(vigente)
                        setEvalModalMode('ficha')
                      }}
                    >
                      <Eye size={14} /> Ficha Técnica
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        setActiveEval(vigente)
                        setDraftRespuestas(structuredClone(vigente.respuestas))
                        setDraftObsGeneral(vigente.observacion_general)
                        setEvalModalMode('diligenciar')
                      }}
                    >
                      <Pencil size={14} />{' '}
                      {vigente.estado === 'borrador' ? 'Continuar Evaluación' : 'Actualizar Evaluación'}
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() =>
                        generateCumplimiento3100Pdf(
                          [vigente],
                          db.sedes,
                          `INFORME DE CUMPLIMIENTO RES. 3100 — ${sede.nombre.toUpperCase()}`,
                        )
                      }
                    >
                      <FileDown size={14} /> PDF Sede
                    </button>
                  </div>
                )}
              </div>

              {/* Tarjetas de los 7 Estándares de la Resolución 3100 para esta Sede */}
              {summary && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  {ESTANDARES_3100.map((est) => {
                    const st = summary.porEstandar[est.key]
                    const tone =
                      st.porcentaje >= 85
                        ? 'audit-fill-green'
                        : st.porcentaje >= 70
                          ? 'audit-fill-yellow'
                          : 'audit-fill-red'
                    return (
                      <div
                        key={est.key}
                        style={{
                          padding: 12,
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          background: '#fafbfd',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <strong>{est.corto}</strong>
                          <strong style={{ color: '#1e3a8a' }}>{st.porcentaje}%</strong>
                        </div>
                        <div className="audit-progress-track" style={{ margin: '7px 0' }}>
                          <div
                            className={`audit-progress-fill ${tone}`}
                            style={{ width: `${st.porcentaje}%` }}
                          />
                        </div>
                        <small style={{ color: '#68778b', fontSize: 10.5 }}>
                          {st.cumple} cumple · {st.parcial} parcial · {st.noCumple} no cumple
                        </small>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* ====================================================================
          VENTANA 2: HISTORIAL DE EVALUACIONES, DILIGENCIAMIENTO Y FICHAS TÉCNICAS
         ==================================================================== */}
      {windowView === 'evaluaciones' && (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <h2>
              Historial de Evaluaciones y Autoevaluaciones Resolución 3100 ({evaluaciones.length})
            </h2>
          </div>
          <p>
            Cada evaluación genera su lista de chequeo variable según los servicios prestados en la sede, su grupo de servicio, modalidad (Intramural, Extramural, Telemedicina) y nivel de complejidad.
          </p>

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código / Nombre de Evaluación</th>
                  <th>Sede y Servicios Evaluados</th>
                  <th>Estado</th>
                  <th>Avance Ítems</th>
                  <th>Cumplimiento General</th>
                  <th>Hallazgos (No Cumple / Parcial)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {evaluaciones.map((ev) => {
                  const sede = db.sedes.find((s) => s.id === ev.sede_id)
                  const sum = summarizeEvaluacion3100(ev)
                  return (
                    <tr key={ev.id}>
                      <td>
                        <strong>
                          {ev.codigo} · {ev.nombre}
                        </strong>
                        <br />
                        <small>
                          Fecha: {formatDateES(ev.fecha_evaluacion)} · Auditor: {ev.evaluador}
                        </small>
                      </td>
                      <td>
                        <strong>{sede?.nombre ?? ev.sede_id}</strong>
                        <br />
                        <small>
                          {ev.servicios_evaluados
                            .map((s) => `${s.nombre} (${s.modalidad.slice(0, 5)}/${s.complejidad})`)
                            .join(', ')}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`plan-badge ${
                            ev.estado === 'cerrada_vigente'
                              ? 'plan-complete'
                              : ev.estado === 'borrador'
                                ? 'plan-month'
                                : 'plan-future'
                          }`}
                        >
                          {ev.estado === 'cerrada_vigente'
                            ? 'Vigente Cerrada'
                            : ev.estado === 'borrador'
                              ? 'En Borrador'
                              : 'Histórica'}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {sum.calificados} / {sum.totalCriterios}
                        </strong>
                      </td>
                      <td>
                        <span className="plan-badge plan-complete" style={{ fontSize: 13, fontWeight: 700 }}>
                          {sum.porcentajeGeneral} %
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: sum.noCumple > 0 ? '#a32828' : '#176342' }}>
                          {sum.noCumple} No cumple · {sum.parcial} Parciales
                        </strong>
                      </td>
                      <td>
                        <div className="user-actions">
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => {
                              setActiveEval(ev)
                              setEvalModalMode('ficha')
                            }}
                          >
                            <Eye size={13} /> Ficha Técnica
                          </button>
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => {
                              setActiveEval(ev)
                              setDraftRespuestas(structuredClone(ev.respuestas))
                              setDraftObsGeneral(ev.observacion_general)
                              setEvalModalMode('diligenciar')
                            }}
                          >
                            <Pencil size={13} /> Diligenciar / Actualizar
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() =>
                              generateCumplimiento3100Pdf([ev], db.sedes, `REPORTE ${ev.codigo}`)
                            }
                          >
                            <FileDown size={13} /> PDF
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
      )}

      {/* ====================================================================
          MODAL PASO 1: CONFIGURADOR DE LISTA DE CHEQUEO VARIABLE POR SEDE Y SERVICIOS
         ==================================================================== */}
      {showNewEvalWizard && (
        <div className="modal-backdrop" onClick={() => setShowNewEvalWizard(false)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <ClipboardCheck size={20} />
                </span>
                <div>
                  <small>PASO 1 DE LA EVALUACIÓN · LISTA DE CHEQUEO VARIABLE RES. 3100</small>
                  <h2>Seleccionar Sede, Servicios, Grupo, Modalidad y Complejidad</h2>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowNewEvalWizard(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              <form onSubmit={handleCreateVariableEvaluation}>
                <section className="case-section">
                  <h3>1. Selección de Sede y Periodo de Evaluación</h3>
                  <div className="plan-form-grid">
                    <label className="form-field">
                      <span>
                        Sede a Evaluar <b>*</b>
                      </span>
                      <select
                        value={wSedeId}
                        onChange={(e) => handleLoadServicesFromSedeTH(e.target.value)}
                      >
                        {sedesOperativas.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} ({s.ciudad})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Periodo / Ciclo</span>
                      <input
                        required
                        value={wPeriodo}
                        onChange={(e) => setWPeriodo(e.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="case-section">
                  <h3>
                    2. Servicios, Modalidades y Complejidades que determinan la Lista de Chequeo Variable ({wSelectedServices.length})
                  </h3>
                  <p>
                    No es lo mismo evaluar un servicio Intramural que Extramural o Telemedicina, ni una sede con 10 servicios frente a una con 2 servicios. Agrega o ajusta los servicios a evaluar:
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr auto',
                      gap: 8,
                      alignItems: 'end',
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <label className="form-field" style={{ margin: 0 }}>
                      <span>Servicio (Catálogo Res. 3100)</span>
                      <select
                        value={addSrvCodigo}
                        onChange={(e) => {
                          const found = CATALOGO_SERVICIOS_SALUD.find(
                            (x) => x.codigo === e.target.value,
                          )
                          setAddSrvCodigo(e.target.value)
                          if (found) setAddSrvComplejidad(found.complejidad_sugerida)
                        }}
                      >
                        {CATALOGO_SERVICIOS_SALUD.map((s) => (
                          <option key={s.codigo} value={s.codigo}>
                            [{s.codigo}] {s.nombre} — {s.grupo}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field" style={{ margin: 0 }}>
                      <span>Modalidad</span>
                      <select
                        value={addSrvModalidad}
                        onChange={(e) => setAddSrvModalidad(e.target.value as ModalidadServicio)}
                      >
                        <option value="Intramural">Intramural</option>
                        <option value="Extramural">Extramural</option>
                        <option value="Telemedicina">Telemedicina</option>
                      </select>
                    </label>
                    <label className="form-field" style={{ margin: 0 }}>
                      <span>Complejidad</span>
                      <select
                        value={addSrvComplejidad}
                        onChange={(e) =>
                          setAddSrvComplejidad(e.target.value as ComplejidadServicio)
                        }
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        const srv =
                          CATALOGO_SERVICIOS_SALUD.find((x) => x.codigo === addSrvCodigo) ||
                          CATALOGO_SERVICIOS_SALUD[0]
                        setWSelectedServices((prev) => [
                          ...prev,
                          {
                            codigo: srv.codigo,
                            nombre: srv.nombre,
                            grupo: srv.grupo,
                            modalidad: addSrvModalidad,
                            complejidad: addSrvComplejidad,
                          },
                        ])
                      }}
                    >
                      <Plus size={14} /> Agregar Servicio
                    </button>
                  </div>

                  <ul className="case-files">
                    {wSelectedServices.map((s, idx) => (
                      <li key={`${s.codigo}-${s.modalidad}-${idx}`}>
                        <span>
                          <strong>
                            [{s.codigo}] {s.nombre}
                          </strong>{' '}
                          · Grupo: {s.grupo} · Modalidad: <u>{s.modalidad}</u> · Complejidad:{' '}
                          <strong>{s.complejidad}</strong>
                        </span>
                        <button
                          type="button"
                          className="button button-secondary button-danger"
                          onClick={() =>
                            setWSelectedServices((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="case-save-actions">
                  <span>
                    Se generarán{' '}
                    <strong>{buildVariableChecklist3100(wSelectedServices).length} criterios</strong>{' '}
                    específicos en los 7 estándares de la Resolución 3100.
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowNewEvalWizard(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="button button-primary">
                    Generar Lista de Chequeo Variable e Iniciar Evaluación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL PASO 2: DILIGENCIAR EVALUACIÓN / VER FICHA TÉCNICA
         ==================================================================== */}
      {evalModalMode && activeEval && (
        <div className="modal-backdrop" onClick={() => setEvalModalMode(null)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <ClipboardCheck size={20} />
                </span>
                <div>
                  <small>
                    {evalModalMode === 'ficha'
                      ? 'FICHA TÉCNICA DE LA AUDITORÍA / EVALUACIÓN REALIZADA'
                      : 'DILIGENCIAMIENTO DE LISTA DE CHEQUEO VARIABLE RES. 3100'}
                  </small>
                  <h2>
                    {activeEval.codigo} · {activeEval.nombre}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setEvalModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {evalModalMode === 'ficha' ? (
                <>
                  {(() => {
                    const sum = summarizeEvaluacion3100(activeEval)
                    const sede = db.sedes.find((s) => s.id === activeEval.sede_id)
                    return (
                      <>
                        <section className="case-section">
                          <h3>
                            <span>Resumen Ejecutivo de la Evaluación</span>
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() =>
                                generateCumplimiento3100Pdf(
                                  [activeEval],
                                  db.sedes,
                                  `FICHA TÉCNICA ${activeEval.codigo}`,
                                )
                              }
                            >
                              <FileDown size={14} /> Imprimir PDF Priorizando No Cumplimientos
                            </button>
                          </h3>
                          <dl className="record-fields">
                            <div>
                              <dt>Sede Evaluada</dt>
                              <dd>{sede?.nombre}</dd>
                            </div>
                            <div>
                              <dt>Cumplimiento General</dt>
                              <dd>
                                <strong style={{ fontSize: 16, color: '#2563eb' }}>
                                  {sum.porcentajeGeneral}%
                                </strong>
                              </dd>
                            </div>
                            <div>
                              <dt>Hallazgos Identificados</dt>
                              <dd>
                                {sum.noCumple} No cumple · {sum.parcial} Cumple parcialmente
                              </dd>
                            </div>
                            <div className="record-field-wide">
                              <dt>Servicios, Modalidades y Complejidades Evaluadas</dt>
                              <dd>
                                {activeEval.servicios_evaluados
                                  .map(
                                    (s) =>
                                      `[${s.codigo}] ${s.nombre} (${s.grupo} · ${s.modalidad} · Complejidad ${s.complejidad})`,
                                  )
                                  .join(' | ')}
                              </dd>
                            </div>
                          </dl>

                          <div className="audit-summary-domains">
                            {ESTANDARES_3100.map((est) => {
                              const st = sum.porEstandar[est.key]
                              return (
                                <div key={est.key} className="audit-summary-domain-chip">
                                  <span>{est.nombre}</span>
                                  <div>
                                    <strong>{st.porcentaje}%</strong>
                                    <small>
                                      ({st.cumple}/{st.aplicables})
                                    </small>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </section>

                        <section className="case-section">
                          <h3 style={{ color: '#a32828' }}>
                            Hallazgos Prioritarios: Criterios en No Cumple y Cumple Parcialmente (
                            {sum.hallazgosTotales})
                          </h3>
                          <ul className="case-files">
                            {activeEval.respuestas
                              .filter(
                                (r) =>
                                  r.calificacion === 'no_cumple' || r.calificacion === 'parcial',
                              )
                              .map((r) => (
                                <li key={r.criterio_id}>
                                  <span>
                                    <span
                                      className={`plan-badge ${
                                        r.calificacion === 'no_cumple'
                                          ? 'plan-overdue'
                                          : 'plan-month'
                                      }`}
                                    >
                                      {r.calificacion === 'no_cumple'
                                        ? 'NO CUMPLE'
                                        : 'CUMPLE PARCIALMENTE'}
                                    </span>{' '}
                                    <strong>
                                      {r.codigo} · {r.servicio_asociado} ({r.modalidad_asociada})
                                    </strong>
                                    <br />
                                    {r.criterio_texto}
                                    <br />
                                    <small>
                                      Hallazgo: {r.descripcion_cumplimiento} | Acción en Plan de
                                      Trabajo: <strong>{r.accion_mejora_titulo}</strong> (Resp:{' '}
                                      {r.accion_mejora_responsable})
                                    </small>
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </section>
                      </>
                    )
                  })()}
                </>
              ) : (
                <>
                  {/* Diligenciamiento agrupado por los 7 estándares */}
                  {ESTANDARES_3100.map((est) => {
                    const itemsEst = draftRespuestas.filter((r) => r.estandar === est.key)
                    return (
                      <details key={est.key} className="audit-domain-group" open>
                        <summary className="audit-domain-summary">
                          <strong>
                            {est.nombre} ({itemsEst.length} criterios aplicables)
                          </strong>
                          <small>
                            Calificados: {itemsEst.filter((i) => i.calificacion !== '').length}/
                            {itemsEst.length}
                          </small>
                        </summary>

                        <div className="audit-criteria-list">
                          {itemsEst.map((item) => {
                            const isFinding =
                              item.calificacion === 'no_cumple' || item.calificacion === 'parcial'
                            const isNA = item.calificacion === 'no_aplica'

                            const updateItem = (patch: Partial<RespuestaCriterio3100>) => {
                              setDraftRespuestas((prev) =>
                                prev.map((x) =>
                                  x.criterio_id === item.criterio_id ? { ...x, ...patch } : x,
                                ),
                              )
                            }

                            return (
                              <div
                                key={item.criterio_id}
                                className={`audit-criterion-card ${
                                  isFinding ? 'audit-criterion-finding' : ''
                                }`}
                              >
                                <div className="audit-criterion-header">
                                  <div>
                                    <span className="audit-criterion-code">{item.codigo}</span>
                                    <p className="audit-criterion-question">{item.criterio_texto}</p>
                                  </div>
                                  <span className="plan-badge plan-future">
                                    {item.servicio_asociado} · {item.modalidad_asociada}
                                  </span>
                                </div>

                                <p className="audit-criterion-evidence">
                                  <strong>Evidencia requerida Res. 3100:</strong>{' '}
                                  {item.evidencia_requerida}
                                </p>

                                {/* Botones de Calificación: Cumple, Cumple parcialmente, No cumple, No aplica */}
                                <div className="audit-rating-group">
                                  {(
                                    [
                                      { key: 'cumple', label: 'Cumple (100%)' },
                                      { key: 'parcial', label: 'Cumple parcialmente (50%)' },
                                      { key: 'no_cumple', label: 'No cumple (0%)' },
                                      { key: 'no_aplica', label: 'No aplica (Justificar)' },
                                    ] as { key: Calificacion3100; label: string }[]
                                  ).map((btn) => (
                                    <button
                                      type="button"
                                      key={btn.key}
                                      className={`audit-rating-btn ${
                                        item.calificacion === btn.key
                                          ? `audit-rating-active audit-rating-${btn.key}`
                                          : ''
                                      }`}
                                      onClick={() => updateItem({ calificacion: btn.key })}
                                    >
                                      {btn.label}
                                    </button>
                                  ))}
                                </div>

                                <label className="form-field audit-obs-field">
                                  <span>Descripción de la evidencia / evaluación del criterio</span>
                                  <input
                                    value={item.descripcion_cumplimiento}
                                    onChange={(e) =>
                                      updateItem({ descripcion_cumplimiento: e.target.value })
                                    }
                                    placeholder="Describe el soporte verificado o el hallazgo encontrado..."
                                  />
                                </label>

                                {isNA && (
                                  <label className="form-field audit-obs-field">
                                    <span style={{ color: '#334155' }}>
                                      Justificación obligatoria de por qué NO APLICA <b>*</b>
                                    </span>
                                    <input
                                      required
                                      value={item.justificacion_no_aplica || ''}
                                      onChange={(e) =>
                                        updateItem({ justificacion_no_aplica: e.target.value })
                                      }
                                      placeholder="Indica técnicamente por qué este criterio no aplica a la sede..."
                                    />
                                  </label>
                                )}

                                {isFinding && (
                                  <div className="audit-criterion-actions">
                                    <div className="audit-criterion-actions-head">
                                      <strong>
                                        Acción de Mejora Obligatoria (Se envía automáticamente al Plan de Trabajo)
                                      </strong>
                                    </div>
                                    <div className="plan-form-grid">
                                      <label className="form-field plan-wide">
                                        <span>
                                          Título de la Acción de Mejora <b>*</b>
                                        </span>
                                        <input
                                          value={item.accion_mejora_titulo || ''}
                                          onChange={(e) =>
                                            updateItem({ accion_mejora_titulo: e.target.value })
                                          }
                                          placeholder="Acción correctiva para subsanar este criterio..."
                                        />
                                      </label>
                                      <label className="form-field">
                                        <span>Responsable</span>
                                        <input
                                          value={
                                            item.accion_mejora_responsable ||
                                            currentUser.nombre_completo
                                          }
                                          onChange={(e) =>
                                            updateItem({
                                              accion_mejora_responsable: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <label className="form-field">
                                        <span>Fecha Límite en Plan de Trabajo</span>
                                        <input
                                          type="date"
                                          value={item.accion_mejora_fecha || '2026-12-15'}
                                          onChange={(e) =>
                                            updateItem({ accion_mejora_fecha: e.target.value })
                                          }
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )
                  })}

                  <div className="case-save-actions">
                    <span>
                      Puedes guardar el avance parcial en borrador o cerrar la evaluación al completar el 100% de los criterios.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setEvalModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={handleSaveDraftProgress}
                    >
                      <Save size={14} /> Guardar Avance (Borrador)
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={handleCloseEvaluation}
                    >
                      <Lock size={14} /> Cerrar Evaluación Vigente y Generar PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
