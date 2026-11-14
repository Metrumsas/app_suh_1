import { useState } from 'react'
import Chart from 'react-apexcharts'
import {
  Award,
  BarChart3,
  Building2,
  ClipboardCheck,
  FilePlus2,
  Plus,
  ShieldAlert,
  X,
} from 'lucide-react'
import type {
  AppUser,
  AuditoriaExterna,
  AuditoriaInterna,
  SuhDatabase,
} from '../lib/types'
import { formatDateES, todayISO } from '../lib/calculations'
import { pushToWorkPlan, updateDb } from '../lib/store'

export default function AuditoriaModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const today = todayISO()
  const [windowView, setWindowView] = useState<'dashboard' | 'internas' | 'externas'>('dashboard')
  const [enteFilter, setEnteFilter] = useState('')
  const [sedeFilter, setSedeFilter] = useState('')

  // Modales
  const [modalMode, setModalMode] = useState<
    'crear_interna' | 'reportar_interna' | 'crear_externa' | null
  >(null)
  const [selectedInterna, setSelectedInterna] = useState<AuditoriaInterna | null>(null)

  // Form Auditoría Interna (NTC-ISO 19011)
  const [aiTitulo, setAiTitulo] = useState('')
  const [aiSedeId, setAiSedeId] = useState('sede-bogota')
  const [aiProceso, setAiProceso] = useState('Todos los Estándares Res. 3100 y Seguridad del Paciente')
  const [aiNorma, setAiNorma] = useState<AuditoriaInterna['estandar_norma']>('Resolución 3100 de 2019')
  const [aiEquipo, setAiEquipo] = useState(`${currentUser.nombre_completo} (Auditor Líder ISO 19011)`)
  const [aiAuditado, setAiAuditado] = useState('Equipo Líder de Sede')
  const [aiFechaProg, setAiFechaProg] = useState(today)

  // Form Reportar Informe de Auditoría Interna (Resultado 0-100 + Hallazgo opcional)
  const [repPuntaje, setRepPuntaje] = useState('90')
  const [repResumen, setRepResumen] = useState('')
  const [repPdf, setRepPdf] = useState('')
  const [repHallazgoTitulo, setRepHallazgoTitulo] = useState('')
  const [repHallazgoCausa, setRepHallazgoCausa] = useState('')

  // Form Reportar Auditoría Externa (Ente de Control vs Cliente / EPS, Resultado 0-100)
  const [aeTipoEnte, setAeTipoEnte] = useState<AuditoriaExterna['tipo_ente']>('Ente de Control')
  const [aeNombreEnte, setAeNombreEnte] = useState('Secretaría de Salud / Comisión SUH')
  const [aeSedeId, setAeSedeId] = useState('sede-bogota')
  const [aeAlcance, setAeAlcance] = useState('Verificación integral de estándares Resolución 3100')
  const [aeFechaVisita, setAeFechaVisita] = useState(today)
  const [aePuntaje, setAePuntaje] = useState('92')
  const [aeConcepto, setAeConcepto] =
    useState<AuditoriaExterna['concepto_visita']>('Favorable con plan de mejora')
  const [aeResumen, setAeResumen] = useState('')
  const [aePdf, setAePdf] = useState('')
  const [aeHallazgoTitulo, setAeHallazgoTitulo] = useState('')
  const [aeHallazgoCausa, setAeHallazgoCausa] = useState('')

  const q = query.trim().toLowerCase()
  const internas = db.auditorias_internas
    .filter((a) => !sedeFilter || a.sede_id === sedeFilter)
    .filter(
      (a) =>
        !q ||
        `${a.codigo} ${a.titulo_programa} ${a.proceso_auditado} ${a.equipo_auditor}`
          .toLowerCase()
          .includes(q),
    )

  const externas = db.auditorias_externas
    .filter((a) => !sedeFilter || a.sede_id === sedeFilter)
    .filter((a) => !enteFilter || a.tipo_ente === enteFilter)
    .filter(
      (a) =>
        !q ||
        `${a.codigo} ${a.nombre_ente_auditor} ${a.alcance_visita} ${a.resumen_informe}`
          .toLowerCase()
          .includes(q),
    )

  // Indicadores Globales
  const internasConPuntaje = db.auditorias_internas.filter((a) => a.resultado_puntaje !== null)
  const promInterna =
    internasConPuntaje.length > 0
      ? Math.round(
          (internasConPuntaje.reduce((s, a) => s + (a.resultado_puntaje || 0), 0) /
            internasConPuntaje.length) *
            10,
        ) / 10
      : 0

  const promExterna =
    db.auditorias_externas.length > 0
      ? Math.round(
          (db.auditorias_externas.reduce((s, a) => s + a.resultado_puntaje, 0) /
            db.auditorias_externas.length) *
            10,
        ) / 10
      : 0

  const progInternas = db.auditorias_internas.filter((a) => a.estado === 'Programada').length
  const ejecInternas = db.auditorias_internas.filter((a) => a.estado !== 'Programada').length
  const extControl = db.auditorias_externas.filter((a) => a.tipo_ente === 'Ente de Control').length
  const extEps = db.auditorias_externas.filter((a) => a.tipo_ente === 'Cliente / EPS').length

  const handleCreateInterna = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiTitulo.trim()) return

    updateDb((draft) => {
      const id = `aud-int-${Date.now()}`
      const cod = `AUD-INT-2026-0${draft.auditorias_internas.length + 1}`
      const ptId = pushToWorkPlan(draft, {
        titulo: `[Auditoría Interna ${cod}] ${aiTitulo.trim()}`,
        descripcion: `Programa de Auditoría Interna NTC-ISO 19011 (${aiNorma}) en proceso: ${aiProceso}`,
        sede_id: aiSedeId,
        modulo_origen: 'Auditoría Interna/Externa',
        referencia_origen_id: id,
        responsable: currentUser.nombre_completo,
        fecha_limite: aiFechaProg,
        usuario_creador: currentUser.nombre_completo,
      })

      draft.auditorias_internas.unshift({
        id,
        codigo: cod,
        titulo_programa: aiTitulo.trim(),
        sede_id: aiSedeId,
        proceso_auditado: aiProceso.trim(),
        estandar_norma: aiNorma,
        equipo_auditor: aiEquipo.trim(),
        auditado_lider: aiAuditado.trim(),
        fecha_programada: aiFechaProg,
        estado: 'Programada',
        resultado_puntaje: null,
        resumen_informe: 'Auditoría programada en el ciclo anual ISO 19011.',
        hallazgos_ids: [],
        plan_trabajo_id: ptId,
      })
      return draft
    }, 'Auditoría interna programada y vinculada al Plan de Trabajo.')

    setModalMode(null)
  }

  const handleReportInterna = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInterna) return
    const score = Math.min(100, Math.max(0, Number(repPuntaje) || 0))

    updateDb((draft) => {
      const target = draft.auditorias_internas.find((x) => x.id === selectedInterna.id)
      if (!target) return draft
      target.fecha_ejecucion = today
      target.estado = 'Informe emitido'
      target.resultado_puntaje = score
      target.resumen_informe = repResumen.trim()
      target.informe_pdf_nombre = repPdf.trim() || `Informe_${target.codigo}.pdf`

      if (repHallazgoTitulo.trim()) {
        const hId = `hal-${Date.now()}`
        const hCod = `HAL-2026-00${draft.hallazgos.length + 1}`
        const ptId = pushToWorkPlan(draft, {
          titulo: `[Hallazgo ${target.codigo}] ${repHallazgoTitulo.trim()}`,
          descripcion: `Derivado de Auditoría Interna (${score}/100). Causa raíz: ${repHallazgoCausa}`,
          sede_id: target.sede_id,
          modulo_origen: 'Auditoría Interna/Externa',
          referencia_origen_id: hId,
          responsable: target.auditado_lider,
          fecha_limite: '2026-12-15',
          usuario_creador: currentUser.nombre_completo,
        })

        draft.hallazgos.unshift({
          id: hId,
          codigo: hCod,
          plan_accion_id: draft.planes_accion[0]?.id || 'pa-01',
          sede_id: target.sede_id,
          origen: 'Auditoría Interna',
          estandar_relacionado: target.estandar_norma,
          titulo: repHallazgoTitulo.trim(),
          descripcion_hallazgo: repResumen.trim(),
          fecha_identificacion: today,
          responsable_lider: target.auditado_lider,
          criticidad: score < 80 ? 'Crítico' : 'Mayor',
          cinco_porques: {
            porque_1: 'Identificado en muestreo de auditoría interna.',
            porque_2: 'Variabilidad en la aplicación del procedimiento.',
            porque_3: 'Falta de lista de verificación previa.',
            porque_4: 'Supervisión no documentada en el turno.',
            porque_5: repHallazgoCausa.trim() || 'Requiere estandarización operativa.',
            causa_raiz_identificada: repHallazgoCausa.trim() || 'Oportunidad de estandarización en proceso auditado.',
            factor_causal: 'Proceso / Método',
          },
          acciones: [
            {
              id: `acc-${Date.now()}`,
              codigo: `${hCod}-A1`,
              hallazgo_id: hId,
              titulo: `Plan correctivo para ${repHallazgoTitulo.trim()}`,
              descripcion: 'Acción derivada de informe de auditoría interna.',
              responsable: target.auditado_lider,
              fecha_programada: '2026-12-15',
              estado: 'Programada',
              seguimientos: [],
              plan_trabajo_id: ptId,
            },
          ],
          estado_hallazgo: 'En gestión',
          efectividad: {
            evaluado: false,
            se_repite_hallazgo: false,
            porcentaje_efectividad: 0,
            concepto: 'Pendiente de cierre',
          },
        })
        target.hallazgos_ids.push(hId)
      }
      return draft
    }, `Informe de auditoría interna reportado con calificación ${score}/100.`)

    setModalMode(null)
  }

  const handleCreateExterna = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aeNombreEnte.trim() || !aeResumen.trim()) return
    const score = Math.min(100, Math.max(0, Number(aePuntaje) || 0))

    updateDb((draft) => {
      const id = `aud-ext-${Date.now()}`
      const cod = `AUD-EXT-2026-0${draft.auditorias_externas.length + 1}`
      const hallazgosIds: string[] = []

      const ptId = pushToWorkPlan(draft, {
        titulo: `[Seguimiento Auditoría Externa ${aeTipoEnte}] ${aeNombreEnte.trim()}`,
        descripcion: `Informe externo (${score}/100 pts): ${aeResumen.trim()}`,
        sede_id: aeSedeId,
        modulo_origen: 'Auditoría Interna/Externa',
        referencia_origen_id: id,
        responsable: currentUser.nombre_completo,
        fecha_limite: '2026-12-18',
        usuario_creador: currentUser.nombre_completo,
      })

      if (aeHallazgoTitulo.trim()) {
        const hId = `hal-${Date.now()}`
        const hCod = `HAL-2026-00${draft.hallazgos.length + 1}`
        draft.hallazgos.unshift({
          id: hId,
          codigo: hCod,
          plan_accion_id: draft.planes_accion[0]?.id || 'pa-01',
          sede_id: aeSedeId,
          origen:
            aeTipoEnte === 'Ente de Control'
              ? 'Auditoría Externa (Secretaría / Supersalud)'
              : 'Auditoría Externa (EPS / Cliente)',
          estandar_relacionado: 'Resolución 3100 de 2019',
          titulo: aeHallazgoTitulo.trim(),
          descripcion_hallazgo: `Reportado por ${aeNombreEnte.trim()}: ${aeResumen.trim()}`,
          fecha_identificacion: today,
          responsable_lider: currentUser.nombre_completo,
          criticidad: 'Mayor',
          cinco_porques: {
            porque_1: 'Hallazgo levantado en visita de ente externo.',
            porque_2: 'Soporte o registro con oportunidad de mejora.',
            porque_3: 'Falta de alerta temprana previa a la visita.',
            porque_4: 'Verificación cruzada mensual incompleta.',
            porque_5: aeHallazgoCausa.trim() || 'Fortalecer control interno previo.',
            causa_raiz_identificada:
              aeHallazgoCausa.trim() || 'Fortalecer autoevaluación previa a visita externa.',
            factor_causal: 'Proceso / Método',
          },
          acciones: [
            {
              id: `acc-${Date.now()}`,
              codigo: `${hCod}-A1`,
              hallazgo_id: hId,
              titulo: `Subsanar requerimiento de ${aeNombreEnte.trim()}: ${aeHallazgoTitulo.trim()}`,
              descripcion: 'Acción correctiva vinculada a Gestión de Hallazgos y Plan de Trabajo.',
              responsable: currentUser.nombre_completo,
              fecha_programada: '2026-12-18',
              estado: 'Programada',
              seguimientos: [],
              plan_trabajo_id: ptId,
            },
          ],
          estado_hallazgo: 'En gestión',
          efectividad: {
            evaluado: false,
            se_repite_hallazgo: false,
            porcentaje_efectividad: 0,
            concepto: 'Pendiente de cierre',
          },
        })
        hallazgosIds.push(hId)
      }

      draft.auditorias_externas.unshift({
        id,
        codigo: cod,
        tipo_ente: aeTipoEnte,
        nombre_ente_auditor: aeNombreEnte.trim(),
        sede_id: aeSedeId,
        alcance_visita: aeAlcance.trim(),
        fecha_visita: aeFechaVisita,
        fecha_entrega_informe: today,
        auditor_externo_lider: aeNombreEnte.trim(),
        recibido_por: currentUser.nombre_completo,
        resultado_puntaje: score,
        concepto_visita: aeConcepto,
        resumen_informe: aeResumen.trim(),
        informe_pdf_nombre: aePdf.trim() || `Informe_Externo_${cod}.pdf`,
        hallazgos_ids: hallazgosIds,
        plan_trabajo_id: ptId,
      })
      return draft
    }, `Informe de Auditoría Externa (${aeTipoEnte}) registrado con puntaje ${score}/100 y enviado a Gestión de Hallazgos y Plan de Trabajo.`)

    setModalMode(null)
  }

  return (
    <div className="work-plan">
      {/* KPIs Principales */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Promedio Auditoría Interna</h2>
            <span className="complaint-kpi-icon">
              <ClipboardCheck size={19} />
            </span>
          </div>
          <strong>{promInterna} / 100</strong>
          <p>
            {ejecInternas} ejecutadas · {progInternas} pendientes en cronograma NTC-ISO 19011.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Promedio Auditoría Externa</h2>
            <span className="complaint-kpi-icon">
              <Award size={19} />
            </span>
          </div>
          <strong>{promExterna} / 100</strong>
          <p>
            {extControl} de Entes de Control · {extEps} de Clientes / EPS.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-amber">
          <div className="complaint-kpi-heading">
            <h2>Entes de Control vs. Clientes EPS</h2>
            <span className="complaint-kpi-icon">
              <Building2 size={19} />
            </span>
          </div>
          <strong>{db.auditorias_externas.length} Informes</strong>
          <p>Secretarías de Salud / Supersalud y EPS pagadoras separadas.</p>
        </article>

        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>Hallazgos de Auditoría</h2>
            <span className="complaint-kpi-icon">
              <ShieldAlert size={19} />
            </span>
          </div>
          <strong>
            {db.hallazgos.filter((h) => h.origen.includes('Auditoría')).length} Hallazgos
          </strong>
          <p>Gestionados con 5 Porqués y vinculados al Plan de Trabajo.</p>
        </article>
      </div>

      {/* Selector de las 3 Ventanas */}
      <div className="plan-controls">
        <div className="view-toggle">
          <button
            type="button"
            className={windowView === 'dashboard' ? 'view-selected' : ''}
            onClick={() => setWindowView('dashboard')}
          >
            1. Dashboard de Indicadores de Auditoría (Interna y Externa)
          </button>
          <button
            type="button"
            className={windowView === 'internas' ? 'view-selected' : ''}
            onClick={() => setWindowView('internas')}
          >
            2. Cronograma de Auditorías Internas (NTC-ISO 19011)
          </button>
          <button
            type="button"
            className={windowView === 'externas' ? 'view-selected' : ''}
            onClick={() => setWindowView('externas')}
          >
            3. Resultados de Auditorías Externas (Entes de Control y EPS)
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)}>
            <option value="">Todas las sedes</option>
            {db.sedes
              .filter((s) => !s.es_nacional)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
          </select>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setAiTitulo('')
              setModalMode('crear_interna')
            }}
          >
            <Plus size={14} /> Programar Auditoría Interna
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setAeResumen('')
              setAeHallazgoTitulo('')
              setAeHallazgoCausa('')
              setModalMode('crear_externa')
            }}
          >
            <FilePlus2 size={14} /> Reportar Informe Auditoría Externa
          </button>
        </div>
      </div>

      {/* ====================================================================
          VENTANA 1: DASHBOARD DE INDICADORES DE AUDITORÍA INTERNA Y EXTERNA
         ==================================================================== */}
      {windowView === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 16 }}>
          <section className="panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Resultados de Cumplimiento (0 a 100) · Internas vs. Externas</h2>
                <p style={{ margin: 0, color: '#68778b' }}>
                  Comparativo de puntajes obtenidos en auditorías internas (ISO 19011) y externas (Secretaría de Salud / EPS).
                </p>
              </div>
              <BarChart3 size={20} color="#3269dd" />
            </div>
            <Chart
              type="bar"
              height={290}
              options={{
                chart: { toolbar: { show: false }, fontFamily: 'Geist Variable, sans-serif' },
                colors: ['#2563eb', '#15966a', '#d97706'],
                plotOptions: { bar: { borderRadius: 6, columnWidth: '48%' } },
                yaxis: { max: 100, title: { text: 'Puntaje (0 a 100)' } },
                xaxis: {
                  categories: [
                    ...internasConPuntaje.map((a) => a.codigo),
                    ...db.auditorias_externas.map((a) => `${a.codigo} (${a.tipo_ente === 'Ente de Control' ? 'Control' : 'EPS'})`),
                  ],
                },
              }}
              series={[
                {
                  name: 'Puntaje Obtenido (0-100)',
                  data: [
                    ...internasConPuntaje.map((a) => a.resultado_puntaje || 0),
                    ...db.auditorias_externas.map((a) => a.resultado_puntaje),
                  ],
                },
              ]}
            />
          </section>

          <section className="panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
            <div>
              <h2>Estado General del Programa de Auditorías del Sistema</h2>
              <p style={{ margin: 0, color: '#68778b' }}>
                Resumen consolidado de auditorías programadas, pendientes, ejecutadas y principales resultados.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#68778b' }}>Auditorías Internas ISO 19011</small>
                <strong style={{ display: 'block', fontSize: 18, marginTop: 4 }}>
                  {ejecInternas} Ejecutadas / {progInternas} Pendientes
                </strong>
                <small style={{ color: '#15966a' }}>Promedio general: {promInterna} / 100 pts</small>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#68778b' }}>Auditorías Externas Recibidas</small>
                <strong style={{ display: 'block', fontSize: 18, marginTop: 4 }}>
                  {extControl} Entes Control · {extEps} EPS
                </strong>
                <small style={{ color: '#2563eb' }}>Promedio general: {promExterna} / 100 pts</small>
              </div>
            </div>

            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>Últimas Auditorías Destacadas</h3>
            <ul className="dash-feed-list">
              {db.auditorias_externas.slice(0, 3).map((ext) => (
                <li key={ext.id} className="dash-feed-item">
                  <div>
                    <strong>
                      [{ext.tipo_ente}] {ext.nombre_ente_auditor}
                    </strong>
                    <small>
                      {formatDateES(ext.fecha_visita)} · Concepto: {ext.concepto_visita}
                    </small>
                  </div>
                  <span className="plan-badge plan-complete">{ext.resultado_puntaje} / 100</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* ====================================================================
          VENTANA 2: CRONOGRAMA DE AUDITORÍAS INTERNAS (NTC-ISO 19011)
         ==================================================================== */}
      {windowView === 'internas' && (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <h2>Programa y Cronograma de Auditorías Internas (NTC-ISO 19011 Colombia)</h2>
          </div>
          <p>
            Programa anual de auditorías internas. Permite reportar el informe de auditoría con calificación obligatoria de <strong>0 a 100</strong> y vincular hallazgos directamente a Gestión del Cambio y Plan de Trabajo.
          </p>

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código / Programa</th>
                  <th>Sede y Proceso Auditado</th>
                  <th>Equipo Auditor (ISO 19011)</th>
                  <th>Fecha Programada / Ejecución</th>
                  <th>Estado</th>
                  <th>Resultado (0 a 100)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {internas.map((ai) => {
                  const sede = db.sedes.find((s) => s.id === ai.sede_id)
                  return (
                    <tr key={ai.id}>
                      <td>
                        <strong>
                          {ai.codigo} · {ai.titulo_programa}
                        </strong>
                        <br />
                        <span className="plan-badge plan-future">{ai.estandar_norma}</span>
                      </td>
                      <td>
                        <strong>{sede?.nombre ?? ai.sede_id}</strong>
                        <br />
                        <small>{ai.proceso_auditado}</small>
                      </td>
                      <td>
                        {ai.equipo_auditor}
                        <br />
                        <small>Auditado: {ai.auditado_lider}</small>
                      </td>
                      <td>
                        Prog: {formatDateES(ai.fecha_programada)}
                        {ai.fecha_ejecucion && (
                          <>
                            <br />
                            <strong>Ejec: {formatDateES(ai.fecha_ejecucion)}</strong>
                          </>
                        )}
                      </td>
                      <td>
                        <span
                          className={`plan-badge ${
                            ai.estado === 'Programada' ? 'plan-month' : 'plan-complete'
                          }`}
                        >
                          {ai.estado}
                        </span>
                      </td>
                      <td>
                        {ai.resultado_puntaje !== null ? (
                          <span className="plan-badge plan-complete" style={{ fontSize: 13, fontWeight: 700 }}>
                            {ai.resultado_puntaje} / 100
                          </span>
                        ) : (
                          <span className="plan-badge plan-future">Pendiente informe</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => {
                            setSelectedInterna(ai)
                            setRepPuntaje(String(ai.resultado_puntaje ?? 90))
                            setRepResumen(ai.resumen_informe)
                            setRepPdf(ai.informe_pdf_nombre || '')
                            setRepHallazgoTitulo('')
                            setRepHallazgoCausa('')
                            setModalMode('reportar_interna')
                          }}
                        >
                          <FilePlus2 size={13} />{' '}
                          {ai.resultado_puntaje !== null ? 'Actualizar Informe' : 'Reportar Informe (0-100)'}
                        </button>
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
          VENTANA 3: RESULTADOS DE AUDITORÍAS EXTERNAS (Entes de Control vs Clientes EPS)
         ==================================================================== */}
      {windowView === 'externas' && (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <div>
              <h2>Informes Entregados de Auditorías Externas ({externas.length})</h2>
              <p>
                Separación clara del ente auditor entre <strong>Entes de Control</strong> (Secretaría de Salud, Supersalud, INVIMA) y <strong>Clientes / EPS</strong>, con calificación de 0 a 100 y gestión de hallazgos.
              </p>
            </div>
            <div className="view-toggle">
              <button
                type="button"
                className={enteFilter === '' ? 'view-selected' : ''}
                onClick={() => setEnteFilter('')}
              >
                Todos ({db.auditorias_externas.length})
              </button>
              <button
                type="button"
                className={enteFilter === 'Ente de Control' ? 'view-selected' : ''}
                onClick={() => setEnteFilter('Ente de Control')}
              >
                Entes de Control ({extControl})
              </button>
              <button
                type="button"
                className={enteFilter === 'Cliente / EPS' ? 'view-selected' : ''}
                onClick={() => setEnteFilter('Cliente / EPS')}
              >
                Clientes / EPS ({extEps})
              </button>
            </div>
          </div>

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo de Ente / Entidad Auditora</th>
                  <th>Sede y Alcance de la Visita</th>
                  <th>Fecha Visita / Informe</th>
                  <th>Resultado (0 a 100)</th>
                  <th>Concepto y Resumen del Informe</th>
                  <th>Hallazgos Vinculados</th>
                </tr>
              </thead>
              <tbody>
                {externas.map((ae) => {
                  const sede = db.sedes.find((s) => s.id === ae.sede_id)
                  return (
                    <tr key={ae.id}>
                      <td>
                        <span
                          className={`plan-badge ${
                            ae.tipo_ente === 'Ente de Control' ? 'plan-urgent' : 'plan-future'
                          }`}
                        >
                          {ae.tipo_ente}
                        </span>
                        <br />
                        <strong style={{ display: 'block', marginTop: 5 }}>
                          {ae.nombre_ente_auditor}
                        </strong>
                        <small>{ae.codigo}</small>
                      </td>
                      <td>
                        <strong>{sede?.nombre ?? ae.sede_id}</strong>
                        <br />
                        <small>{ae.alcance_visita}</small>
                      </td>
                      <td>
                        Visita: {formatDateES(ae.fecha_visita)}
                        <br />
                        <small>Informe: {formatDateES(ae.fecha_entrega_informe)}</small>
                      </td>
                      <td>
                        <span className="plan-badge plan-complete" style={{ fontSize: 13.5, fontWeight: 700 }}>
                          {ae.resultado_puntaje} / 100
                        </span>
                      </td>
                      <td>
                        <strong>{ae.concepto_visita}</strong>
                        <p style={{ margin: '4px 0 0', color: '#52617a' }}>{ae.resumen_informe}</p>
                        <small style={{ color: '#245dcc' }}>{ae.informe_pdf_nombre}</small>
                      </td>
                      <td>
                        <strong>{ae.hallazgos_ids.length} hallazgo(s)</strong>
                        <br />
                        <small>En Gestión del Cambio y Plan de Trabajo</small>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modales */}
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
                  <ClipboardCheck size={20} />
                </span>
                <div>
                  <small>AUDITORÍA INTERNA (ISO 19011) Y EXTERNA (ENTES DE CONTROL / EPS)</small>
                  <h2>
                    {modalMode === 'crear_interna' && 'Programar Auditoría Interna en Cronograma'}
                    {modalMode === 'reportar_interna' &&
                      `Reportar Informe de Auditoría Interna (0 a 100) · ${selectedInterna?.codigo}`}
                    {modalMode === 'crear_externa' &&
                      'Reportar Informe de Auditoría Externa (Ente de Control o EPS)'}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {modalMode === 'crear_interna' && (
                <form onSubmit={handleCreateInterna}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Título de la Auditoría Interna <b>*</b>
                        </span>
                        <input
                          required
                          value={aiTitulo}
                          onChange={(e) => setAiTitulo(e.target.value)}
                          placeholder="Ej. Auditoría Interna Estándares de Medicamentos e Historia Clínica"
                        />
                      </label>
                      <label className="form-field">
                        <span>Sede a auditar</span>
                        <select value={aiSedeId} onChange={(e) => setAiSedeId(e.target.value)}>
                          {db.sedes
                            .filter((s) => !s.es_nacional)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Norma / Estándar de Referencia</span>
                        <select
                          value={aiNorma}
                          onChange={(e) =>
                            setAiNorma(e.target.value as AuditoriaInterna['estandar_norma'])
                          }
                        >
                          <option value="Resolución 3100 de 2019">Resolución 3100 de 2019</option>
                          <option value="NTC-ISO 9001 / NTC-ISO 19011">
                            NTC-ISO 9001 / NTC-ISO 19011
                          </option>
                          <option value="PAMEC / Decreto 1011">PAMEC / Decreto 1011</option>
                          <option value="Seguridad del Paciente">Seguridad del Paciente</option>
                        </select>
                      </label>
                      <label className="form-field plan-wide">
                        <span>Proceso / Servicios Auditados</span>
                        <input
                          required
                          value={aiProceso}
                          onChange={(e) => setAiProceso(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Equipo Auditor (ISO 19011)</span>
                        <input
                          required
                          value={aiEquipo}
                          onChange={(e) => setAiEquipo(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Líder del Proceso Auditado</span>
                        <input
                          required
                          value={aiAuditado}
                          onChange={(e) => setAiAuditado(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Fecha Programada</span>
                        <input
                          type="date"
                          required
                          value={aiFechaProg}
                          onChange={(e) => setAiFechaProg(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>Esta programación reposará automáticamente en el Plan de Trabajo.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Programar Auditoría
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'reportar_interna' && (
                <form onSubmit={handleReportInterna}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Resultado Cuantitativo de la Auditoría (0 a 100) <b>*</b>
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={repPuntaje}
                          onChange={(e) => setRepPuntaje(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Archivo PDF del Informe</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setRepPdf(e.target.files?.[0]?.name || '')}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Resumen Ejecutivo del Informe de Auditoría <b>*</b>
                        </span>
                        <textarea
                          required
                          value={repResumen}
                          onChange={(e) => setRepResumen(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Reportar Hallazgo a Gestión de Hallazgos (Opcional)</span>
                        <input
                          value={repHallazgoTitulo}
                          onChange={(e) => setRepHallazgoTitulo(e.target.value)}
                          placeholder="Título del hallazgo detectado..."
                        />
                      </label>
                      <label className="form-field">
                        <span>Causa raíz preliminar (5 Porqués)</span>
                        <input
                          value={repHallazgoCausa}
                          onChange={(e) => setRepHallazgoCausa(e.target.value)}
                          placeholder="Causa raíz identificada..."
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>Los hallazgos reportados se envían a Gestión del Cambio y Plan de Trabajo.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar Informe y Puntaje
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'crear_externa' && (
                <form onSubmit={handleCreateExterna}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Clasificación del Ente Auditor <b>*</b>
                        </span>
                        <select
                          value={aeTipoEnte}
                          onChange={(e) =>
                            setAeTipoEnte(e.target.value as AuditoriaExterna['tipo_ente'])
                          }
                        >
                          <option value="Ente de Control">
                            Ente de Control (Secretaría de Salud / Supersalud / INVIMA)
                          </option>
                          <option value="Cliente / EPS">
                            Cliente / EPS (EPS Sura, Sanitas, Nueva EPS, Compensar, etc.)
                          </option>
                        </select>
                      </label>
                      <label className="form-field">
                        <span>
                          Nombre de la Entidad Auditora <b>*</b>
                        </span>
                        <input
                          required
                          value={aeNombreEnte}
                          onChange={(e) => setAeNombreEnte(e.target.value)}
                          placeholder="Ej. Secretaría Distrital de Salud o EPS Sura"
                        />
                      </label>
                      <label className="form-field">
                        <span>Sede Visitada</span>
                        <select value={aeSedeId} onChange={(e) => setAeSedeId(e.target.value)}>
                          {db.sedes
                            .filter((s) => !s.es_nacional)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>
                          Resultado de la Auditoría Externa (0 a 100) <b>*</b>
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={aePuntaje}
                          onChange={(e) => setAePuntaje(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Fecha de la Visita</span>
                        <input
                          type="date"
                          required
                          value={aeFechaVisita}
                          onChange={(e) => setAeFechaVisita(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Concepto Emitido</span>
                        <select
                          value={aeConcepto}
                          onChange={(e) =>
                            setAeConcepto(e.target.value as AuditoriaExterna['concepto_visita'])
                          }
                        >
                          <option value="Favorable sin requerimientos">
                            Favorable sin requerimientos
                          </option>
                          <option value="Favorable con plan de mejora">
                            Favorable con plan de mejora
                          </option>
                          <option value="Condicionado / Requerimiento prioritario">
                            Condicionado / Requerimiento prioritario
                          </option>
                        </select>
                      </label>
                      <label className="form-field plan-wide">
                        <span>Alcance de la Auditoría</span>
                        <input
                          required
                          value={aeAlcance}
                          onChange={(e) => setAeAlcance(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Resumen del Informe Entregado <b>*</b>
                        </span>
                        <textarea
                          required
                          value={aeResumen}
                          onChange={(e) => setAeResumen(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Registrar Hallazgo Reportado (Se envía a Gestión de Hallazgos)</span>
                        <input
                          value={aeHallazgoTitulo}
                          onChange={(e) => setAeHallazgoTitulo(e.target.value)}
                          placeholder="Título del hallazgo si hubo requerimiento..."
                        />
                      </label>
                      <label className="form-field">
                        <span>Causa raíz preliminar</span>
                        <input
                          value={aeHallazgoCausa}
                          onChange={(e) => setAeHallazgoCausa(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>
                      El informe y sus hallazgos alimentan automáticamente el Dashboard, Gestión del Cambio y Plan de Trabajo.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar Informe de Auditoría Externa
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
