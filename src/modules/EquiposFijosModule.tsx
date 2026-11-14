import { useState } from 'react'
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Cpu,
  Eye,
  Plus,
  Settings,
  X,
} from 'lucide-react'
import type {
  AppUser,
  EquipoFijo,
  EquipoMaintenanceDate,
  EstadoOperativoEquipo,
  FrecuenciaMantenimientoEquipo,
  SuhDatabase,
  TipoTecnologiaEquipo,
} from '../lib/types'
import {
  evaluateSemaphore3060,
  formatDateES,
  generateAnnualMaintenanceSchedule,
  todayISO,
} from '../lib/calculations'
import { updateDb } from '../lib/store'

const TIPOS_TECNOLOGIA: TipoTecnologiaEquipo[] = [
  'Aires acondicionados',
  'Equipos industriales de uso hospitalario',
  'Cómputo y comunicación',
]

const ESTADOS_OPERATIVOS: EstadoOperativoEquipo[] = [
  'Activo',
  'Inactivo',
  'Fallando',
  'Inoperativo',
]

export default function EquiposFijosModule({
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
  const [sedeFilter, setSedeFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')

  const [selectedEquipo, setSelectedEquipo] = useState<EquipoFijo | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedMtoDate, setSelectedMtoDate] = useState<{
    equipo: EquipoFijo
    mto: EquipoMaintenanceDate
  } | null>(null)

  // Form Seguimiento de Fecha de Mantenimiento
  const [segFechaEjec, setSegFechaEjec] = useState(today)
  const [segDesc, setSegDesc] = useState('')
  const [segTecnico, setSegTecnico] = useState('Ing. Biomédico / Proveedor Autorizado')
  const [segSoporte, setSegSoporte] = useState('')

  // Form Nuevo Equipo Fijo
  const [eCodigo, setECodigo] = useState('')
  const [eNombre, setENombre] = useState('')
  const [eMarca, setEMarca] = useState('')
  const [eModelo, setEModelo] = useState('')
  const [eSerie, setESerie] = useState('')
  const [eTipo, setETipo] = useState<TipoTecnologiaEquipo>('Aires acondicionados')
  const [eSedeId, setESedeId] = useState(sedesOperativas[0]?.id || 'sede-bogota')
  const [eLocalizacion, setELocalizacion] = useState('')
  const [eEstado, setEEstado] = useState<EstadoOperativoEquipo>('Activo')
  const [eFrecuencia, setEFrecuencia] = useState<FrecuenciaMantenimientoEquipo>('Semestral')
  const [eAnio, setEAnio] = useState('2026')
  const [eObs, setEObs] = useState('')

  const q = query.trim().toLowerCase()
  const equipos = db.equipos_fijos
    .filter((e) => !sedeFilter || e.sede_id === sedeFilter)
    .filter((e) => !tipoFilter || e.tipo_tecnologia === tipoFilter)
    .filter((e) => !estadoFilter || e.estado_operativo === estadoFilter)
    .filter(
      (e) =>
        !q ||
        `${e.codigo_inventario} ${e.nombre} ${e.marca} ${e.modelo} ${e.serie} ${e.localizacion}`
          .toLowerCase()
          .includes(q),
    )

  // KPIs
  const totalEquipos = equipos.length
  const activosCount = equipos.filter((e) => e.estado_operativo === 'Activo').length
  const alertaOperativaCount = equipos.filter(
    (e) => e.estado_operativo === 'Fallando' || e.estado_operativo === 'Inoperativo',
  ).length
  const totalMtosAnio = equipos.reduce((s, e) => s + e.cronograma_anual.length, 0)
  const ejecutadosMtosAnio = equipos.reduce(
    (s, e) => s + e.cronograma_anual.filter((m) => m.estado === 'Ejecutado').length,
    0,
  )

  const handleCreateEquipo = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!eNombre.trim() || !eCodigo.trim()) return

    const yearNum = Number(eAnio) || 2026
    const cronograma = generateAnnualMaintenanceSchedule(yearNum, eFrecuencia, 15)

    updateDb((draft) => {
      draft.equipos_fijos.push({
        id: `eq-${Date.now()}`,
        codigo_inventario: eCodigo.trim(),
        nombre: eNombre.trim(),
        marca: eMarca.trim() || 'Estándar Hospitalario',
        modelo: eModelo.trim() || '2026',
        serie: eSerie.trim() || `SN-${Date.now().toString().slice(-6)}`,
        tipo_tecnologia: eTipo,
        sede_id: eSedeId,
        localizacion: eLocalizacion.trim() || 'Área asistencial',
        estado_operativo: eEstado,
        frecuencia_mantenimiento: eFrecuencia,
        anio_programa: yearNum,
        responsable: currentUser.nombre_completo,
        foto_url: `data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><rect width="500" height="300" rx="12" fill="#1e3a8a"/><text x="30" y="75" fill="#fff" font-family="sans-serif" font-size="18" font-weight="bold">${eCodigo.trim()}</text><text x="30" y="110" fill="#93c5fd" font-family="sans-serif" font-size="14">${eNombre.trim().slice(0, 42)}</text><text x="30" y="250" fill="#cbd5e1" font-family="monospace" font-size="12">${eTipo}</text></svg>`,
        )}`,
        observaciones: eObs.trim(),
        cronograma_anual: cronograma,
      })
      return draft
    }, `Equipo fijo ${eNombre.trim()} registrado con cronograma ${eFrecuencia} (${cronograma.length} fechas en el año).`)

    setShowCreateModal(false)
  }

  const handleSaveMtoExecution = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!selectedMtoDate) return

    updateDb((draft) => {
      const eq = draft.equipos_fijos.find((x) => x.id === selectedMtoDate.equipo.id)
      if (!eq) return draft
      const m = eq.cronograma_anual.find((x) => x.id === selectedMtoDate.mto.id)
      if (!m) return draft
      m.estado = 'Ejecutado'
      m.fecha_ejecucion = segFechaEjec
      m.descripcion_seguimiento = segDesc.trim()
      m.tecnico_responsable = segTecnico.trim()
      m.soporte_archivo = segSoporte.trim() || `OT_${eq.codigo_inventario}_${segFechaEjec}.pdf`
      return draft
    }, 'Seguimiento de mantenimiento del equipo registrado con soporte.')

    setSelectedMtoDate(null)
  }

  const getOperationalBadge = (st: EstadoOperativoEquipo) => {
    if (st === 'Activo') return 'plan-complete'
    if (st === 'Inactivo') return 'plan-future'
    if (st === 'Fallando') return 'plan-month'
    return 'plan-overdue'
  }

  return (
    <div className="work-plan">
      {/* KPIs */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>Inventario Equipos Fijos</h2>
            <span className="complaint-kpi-icon">
              <Cpu size={19} />
            </span>
          </div>
          <strong>{totalEquipos}</strong>
          <p>Aires acondicionados, industriales hospitalarios y cómputo/comunicación.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Equipos Activos</h2>
            <span className="complaint-kpi-icon">
              <CheckCircle2 size={19} />
            </span>
          </div>
          <strong>{activosCount}</strong>
          <p>En operación normal dentro de las sedes habilitadas.</p>
        </article>

        <article
          className={`panel complaint-kpi ${
            alertaOperativaCount > 0 ? 'complaint-kpi-red' : 'complaint-kpi-amber'
          }`}
        >
          <div className="complaint-kpi-heading">
            <h2>Fallando o Inoperativos</h2>
            <span className="complaint-kpi-icon">
              <AlertTriangle size={19} />
            </span>
          </div>
          <strong>{alertaOperativaCount}</strong>
          <p>Equipos que requieren intervención correctiva prioritaria.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Ejecución Cronograma Anual</h2>
            <span className="complaint-kpi-icon">
              <CalendarCheck size={19} />
            </span>
          </div>
          <strong>
            {ejecutadosMtosAnio} / {totalMtosAnio}
          </strong>
          <p>Mantenimientos anuales ejecutados según frecuencia (Mensual/Semestral/Anual).</p>
        </article>
      </div>

      {/* Filtros y botón de agregar */}
      <div className="plan-controls">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            Tipo de tecnología{' '}
            <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
              <option value="">Todos los tipos</option>
              {TIPOS_TECNOLOGIA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado operativo{' '}
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              {ESTADOS_OPERATIVOS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            setECodigo(`EQ-${Date.now().toString().slice(-4)}`)
            setENombre('')
            setEMarca('')
            setEModelo('')
            setESerie('')
            setELocalizacion('')
            setEObs('')
            setShowCreateModal(true)
          }}
        >
          <Plus size={15} /> Registrar Equipo Fijo
        </button>
      </div>

      {/* ====================================================================
          TARJETAS INTERACTIVAS ORGANIZADAS PRIMERO POR SEDE Y LUEGO POR TIPO DE TECNOLOGÍA
         ==================================================================== */}
      {sedesOperativas
        .filter((s) => !sedeFilter || s.id === sedeFilter)
        .map((sede) => {
          const equiposSede = equipos.filter((e) => e.sede_id === sede.id)
          if (equiposSede.length === 0) return null

          return (
            <section key={sede.id} className="panel" style={{ padding: 18, display: 'grid', gap: 16 }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                <span className="plan-badge plan-complete">SEDE · {sede.ciudad.toUpperCase()}</span>
                <h2 style={{ marginTop: 6 }}>
                  {sede.nombre} ({equiposSede.length} equipos registrados)
                </h2>
              </div>

              {TIPOS_TECNOLOGIA.filter((t) => !tipoFilter || t === tipoFilter).map((tipo) => {
                const delTipo = equiposSede.filter((e) => e.tipo_tecnologia === tipo)
                if (delTipo.length === 0) return null

                return (
                  <div key={tipo} style={{ display: 'grid', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 13.5, color: '#25406b' }}>
                      {tipo} ({delTipo.length})
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: 14,
                      }}
                    >
                      {delTipo.map((eq) => {
                        const ejecutados = eq.cronograma_anual.filter(
                          (m) => m.estado === 'Ejecutado',
                        ).length
                        const pendientes = eq.cronograma_anual.filter(
                          (m) => m.estado !== 'Ejecutado',
                        )
                        const proximo = pendientes[0]
                        const semProximo = proximo
                          ? evaluateSemaphore3060(proximo.fecha_programada, today)
                          : null

                        return (
                          <article
                            key={eq.id}
                            style={{
                              border: '1px solid #dfe6f1',
                              borderRadius: 12,
                              padding: 15,
                              background: '#fff',
                              display: 'grid',
                              gap: 10,
                              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                            }}
                          >
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <img
                                src={eq.foto_url}
                                alt={eq.nombre}
                                style={{
                                  width: 82,
                                  height: 64,
                                  objectFit: 'cover',
                                  borderRadius: 8,
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                                  <small style={{ fontWeight: 700, color: '#3454a1' }}>
                                    {eq.codigo_inventario}
                                  </small>
                                  <span className={`plan-badge ${getOperationalBadge(eq.estado_operativo)}`}>
                                    {eq.estado_operativo}
                                  </span>
                                </div>
                                <strong style={{ fontSize: 13, display: 'block', marginTop: 3 }}>
                                  {eq.nombre}
                                </strong>
                                <small style={{ color: '#68778b' }}>
                                  {eq.marca} · {eq.modelo} · Serie: {eq.serie}
                                </small>
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: 11.5,
                                padding: '8px 10px',
                                background: '#f8fafc',
                                borderRadius: 8,
                                color: '#334155',
                              }}
                            >
                              <div>
                                <strong>Localización:</strong> {eq.localizacion}
                              </div>
                              <div>
                                <strong>Programa {eq.anio_programa}:</strong> Frecuencia{' '}
                                <u>{eq.frecuencia_mantenimiento}</u> ({ejecutados}/
                                {eq.cronograma_anual.length} ejecutados)
                              </div>
                              {proximo && semProximo && (
                                <div style={{ marginTop: 4 }}>
                                  <strong>Próxima fecha:</strong> {formatDateES(proximo.fecha_programada)}{' '}
                                  <span className={`plan-badge ${semProximo.badgeClass}`}>
                                    {semProximo.label}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <select
                                aria-label="Cambiar estado operativo"
                                value={eq.estado_operativo}
                                onChange={(e) => {
                                  const nextSt = e.target.value as EstadoOperativoEquipo
                                  updateDb((draft) => {
                                    const t = draft.equipos_fijos.find((x) => x.id === eq.id)
                                    if (t) t.estado_operativo = nextSt
                                    return draft
                                  }, `Estado de ${eq.codigo_inventario} cambiado a ${nextSt}.`)
                                }}
                                style={{
                                  fontSize: 11,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: '1px solid #cbd5e1',
                                }}
                              >
                                {ESTADOS_OPERATIVOS.map((st) => (
                                  <option key={st} value={st}>
                                    Estado: {st}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                className="button button-primary"
                                onClick={() => setSelectedEquipo(eq)}
                              >
                                <Eye size={13} /> Cronograma y Seguimiento
                              </button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </section>
          )
        })}

      {/* Modal de Ficha y Cronograma Anual del Equipo */}
      {selectedEquipo && (
        <div className="modal-backdrop" onClick={() => setSelectedEquipo(null)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <Settings size={20} />
                </span>
                <div>
                  <small>
                    HOJA DE VIDA Y CRONOGRAMA ANUAL ({selectedEquipo.frecuencia_mantenimiento.toUpperCase()})
                  </small>
                  <h2>
                    {selectedEquipo.codigo_inventario} · {selectedEquipo.nombre}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedEquipo(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              <section className="case-section">
                <h3>Datos de Identificación y Registro Fotográfico</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
                  <img
                    src={selectedEquipo.foto_url}
                    alt={selectedEquipo.nombre}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }}
                  />
                  <dl className="record-fields">
                    <div>
                      <dt>Tipo de Tecnología</dt>
                      <dd>{selectedEquipo.tipo_tecnologia}</dd>
                    </div>
                    <div>
                      <dt>Sede y Localización</dt>
                      <dd>
                        {db.sedes.find((s) => s.id === selectedEquipo.sede_id)?.nombre} ·{' '}
                        {selectedEquipo.localizacion}
                      </dd>
                    </div>
                    <div>
                      <dt>Marca / Modelo / Serie</dt>
                      <dd>
                        {selectedEquipo.marca} / {selectedEquipo.modelo} / {selectedEquipo.serie}
                      </dd>
                    </div>
                    <div>
                      <dt>Frecuencia Anual</dt>
                      <dd>
                        {selectedEquipo.frecuencia_mantenimiento} (
                        {selectedEquipo.cronograma_anual.length} fechas en {selectedEquipo.anio_programa})
                      </dd>
                    </div>
                    <div>
                      <dt>Estado Operativo</dt>
                      <dd>{selectedEquipo.estado_operativo}</dd>
                    </div>
                    <div>
                      <dt>Responsable</dt>
                      <dd>{selectedEquipo.responsable}</dd>
                    </div>
                  </dl>
                </div>
              </section>

              <section className="case-section">
                <h3>
                  Cronograma de Mantenimiento Año {selectedEquipo.anio_programa} (
                  {selectedEquipo.cronograma_anual.length} Fechas Programadas)
                </h3>
                <div className="plan-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Periodo</th>
                        <th>Fecha Programada y Semáforo</th>
                        <th>Estado</th>
                        <th>Fecha Ejecución y Seguimiento</th>
                        <th>Soporte</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        db.equipos_fijos.find((x) => x.id === selectedEquipo.id) || selectedEquipo
                      ).cronograma_anual.map((mto) => {
                        const sem = evaluateSemaphore3060(
                          mto.fecha_programada,
                          today,
                          mto.estado === 'Ejecutado',
                        )
                        return (
                          <tr key={mto.id}>
                            <td>
                              <strong>{mto.periodo_label}</strong>
                            </td>
                            <td>
                              <strong>{formatDateES(mto.fecha_programada)}</strong>
                              <br />
                              <span className={`plan-badge ${sem.badgeClass}`}>{sem.label}</span>
                            </td>
                            <td>
                              <span
                                className={`plan-badge ${
                                  mto.estado === 'Ejecutado' ? 'plan-complete' : 'plan-month'
                                }`}
                              >
                                {mto.estado}
                              </span>
                            </td>
                            <td>
                              {mto.estado === 'Ejecutado' ? (
                                <>
                                  <strong>Ejecutado: {formatDateES(mto.fecha_ejecucion)}</strong>
                                  <br />
                                  <small>{mto.descripcion_seguimiento}</small>
                                </>
                              ) : (
                                <small style={{ color: '#68778b' }}>Pendiente de seguimiento</small>
                              )}
                            </td>
                            <td>{mto.soporte_archivo || '—'}</td>
                            <td>
                              <button
                                type="button"
                                className="button button-primary"
                                onClick={() => {
                                  setSelectedMtoDate({ equipo: selectedEquipo, mto })
                                  setSegFechaEjec(mto.fecha_ejecucion || today)
                                  setSegDesc(mto.descripcion_seguimiento || '')
                                  setSegSoporte(mto.soporte_archivo || '')
                                }}
                              >
                                {mto.estado === 'Ejecutado' ? 'Actualizar' : 'Registrar Ejecución'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar ejecución de mantenimiento de una fecha */}
      {selectedMtoDate && (
        <div className="modal-backdrop" onClick={() => setSelectedMtoDate(null)}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-icon">
                  <CalendarCheck size={18} />
                </span>
                <div>
                  <small>{selectedMtoDate.mto.periodo_label}</small>
                  <h2>Seguimiento de Mantenimiento</h2>
                </div>
              </div>
              <button className="icon-button" onClick={() => setSelectedMtoDate(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveMtoExecution}>
              <label className="form-field">
                <span>
                  Fecha real de ejecución <b>*</b>
                </span>
                <input
                  type="date"
                  required
                  value={segFechaEjec}
                  onChange={(e) => setSegFechaEjec(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>
                  Descripción técnica del mantenimiento realizado <b>*</b>
                </span>
                <textarea
                  required
                  value={segDesc}
                  onChange={(e) => setSegDesc(e.target.value)}
                  placeholder="Limpieza, ajuste, pruebas de seguridad eléctrica y calibración..."
                />
              </label>
              <label className="form-field">
                <span>Firma / Proveedor técnico</span>
                <input
                  value={segTecnico}
                  onChange={(e) => setSegTecnico(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Nombre del archivo soporte (Orden de trabajo / Certificado)</span>
                <input
                  value={segSoporte}
                  onChange={(e) => setSegSoporte(e.target.value)}
                  placeholder="OT_Mantenimiento_Firmado.pdf"
                />
              </label>
              <div className="modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setSelectedMtoDate(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="button button-primary">
                  Guardar ejecución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Nuevo Equipo Fijo */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <Cpu size={20} />
                </span>
                <div>
                  <small>INVENTARIO Y PROGRAMA DE MANTENIMIENTO ANUAL</small>
                  <h2>Registrar Nuevo Equipo Fijo</h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="case-dialog-body">
              <form onSubmit={handleCreateEquipo}>
                <section className="case-section">
                  <div className="plan-form-grid">
                    <label className="form-field">
                      <span>
                        Código de Inventario <b>*</b>
                      </span>
                      <input
                        required
                        value={eCodigo}
                        onChange={(e) => setECodigo(e.target.value)}
                      />
                    </label>
                    <label className="form-field">
                      <span>
                        Tipo de Tecnología <b>*</b>
                      </span>
                      <select
                        value={eTipo}
                        onChange={(e) => setETipo(e.target.value as TipoTecnologiaEquipo)}
                      >
                        {TIPOS_TECNOLOGIA.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field plan-wide">
                      <span>
                        Nombre del Equipo <b>*</b>
                      </span>
                      <input
                        required
                        value={eNombre}
                        onChange={(e) => setENombre(e.target.value)}
                        placeholder="Ej. Aire Acondicionado Split Inverter 24.000 BTU Farmacia"
                      />
                    </label>
                    <label className="form-field">
                      <span>Sede</span>
                      <select value={eSedeId} onChange={(e) => setESedeId(e.target.value)}>
                        {sedesOperativas.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>
                        Localización física dentro de la sede <b>*</b>
                      </span>
                      <input
                        required
                        value={eLocalizacion}
                        onChange={(e) => setELocalizacion(e.target.value)}
                        placeholder="Ej. Piso 1 · Servicio Farmacéutico"
                      />
                    </label>
                    <label className="form-field">
                      <span>Marca</span>
                      <input value={eMarca} onChange={(e) => setEMarca(e.target.value)} />
                    </label>
                    <label className="form-field">
                      <span>Modelo</span>
                      <input value={eModelo} onChange={(e) => setEModelo(e.target.value)} />
                    </label>
                    <label className="form-field">
                      <span>Serie</span>
                      <input value={eSerie} onChange={(e) => setESerie(e.target.value)} />
                    </label>
                    <label className="form-field">
                      <span>Estado Operativo Inicial</span>
                      <select
                        value={eEstado}
                        onChange={(e) => setEEstado(e.target.value as EstadoOperativoEquipo)}
                      >
                        {ESTADOS_OPERATIVOS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>
                        Frecuencia de Mantenimiento Anual <b>*</b>
                      </span>
                      <select
                        value={eFrecuencia}
                        onChange={(e) =>
                          setEFrecuencia(e.target.value as FrecuenciaMantenimientoEquipo)
                        }
                      >
                        <option value="Mensual">Mensual (Genera 12 fechas en el año)</option>
                        <option value="Trimestral">Trimestral (Genera 4 fechas en el año)</option>
                        <option value="Semestral">Semestral (Genera 2 fechas en el año)</option>
                        <option value="Anual">Anual (Genera 1 fecha en el año)</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Año del Programa</span>
                      <input
                        type="number"
                        value={eAnio}
                        onChange={(e) => setEAnio(e.target.value)}
                      />
                    </label>
                    <label className="form-field plan-wide">
                      <span>Observaciones técnicas</span>
                      <textarea value={eObs} onChange={(e) => setEObs(e.target.value)} />
                    </label>
                  </div>
                </section>
                <div className="case-save-actions">
                  <span>Se generarán automáticamente las fechas programadas del año según la frecuencia seleccionada.</span>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="button button-primary">
                    Guardar Equipo y Generar Cronograma
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
