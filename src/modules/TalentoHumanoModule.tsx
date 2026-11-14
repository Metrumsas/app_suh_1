import { useState } from 'react'
import Chart from 'react-apexcharts'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Plus,
  UsersRound,
  X,
} from 'lucide-react'
import type {
  AppUser,
  ComplejidadServicio,
  GrupoServicio3100,
  ModalidadServicio,
  ServicioCapacidadConfig,
  SuhDatabase,
} from '../lib/types'
import { CATALOGO_SERVICIOS_SALUD } from '../lib/normativa-3100'
import {
  calculateCapacidadInstaladaMes,
  evaluateCapacidadBalance,
  todayISO,
} from '../lib/calculations'
import { updateDb } from '../lib/store'

export default function TalentoHumanoModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const [windowView, setWindowView] = useState<'tabla' | 'graficas'>('tabla')
  const [sedeFilter, setSedeFilter] = useState('')
  const [servicioFilter, setServicioFilter] = useState('')
  const [modalidadFilter, setModalidadFilter] = useState('')
  const [periodoActual, setPeriodoActual] = useState('2026-11')

  // Modales
  const [showAddConfig, setShowAddConfig] = useState(false)
  const [selectedCapForMonth, setSelectedCapForMonth] = useState<ServicioCapacidadConfig | null>(null)
  const [mesInputPeriodo, setMesInputPeriodo] = useState('2026-11')
  const [mesInputAtenciones, setMesInputAtenciones] = useState('')
  const [mesInputObs, setMesInputObs] = useState('')

  // Form Declarar nuevo servicio y modalidad
  const sedesOperativas = db.sedes.filter((s) => !s.es_nacional)
  const [fSedeId, setFSedeId] = useState(sedesOperativas[0]?.id || 'sede-bogota')
  const [fServicioCod, setFServicioCod] = useState(CATALOGO_SERVICIOS_SALUD[0].codigo)
  const [fModalidad, setFModalidad] = useState<ModalidadServicio>('Intramural')
  const [fComplejidad, setFComplejidad] = useState<ComplejidadServicio>('Baja')
  const [fTipoEspacio, setFTipoEspacio] = useState<ServicioCapacidadConfig['tipo_espacio_fisico']>('Consultorios')
  const [fCantEspacios, setFCantEspacios] = useState('1')
  const [fHorasLV, setFHorasLV] = useState('7')
  const [fHorasSab, setFHorasSab] = useState('4')
  const [fDiasLV, setFDiasLV] = useState('20')
  const [fSabados, setFSabados] = useState('4')
  const [fNumProf, setFNumProf] = useState('1')
  const [fPerfil, setFPerfil] = useState('Profesional en Salud')
  const [fHorasContratadas, setFHorasContratadas] = useState('160')
  const [fTiempoMin, setFTiempoMin] = useState('30')
  const [fTransporte, setFTransporte] = useState(false)
  const [fObs, setFObs] = useState('')

  const q = query.trim().toLowerCase()
  const rows = db.th_capacidad
    .filter((r) => !sedeFilter || r.sede_id === sedeFilter)
    .filter((r) => !servicioFilter || r.nombre_servicio === servicioFilter)
    .filter((r) => !modalidadFilter || r.modalidad === modalidadFilter)
    .filter(
      (r) =>
        !q ||
        `${r.codigo_servicio} ${r.nombre_servicio} ${r.modalidad} ${r.perfil_profesional} ${r.observaciones}`
          .toLowerCase()
          .includes(q),
    )

  const enriched = rows.map((cfg) => {
    const calc = calculateCapacidadInstaladaMes(cfg)
    const regMes = db.th_prestados.find(
      (p) => p.servicio_capacidad_id === cfg.id && p.periodo === periodoActual,
    )
    const prestados = regMes ? regMes.atenciones_realizadas : null
    const balance =
      prestados !== null ? evaluateCapacidadBalance(calc.capacidadPacientesMes, prestados) : null
    return { cfg, calc, regMes, prestados, balance }
  })

  // Alerta de servicios sin actualizar en el mes seleccionado
  const sinActualizarMes = enriched.filter((x) => x.prestados === null)
  const conDeficiencia = enriched.filter((x) => x.balance && x.balance.diferencia < 0)

  // Totales por modalidad (separadas como pide la especificación)
  const capIntramural = enriched
    .filter((x) => x.cfg.modalidad === 'Intramural')
    .reduce((s, x) => s + x.calc.capacidadPacientesMes, 0)
  const capExtramural = enriched
    .filter((x) => x.cfg.modalidad === 'Extramural')
    .reduce((s, x) => s + x.calc.capacidadPacientesMes, 0)
  const capTelemedicina = enriched
    .filter((x) => x.cfg.modalidad === 'Telemedicina')
    .reduce((s, x) => s + x.calc.capacidadPacientesMes, 0)

  const serviciosUnicos = [...new Set(db.th_capacidad.map((x) => x.nombre_servicio))].sort()

  const handleSaveNewCapacidad = (e: React.FormEvent) => {
    e.preventDefault()
    const srvCat =
      CATALOGO_SERVICIOS_SALUD.find((s) => s.codigo === fServicioCod) || CATALOGO_SERVICIOS_SALUD[0]

    updateDb((draft) => {
      draft.th_capacidad.push({
        id: `th-cap-${Date.now()}`,
        sede_id: fSedeId,
        codigo_servicio: srvCat.codigo,
        nombre_servicio: srvCat.nombre,
        grupo_servicio: srvCat.grupo as GrupoServicio3100,
        complejidad: fComplejidad,
        modalidad: fModalidad,
        tipo_espacio_fisico: fTipoEspacio,
        cantidad_espacios_fisicos: Number(fCantEspacios) || 1,
        horas_lunes_viernes_dia: Number(fHorasLV) || 7,
        horas_sabado_dia: Number(fHorasSab) || 0,
        dias_habiles_lv_mes: Number(fDiasLV) || 20,
        sabados_mes: Number(fSabados) || 0,
        numero_profesionales: Number(fNumProf) || 1,
        perfil_profesional: fPerfil.trim() || srvCat.nombre,
        horas_contratadas_mes_por_prof: Number(fHorasContratadas) || 160,
        tiempo_atencion_minutos: Number(fTiempoMin) || 30,
        incluye_transporte: fModalidad === 'Extramural' ? true : fTransporte,
        observaciones: fObs.trim(),
      })
      return draft
    }, `Capacidad instalada declarada para ${srvCat.nombre} (${fModalidad}).`)

    setShowAddConfig(false)
  }

  const handleSaveMonthlyRendered = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCapForMonth) return
    const calc = calculateCapacidadInstaladaMes(selectedCapForMonth)
    const count = Number(mesInputAtenciones) || 0

    updateDb((draft) => {
      const existing = draft.th_prestados.find(
        (p) =>
          p.servicio_capacidad_id === selectedCapForMonth.id && p.periodo === mesInputPeriodo,
      )
      if (existing) {
        existing.atenciones_realizadas = count
        existing.capacidad_calculada_mes = calc.capacidadPacientesMes
        existing.actualizado_en = todayISO()
        existing.responsable_registro = currentUser.nombre_completo
        existing.observacion = mesInputObs.trim()
      } else {
        draft.th_prestados.push({
          id: `thp-${Date.now()}`,
          servicio_capacidad_id: selectedCapForMonth.id,
          sede_id: selectedCapForMonth.sede_id,
          nombre_servicio: selectedCapForMonth.nombre_servicio,
          modalidad: selectedCapForMonth.modalidad,
          periodo: mesInputPeriodo,
          atenciones_realizadas: count,
          capacidad_calculada_mes: calc.capacidadPacientesMes,
          actualizado_en: todayISO(),
          responsable_registro: currentUser.nombre_completo,
          observacion: mesInputObs.trim(),
        })
      }
      return draft
    }, `Servicios prestados de ${selectedCapForMonth.nombre_servicio} (${mesInputPeriodo}) actualizados.`)

    setSelectedCapForMonth(null)
  }

  // Datos para Gráficas Dinámicas (Ventana 2)
  const periodosTendencia = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11']
  const serieCapacidadPorPeriodo = periodosTendencia.map(() =>
    enriched.reduce((s, x) => s + x.calc.capacidadPacientesMes, 0),
  )
  const seriePrestadosPorPeriodo = periodosTendencia.map((per) =>
    enriched.reduce((s, x) => {
      const found = db.th_prestados.find(
        (p) => p.servicio_capacidad_id === x.cfg.id && p.periodo === per,
      )
      return s + (found ? found.atenciones_realizadas : 0)
    }, 0),
  )

  return (
    <div className="work-plan">
      {/* KPIs por modalidad separada y balance */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Capacidad Intramural</h2>
            <span className="complaint-kpi-icon">
              <UsersRound size={19} />
            </span>
          </div>
          <strong>{capIntramural.toLocaleString('es-CO')} pac/mes</strong>
          <p>Calculada por consultorios/espacios físicos, horario L-V / Sáb y tiempo de consulta.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Capacidad Extramural</h2>
            <span className="complaint-kpi-icon">
              <Activity size={19} />
            </span>
          </div>
          <strong>{capExtramural.toLocaleString('es-CO')} pac/mes</strong>
          <p>Calculada por N.º de profesionales, horas contratadas/mes y tiempo con transporte.</p>
        </article>

        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>Capacidad Telemedicina</h2>
            <span className="complaint-kpi-icon">
              <CheckCircle2 size={19} />
            </span>
          </div>
          <strong>{capTelemedicina.toLocaleString('es-CO')} pac/mes</strong>
          <p>Calculada por módulos/personal asignado, horas disponibles y tiempo de teleconsulta.</p>
        </article>

        <article
          className={`panel complaint-kpi ${
            conDeficiencia.length > 0 || sinActualizarMes.length > 0
              ? 'complaint-kpi-red'
              : 'complaint-kpi-amber'
          }`}
        >
          <div className="complaint-kpi-heading">
            <h2>Deficiencias y Actualización ({periodoActual})</h2>
            <span className="complaint-kpi-icon">
              <AlertTriangle size={19} />
            </span>
          </div>
          <strong>{conDeficiencia.length} Deficiencias</strong>
          <p>
            {sinActualizarMes.length > 0
              ? `${sinActualizarMes.length} servicio(s) sin actualizar datos en ${periodoActual}`
              : 'Todos los servicios actualizados este mes'}
          </p>
        </article>
      </div>

      {/* Alerta destacada si no se han actualizado los datos mensuales */}
      {sinActualizarMes.length > 0 && (
        <div className="uiaf-callout" role="alert">
          <span>
            <AlertTriangle size={20} />
          </span>
          <div>
            <strong>
              ADVERTENCIA DE ACTUALIZACIÓN MENSUAL ({periodoActual}): Existen {sinActualizarMes.length} servicio(s) sin reporte de servicios prestados del mes
            </strong>
            <p>
              Servicios pendientes de actualizar:{' '}
              {sinActualizarMes
                .map(
                  (x) =>
                    `${x.cfg.nombre_servicio} (${x.cfg.modalidad} - ${
                      db.sedes.find((s) => s.id === x.cfg.sede_id)?.nombre ?? x.cfg.sede_id
                    })`,
                )
                .join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const first = sinActualizarMes[0].cfg
              setSelectedCapForMonth(first)
              setMesInputPeriodo(periodoActual)
              setMesInputAtenciones('')
              setMesInputObs('')
            }}
          >
            Registrar datos del mes ahora →
          </button>
        </div>
      )}

      {/* Barra de controles y selector de las 2 ventanas */}
      <div className="plan-controls">
        <div className="view-toggle">
          <button
            type="button"
            className={windowView === 'tabla' ? 'view-selected' : ''}
            onClick={() => setWindowView('tabla')}
          >
            1. Tabla Resumen de Capacidad Instalada vs. Servicios Prestados
          </button>
          <button
            type="button"
            className={windowView === 'graficas' ? 'view-selected' : ''}
            onClick={() => setWindowView('graficas')}
          >
            2. Ventana de Gráficas Dinámicas (Tendencias y Perfil)
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label>
            Mes evaluación{' '}
            <input
              type="month"
              value={periodoActual}
              onChange={(e) => setPeriodoActual(e.target.value)}
            />
          </label>
          <label>
            Sede{' '}
            <select value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)}>
              <option value="">Todas las sedes</option>
              {sedesOperativas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Servicio{' '}
            <select value={servicioFilter} onChange={(e) => setServicioFilter(e.target.value)}>
              <option value="">Todos los servicios</option>
              {serviciosUnicos.map((srv) => (
                <option key={srv} value={srv}>
                  {srv}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modalidad{' '}
            <select value={modalidadFilter} onChange={(e) => setModalidadFilter(e.target.value)}>
              <option value="">Todas (Intra / Extra / Tele)</option>
              <option value="Intramural">Intramural</option>
              <option value="Extramural">Extramural</option>
              <option value="Telemedicina">Telemedicina</option>
            </select>
          </label>

          <button
            type="button"
            className="button button-primary"
            onClick={() => setShowAddConfig(true)}
          >
            <Plus size={15} /> Declarar Servicio y Capacidad
          </button>
        </div>
      </div>

      {/* ====================================================================
          VENTANA 1: TABLA CON DATOS RESUMIDOS Y GESTIÓN MENSUAL
         ==================================================================== */}
      {windowView === 'tabla' && (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <h2>
              Capacidad Instalada Declarada por Sede, Servicio y Modalidad ({enriched.length} registros)
            </h2>
          </div>
          <p>
            La capacidad se calcula de forma independiente para cada modalidad (<strong>Intramural</strong> por capacidad física y horario; <strong>Extramural</strong> por profesionales, horas contratadas y tiempo con transporte; <strong>Telemedicina</strong> por personal/módulos y horario) y se compara contra las atenciones reales prestadas en el mes.
          </p>

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sede / Servicio</th>
                  <th>Modalidad</th>
                  <th>Parámetros de Cálculo Declarados</th>
                  <th>Capacidad Instalada / Mes</th>
                  <th>Servicios Prestados ({periodoActual})</th>
                  <th>Balance (Holgura / Deficiencia)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(({ cfg, calc, prestados, balance }) => {
                  const sede = db.sedes.find((s) => s.id === cfg.sede_id)
                  return (
                    <tr key={cfg.id}>
                      <td data-label="Sede / Servicio">
                        <strong>
                          [{cfg.codigo_servicio}] {cfg.nombre_servicio}
                        </strong>
                        <br />
                        <small style={{ color: '#3454a1', fontWeight: 600 }}>
                          {sede?.nombre ?? cfg.sede_id}
                        </small>
                        <br />
                        <small style={{ color: '#68778b' }}>
                          {cfg.grupo_servicio} · Complejidad {cfg.complejidad}
                        </small>
                      </td>
                      <td data-label="Modalidad">
                        <span
                          className={`plan-badge ${
                            cfg.modalidad === 'Intramural'
                              ? 'plan-complete'
                              : cfg.modalidad === 'Extramural'
                                ? 'plan-month'
                                : 'plan-future'
                          }`}
                        >
                          {cfg.modalidad}
                        </span>
                      </td>
                      <td data-label="Parámetros">
                        <strong>{calc.formulaExplicacion}</strong>
                        <br />
                        <small style={{ color: '#52617a' }}>{cfg.observaciones}</small>
                      </td>
                      <td data-label="Capacidad / Mes">
                        <strong style={{ fontSize: 15, color: '#1d324f' }}>
                          {calc.capacidadPacientesMes.toLocaleString('es-CO')} atenciones
                        </strong>
                        <br />
                        <small>
                          {calc.horasTotalesMes} h/mes · {cfg.tiempo_atencion_minutos} min/pac
                        </small>
                      </td>
                      <td data-label="Servicios Prestados">
                        {prestados === null ? (
                          <span className="plan-badge plan-overdue">
                            Sin actualizar ({periodoActual})
                          </span>
                        ) : (
                          <>
                            <strong style={{ fontSize: 15 }}>
                              {prestados.toLocaleString('es-CO')} atenciones
                            </strong>
                            <br />
                            <small>Ocupación: {balance?.porcentajeOcupacion}%</small>
                          </>
                        )}
                      </td>
                      <td data-label="Balance">
                        {balance ? (
                          <>
                            <span className={`plan-badge ${balance.badgeClass}`}>
                              {balance.estado}
                            </span>
                            <br />
                            <strong
                              style={{
                                color: balance.diferencia < 0 ? '#a32828' : '#176342',
                                fontSize: 12,
                              }}
                            >
                              {balance.diferencia >= 0
                                ? `Holgura: +${balance.diferencia} cupos disponibles`
                                : `Deficiencia: ${balance.diferencia} atenciones en déficit`}
                            </strong>
                          </>
                        ) : (
                          <small style={{ color: '#a32828' }}>
                            Actualice los servicios prestados del mes para calcular holgura o deficiencia.
                          </small>
                        )}
                      </td>
                      <td data-label="Acciones">
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => {
                            setSelectedCapForMonth(cfg)
                            setMesInputPeriodo(periodoActual)
                            setMesInputAtenciones(prestados !== null ? String(prestados) : '')
                            setMesInputObs('')
                          }}
                        >
                          {prestados === null ? 'Registrar Mes' : 'Actualizar Datos'}
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
          VENTANA 2: GRÁFICAS DINÁMICAS DE TENDENCIAS Y PERFIL DE CAPACIDAD
         ==================================================================== */}
      {windowView === 'graficas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 16 }}>
          <section className="panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <h2>Tendencia Histórica: Capacidad Instalada vs. Servicios Prestados</h2>
                <p style={{ margin: 0, color: '#68778b' }}>
                  Comparativa mensual dinámica según filtro activo de Sede ({sedeFilter ? db.sedes.find((s) => s.id === sedeFilter)?.nombre : 'Todas'}) y Servicio ({servicioFilter || 'Todos'}).
                </p>
              </div>
              <BarChart3 size={20} color="#3269dd" />
            </div>
            <Chart
              type="line"
              height={310}
              options={{
                chart: { toolbar: { show: false }, fontFamily: 'Geist Variable, sans-serif' },
                colors: ['#3269dd', '#15966a'],
                stroke: { width: [3, 3], curve: 'smooth' },
                markers: { size: 5 },
                xaxis: { categories: ['Jul 2026', 'Ago 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'] },
                yaxis: { title: { text: 'Atenciones / Pacientes por Mes' } },
                legend: { position: 'top' },
              }}
              series={[
                { name: 'Capacidad Instalada Máxima', data: serieCapacidadPorPeriodo },
                { name: 'Servicios Prestados Reales', data: seriePrestadosPorPeriodo },
              ]}
            />
          </section>

          <section className="panel" style={{ padding: 18 }}>
            <div>
              <h2>Perfil de Capacidad Instalada vs. Demanda por Servicio y Modalidad ({periodoActual})</h2>
              <p style={{ margin: 0, color: '#68778b' }}>
                Identificación visual de holguras y deficiencias separadas en Intramural, Extramural y Telemedicina.
              </p>
            </div>
            <Chart
              type="bar"
              height={310}
              options={{
                chart: { toolbar: { show: false }, fontFamily: 'Geist Variable, sans-serif' },
                colors: ['#2563eb', '#f59e0b'],
                plotOptions: { bar: { horizontal: false, columnWidth: '52%', borderRadius: 5 } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: enriched.map(
                    (x) => `${x.cfg.nombre_servicio.slice(0, 12)} (${x.cfg.modalidad.slice(0, 5)})`,
                  ),
                },
                legend: { position: 'top' },
              }}
              series={[
                {
                  name: 'Capacidad Instalada (Mes)',
                  data: enriched.map((x) => x.calc.capacidadPacientesMes),
                },
                {
                  name: `Servicios Prestados (${periodoActual})`,
                  data: enriched.map((x) => x.prestados ?? 0),
                },
              ]}
            />
          </section>
        </div>
      )}

      {/* Modal para declarar nuevo servicio y capacidad */}
      {showAddConfig && (
        <div className="modal-backdrop" onClick={() => setShowAddConfig(false)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <UsersRound size={20} />
                </span>
                <div>
                  <small>TALENTO HUMANO · CAPACIDAD INSTALADA RESOLUCIÓN 3100</small>
                  <h2>Declarar Servicio, Modalidad y Parámetros de Capacidad Instalada</h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowAddConfig(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              <form onSubmit={handleSaveNewCapacidad}>
                <section className="case-section">
                  <div className="plan-form-grid">
                    <label className="form-field">
                      <span>
                        Sede Operativa <b>*</b>
                      </span>
                      <select value={fSedeId} onChange={(e) => setFSedeId(e.target.value)}>
                        {sedesOperativas.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>
                        Servicio de Salud (Catálogo REPS 3100) <b>*</b>
                      </span>
                      <select value={fServicioCod} onChange={(e) => setFServicioCod(e.target.value)}>
                        {CATALOGO_SERVICIOS_SALUD.map((s) => (
                          <option key={s.codigo} value={s.codigo}>
                            [{s.codigo}] {s.nombre} ({s.grupo})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>
                        Modalidad de Prestación <b>*</b>
                      </span>
                      <select
                        value={fModalidad}
                        onChange={(e) => {
                          const mod = e.target.value as ModalidadServicio
                          setFModalidad(mod)
                          if (mod === 'Extramural') {
                            setFTiempoMin('45')
                            setFTransporte(true)
                          } else {
                            setFTiempoMin('30')
                            setFTransporte(false)
                          }
                        }}
                      >
                        <option value="Intramural">Intramural (Capacidad física + horario)</option>
                        <option value="Extramural">Extramural (Personal + horas + transporte)</option>
                        <option value="Telemedicina">Telemedicina (Personal/Módulo + horas)</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Nivel de Complejidad</span>
                      <select
                        value={fComplejidad}
                        onChange={(e) => setFComplejidad(e.target.value as ComplejidadServicio)}
                      >
                        <option value="Baja">Baja complejidad</option>
                        <option value="Media">Media complejidad</option>
                        <option value="Alta">Alta complejidad</option>
                      </select>
                    </label>

                    {fModalidad === 'Intramural' ? (
                      <>
                        <label className="form-field">
                          <span>Capacidad Física Instalada (REPS Resolución 3100 de 2019)</span>
                          <select
                            value={fTipoEspacio}
                            onChange={(e) =>
                              setFTipoEspacio(
                                e.target.value as ServicioCapacidadConfig['tipo_espacio_fisico'],
                              )
                            }
                          >
                            <optgroup label="1. Consultorios (REPS)">
                              <option value="Consultorios">Consultorios en Consulta Externa</option>
                              <option value="Consultorios en el Servicio de Urgencias">
                                Consultorios en el Servicio de Urgencias
                              </option>
                            </optgroup>
                            <optgroup label="2. Salas y Quirófanos (REPS)">
                              <option value="Salas de Procedimientos">
                                Salas de Procedimientos (Menores, Endoscopia, Toma de muestras)
                              </option>
                              <option value="Salas de Cirugía / Quirófanos">
                                Salas de Cirugía / Quirófanos
                              </option>
                              <option value="Salas de Partos / TPR">
                                Salas de Partos / TPR
                              </option>
                            </optgroup>
                            <optgroup label="3. Sillas (REPS)">
                              <option value="Sillas">
                                Sillas / Unidades de Odontología
                              </option>
                              <option value="Sillas de Hemodiálisis">
                                Sillas de Hemodiálisis
                              </option>
                              <option value="Sillas de Quimioterapia / Infusión">
                                Sillas de Quimioterapia / Infusión de Medicamentos
                              </option>
                              <option value="Sillas de Salud Mental / Hospital Día">
                                Sillas de Salud Mental / Internación Parcial
                              </option>
                            </optgroup>
                            <optgroup label="4. Camas y Camillas (REPS)">
                              <option value="Camas Hospitalarias / Internación">
                                Camas de Hospitalización (Adultos, Pediátrica, Obstétrica)
                              </option>
                              <option value="Camas UCI / Cuidado Intermedio / Incubadoras">
                                Camas UCI / Cuidado Intermedio / Incubadoras
                              </option>
                              <option value="Camillas / Cubículos">
                                Camillas de Procedimientos / Terapia / Rehabilitación
                              </option>
                              <option value="Camillas de Observación Urgencias">
                                Camillas de Observación Urgencias
                              </option>
                              <option value="Camillas de Recuperación Post-Quirúrgica">
                                Camillas de Recuperación Post-Quirúrgica
                              </option>
                            </optgroup>
                            <optgroup label="5. Módulos y Unidades Móviles">
                              <option value="Módulos de atención">
                                Módulos de Atención / Vacunación / Telesalud
                              </option>
                              <option value="Ambulancias TAB / TAM y Unidades Móviles">
                                Ambulancias (TAB / TAM) y Unidades Móviles
                              </option>
                            </optgroup>
                          </select>
                        </label>
                        <label className="form-field">
                          <span>Cantidad de consultorios / espacios físicos</span>
                          <input
                            type="number"
                            min="1"
                            value={fCantEspacios}
                            onChange={(e) => setFCantEspacios(e.target.value)}
                          />
                        </label>
                        <label className="form-field">
                          <span>Horas disponibles por día Lunes a Viernes (ej. 8-12 y 2-5 = 7h)</span>
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={fHorasLV}
                            onChange={(e) => setFHorasLV(e.target.value)}
                          />
                        </label>
                        <label className="form-field">
                          <span>Horas disponibles Sábado (ej. 8-12 = 4h)</span>
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={fHorasSab}
                            onChange={(e) => setFHorasSab(e.target.value)}
                          />
                        </label>
                        <label className="form-field">
                          <span>Días hábiles Lunes-Viernes al mes</span>
                          <input
                            type="number"
                            value={fDiasLV}
                            onChange={(e) => setFDiasLV(e.target.value)}
                          />
                        </label>
                        <label className="form-field">
                          <span>Sábados habilitados al mes</span>
                          <input
                            type="number"
                            value={fSabados}
                            onChange={(e) => setFSabados(e.target.value)}
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="form-field">
                          <span>Número de profesionales asignados</span>
                          <input
                            type="number"
                            min="1"
                            value={fNumProf}
                            onChange={(e) => setFNumProf(e.target.value)}
                          />
                        </label>
                        <label className="form-field">
                          <span>Horas contratadas al mes por profesional (ej. 160 h)</span>
                          <input
                            type="number"
                            min="1"
                            value={fHorasContratadas}
                            onChange={(e) => setFHorasContratadas(e.target.value)}
                          />
                        </label>
                      </>
                    )}

                    <label className="form-field">
                      <span>Perfil profesional</span>
                      <input
                        value={fPerfil}
                        onChange={(e) => setFPerfil(e.target.value)}
                        placeholder="Ej. Enfermera Profesional / Médico General"
                      />
                    </label>
                    <label className="form-field">
                      <span>
                        Tiempo de atención por paciente (minutos) <b>*</b>
                      </span>
                      <input
                        type="number"
                        min="5"
                        value={fTiempoMin}
                        onChange={(e) => setFTiempoMin(e.target.value)}
                      />
                    </label>
                    <label className="form-field plan-wide">
                      <span>Observación del horario y modalidad</span>
                      <textarea
                        value={fObs}
                        onChange={(e) => setFObs(e.target.value)}
                        placeholder="Ej. Horario Lunes a Viernes 8-12 y 2-5, Sábado 8-12..."
                      />
                    </label>
                  </div>
                </section>
                <div className="case-save-actions">
                  <span>El motor calculará automáticamente los cupos/pacientes mensuales de esta modalidad.</span>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowAddConfig(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="button button-primary">
                    Guardar capacidad instalada
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para actualizar servicios prestados del mes */}
      {selectedCapForMonth && (
        <div className="modal-backdrop" onClick={() => setSelectedCapForMonth(null)}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-icon">
                  <Activity size={18} />
                </span>
                <div>
                  <small>ACTUALIZACIÓN MENSUAL DE SERVICIOS PRESTADOS</small>
                  <h2>
                    {selectedCapForMonth.nombre_servicio} ({selectedCapForMonth.modalidad})
                  </h2>
                </div>
              </div>
              <button className="icon-button" onClick={() => setSelectedCapForMonth(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveMonthlyRendered}>
              <label className="form-field">
                <span>Periodo (Mes / Año)</span>
                <input
                  type="month"
                  required
                  value={mesInputPeriodo}
                  onChange={(e) => setMesInputPeriodo(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>
                  Total de Servicios / Atenciones Prestadas en el Mes <b>*</b>
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={mesInputAtenciones}
                  onChange={(e) => setMesInputAtenciones(e.target.value)}
                  placeholder="Ej. 320"
                />
              </label>
              <label className="form-field">
                <span>Observaciones del comportamiento mensual</span>
                <textarea
                  value={mesInputObs}
                  onChange={(e) => setMesInputObs(e.target.value)}
                  placeholder="Justificación de holgura o medidas ante sobreocupación..."
                />
              </label>
              <div className="modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setSelectedCapForMonth(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="button button-primary">
                  Guardar servicios prestados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
