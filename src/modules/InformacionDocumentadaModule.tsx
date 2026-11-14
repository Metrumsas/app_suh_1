import { useState } from 'react'
import {
  AlertTriangle,
  Archive,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileDown,
  FileText,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import type {
  ActaReunion,
  AppUser,
  DocumentoMaestro,
  SuhDatabase,
  TipoComiteNombre,
} from '../lib/types'
import { addYearsISO, evaluateSemaphore3060, formatDateES, todayISO } from '../lib/calculations'
import { updateDb } from '../lib/store'

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

export default function InformacionDocumentadaModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const today = todayISO()
  const currentYear = Number(today.slice(0, 4))
  const [windowView, setWindowView] = useState<'documentos' | 'actas'>('documentos')
  const [procesoFilter, setProcesoFilter] = useState('')
  const [showPreviousYearsActas, setShowPreviousYearsActas] = useState(false)

  // Modales Documentos
  const [selectedDoc, setSelectedDoc] = useState<DocumentoMaestro | null>(null)
  const [docModalMode, setDocModalMode] = useState<'ficha' | 'crear' | 'actualizar' | null>(null)

  // Form Crear / Actualizar Documento
  const [dCodigo, setDCodigo] = useState('')
  const [dProceso, setDProceso] = useState<DocumentoMaestro['proceso']>('Calidad y Habilitación SOGCS')
  const [dTipo, setDTipo] = useState<DocumentoMaestro['tipo_documento']>('Protocolo')
  const [dTitulo, setDTitulo] = useState('')
  const [dObjetivo, setDObjetivo] = useState('')
  const [dFechaAprob, setDFechaAprob] = useState(today)
  const [dArchivoPdf, setDArchivoPdf] = useState('')
  const [dJustificacion, setDJustificacion] = useState('')

  // Modales Actas
  const [selectedActa, setSelectedActa] = useState<ActaReunion | null>(null)
  const [actaModalMode, setActaModalMode] = useState<'ficha' | 'actualizar' | null>(null)
  const [aResumen, setAResumen] = useState('')
  const [aArchivoPdf, setAArchivoPdf] = useState('')
  const [aJustificacion, setAJustificacion] = useState('')

  const q = query.trim().toLowerCase()
  const docs = db.documentos
    .filter((d) => !procesoFilter || d.proceso === procesoFilter)
    .filter(
      (d) =>
        !q ||
        `${d.codigo} ${d.titulo} ${d.proceso} ${d.tipo_documento} ${d.objetivo_descripcion}`
          .toLowerCase()
          .includes(q),
    )

  const docsWithSemaphore = docs.map((d) => ({
    doc: d,
    sem: evaluateSemaphore3060(d.fecha_vencimiento, today),
  }))

  const vigentesCount = docsWithSemaphore.filter((x) => x.sem.days >= 0).length
  const vencidosCount = docsWithSemaphore.filter((x) => x.sem.days < 0).length

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault()
    const venc = addYearsISO(dFechaAprob, 2)

    if (docModalMode === 'crear') {
      updateDb((draft) => {
        draft.documentos.unshift({
          id: `doc-${Date.now()}`,
          codigo: dCodigo.trim() || `DOC-${Date.now().toString().slice(-3)}`,
          proceso: dProceso,
          tipo_documento: dTipo,
          titulo: dTitulo.trim(),
          objetivo_descripcion: dObjetivo.trim(),
          sede_id: 'sede-nacional',
          version_actual: 1,
          fecha_aprobacion: dFechaAprob,
          fecha_vencimiento: venc,
          responsable: currentUser.nombre_completo,
          archivo_pdf_nombre: dArchivoPdf.trim() || `${dCodigo.trim()}_v1.pdf`,
          archivo_pdf_url: `#pdf-${Date.now()}`,
          historial_versiones: [],
        })
        return draft
      }, `Documento ${dCodigo.trim()} creado con vigencia bienal hasta ${formatDateES(venc)}.`)
      setDocModalMode(null)
      return
    }

    if (docModalMode === 'actualizar' && selectedDoc) {
      if (!dJustificacion.trim()) return
      updateDb((draft) => {
        const target = draft.documentos.find((x) => x.id === selectedDoc.id)
        if (!target) return draft
        // Archivar versión actual en historial
        target.historial_versiones.push({
          version: target.version_actual,
          fecha_aprobacion: target.fecha_aprobacion,
          fecha_vencimiento: target.fecha_vencimiento,
          archivo_pdf_nombre: target.archivo_pdf_nombre,
          archivo_pdf_url: target.archivo_pdf_url,
          justificacion_cambio: dJustificacion.trim(),
          autor_cambio: currentUser.nombre_completo,
        })
        target.version_actual += 1
        target.titulo = dTitulo.trim()
        target.objetivo_descripcion = dObjetivo.trim()
        target.fecha_aprobacion = dFechaAprob
        target.fecha_vencimiento = venc
        target.archivo_pdf_nombre =
          dArchivoPdf.trim() || `${target.codigo}_v${target.version_actual}.pdf`
        return draft
      }, `Documento actualizado a v${selectedDoc.version_actual + 1}; PDF anterior conservado para consulta.`)
      setDocModalMode(null)
    }
  }

  const handleUpdateActa = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedActa || !aJustificacion.trim()) return

    updateDb((draft) => {
      const target = draft.actas.find((x) => x.id === selectedActa.id)
      if (!target) return draft
      target.historial_versiones.unshift({
        version: target.version,
        fecha_actualizacion: today,
        resumen_anterior: target.resumen,
        archivo_pdf_nombre: target.archivo_pdf_nombre,
        justificacion: aJustificacion.trim(),
        usuario: currentUser.nombre_completo,
      })
      target.version += 1
      target.resumen = aResumen.trim()
      target.archivo_pdf_nombre =
        aArchivoPdf.trim() || `${target.numero_acta}_v${target.version}.pdf`
      return draft
    }, `Acta ${selectedActa.numero_acta} actualizada con justificación e historial de versiones.`)

    setActaModalMode(null)
  }

  return (
    <div className="work-plan">
      {/* KPIs */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>Listado Maestro Documental</h2>
            <span className="complaint-kpi-icon">
              <FileText size={19} />
            </span>
          </div>
          <strong>{docs.length}</strong>
          <p>Manuales, protocolos, procedimientos, guías clínicas y políticas.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Documentos Vigentes (&lt; 2 años)</h2>
            <span className="complaint-kpi-icon">
              <CheckCircle2 size={19} />
            </span>
          </div>
          <strong>{vigentesCount}</strong>
          <p>Dentro del ciclo obligatorio de actualización cada 2 años.</p>
        </article>

        <article
          className={`panel complaint-kpi ${
            vencidosCount > 0 ? 'complaint-kpi-red' : 'complaint-kpi-amber'
          }`}
        >
          <div className="complaint-kpi-heading">
            <h2>Vencidos (&gt; 2 años)</h2>
            <span className="complaint-kpi-icon">
              <AlertTriangle size={19} />
            </span>
          </div>
          <strong>{vencidosCount}</strong>
          <p>Documentos que requieren actualización y nueva versión controlada.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Actas de Comités y Reuniones</h2>
            <span className="complaint-kpi-icon">
              <BookOpen size={19} />
            </span>
          </div>
          <strong>{db.actas.length} Actas</strong>
          <p>
            {db.actas.filter((a) => a.anio === currentYear).length} del año {currentYear} ·{' '}
            {db.actas.filter((a) => a.anio < currentYear).length} de años anteriores
          </p>
        </article>
      </div>

      {/* Controles y selector de las 2 ventanas */}
      <div className="plan-controls">
        <div className="view-toggle">
          <button
            type="button"
            className={windowView === 'documentos' ? 'view-selected' : ''}
            onClick={() => setWindowView('documentos')}
          >
            1. Ventana de Información Documentada (Vigencia 2 años y Versiones PDF)
          </button>
          <button
            type="button"
            className={windowView === 'actas' ? 'view-selected' : ''}
            onClick={() => setWindowView('actas')}
          >
            2. Ventana de Actas y Reuniones (Por Tipo de Comité)
          </button>
        </div>

        {windowView === 'documentos' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={procesoFilter} onChange={(e) => setProcesoFilter(e.target.value)}>
              <option value="">Todos los procesos</option>
              {[
                'Dirección y Planeación',
                'Calidad y Habilitación SOGCS',
                'Seguridad del Paciente',
                'Atención Asistencial',
                'Gestión de Medicamentos y Dispositivos',
                'Talento Humano',
                'Infraestructura y Ambiente Físico',
                'Historia Clínica y Registros',
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setDCodigo(`PRO-CAL-00${db.documentos.length + 1}`)
                setDTitulo('')
                setDObjetivo('')
                setDFechaAprob(today)
                setDArchivoPdf('')
                setDocModalMode('crear')
              }}
            >
              <Plus size={15} /> Cargar Nuevo Documento
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`button ${showPreviousYearsActas ? 'button-primary' : 'button-secondary'}`}
            onClick={() => setShowPreviousYearsActas((v) => !v)}
          >
            <Archive size={15} />{' '}
            {showPreviousYearsActas
              ? `Mostrando Año en Curso (${currentYear}) + Años Anteriores`
              : `Cargar Años Anteriores (Mostrando solo ${currentYear})`}
          </button>
        )}
      </div>

      {/* ====================================================================
          VENTANA 1: INFORMACIÓN DOCUMENTADA (Vigencia 2 años + PDFs anteriores)
         ==================================================================== */}
      {windowView === 'documentos' && (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <h2>Listado Maestro de Información Documentada ({docsWithSemaphore.length})</h2>
          </div>
          <p>
            Todo documento se actualiza cada <strong>2 años</strong> a partir de su fecha de aprobación. Al actualizar un documento se exige justificación y se conservan todas las versiones anteriores incluyendo la consulta del PDF anterior.
          </p>

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código / Proceso</th>
                  <th>Título y Objetivo</th>
                  <th>Versión</th>
                  <th>Aprobación y Vigencia (2 Años)</th>
                  <th>Semáforo Vigencia</th>
                  <th>PDF Actual y Versiones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docsWithSemaphore.map(({ doc, sem }) => (
                  <tr key={doc.id}>
                    <td data-label="Código / Proceso">
                      <strong>{doc.codigo}</strong>
                      <br />
                      <span className="plan-badge plan-future">{doc.tipo_documento}</span>
                      <br />
                      <small style={{ color: '#52617a' }}>{doc.proceso}</small>
                    </td>
                    <td data-label="Título y Objetivo">
                      <strong>{doc.titulo}</strong>
                      <p style={{ margin: '4px 0 0', color: '#52617a' }}>
                        {doc.objetivo_descripcion}
                      </p>
                    </td>
                    <td data-label="Versión">
                      <span className="plan-badge plan-complete">v{doc.version_actual}.0</span>
                      <br />
                      <small>{doc.historial_versiones.length} versión(es) anterior(es)</small>
                    </td>
                    <td data-label="Fechas">
                      <small>Aprobado: {formatDateES(doc.fecha_aprobacion)}</small>
                      <br />
                      <strong>Vence (2 años): {formatDateES(doc.fecha_vencimiento)}</strong>
                    </td>
                    <td data-label="Semáforo">
                      <span className={`plan-badge ${sem.badgeClass}`}>{sem.label}</span>
                    </td>
                    <td data-label="PDF">
                      <strong style={{ color: '#245dcc', fontSize: 11.5 }}>
                        {doc.archivo_pdf_nombre}
                      </strong>
                      <br />
                      <small>Resp: {doc.responsable}</small>
                    </td>
                    <td data-label="Acciones">
                      <div className="user-actions">
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => {
                            setSelectedDoc(doc)
                            setDocModalMode('ficha')
                          }}
                        >
                          <Eye size={13} /> Versiones y PDFs ({doc.historial_versiones.length + 1})
                        </button>
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => {
                            setSelectedDoc(doc)
                            setDTitulo(doc.titulo)
                            setDObjetivo(doc.objetivo_descripcion)
                            setDFechaAprob(today)
                            setDArchivoPdf('')
                            setDJustificacion('')
                            setDocModalMode('actualizar')
                          }}
                        >
                          <Pencil size={13} /> Actualizar Versión
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ====================================================================
          VENTANA 2: ACTAS Y REUNIONES TIPIFICADAS POR SECCIÓN DE COMITÉ
          Muestra actas del año en curso y botón para cargar años anteriores
         ==================================================================== */}
      {windowView === 'actas' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {TIPOS_COMITE.map((tipoComite) => {
            const actasTipo = db.actas
              .filter((a) => a.tipo_comite === tipoComite)
              .filter((a) => showPreviousYearsActas || a.anio === currentYear)
              .filter(
                (a) =>
                  !q ||
                  `${a.numero_acta} ${a.resumen} ${a.periodo_mes}`.toLowerCase().includes(q),
              )
              .sort((a, b) => b.fecha_reunion.localeCompare(a.fecha_reunion))

            return (
              <section key={tipoComite} className="panel plan-table-panel">
                <div className="plan-controls">
                  <div>
                    <span className="plan-badge plan-future">SECCIÓN POR TIPO DE COMITÉ</span>
                    <h2 style={{ marginTop: 5 }}>
                      Comité de {tipoComite} ({actasTipo.length} actas visibles)
                    </h2>
                  </div>
                  <small style={{ color: '#68778b' }}>
                    {showPreviousYearsActas
                      ? 'Incluyendo actas históricas de años anteriores'
                      : `Vigencia en curso: ${currentYear}`}
                  </small>
                </div>

                {actasTipo.length === 0 ? (
                  <p>No hay actas registradas para este comité en el filtro de año seleccionado.</p>
                ) : (
                  <div className="plan-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>N.º de Acta / Versión</th>
                          <th>Fecha y Periodo</th>
                          <th>Resumen de la Reunión</th>
                          <th>PDF Cargado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actasTipo.map((acta) => (
                          <tr key={acta.id}>
                            <td data-label="N.º de Acta">
                              <strong>{acta.numero_acta}</strong>
                              <br />
                              <span className="plan-badge plan-complete">v{acta.version}</span>
                              {acta.anio < currentYear && (
                                <span
                                  className="plan-badge plan-month"
                                  style={{ marginLeft: 4 }}
                                >
                                  Histórico {acta.anio}
                                </span>
                              )}
                            </td>
                            <td data-label="Fecha y Periodo">
                              <strong>{formatDateES(acta.fecha_reunion)}</strong>
                              <br />
                              <small>Periodo: {acta.periodo_mes}</small>
                            </td>
                            <td data-label="Resumen">{acta.resumen}</td>
                            <td data-label="PDF">
                              <strong style={{ color: '#245dcc', fontSize: 11.5 }}>
                                {acta.archivo_pdf_nombre}
                              </strong>
                              <br />
                              <small>{acta.historial_versiones.length} cambios previos</small>
                            </td>
                            <td data-label="Acciones">
                              <div className="user-actions">
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  onClick={() => {
                                    setSelectedActa(acta)
                                    setActaModalMode('ficha')
                                  }}
                                >
                                  <Eye size={13} /> Ver e Historial
                                </button>
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  onClick={() => {
                                    setSelectedActa(acta)
                                    setAResumen(acta.resumen)
                                    setAArchivoPdf(acta.archivo_pdf_nombre)
                                    setAJustificacion('')
                                    setActaModalMode('actualizar')
                                  }}
                                >
                                  <Pencil size={13} /> Actualizar Acta
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {/* Modal Documentos: Ficha de Versiones + Consulta de PDFs Anteriores / Actualizar */}
      {docModalMode && (
        <div className="modal-backdrop" onClick={() => setDocModalMode(null)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <FileText size={20} />
                </span>
                <div>
                  <small>CONTROL DOCUMENTAL SOGCS · VIGENCIA BIENAL (2 AÑOS)</small>
                  <h2>
                    {docModalMode === 'crear' && 'Registrar Nuevo Documento Institucional'}
                    {docModalMode === 'ficha' &&
                      `${selectedDoc?.codigo} · ${selectedDoc?.titulo}`}
                    {docModalMode === 'actualizar' &&
                      `Actualizar a Versión v${(selectedDoc?.version_actual || 1) + 1} · ${selectedDoc?.codigo}`}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setDocModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {docModalMode === 'ficha' && selectedDoc && (
                <>
                  <section className="case-section">
                    <h3>Versión Vigente Actual (v{selectedDoc.version_actual}.0)</h3>
                    <dl className="record-fields">
                      <div>
                        <dt>Código y Tipo</dt>
                        <dd>
                          <strong>{selectedDoc.codigo}</strong> · {selectedDoc.tipo_documento}
                        </dd>
                      </div>
                      <div>
                        <dt>Proceso</dt>
                        <dd>{selectedDoc.proceso}</dd>
                      </div>
                      <div>
                        <dt>Aprobación y Vencimiento (2 años)</dt>
                        <dd>
                          {formatDateES(selectedDoc.fecha_aprobacion)} →{' '}
                          <strong>{formatDateES(selectedDoc.fecha_vencimiento)}</strong>
                        </dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Objetivo / Descripción</dt>
                        <dd>{selectedDoc.objetivo_descripcion}</dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>PDF Vigente Disponible</dt>
                        <dd>
                          <strong style={{ color: '#245dcc' }}>
                            {selectedDoc.archivo_pdf_nombre}
                          </strong>
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="case-section">
                    <h3>
                      Historial de Versiones Anteriores y Consulta de PDFs Anteriores (
                      {selectedDoc.historial_versiones.length})
                    </h3>
                    {selectedDoc.historial_versiones.length === 0 ? (
                      <p>Este documento se encuentra en su primera versión controlada.</p>
                    ) : (
                      <ul className="case-files">
                        {[...selectedDoc.historial_versiones].reverse().map((hv) => (
                          <li key={hv.version}>
                            <span>
                              <strong>
                                Versión v{hv.version}.0 · Aprobado:{' '}
                                {formatDateES(hv.fecha_aprobacion)} (Venció:{' '}
                                {formatDateES(hv.fecha_vencimiento)})
                              </strong>
                              <br />
                              Justificación del cambio: {hv.justificacion_cambio} · Autor:{' '}
                              {hv.autor_cambio}
                              <br />
                              <small style={{ color: '#245dcc', fontWeight: 600 }}>
                                PDF Histórico Conservado: {hv.archivo_pdf_nombre}
                              </small>
                            </span>
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() =>
                                alert(
                                  `Abriendo visor del PDF histórico conservado:\n\nArchivo: ${hv.archivo_pdf_nombre}\nVersión: v${hv.version}.0\nFecha aprobación: ${hv.fecha_aprobacion}`,
                                )
                              }
                            >
                              <FileDown size={13} /> Consultar PDF v{hv.version}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}

              {(docModalMode === 'crear' || docModalMode === 'actualizar') && (
                <form onSubmit={handleSaveDocument}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      {docModalMode === 'crear' && (
                        <>
                          <label className="form-field">
                            <span>
                              Código del Documento <b>*</b>
                            </span>
                            <input
                              required
                              value={dCodigo}
                              onChange={(e) => setDCodigo(e.target.value)}
                            />
                          </label>
                          <label className="form-field">
                            <span>Tipo de Documento</span>
                            <select
                              value={dTipo}
                              onChange={(e) =>
                                setDTipo(
                                  e.target.value as DocumentoMaestro['tipo_documento'],
                                )
                              }
                            >
                              <option value="Manual">Manual</option>
                              <option value="Protocolo">Protocolo</option>
                              <option value="Procedimiento">Procedimiento</option>
                              <option value="Guía de Práctica Clínica">Guía de Práctica Clínica</option>
                              <option value="Formato / Instructivo">Formato / Instructivo</option>
                              <option value="Política">Política</option>
                            </select>
                          </label>
                          <label className="form-field plan-wide">
                            <span>Proceso Institucional</span>
                            <select
                              value={dProceso}
                              onChange={(e) =>
                                setDProceso(e.target.value as DocumentoMaestro['proceso'])
                              }
                            >
                              {[
                                'Dirección y Planeación',
                                'Calidad y Habilitación SOGCS',
                                'Seguridad del Paciente',
                                'Atención Asistencial',
                                'Gestión de Medicamentos y Dispositivos',
                                'Talento Humano',
                                'Infraestructura y Ambiente Físico',
                                'Historia Clínica y Registros',
                              ].map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </label>
                        </>
                      )}

                      <label className="form-field plan-wide">
                        <span>
                          Título del Documento <b>*</b>
                        </span>
                        <input
                          required
                          value={dTitulo}
                          onChange={(e) => setDTitulo(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Descripción u Objetivo del Documento <b>*</b>
                        </span>
                        <textarea
                          required
                          value={dObjetivo}
                          onChange={(e) => setDObjetivo(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Fecha de Aprobación (Vigencia automática +2 años) <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={dFechaAprob}
                          onChange={(e) => setDFechaAprob(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Cargar Archivo PDF</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setDArchivoPdf(e.target.files?.[0]?.name || '')}
                        />
                      </label>

                      {docModalMode === 'actualizar' && (
                        <label className="form-field plan-wide">
                          <span>
                            Justificación obligatoria del cambio de versión <b>*</b>
                          </span>
                          <textarea
                            required
                            value={dJustificacion}
                            onChange={(e) => setDJustificacion(e.target.value)}
                            placeholder="Explica los cambios realizados respecto a la versión anterior..."
                          />
                        </label>
                      )}
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>
                      Próxima actualización obligatoria calculada a 2 años:{' '}
                      <strong>{formatDateES(addYearsISO(dFechaAprob, 2))}</strong>
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setDocModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar documento y PDF
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Actas: Ver Historial o Actualizar con Justificación */}
      {actaModalMode && selectedActa && (
        <div className="modal-backdrop" onClick={() => setActaModalMode(null)}>
          <div
            className="case-dialog record-dialog"
            style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <CalendarClock size={20} />
                </span>
                <div>
                  <small>ACTAS DE COMITÉ · HISTORIAL DE VERSIONES</small>
                  <h2>
                    {selectedActa.numero_acta} · Comité de {selectedActa.tipo_comite}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setActaModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {actaModalMode === 'ficha' ? (
                <>
                  <section className="case-section">
                    <h3>Datos del Acta (Versión v{selectedActa.version})</h3>
                    <dl className="record-fields">
                      <div>
                        <dt>N.º de Acta y Periodo</dt>
                        <dd>
                          {selectedActa.numero_acta} ({selectedActa.periodo_mes})
                        </dd>
                      </div>
                      <div>
                        <dt>Fecha de Reunión</dt>
                        <dd>{formatDateES(selectedActa.fecha_reunion)}</dd>
                      </div>
                      <div>
                        <dt>Archivo PDF</dt>
                        <dd>{selectedActa.archivo_pdf_nombre}</dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Asistentes</dt>
                        <dd>{selectedActa.asistentes.join(', ')}</dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Resumen de la Reunión</dt>
                        <dd>{selectedActa.resumen}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="case-section">
                    <h3>
                      Historial de Versiones Anteriores del Acta (
                      {selectedActa.historial_versiones.length})
                    </h3>
                    {selectedActa.historial_versiones.length === 0 ? (
                      <p>Sin modificaciones posteriores al cargue original.</p>
                    ) : (
                      <ul className="case-files">
                        {selectedActa.historial_versiones.map((h) => (
                          <li key={h.version}>
                            <span>
                              <strong>
                                Versión v{h.version} · Actualizada el{' '}
                                {formatDateES(h.fecha_actualizacion)} por {h.usuario}
                              </strong>
                              <br />
                              Justificación: {h.justificacion}
                              <br />
                              <small>
                                Resumen anterior: {h.resumen_anterior} · PDF:{' '}
                                {h.archivo_pdf_nombre}
                              </small>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : (
                <form onSubmit={handleUpdateActa}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Resumen actualizado de la reunión <b>*</b>
                        </span>
                        <textarea
                          required
                          value={aResumen}
                          onChange={(e) => setAResumen(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Reemplazar / Actualizar PDF del Acta</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            setAArchivoPdf(
                              e.target.files?.[0]?.name || selectedActa.archivo_pdf_nombre,
                            )
                          }
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Justificación obligatoria de la actualización del acta <b>*</b>
                        </span>
                        <textarea
                          required
                          value={aJustificacion}
                          onChange={(e) => setAJustificacion(e.target.value)}
                          placeholder="Todo cambio en un acta debe quedar justificado en el historial..."
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>Se conservará la versión anterior en el historial del acta.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setActaModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar actualización justificada
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
