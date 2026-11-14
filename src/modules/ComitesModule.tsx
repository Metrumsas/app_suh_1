import { useState } from 'react'
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Eye,
  FilePlus2,
  Plus,
  UsersRound,
  X,
} from 'lucide-react'
import type {
  AppUser,
  ComiteInstitucional,
  SuhDatabase,
  TipoComiteNombre,
} from '../lib/types'
import { evaluateComiteStatus, formatDateES, todayISO } from '../lib/calculations'
import { pushToWorkPlan, updateDb } from '../lib/store'

const TIPOS_COMITE: TipoComiteNombre[] = [
  'Seguridad del Paciente',
  'Historias Clínicas',
  'Tecnovigilancia',
  'Farmacovigilancia',
  'Infecciones y PROA (IAAS)',
  'Ética Hospitalaria y Bioética',
  'Calidad y Mejoramiento PAMEC',
  'GAGAS (Gestión Ambiental y Residuos)',
]

export default function ComitesModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const today = todayISO()
  const [selectedComite, setSelectedComite] = useState<ComiteInstitucional | null>(null)
  const [modalMode, setModalMode] = useState<'ficha' | 'ejecutar' | 'crear' | null>(null)

  // Form Crear Comité con Acta de Conformación
  const [cCodigo, setCCodigo] = useState('')
  const [cTipo, setCTipo] = useState<TipoComiteNombre>('Seguridad del Paciente')
  const [cNombre, setCNombre] = useState('')
  const [cFechaConf, setCFechaConf] = useState(today)
  const [cResolucion, setCResolucion] = useState('')
  const [cArchivoConf, setCArchivoConf] = useState('')
  const [cDiaMes, setCDiaMes] = useState('15')
  const [cFunciones, setCFunciones] = useState('')
  const [cIntegrantesText, setCIntegrantesText] = useState(
    'Dr. Jorge E. Administrador (Presidente)\nDra. Carolina Méndez (Secretario Técnico)',
  )

  // Form Ejecutar Reunión de Comité + Compromisos al Plan de Trabajo
  const [exNumActa, setExNumActa] = useState('')
  const [exPeriodoMes, setExPeriodoMes] = useState(today.slice(0, 7))
  const [exFechaEjec, setExFechaEjec] = useState(today)
  const [exAsistentes, setExAsistentes] = useState('')
  const [exResumen, setExResumen] = useState('')
  const [exPdf, setExPdf] = useState('')
  const [exCompDesc, setExCompDesc] = useState('')
  const [exCompResp, setExCompResp] = useState(currentUser.nombre_completo)
  const [exCompFecha, setExCompFecha] = useState(today)

  const q = query.trim().toLowerCase()
  const comites = db.comites.filter(
    (c) =>
      !q ||
      `${c.codigo} ${c.nombre} ${c.tipo_comite} ${c.objetivo_funciones}`
        .toLowerCase()
        .includes(q),
  )

  const evaluated = comites.map((c) => ({
    comite: c,
    status: evaluateComiteStatus(c, db.actas, today),
  }))

  const hallazgosCriticos = evaluated.filter((x) => x.status.esHallazgoCritico)
  const alDiaCount = evaluated.filter((x) => x.status.tieneActaMesActual).length

  const handleCreateComite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cNombre.trim() || !cResolucion.trim()) return

    const integrantes = cIntegrantesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => ({
        nombre: line,
        cargo: 'Integrante designado',
        rol_comite:
          i === 0
            ? ('Presidente' as const)
            : i === 1
              ? ('Secretario Técnico' as const)
              : ('Integrante Permanente' as const),
        correo: 'comite@calidadips.co',
      }))

    updateDb((draft) => {
      draft.comites.push({
        id: `com-${Date.now()}`,
        codigo: cCodigo.trim() || `COM-0${draft.comites.length + 1}`,
        tipo_comite: cTipo,
        nombre: cNombre.trim(),
        sede_id: 'sede-nacional',
        fecha_conformacion: cFechaConf,
        resolucion_acta_conformacion: cResolucion.trim(),
        archivo_conformacion_pdf:
          cArchivoConf.trim() || `Acta_Conformacion_${cTipo.replace(/\s+/g, '_')}.pdf`,
        periodicidad: 'Mensual',
        dia_programado_mes: Number(cDiaMes) || 15,
        objetivo_funciones: cFunciones.trim(),
        integrantes,
        activo: true,
      })
      return draft
    }, `Comité "${cNombre.trim()}" creado con su Acta de Conformación.`)

    setModalMode(null)
  }

  const handleExecuteComite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComite || !exNumActa.trim() || !exResumen.trim()) return

    updateDb((draft) => {
      const actaId = `acta-${Date.now()}`
      const compromisos = []

      if (exCompDesc.trim()) {
        const ptId = pushToWorkPlan(draft, {
          titulo: `[Compromiso Comité ${selectedComite.tipo_comite}] ${exCompDesc.trim()}`,
          descripcion: `Derivado del Acta ${exNumActa.trim()} (${exPeriodoMes}) del ${selectedComite.nombre}.`,
          sede_id: selectedComite.sede_id,
          modulo_origen: 'Comités y Reuniones',
          referencia_origen_id: actaId,
          responsable: exCompResp.trim(),
          fecha_limite: exCompFecha,
          usuario_creador: currentUser.nombre_completo,
        })

        compromisos.push({
          id: `comp-${Date.now()}`,
          descripcion: exCompDesc.trim(),
          responsable: exCompResp.trim(),
          fecha_limite: exCompFecha,
          plan_trabajo_id: ptId,
        })
      }

      draft.actas.unshift({
        id: actaId,
        comite_id: selectedComite.id,
        tipo_comite: selectedComite.tipo_comite,
        sede_id: selectedComite.sede_id,
        numero_acta: exNumActa.trim(),
        anio: Number(exPeriodoMes.slice(0, 4)) || 2026,
        periodo_mes: exPeriodoMes,
        fecha_reunion: exFechaEjec,
        asistentes: exAsistentes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        resumen: exResumen.trim(),
        compromisos,
        archivo_pdf_nombre: exPdf.trim() || `${exNumActa.trim()}.pdf`,
        archivo_pdf_url: `#pdf-${actaId}`,
        version: 1,
        historial_versiones: [],
      })
      return draft
    }, 'Acta de comité ejecutada, archivada en el histórico y compromisos enviados al Plan de Trabajo Anual.')

    setModalMode(null)
  }

  return (
    <div className="work-plan">
      {/* KPIs */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>Comités Conformados</h2>
            <span className="complaint-kpi-icon">
              <UsersRound size={19} />
            </span>
          </div>
          <strong>{evaluated.length}</strong>
          <p>Todos los comités tienen programación mensual obligatoria.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Ejecutados Mes Actual</h2>
            <span className="complaint-kpi-icon">
              <CheckCircle2 size={19} />
            </span>
          </div>
          <strong>{alDiaCount}</strong>
          <p>Con acta PDF y compromisos vinculados al Plan de Trabajo Anual.</p>
        </article>

        <article
          className={`panel complaint-kpi ${
            hallazgosCriticos.length > 0 ? 'complaint-kpi-red' : 'complaint-kpi-green'
          }`}
        >
          <div className="complaint-kpi-heading">
            <h2>Hallazgos Críticos (&gt;10 días hábiles)</h2>
            <span className="complaint-kpi-icon">
              <AlertTriangle size={19} />
            </span>
          </div>
          <strong>{hallazgosCriticos.length}</strong>
          <p>
            Si no se ejecuta dentro de los 10 primeros días hábiles del mes siguiente se marca como Hallazgo Crítico.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Total Actas Archivadas</h2>
            <span className="complaint-kpi-icon">
              <CalendarCheck size={19} />
            </span>
          </div>
          <strong>{db.actas.length}</strong>
          <p>Histórico completo sincronizado con Información Documentada.</p>
        </article>
      </div>

      {hallazgosCriticos.length > 0 && (
        <div className="portal-error" role="alert">
          <strong>
            HALLAZGO CRÍTICO DE INCUMPLIMIENTO DE COMITÉ MENSUAL ({hallazgosCriticos.length}):
          </strong>{' '}
          {hallazgosCriticos
            .map((x) => `${x.comite.nombre} (${x.status.explicacion})`)
            .join(' · ')}
        </div>
      )}

      <div className="plan-controls">
        <div>
          <h2>Cronograma Mensual y Seguimiento de Comités Institucionales</h2>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            setCCodigo(`COM-0${db.comites.length + 1}`)
            setCNombre('')
            setCResolucion('Resolución Interna N.º 012 de 2026 · Acta de Conformación')
            setCFunciones('')
            setModalMode('crear')
          }}
        >
          <Plus size={15} /> Crear Comité y Acta de Conformación
        </button>
      </div>

      {/* Tabla Resumen Principal de Comités */}
      <section className="panel plan-table-panel">
        <div className="plan-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo y Datos Básicos del Comité</th>
                <th>Periodicidad y Conformación</th>
                <th>Semáforo Mensual (Regla 10 días hábiles)</th>
                <th>Última Acta de Ejecución</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluated.map(({ comite, status }) => (
                <tr key={comite.id}>
                  <td data-label="Comité">
                    <span className="plan-badge plan-future">{comite.tipo_comite}</span>
                    <br />
                    <strong style={{ display: 'block', marginTop: 5 }}>
                      {comite.codigo} · {comite.nombre}
                    </strong>
                    <small style={{ color: '#52617a' }}>{comite.objetivo_funciones}</small>
                  </td>
                  <td data-label="Conformación">
                    <strong>
                      {comite.periodicidad} (Día {comite.dia_programado_mes} de cada mes)
                    </strong>
                    <br />
                    <small>{comite.resolucion_acta_conformacion}</small>
                    <br />
                    <small style={{ color: '#245dcc' }}>
                      {comite.archivo_conformacion_pdf}
                    </small>
                  </td>
                  <td data-label="Semáforo">
                    <span className={`plan-badge ${status.badgeClass}`}>
                      {status.semaforoLabel}
                    </span>
                    <br />
                    <small style={{ color: status.esHallazgoCritico ? '#a32828' : '#52617a' }}>
                      {status.explicacion}
                    </small>
                  </td>
                  <td data-label="Última Acta">
                    {status.ultimaActa ? (
                      <>
                        <strong>
                          {status.ultimaActa.numero_acta} ({status.ultimaActa.periodo_mes})
                        </strong>
                        <br />
                        <small>
                          Fecha: {formatDateES(status.ultimaActa.fecha_reunion)} · {' '}
                          {status.ultimaActa.archivo_pdf_nombre}
                        </small>
                      </>
                    ) : (
                      <span className="plan-badge plan-overdue">Sin actas ejecutadas</span>
                    )}
                  </td>
                  <td data-label="Acciones">
                    <div className="user-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => {
                          setSelectedComite(comite)
                          setModalMode('ficha')
                        }}
                      >
                        <Eye size={13} /> Ficha Técnica e Histórico
                      </button>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => {
                          setSelectedComite(comite)
                          setExNumActa(`ACT-${comite.codigo}-${today.slice(0, 7)}`)
                          setExPeriodoMes(today.slice(0, 7))
                          setExFechaEjec(today)
                          setExAsistentes(comite.integrantes.map((i) => i.nombre).join(', '))
                          setExResumen('')
                          setExPdf('')
                          setExCompDesc('')
                          setModalMode('ejecutar')
                        }}
                      >
                        <FilePlus2 size={13} /> Registrar Ejecución / Acta
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Ficha Técnica del Comité / Ejecutar Reunión / Crear Comité */}
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
                  <UsersRound size={20} />
                </span>
                <div>
                  <small>MÓDULO DE COMITÉS Y REUNIONES · RESOLUCIÓN 3100 DE 2019</small>
                  <h2>
                    {modalMode === 'crear' && 'Crear Nuevo Comité y Cargar Acta de Conformación'}
                    {modalMode === 'ficha' &&
                      `Ficha Técnica e Histórico de Actas · ${selectedComite?.nombre}`}
                    {modalMode === 'ejecutar' &&
                      `Ejecutar Reunión Mensual y Compromisos · ${selectedComite?.nombre}`}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {modalMode === 'ficha' && selectedComite && (
                <>
                  <section className="case-section">
                    <h3>Datos de Conformación, Funciones y Periodicidad</h3>
                    <dl className="record-fields">
                      <div>
                        <dt>Código y Tipo de Comité</dt>
                        <dd>
                          <strong>{selectedComite.codigo}</strong> · {selectedComite.tipo_comite}
                        </dd>
                      </div>
                      <div>
                        <dt>Fecha de Conformación</dt>
                        <dd>{formatDateES(selectedComite.fecha_conformacion)}</dd>
                      </div>
                      <div>
                        <dt>Periodicidad de Reuniones</dt>
                        <dd>
                          {selectedComite.periodicidad} (Día {selectedComite.dia_programado_mes} de
                          cada mes)
                        </dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Acto Administrativo y Acta de Conformación</dt>
                        <dd>
                          {selectedComite.resolucion_acta_conformacion} ·{' '}
                          <strong style={{ color: '#245dcc' }}>
                            {selectedComite.archivo_conformacion_pdf}
                          </strong>
                        </dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Objetivo y Funciones del Comité</dt>
                        <dd>{selectedComite.objetivo_funciones}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="case-section">
                    <h3>Integrantes Designados ({selectedComite.integrantes.length})</h3>
                    <ul className="case-files">
                      {selectedComite.integrantes.map((int, idx) => (
                        <li key={idx}>
                          <span>
                            <strong>{int.nombre}</strong> · {int.rol_comite}
                            <br />
                            <small>
                              Cargo: {int.cargo} · Correo: {int.correo}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="case-section">
                    <h3>
                      Archivo Histórico de Actas Ejecutadas de este Comité (
                      {db.actas.filter((a) => a.comite_id === selectedComite.id).length})
                    </h3>
                    <ul className="case-files">
                      {db.actas
                        .filter((a) => a.comite_id === selectedComite.id)
                        .sort((a, b) => b.fecha_reunion.localeCompare(a.fecha_reunion))
                        .map((acta) => (
                          <li key={acta.id}>
                            <span>
                              <strong>
                                {acta.numero_acta} · Periodo: {acta.periodo_mes} (Ejecutada:{' '}
                                {formatDateES(acta.fecha_reunion)})
                              </strong>
                              <br />
                              {acta.resumen}
                              <br />
                              <small>
                                Asistentes: {acta.asistentes.join(', ')} · PDF:{' '}
                                <u>{acta.archivo_pdf_nombre}</u> · Compromisos vinculados a Plan de
                                Trabajo: {acta.compromisos.length}
                              </small>
                            </span>
                          </li>
                        ))}
                    </ul>
                  </section>
                </>
              )}

              {modalMode === 'crear' && (
                <form onSubmit={handleCreateComite}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Código del Comité <b>*</b>
                        </span>
                        <input
                          required
                          value={cCodigo}
                          onChange={(e) => setCCodigo(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Tipo de Comité <b>*</b>
                        </span>
                        <select
                          value={cTipo}
                          onChange={(e) => setCTipo(e.target.value as TipoComiteNombre)}
                        >
                          {TIPOS_COMITE.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Nombre Oficial del Comité <b>*</b>
                        </span>
                        <input
                          required
                          value={cNombre}
                          onChange={(e) => setCNombre(e.target.value)}
                          placeholder="Ej. Comité de Infecciones Asociadas a la Atención en Salud y PROA"
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Fecha de Conformación <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={cFechaConf}
                          onChange={(e) => setCFechaConf(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Día del mes programado (Periodicidad Mensual)</span>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={cDiaMes}
                          onChange={(e) => setCDiaMes(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Resolución / Datos de Conformación <b>*</b>
                        </span>
                        <input
                          required
                          value={cResolucion}
                          onChange={(e) => setCResolucion(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Acta de Conformación (PDF)</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setCArchivoConf(e.target.files?.[0]?.name || '')}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Funciones y Objetivo del Comité <b>*</b>
                        </span>
                        <textarea
                          required
                          value={cFunciones}
                          onChange={(e) => setCFunciones(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Integrantes del Comité (uno por línea)</span>
                        <textarea
                          value={cIntegrantesText}
                          onChange={(e) => setCIntegrantesText(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>El comité quedará programado mensualmente con control de los primeros 10 días hábiles.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Crear Comité
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'ejecutar' && selectedComite && (
                <form onSubmit={handleExecuteComite}>
                  <section className="case-section">
                    <h3>1. Datos de Ejecución del Comité y Acta en PDF</h3>
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Número de Acta <b>*</b>
                        </span>
                        <input
                          required
                          value={exNumActa}
                          onChange={(e) => setExNumActa(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Periodo Mensual Correspondiente <b>*</b>
                        </span>
                        <input
                          type="month"
                          required
                          value={exPeriodoMes}
                          onChange={(e) => setExPeriodoMes(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Fecha de Ejecución de la Reunión <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={exFechaEjec}
                          onChange={(e) => setExFechaEjec(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Cargar Acta Firmada en PDF</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setExPdf(e.target.files?.[0]?.name || '')}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Asistentes (separados por coma) <b>*</b>
                        </span>
                        <input
                          required
                          value={exAsistentes}
                          onChange={(e) => setExAsistentes(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Resumen Ejecutivo de la Reunión <b>*</b>
                        </span>
                        <textarea
                          required
                          value={exResumen}
                          onChange={(e) => setExResumen(e.target.value)}
                          placeholder="Temas tratados, decisiones e indicadores revisados..."
                        />
                      </label>
                    </div>
                  </section>

                  <section className="case-section">
                    <h3>2. Compromisos del Comité (Se asignan automáticamente al Plan de Trabajo Anual)</h3>
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>Descripción del Compromiso / Acción</span>
                        <input
                          value={exCompDesc}
                          onChange={(e) => setExCompDesc(e.target.value)}
                          placeholder="Ej. Realizar auditoría de adherencia a protocolo y socializar resultados..."
                        />
                      </label>
                      <label className="form-field">
                        <span>Responsable del Compromiso</span>
                        <input
                          value={exCompResp}
                          onChange={(e) => setExCompResp(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Fecha Límite en Plan de Trabajo</span>
                        <input
                          type="date"
                          value={exCompFecha}
                          onChange={(e) => setExCompFecha(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>

                  <div className="case-save-actions">
                    <span>
                      El acta se archivará en el comité, en Información Documentada y los compromisos irán al Plan de Trabajo.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar Acta y Enviar Compromisos
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
