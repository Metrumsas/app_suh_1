import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  UsersRound,
  Wrench,
} from 'lucide-react'
import type { SuhDatabase } from '../lib/types'
import {
  calculateCapacidadInstaladaMes,
  evaluateAdminCriterion,
  evaluateComiteStatus,
  formatDateES,
  summarizeEvaluacion3100,
  todayISO,
} from '../lib/calculations'
import { ESTANDARES_3100 } from '../lib/normativa-3100'

export default function DashboardOverview({
  db,
  onNavigate,
}: {
  db: SuhDatabase
  onNavigate: (moduleId: string) => void
}) {
  const today = todayISO()
  const sedesOperativas = db.sedes.filter((s) => !s.es_nacional)

  // 1. Cumplimiento 3100
  const rankingSedes = sedesOperativas.map((sede) => {
    const ev =
      db.evaluaciones_3100.find(
        (e) => e.sede_id === sede.id && e.estado === 'cerrada_vigente',
      ) || db.evaluaciones_3100.find((e) => e.sede_id === sede.id)
    const sum = ev ? summarizeEvaluacion3100(ev) : null
    return { sede, ev, sum }
  })

  const promedio3100 =
    rankingSedes.length > 0
      ? Math.round(
          (rankingSedes.reduce((s, r) => s + (r.sum?.porcentajeGeneral ?? 0), 0) /
            rankingSedes.length) *
            10,
        ) / 10
      : 0

  // 2. Administración
  const adminEval = db.admin_criterios.map((c) => ({
    c,
    ev: evaluateAdminCriterion(c, today),
  }))
  const adminCumplen = adminEval.filter((x) => x.ev.cumple).length
  const adminCriticos = adminEval.filter((x) => x.ev.semaforo.level === 'critico').length

  // 3. Plan de Trabajo
  const ptCompletas = db.plan_trabajo.filter((p) => p.estado === 'completa').length
  const ptPendientes = db.plan_trabajo.length - ptCompletas

  // 4. Comités
  const comitesStatus = db.comites.map((c) => ({
    c,
    st: evaluateComiteStatus(c, db.actas, today),
  }))
  const comitesCriticos = comitesStatus.filter((x) => x.st.esHallazgoCritico).length

  // 5. Capacidad Instalada
  const capTotal = db.th_capacidad.reduce(
    (s, c) => s + calculateCapacidadInstaladaMes(c).capacidadPacientesMes,
    0,
  )

  return (
    <div className="dashboard-overview">
      {/* 1. BLOQUE CUMPLIMIENTO RESOLUCIÓN 3100 Y RANKING POR SEDE */}
      <section className="dash-block">
        <header className="dash-block-header">
          <div className="dash-block-title">
            <span className="dash-block-icon">
              <Award size={18} />
            </span>
            <div>
              <h2>Autoevaluación y Cumplimiento Resolución 3100 de 2019 (7 Estándares)</h2>
              <p>
                Estado consolidado por sede, servicios habilitados y brechas activas hacia visita de verificación REPS.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="button button-secondary dash-goto"
            onClick={() => onNavigate('cumplimiento')}
          >
            Ir a Cumplimiento Res. 3100 <ArrowRight size={13} />
          </button>
        </header>

        <div className="plan-kpis dash-kpis">
          <article className="panel complaint-kpi complaint-kpi-green">
            <div className="complaint-kpi-heading">
              <h2>Índice Global Res. 3100</h2>
              <span className="complaint-kpi-icon">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <strong>{promedio3100} %</strong>
            <p>Promedio ponderado de las sedes operativas de la institución.</p>
          </article>

          <article className="panel complaint-kpi complaint-kpi-blue">
            <div className="complaint-kpi-heading">
              <h2>Capacidad Técnico-Admin</h2>
              <span className="complaint-kpi-icon">
                <Building2 size={18} />
              </span>
            </div>
            <strong>
              {adminCumplen} / {adminEval.length} Cumplen
            </strong>
            <p>{adminCriticos} soportes en semáforo crítico (≤30 días).</p>
          </article>

          <article className="panel complaint-kpi complaint-kpi-amber">
            <div className="complaint-kpi-heading">
              <h2>Plan de Trabajo SOGCS</h2>
              <span className="complaint-kpi-icon">
                <CalendarDays size={18} />
              </span>
            </div>
            <strong>
              {ptCompletas} / {db.plan_trabajo.length} Cumplidas
            </strong>
            <p>{ptPendientes} actividades y acciones de mejora en curso.</p>
          </article>

          <article
            className={`panel complaint-kpi ${
              comitesCriticos > 0 ? 'complaint-kpi-red' : 'complaint-kpi-green'
            }`}
          >
            <div className="complaint-kpi-heading">
              <h2>Comités y Hallazgos</h2>
              <span className="complaint-kpi-icon">
                <AlertTriangle size={18} />
              </span>
            </div>
            <strong>{db.hallazgos.length} Hallazgos (5 Porqués)</strong>
            <p>
              {comitesCriticos > 0
                ? `${comitesCriticos} comité(s) con hallazgo crítico (>10 días hábiles)`
                : 'Comités mensuales en seguimiento'}
            </p>
          </article>
        </div>

        {/* Ranking visual de Sedes */}
        <div className="dash-two-col">
          {rankingSedes.map(({ sede, ev, sum }) => (
            <div key={sede.id} className="panel dash-list-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{sede.nombre}</h3>
                  <small style={{ color: '#68778b' }}>
                    REPS: {sede.codigo_reps} · {ev?.servicios_evaluados.length ?? 0} servicios evaluados
                  </small>
                </div>
                <span className="plan-badge plan-complete" style={{ fontSize: 13, fontWeight: 700 }}>
                  {sum ? `${sum.porcentajeGeneral}%` : 'N/A'}
                </span>
              </div>

              {sum && (
                <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                  {ESTANDARES_3100.map((est) => {
                    const st = sum.porEstandar[est.key]
                    return (
                      <div key={est.key} style={{ display: 'grid', gap: 3 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span>{est.nombre}</span>
                          <strong>{st.porcentaje}%</strong>
                        </div>
                        <div className="audit-progress-track" style={{ height: 6 }}>
                          <div
                            className={`audit-progress-fill ${
                              st.porcentaje >= 85
                                ? 'audit-fill-green'
                                : st.porcentaje >= 70
                                  ? 'audit-fill-yellow'
                                  : 'audit-fill-red'
                            }`}
                            style={{ width: `${st.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. ACCESO RÁPIDO A LOS MÓDULOS OPERATIVOS */}
      <section className="dash-block">
        <header className="dash-block-header">
          <div className="dash-block-title">
            <span className="dash-block-icon">
              <ClipboardCheck size={18} />
            </span>
            <div>
              <h2>Estado Operativo de Todos los Módulos del Sistema de Garantía de Calidad</h2>
              <p>Integración total del equipo de calidad en una sola plataforma conectada al Plan de Trabajo.</p>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <article className="panel" style={{ padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Administración y Financiera</strong>
              <Building2 size={16} color="#3269dd" />
            </div>
            <p style={{ margin: '6px 0', fontSize: 11.5, color: '#68778b' }}>
              {db.admin_criterios.length} criterios por sede y NACIONAL · Semáforo 30/60/+60 días.
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => onNavigate('administracion')}
            >
              Abrir módulo →
            </button>
          </article>

          <article className="panel" style={{ padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Talento Humano (Capacidad)</strong>
              <Activity size={16} color="#15966a" />
            </div>
            <p style={{ margin: '6px 0', fontSize: 11.5, color: '#68778b' }}>
              {capTotal.toLocaleString('es-CO')} cupos/mes instalados (Intramural, Extramural y Telemedicina).
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => onNavigate('talento-humano')}
            >
              Abrir módulo →
            </button>
          </article>

          <article className="panel" style={{ padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Infraestructura y Equipos Fijos</strong>
              <Wrench size={16} color="#d69016" />
            </div>
            <p style={{ margin: '6px 0', fontSize: 11.5, color: '#68778b' }}>
              {db.infra_mantenimientos.length} mantenimientos locativos (1-4 fotos) y {db.equipos_fijos.length} equipos fijos.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onNavigate('infraestructura')}
              >
                Infraestructura
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onNavigate('equipos')}
              >
                Equipos Fijos
              </button>
            </div>
          </article>

          <article className="panel" style={{ padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Documentos (2 años) y Comités</strong>
              <FileText size={16} color="#3269dd" />
            </div>
            <p style={{ margin: '6px 0', fontSize: 11.5, color: '#68778b' }}>
              {db.documentos.length} documentos controlados y {db.comites.length} comités mensuales.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onNavigate('documentos')}
              >
                Documentos
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onNavigate('comites')}
              >
                Comités
              </button>
            </div>
          </article>

          <article className="panel" style={{ padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Gestión del Cambio (5 Porqués)</strong>
              <GitBranch size={16} color="#8055c7" />
            </div>
            <p style={{ margin: '6px 0', fontSize: 11.5, color: '#68778b' }}>
              {db.planes_accion.length} planes de acción, {db.hallazgos.length} hallazgos y efectividad post-cierre.
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => onNavigate('cambio')}
            >
              Abrir módulo →
            </button>
          </article>

          <article className="panel" style={{ padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Auditorías (ISO 19011 / Externas)</strong>
              <UsersRound size={16} color="#15966a" />
            </div>
            <p style={{ margin: '6px 0', fontSize: 11.5, color: '#68778b' }}>
              {db.auditorias_internas.length} internas y {db.auditorias_externas.length} externas (Control y EPS) de 0 a 100.
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => onNavigate('auditoria')}
            >
              Abrir módulo →
            </button>
          </article>
        </div>
      </section>

      {/* 3. PRÓXIMAS PRIORIDADES DEL PLAN DE TRABAJO */}
      <section className="dash-block">
        <div className="panel dash-list-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Actividades Recientes y Prioritarias en el Plan de Trabajo Institucional</h3>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => onNavigate('cronograma')}
            >
              Ver Plan de Trabajo completo →
            </button>
          </div>
          <ul className="dash-feed-list">
            {db.plan_trabajo.slice(0, 5).map((pt) => (
              <li key={pt.id}>
                <button
                  type="button"
                  className="dash-feed-item"
                  onClick={() => onNavigate('cronograma')}
                >
                  <div>
                    <strong>
                      [{pt.modulo_origen}] {pt.titulo}
                    </strong>
                    <small>
                      Plazo: {formatDateES(pt.fecha_limite)} · Responsable: {pt.responsable}
                    </small>
                  </div>
                  <span
                    className={`plan-badge ${
                      pt.estado === 'completa' ? 'plan-complete' : 'plan-month'
                    }`}
                  >
                    {pt.estado.toUpperCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
