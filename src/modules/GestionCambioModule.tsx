import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  GitBranch,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react'
import type {
  AccionHallazgo,
  AppUser,
  EstadoAccionHallazgo,
  HallazgoCalidad,
  PlanAccionMejora,
  SuhDatabase,
} from '../lib/types'
import { calculateHallazgoEffectiveness, formatDateES, todayISO } from '../lib/calculations'
import { pushToWorkPlan, updateDb } from '../lib/store'

export default function GestionCambioModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const today = todayISO()
  const [windowView, setWindowView] = useState<'planes' | 'hallazgos'>('hallazgos')
  const [planFilter, setPlanFilter] = useState('')
  const [sedeFilter, setSedeFilter] = useState('')

  // Modales
  const [selectedHallazgo, setSelectedHallazgo] = useState<HallazgoCalidad | null>(null)
  const [modalMode, setModalMode] = useState<
    'ficha' | 'crear_hallazgo' | 'crear_plan' | 'agregar_accion' | 'seguimiento_accion' | 'efectividad' | null
  >(null)
  const [selectedAccion, setSelectedAccion] = useState<AccionHallazgo | null>(null)

  // Form Crear Plan de Acción
  const [pNombre, setPNombre] = useState('')
  const [pSedeId, setPSedeId] = useState('sede-bogota')
  const [pProceso, setPProceso] = useState('Calidad y Habilitación SOGCS')
  const [pOrigen, setPOrigen] = useState('Autoevaluación Res. 3100 / PAMEC')
  const [pMetaFecha, setPMetaFecha] = useState('2026-12-30')
  const [pDesc, setPDesc] = useState('')

  // Form Crear Hallazgo con Metodología 5 Porqués
  const [hPlanId, setHPlanId] = useState(db.planes_accion[0]?.id || 'pa-01')
  const [hSedeId, setHSedeId] = useState('sede-bogota')
  const [hOrigen, setHOrigen] = useState<HallazgoCalidad['origen']>('Autoevaluación Res. 3100')
  const [hEstandar, setHEstandar] = useState('5. Procesos Prioritarios')
  const [hTitulo, setHTitulo] = useState('')
  const [hDesc, setHDesc] = useState('')
  const [hCriticidad, setHCriticidad] = useState<HallazgoCalidad['criticidad']>('Mayor')
  const [pq1, setPq1] = useState('')
  const [pq2, setPq2] = useState('')
  const [pq3, setPq3] = useState('')
  const [pq4, setPq4] = useState('')
  const [pq5, setPq5] = useState('')
  const [causaRaiz, setCausaRaiz] = useState('')
  const [factorCausal, setFactorCausal] =
    useState<HallazgoCalidad['cinco_porques']['factor_causal']>('Proceso / Método')
  const [accInicialTitulo, setAccInicialTitulo] = useState('')
  const [accInicialFecha, setAccInicialFecha] = useState('2026-12-10')

  // Form Agregar Acción o Seguimiento de Acción
  const [accTitulo, setAccTitulo] = useState('')
  const [accDesc, setAccDesc] = useState('')
  const [accResp, setAccResp] = useState(currentUser.nombre_completo)
  const [accFecha, setAccFecha] = useState(today)
  const [segAvance, setSegAvance] = useState('100')
  const [segEstado, setSegEstado] = useState<EstadoAccionHallazgo>('Cerrada')
  const [segTexto, setSegTexto] = useState('')
  const [segSoporte, setSegSoporte] = useState('')

  // Form Medición Cuantitativa de Efectividad Post-Cierre
  const [efSeRepite, setEfSeRepite] = useState<'no' | 'si'>('no')
  const [efEvidencia, setEfEvidencia] = useState('')

  const q = query.trim().toLowerCase()
  const hallazgos = db.hallazgos
    .filter((h) => !planFilter || h.plan_accion_id === planFilter)
    .filter((h) => !sedeFilter || h.sede_id === sedeFilter)
    .filter(
      (h) =>
        !q ||
        `${h.codigo} ${h.titulo} ${h.descripcion_hallazgo} ${h.origen} ${h.cinco_porques.causa_raiz_identificada}`
          .toLowerCase()
          .includes(q),
    )

  // Estructura General de KPIs solicitada: KPI de Planes de Mejora, KPI de Hallazgos, KPI de Acciones y KPI de Efectividad
  const totalPlanes = db.planes_accion.length
  const totalHallazgos = db.hallazgos.length
  const hallazgosCerrados = db.hallazgos.filter((h) => h.estado_hallazgo === 'Cerrado').length
  const todasAcciones = db.hallazgos.flatMap((h) => h.acciones)
  const accionesCerradas = todasAcciones.filter((a) => a.estado === 'Cerrada').length
  const accionesAtrasadas = todasAcciones.filter((a) => a.estado === 'Atrasada').length
  const evaluadosEfectividad = db.hallazgos.filter((h) => h.efectividad.evaluado)
  const promedioEfectividad =
    evaluadosEfectividad.length > 0
      ? Math.round(
          evaluadosEfectividad.reduce((s, h) => s + h.efectividad.porcentaje_efectividad, 0) /
            evaluadosEfectividad.length,
        )
      : 100

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pNombre.trim()) return

    updateDb((draft) => {
      const nuevo: PlanAccionMejora = {
        id: `pa-${Date.now()}`,
        codigo: `PAM-2026-0${draft.planes_accion.length + 1}`,
        nombre: pNombre.trim(),
        sede_id: pSedeId,
        proceso_objetivo: pProceso.trim(),
        origen_principal: pOrigen.trim(),
        fecha_apertura: today,
        fecha_meta_cierre: pMetaFecha,
        lider_plan: currentUser.nombre_completo,
        descripcion: pDesc.trim(),
        estado: 'Activo',
      }
      draft.planes_accion.unshift(nuevo)
      return draft
    }, `Plan de Acción "${pNombre.trim()}" creado exitosamente.`)

    setModalMode(null)
  }

  const handleCreateHallazgo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hTitulo.trim() || !causaRaiz.trim()) return

    updateDb((draft) => {
      const hId = `hal-${Date.now()}`
      const hCod = `HAL-2026-00${draft.hallazgos.length + 1}`
      const acciones: AccionHallazgo[] = []

      if (accInicialTitulo.trim()) {
        const ptId = pushToWorkPlan(draft, {
          titulo: `[Acción ${hCod}] ${accInicialTitulo.trim()}`,
          descripcion: `Acción derivada del análisis de 5 Porqués (Causa raíz: ${causaRaiz.trim()}).`,
          sede_id: hSedeId,
          modulo_origen: 'Gestión del Cambio',
          referencia_origen_id: hId,
          responsable: currentUser.nombre_completo,
          fecha_limite: accInicialFecha,
          usuario_creador: currentUser.nombre_completo,
        })

        acciones.push({
          id: `acc-${Date.now()}`,
          codigo: `ACC-${draft.hallazgos.length + 1}-A`,
          hallazgo_id: hId,
          titulo: accInicialTitulo.trim(),
          descripcion: `Acción para eliminar causa raíz: ${causaRaiz.trim()}`,
          responsable: currentUser.nombre_completo,
          fecha_programada: accInicialFecha,
          estado: 'Programada',
          seguimientos: [],
          plan_trabajo_id: ptId,
        })
      }

      draft.hallazgos.unshift({
        id: hId,
        codigo: hCod,
        plan_accion_id: hPlanId,
        sede_id: hSedeId,
        origen: hOrigen,
        estandar_relacionado: hEstandar,
        titulo: hTitulo.trim(),
        descripcion_hallazgo: hDesc.trim(),
        fecha_identificacion: today,
        responsable_lider: currentUser.nombre_completo,
        criticidad: hCriticidad,
        cinco_porques: {
          porque_1: pq1.trim() || '1. Incumplimiento detectado en el proceso.',
          porque_2: pq2.trim() || '2. Falta de control preventivo en la actividad.',
          porque_3: pq3.trim() || '3. No se encontraba estandarizado el punto de chequeo.',
          porque_4: pq4.trim() || '4. Socialización incompleta en cambio de turno.',
          porque_5: pq5.trim() || `5. Causa sistémica: ${causaRaiz.trim()}`,
          causa_raiz_identificada: causaRaiz.trim(),
          factor_causal: factorCausal,
        },
        acciones,
        estado_hallazgo: acciones.length > 0 ? 'En gestión' : 'Identificado',
        efectividad: {
          evaluado: false,
          se_repite_hallazgo: false,
          porcentaje_efectividad: 0,
          concepto: 'Pendiente de cierre',
        },
      })
      return draft
    }, 'Hallazgo registrado con análisis de 5 Porqués y acción enviada al Plan de Trabajo.')

    setModalMode(null)
  }

  const handleAddAccionToHallazgo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHallazgo || !accTitulo.trim()) return

    updateDb((draft) => {
      const target = draft.hallazgos.find((h) => h.id === selectedHallazgo.id)
      if (!target) return draft
      const accId = `acc-${Date.now()}`
      const ptId = pushToWorkPlan(draft, {
        titulo: `[Acción ${target.codigo}] ${accTitulo.trim()}`,
        descripcion: accDesc.trim() || target.cinco_porques.causa_raiz_identificada,
        sede_id: target.sede_id,
        modulo_origen: 'Gestión del Cambio',
        referencia_origen_id: accId,
        responsable: accResp.trim(),
        fecha_limite: accFecha,
        usuario_creador: currentUser.nombre_completo,
      })

      target.acciones.push({
        id: accId,
        codigo: `${target.codigo}-ACC-${target.acciones.length + 1}`,
        hallazgo_id: target.id,
        titulo: accTitulo.trim(),
        descripcion: accDesc.trim(),
        responsable: accResp.trim(),
        fecha_programada: accFecha,
        estado: 'Programada',
        seguimientos: [],
        plan_trabajo_id: ptId,
      })
      if (target.estado_hallazgo === 'Identificado') {
        target.estado_hallazgo = 'En gestión'
      }
      return draft
    }, 'Nueva acción agregada al hallazgo y enviada al Plan de Trabajo.')

    setModalMode('ficha')
  }

  const handleSaveSeguimientoAccion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHallazgo || !selectedAccion || !segTexto.trim()) return

    updateDb((draft) => {
      const h = draft.hallazgos.find((x) => x.id === selectedHallazgo.id)
      if (!h) return draft
      const a = h.acciones.find((x) => x.id === selectedAccion.id)
      if (!a) return draft

      a.estado = segEstado
      if (segEstado === 'Cerrada' || segEstado === 'Ejecutada') {
        a.fecha_cierre = today
      }
      a.seguimientos.unshift({
        id: `seg-${Date.now()}`,
        fecha: today,
        avance_porcentaje: Number(segAvance) || 100,
        descripcion_seguimiento: segTexto.trim(),
        estado_resultante: segEstado,
        evidencia_soporte: segSoporte.trim() || `Soporte_Accion_${a.codigo}.pdf`,
        usuario: currentUser.nombre_completo,
      })

      // Actualizar estado del hallazgo según sus acciones
      const allClosed = h.acciones.length > 0 && h.acciones.every((x) => x.estado === 'Cerrada')
      const allExecOrClosed =
        h.acciones.length > 0 &&
        h.acciones.every((x) => x.estado === 'Cerrada' || x.estado === 'Ejecutada')

      if (allClosed) h.estado_hallazgo = 'Cerrado'
      else if (allExecOrClosed) h.estado_hallazgo = 'Acciones ejecutadas'
      else h.estado_hallazgo = 'En gestión'

      return draft
    }, `Seguimiento registrado; estado de la acción actualizado a "${segEstado}".`)

    setModalMode('ficha')
  }

  const handleEvaluateEffectiveness = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHallazgo) return

    const seRepite = efSeRepite === 'si'
    const result = calculateHallazgoEffectiveness(selectedHallazgo, seRepite)

    updateDb((draft) => {
      const h = draft.hallazgos.find((x) => x.id === selectedHallazgo.id)
      if (!h) return draft
      h.estado_hallazgo = seRepite ? 'En gestión' : 'Cerrado'
      h.efectividad = {
        evaluado: true,
        fecha_evaluacion: today,
        evaluador: currentUser.nombre_completo,
        se_repite_hallazgo: seRepite,
        evidencia_verificacion: efEvidencia.trim(),
        porcentaje_efectividad: result.porcentaje,
        concepto: result.concepto,
      }
      return draft
    }, `Efectividad cuantitativa medida: ${result.porcentaje}% (${result.concepto}).`)

    setModalMode(null)
  }

  return (
    <div className="work-plan">
      {/* KPIs: Planes de Mejora, Hallazgos, Acciones y Efectividad */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>KPI Planes de Mejora</h2>
            <span className="complaint-kpi-icon">
              <ClipboardList size={19} />
            </span>
          </div>
          <strong>{totalPlanes} Planes</strong>
          <p>Planes de acción maestros que agrupan los hallazgos del SOGCS.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-amber">
          <div className="complaint-kpi-heading">
            <h2>KPI de Hallazgos (5 Porqués)</h2>
            <span className="complaint-kpi-icon">
              <AlertTriangle size={19} />
            </span>
          </div>
          <strong>
            {hallazgosCerrados} / {totalHallazgos} Cerrados
          </strong>
          <p>{totalHallazgos - hallazgosCerrados} hallazgos en ciclo de vida activo.</p>
        </article>

        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>KPI de Acciones</h2>
            <span className="complaint-kpi-icon">
              <GitBranch size={19} />
            </span>
          </div>
          <strong>
            {accionesCerradas} / {todasAcciones.length} Cerradas
          </strong>
          <p>
            Estados: Por iniciar, Programadas, Ejecutadas, Cerradas y {accionesAtrasadas} Atrasadas.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Efectividad Cuantitativa</h2>
            <span className="complaint-kpi-icon">
              <ShieldCheck size={19} />
            </span>
          </div>
          <strong>{promedioEfectividad} %</strong>
          <p>Medición post-cierre según no repetición del hallazgo y cierre de acciones.</p>
        </article>
      </div>

      {/* Controles y selector de las 2 ventanas */}
      <div className="plan-controls">
        <div className="view-toggle">
          <button
            type="button"
            className={windowView === 'planes' ? 'view-selected' : ''}
            onClick={() => setWindowView('planes')}
          >
            1. Ventana de Planes de Acción (Contienen varios hallazgos)
          </button>
          <button
            type="button"
            className={windowView === 'hallazgos' ? 'view-selected' : ''}
            onClick={() => setWindowView('hallazgos')}
          >
            2. Ventana de Hallazgos, 5 Porqués, Acciones y Efectividad
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="">Todos los Planes de Acción</option>
            {db.planes_accion.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>

          <select value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)}>
            <option value="">Todas las sedes</option>
            {db.sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setPNombre('')
              setPDesc('')
              setModalMode('crear_plan')
            }}
          >
            <Plus size={14} /> Nuevo Plan de Acción
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setHTitulo('')
              setHDesc('')
              setPq1('')
              setPq2('')
              setPq3('')
              setPq4('')
              setPq5('')
              setCausaRaiz('')
              setAccInicialTitulo('')
              setModalMode('crear_hallazgo')
            }}
          >
            <Plus size={15} /> Registrar Hallazgo (5 Porqués)
          </button>
        </div>
      </div>

      {/* ====================================================================
          VENTANA 1: PLANES DE ACCIÓN (Un plan contiene varios hallazgos)
         ==================================================================== */}
      {windowView === 'planes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
          {db.planes_accion.map((plan) => {
            const hallazgosDelPlan = db.hallazgos.filter((h) => h.plan_accion_id === plan.id)
            const accionesPlan = hallazgosDelPlan.flatMap((h) => h.acciones)
            const cerradas = accionesPlan.filter((a) => a.estado === 'Cerrada').length
            const pct = accionesPlan.length > 0 ? Math.round((cerradas / accionesPlan.length) * 100) : 0
            const sede = db.sedes.find((s) => s.id === plan.sede_id)

            return (
              <section key={plan.id} className="panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="plan-badge plan-future">{plan.codigo}</span>
                    <h2 style={{ margin: '6px 0 3px', fontSize: 16 }}>{plan.nombre}</h2>
                    <small style={{ color: '#68778b' }}>
                      {sede?.nombre} · Proceso: {plan.proceso_objetivo} · Líder: {plan.lider_plan}
                    </small>
                  </div>
                  <span className="plan-badge plan-complete">{plan.estado}</span>
                </div>

                <p style={{ margin: 0, color: '#475569' }}>{plan.descripcion}</p>

                <div>
                  <div className="audit-progress-track" style={{ height: 8 }}>
                    <div className="audit-progress-fill audit-fill-green" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11.5 }}>
                    <span>
                      <strong>{hallazgosDelPlan.length}</strong> hallazgos contenidos
                    </span>
                    <span>
                      <strong>
                        {cerradas}/{accionesPlan.length}
                      </strong>{' '}
                      acciones cerradas ({pct}%)
                    </span>
                    <span>Meta: {formatDateES(plan.fecha_meta_cierre)}</span>
                  </div>
                </div>

                <ul className="dash-feed-list">
                  {hallazgosDelPlan.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="dash-feed-item"
                        onClick={() => {
                          setSelectedHallazgo(h)
                          setModalMode('ficha')
                        }}
                      >
                        <div>
                          <strong>
                            {h.codigo} · {h.titulo}
                          </strong>
                          <small>
                            Causa raíz (5 Porqués): {h.cinco_porques.causa_raiz_identificada}
                          </small>
                        </div>
                        <span
                          className={`plan-badge ${
                            h.estado_hallazgo === 'Cerrado' ? 'plan-complete' : 'plan-month'
                          }`}
                        >
                          {h.estado_hallazgo}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      setPlanFilter(plan.id)
                      setWindowView('hallazgos')
                    }}
                  >
                    Ver todos los hallazgos y acciones de este plan →
                  </button>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* ====================================================================
          VENTANA 2: HALLAZGOS EN CUESTIÓN (5 Porqués, Ciclo de Acciones y Efectividad)
         ==================================================================== */}
      {windowView === 'hallazgos' && (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <h2>
              Matriz de Hallazgos, Causas (5 Porqués), Acciones y Medición de Efectividad (
              {hallazgos.length})
            </h2>
          </div>
          <p>
            Cada hallazgo identifica su origen, aplica la metodología de los <strong>5 Porqués</strong> para determinar la causa raíz, gestiona múltiples acciones vinculadas al <strong>Plan de Trabajo</strong> y mide cuantitativamente la efectividad tras el cierre verificando si el hallazgo se repite o no.
          </p>

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hallazgo / Origen</th>
                  <th>Causa Raíz (Metodología 5 Porqués)</th>
                  <th>Acciones y Estados</th>
                  <th>Ciclo del Hallazgo</th>
                  <th>Efectividad Cuantitativa (Post-Cierre)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {hallazgos.map((h) => {
                  const sede = db.sedes.find((s) => s.id === h.sede_id)
                  return (
                    <tr key={h.id}>
                      <td data-label="Hallazgo / Origen">
                        <span className="plan-badge plan-future">{h.origen}</span>
                        <br />
                        <strong style={{ display: 'block', marginTop: 4 }}>
                          {h.codigo} · {h.titulo}
                        </strong>
                        <small style={{ color: '#68778b' }}>
                          {sede?.nombre} · {h.estandar_relacionado}
                        </small>
                      </td>
                      <td data-label="Causa Raíz (5 Porqués)">
                        <strong>{h.cinco_porques.causa_raiz_identificada}</strong>
                        <br />
                        <small style={{ color: '#3454a1' }}>
                          Factor causal: {h.cinco_porques.factor_causal}
                        </small>
                      </td>
                      <td data-label="Acciones">
                        <strong>{h.acciones.length} acción(es)</strong>
                        {h.acciones.map((a) => (
                          <div key={a.id} style={{ marginTop: 4 }}>
                            <span
                              className={`plan-badge ${
                                a.estado === 'Cerrada'
                                  ? 'plan-complete'
                                  : a.estado === 'Atrasada'
                                    ? 'plan-overdue'
                                    : 'plan-month'
                              }`}
                            >
                              {a.estado}
                            </span>{' '}
                            <small>{a.titulo.slice(0, 42)}…</small>
                          </div>
                        ))}
                      </td>
                      <td data-label="Ciclo">
                        <span
                          className={`plan-badge ${
                            h.estado_hallazgo === 'Cerrado' ? 'plan-complete' : 'plan-month'
                          }`}
                        >
                          {h.estado_hallazgo}
                        </span>
                      </td>
                      <td data-label="Efectividad">
                        {h.efectividad.evaluado ? (
                          <>
                            <span
                              className={`plan-badge ${
                                h.efectividad.se_repite_hallazgo ? 'plan-overdue' : 'plan-complete'
                              }`}
                            >
                              {h.efectividad.porcentaje_efectividad}% · {h.efectividad.concepto}
                            </span>
                            <br />
                            <small>
                              {h.efectividad.se_repite_hallazgo
                                ? 'Hallazgo se repitió'
                                : 'No se repite (Cierre efectivo)'}
                            </small>
                          </>
                        ) : (
                          <span className="plan-badge plan-future">Pendiente medir post-cierre</span>
                        )}
                      </td>
                      <td data-label="Acciones">
                        <div className="user-actions">
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => {
                              setSelectedHallazgo(h)
                              setModalMode('ficha')
                            }}
                          >
                            <Eye size={13} /> 5 Porqués y Acciones
                          </button>
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => {
                              setSelectedHallazgo(h)
                              setEfSeRepite(h.efectividad.se_repite_hallazgo ? 'si' : 'no')
                              setEfEvidencia(h.efectividad.evidencia_verificacion || '')
                              setModalMode('efectividad')
                            }}
                          >
                            <CheckCircle2 size={13} /> Medir Efectividad
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

      {/* Modal de Ficha 5 Porqués / Crear Hallazgo / Seguimiento Acción / Efectividad */}
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
                  <GitBranch size={20} />
                </span>
                <div>
                  <small>GESTIÓN DEL CAMBIO Y MEJORA CONTINUA · METODOLOGÍA 5 PORQUÉS</small>
                  <h2>
                    {modalMode === 'crear_plan' && 'Crear Nuevo Plan de Acción / Mejoramiento'}
                    {modalMode === 'crear_hallazgo' &&
                      'Registrar Hallazgo y Análisis Causal de los 5 Porqués'}
                    {modalMode === 'ficha' &&
                      `${selectedHallazgo?.codigo} · ${selectedHallazgo?.titulo}`}
                    {modalMode === 'agregar_accion' &&
                      `Agregar Acción a ${selectedHallazgo?.codigo} (Se envía a Plan de Trabajo)`}
                    {modalMode === 'seguimiento_accion' &&
                      `Seguimiento de Acción · ${selectedAccion?.codigo}`}
                    {modalMode === 'efectividad' &&
                      `Medición Cuantitativa de Efectividad Post-Cierre · ${selectedHallazgo?.codigo}`}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {modalMode === 'ficha' && selectedHallazgo && (
                <>
                  {(() => {
                    const liveH =
                      db.hallazgos.find((x) => x.id === selectedHallazgo.id) || selectedHallazgo
                    return (
                      <>
                        <section className="case-section">
                          <h3>1. Identificación y Origen del Hallazgo</h3>
                          <dl className="record-fields">
                            <div>
                              <dt>Código y Origen</dt>
                              <dd>
                                <strong>{liveH.codigo}</strong> · {liveH.origen}
                              </dd>
                            </div>
                            <div>
                              <dt>Estándar Relacionado</dt>
                              <dd>{liveH.estandar_relacionado}</dd>
                            </div>
                            <div>
                              <dt>Estado y Criticidad</dt>
                              <dd>
                                {liveH.estado_hallazgo} ({liveH.criticidad})
                              </dd>
                            </div>
                            <div className="record-field-wide">
                              <dt>Descripción del Hallazgo en Cuestión</dt>
                              <dd>{liveH.descripcion_hallazgo}</dd>
                            </div>
                          </dl>
                        </section>

                        <section className="case-section">
                          <h3>2. Análisis de Causas — Metodología de los Cinco Porqués (5 Whys)</h3>
                          <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                            <li>{liveH.cinco_porques.porque_1}</li>
                            <li>{liveH.cinco_porques.porque_2}</li>
                            <li>{liveH.cinco_porques.porque_3}</li>
                            <li>{liveH.cinco_porques.porque_4}</li>
                            <li>{liveH.cinco_porques.porque_5}</li>
                          </ol>
                          <div
                            style={{
                              marginTop: 12,
                              padding: 12,
                              borderRadius: 8,
                              background: '#eef4ff',
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            <strong>
                              CAUSA RAÍZ IDENTIFICADA ({liveH.cinco_porques.factor_causal}):
                            </strong>{' '}
                            {liveH.cinco_porques.causa_raiz_identificada}
                          </div>
                        </section>

                        <section className="case-section">
                          <h3>
                            <span>3. Ciclo de Vida de las Acciones ({liveH.acciones.length})</span>
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => {
                                setAccTitulo('')
                                setAccDesc('')
                                setAccResp(currentUser.nombre_completo)
                                setAccFecha(today)
                                setModalMode('agregar_accion')
                              }}
                            >
                              <Plus size={14} /> Agregar Acción (Vinculada a Plan de Trabajo)
                            </button>
                          </h3>
                          <div className="plan-table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Acción</th>
                                  <th>Responsable y Fecha</th>
                                  <th>Estado Ciclo de Vida</th>
                                  <th>Seguimientos</th>
                                  <th>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {liveH.acciones.map((a) => (
                                  <tr key={a.id}>
                                    <td>
                                      <strong>
                                        {a.codigo} · {a.titulo}
                                      </strong>
                                      <br />
                                      <small>{a.descripcion}</small>
                                    </td>
                                    <td>
                                      {a.responsable}
                                      <br />
                                      <small>Prog: {formatDateES(a.fecha_programada)}</small>
                                    </td>
                                    <td>
                                      <span className="plan-badge plan-complete">{a.estado}</span>
                                    </td>
                                    <td>
                                      {a.seguimientos.length} seguimiento(s)
                                      {a.seguimientos[0] && (
                                        <>
                                          <br />
                                          <small>{a.seguimientos[0].descripcion_seguimiento}</small>
                                        </>
                                      )}
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className="button button-secondary"
                                        onClick={() => {
                                          setSelectedAccion(a)
                                          setSegAvance('100')
                                          setSegEstado('Cerrada')
                                          setSegTexto('')
                                          setModalMode('seguimiento_accion')
                                        }}
                                      >
                                        Registrar Seguimiento
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      </>
                    )
                  })()}
                </>
              )}

              {modalMode === 'crear_plan' && (
                <form onSubmit={handleCreatePlan}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Nombre del Plan de Acción / Mejoramiento <b>*</b>
                        </span>
                        <input
                          required
                          value={pNombre}
                          onChange={(e) => setPNombre(e.target.value)}
                          placeholder="Ej. Plan de Mejoramiento Auditoría Externa Secretaría de Salud"
                        />
                      </label>
                      <label className="form-field">
                        <span>Sede</span>
                        <select value={pSedeId} onChange={(e) => setPSedeId(e.target.value)}>
                          {db.sedes.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Fecha Meta de Cierre</span>
                        <input
                          type="date"
                          value={pMetaFecha}
                          onChange={(e) => setPMetaFecha(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Proceso Objetivo</span>
                        <input
                          value={pProceso}
                          onChange={(e) => setPProceso(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Origen Principal</span>
                        <input value={pOrigen} onChange={(e) => setPOrigen(e.target.value)} />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Descripción del Plan</span>
                        <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>Un Plan de Acción agrupa varios hallazgos y sus respectivas acciones.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Crear Plan de Acción
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'crear_hallazgo' && (
                <form onSubmit={handleCreateHallazgo}>
                  <section className="case-section">
                    <h3>1. Origen y Descripción del Hallazgo</h3>
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>Plan de Acción al que pertenece</span>
                        <select value={hPlanId} onChange={(e) => setHPlanId(e.target.value)}>
                          {db.planes_accion.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codigo} · {p.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Origen del Hallazgo</span>
                        <select
                          value={hOrigen}
                          onChange={(e) =>
                            setHOrigen(e.target.value as HallazgoCalidad['origen'])
                          }
                        >
                          <option value="Autoevaluación Res. 3100">Autoevaluación Res. 3100</option>
                          <option value="Auditoría Interna">Auditoría Interna</option>
                          <option value="Auditoría Externa (Secretaría / Supersalud)">
                            Auditoría Externa (Secretaría / Supersalud)
                          </option>
                          <option value="Auditoría Externa (EPS / Cliente)">
                            Auditoría Externa (EPS / Cliente)
                          </option>
                          <option value="Ronda de Infraestructura">Ronda de Infraestructura</option>
                          <option value="Comités Institucionales">Comités Institucionales</option>
                          <option value="PAMEC / Seguridad del Paciente">
                            PAMEC / Seguridad del Paciente
                          </option>
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Sede</span>
                        <select value={hSedeId} onChange={(e) => setHSedeId(e.target.value)}>
                          {db.sedes.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Criticidad</span>
                        <select
                          value={hCriticidad}
                          onChange={(e) =>
                            setHCriticidad(e.target.value as HallazgoCalidad['criticidad'])
                          }
                        >
                          <option value="Crítico">Crítico</option>
                          <option value="Mayor">Mayor</option>
                          <option value="Menor / Observación">Menor / Observación</option>
                        </select>
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Título del Hallazgo <b>*</b>
                        </span>
                        <input
                          required
                          value={hTitulo}
                          onChange={(e) => setHTitulo(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Descripción detallada del hallazgo <b>*</b>
                        </span>
                        <textarea
                          required
                          value={hDesc}
                          onChange={(e) => setHDesc(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="case-section">
                    <h3>2. Identificación de Causas — Metodología de los 5 Porqués</h3>
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>1. ¿Por qué ocurrió el hallazgo?</span>
                        <input value={pq1} onChange={(e) => setPq1(e.target.value)} />
                      </label>
                      <label className="form-field plan-wide">
                        <span>2. ¿Por qué ocurrió esa primera causa?</span>
                        <input value={pq2} onChange={(e) => setPq2(e.target.value)} />
                      </label>
                      <label className="form-field plan-wide">
                        <span>3. ¿Por qué ocurrió la segunda causa?</span>
                        <input value={pq3} onChange={(e) => setPq3(e.target.value)} />
                      </label>
                      <label className="form-field plan-wide">
                        <span>4. ¿Por qué ocurrió la tercera causa?</span>
                        <input value={pq4} onChange={(e) => setPq4(e.target.value)} />
                      </label>
                      <label className="form-field plan-wide">
                        <span>5. ¿Por qué ocurrió la cuarta causa?</span>
                        <input value={pq5} onChange={(e) => setPq5(e.target.value)} />
                      </label>
                      <label className="form-field">
                        <span>
                          Causa Raíz Definitiva Identificada <b>*</b>
                        </span>
                        <input
                          required
                          value={causaRaiz}
                          onChange={(e) => setCausaRaiz(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Factor Causal</span>
                        <select
                          value={factorCausal}
                          onChange={(e) =>
                            setFactorCausal(
                              e.target.value as HallazgoCalidad['cinco_porques']['factor_causal'],
                            )
                          }
                        >
                          <option value="Proceso / Método">Proceso / Método</option>
                          <option value="Talento Humano / Competencia">
                            Talento Humano / Competencia
                          </option>
                          <option value="Infraestructura / Dotación">
                            Infraestructura / Dotación
                          </option>
                          <option value="Insumos / Medicamentos">Insumos / Medicamentos</option>
                          <option value="Sistemas de Información">Sistemas de Información</option>
                          <option value="Organizacional / Financiero">
                            Organizacional / Financiero
                          </option>
                        </select>
                      </label>
                    </div>
                  </section>

                  <section className="case-section">
                    <h3>3. Acción Correctiva Inicial (Se envía automáticamente al Plan de Trabajo)</h3>
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>Título de la acción de mejora</span>
                        <input
                          value={accInicialTitulo}
                          onChange={(e) => setAccInicialTitulo(e.target.value)}
                          placeholder="Acción para erradicar la causa raíz..."
                        />
                      </label>
                      <label className="form-field">
                        <span>Fecha programada</span>
                        <input
                          type="date"
                          value={accInicialFecha}
                          onChange={(e) => setAccInicialFecha(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>

                  <div className="case-save-actions">
                    <span>Toda acción de mejora identificada se vincula al Plan de Trabajo Anual.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar Hallazgo y Enviar Acción a Plan de Trabajo
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'agregar_accion' && (
                <form onSubmit={handleAddAccionToHallazgo}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Título de la Acción <b>*</b>
                        </span>
                        <input
                          required
                          value={accTitulo}
                          onChange={(e) => setAccTitulo(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Descripción</span>
                        <textarea
                          value={accDesc}
                          onChange={(e) => setAccDesc(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Responsable</span>
                        <input
                          required
                          value={accResp}
                          onChange={(e) => setAccResp(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Fecha Programada</span>
                        <input
                          type="date"
                          required
                          value={accFecha}
                          onChange={(e) => setAccFecha(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>Se enviará automáticamente al Plan de Trabajo.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode('ficha')}
                    >
                      Volver
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar Acción
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'seguimiento_accion' && (
                <form onSubmit={handleSaveSeguimientoAccion}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>Estado de la Acción según Seguimiento</span>
                        <select
                          value={segEstado}
                          onChange={(e) => setSegEstado(e.target.value as EstadoAccionHallazgo)}
                        >
                          <option value="Por iniciar">Por iniciar</option>
                          <option value="Programada">Programada</option>
                          <option value="En ejecución">En ejecución</option>
                          <option value="Ejecutada">Ejecutada</option>
                          <option value="Cerrada">Cerrada</option>
                          <option value="Atrasada">Atrasada</option>
                        </select>
                      </label>
                      <label className="form-field">
                        <span>% de Avance</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={segAvance}
                          onChange={(e) => setSegAvance(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Descripción del Seguimiento Realizado <b>*</b>
                        </span>
                        <textarea
                          required
                          value={segTexto}
                          onChange={(e) => setSegTexto(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Soporte / Evidencia de Cierre</span>
                        <input
                          value={segSoporte}
                          onChange={(e) => setSegSoporte(e.target.value)}
                          placeholder="Ej. Acta_Verificacion_Accion.pdf"
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>El estado de la acción depende del seguimiento registrado.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode('ficha')}
                    >
                      Volver
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar Seguimiento
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'efectividad' && selectedHallazgo && (
                <form onSubmit={handleEvaluateEffectiveness}>
                  <section className="case-section">
                    <h3>Medición Cuantitativa de la Efectividad (Posterior al Cierre)</h3>
                    <p>
                      Fórmula cuantitativa institucional: 50% por proporción de acciones ejecutadas/cerradas + 50% por verificación de <strong>NO repetición del hallazgo</strong>. Si el hallazgo se repite, se clasifica como Inefectivo y permanece abierto.
                    </p>
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          ¿El hallazgo se repite posterior a la ejecución de las acciones? <b>*</b>
                        </span>
                        <select
                          value={efSeRepite}
                          onChange={(e) => setEfSeRepite(e.target.value as 'no' | 'si')}
                        >
                          <option value="no">
                            NO se repite — El hallazgo se cierra efectivamente (100% no reincidencia)
                          </option>
                          <option value="si">
                            SÍ se repite — Hallazgo reincidente (Requiere reabrir gestión)
                          </option>
                        </select>
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Evidencia cuantitativa de la verificación de efectividad <b>*</b>
                        </span>
                        <textarea
                          required
                          value={efEvidencia}
                          onChange={(e) => setEfEvidencia(e.target.value)}
                          placeholder="Ej. Muestreo posterior de 30 días consecutivos con 0% de reincidencia del hallazgo..."
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>
                      Resultado calculado:{' '}
                      <strong>
                        {calculateHallazgoEffectiveness(selectedHallazgo, efSeRepite === 'si').porcentaje}% (
                        {calculateHallazgoEffectiveness(selectedHallazgo, efSeRepite === 'si').concepto})
                      </strong>
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar Medición de Efectividad
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
