import { useState } from 'react'
import { AlertTriangle, Building2, ShieldCheck, X } from 'lucide-react'
import type { AppUser, Sede, SedeServicioHabilitadoREPS, SuhDatabase } from '../lib/types'
import { CATALOGO_CRITERIOS_ADMIN } from '../lib/normativa-3100'
import {
  addDaysISO,
  calculateExpirationByPeriodicidad,
  evaluateSedeHabilitacionStatus,
  formatDateES,
  todayISO,
} from '../lib/calculations'
import { pushToWorkPlan, updateDb } from '../lib/store'
import {
  CATALOGO_CAPACIDAD_INSTALADA_REPS_3100,
  findTerritorioByName,
  TERRITORIOS_SALUD_COLOMBIA,
} from '../lib/colombia-reps-map'
import SedeServiciosREPSManager, { createEmptyServicioREPS } from './SedeServiciosREPSManager'

export default function SedeGeoModal({
  currentUser,
  isOpen,
  onClose,
}: {
  db: SuhDatabase
  currentUser: AppUser
  isOpen: boolean
  onClose: () => void
}) {
  const today = todayISO()
  const [nombre, setNombre] = useState('')
  const [codigoReps, setCodigoReps] = useState('')
  const [territorioNombre, setTerritorioNombre] = useState(
    TERRITORIOS_SALUD_COLOMBIA.find((t) => t.nombre === 'Santander')?.nombre ||
      TERRITORIOS_SALUD_COLOMBIA[0].nombre,
  )
  const [municipio, setMunicipio] = useState('Bucaramanga')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [director, setDirector] = useState(currentUser.nombre_completo)
  const [responsableCorreo, setResponsableCorreo] = useState(currentUser.correo)
  const [areaM2, setAreaM2] = useState('520')
  const [pisosNiveles, setPisosNiveles] = useState('1')
  const [tenenciaInmueble, setTenenciaInmueble] = useState<'Propio' | 'Arrendado' | 'Comodato'>('Arrendado')
  const [accesibilidadPmr, setAccesibilidadPmr] = useState(true)
  const [plantaElectrica, setPlantaElectrica] = useState<'SÍ' | 'NO'>('SÍ')
  const [tanqueReservaAgua, setTanqueReservaAgua] = useState<'SÍ' | 'NO'>('SÍ')
  const [redGasesMedicinales, setRedGasesMedicinales] = useState<'Centralizada' | 'Cilindros portátiles' | 'No aplica'>('Cilindros portátiles')
  const [fechaInscripcion, setFechaInscripcion] = useState(today)
  const [fechaVencimientoHab, setFechaVencimientoHab] = useState(() => addDaysISO(today, 365))

  // Capacidad instalada oficial según Resolución 3100 de 2019 (REPS) + Farmacia y Telemedicina
  const [capacidadCantidades, setCapacidadCantidades] = useState<Record<string, number>>({
    'reps-cap-cons-ext': 6,
    'reps-cap-cons-urg': 0,
    'reps-cap-sala-proc': 1,
    'reps-cap-sala-quir': 0,
    'reps-cap-sala-partos': 0,
    'reps-cap-silla-odon': 2,
    'reps-cap-silla-hemo': 0,
    'reps-cap-silla-quimio': 0,
    'reps-cap-silla-sm': 0,
    'reps-cap-cama-adulto': 0,
    'reps-cap-cama-ped': 0,
    'reps-cap-cama-obst': 0,
    'reps-cap-cama-uci': 0,
    'reps-cap-cama-ucin': 0,
    'reps-cap-camilla-obs': 0,
    'reps-cap-camilla-rec': 0,
    'reps-cap-camilla-otras': 2,
    'reps-cap-farm-ventanillas': 2,
    'reps-cap-tele-modulos': 1,
    'reps-cap-amb-tab': 0,
    'reps-cap-amb-tam': 0,
    'reps-cap-umovil': 0,
  })

  const [autoAssignCatalog, setAutoAssignCatalog] = useState(true)
  const [serviciosSede, setServiciosSede] = useState<SedeServicioHabilitadoREPS[]>(() => [
    createEmptyServicioREPS(),
  ])

  if (!isOpen) return null

  const terrObj = findTerritorioByName(territorioNombre)

  const handleSelectTerritorio = (nextTerrName: string) => {
    setTerritorioNombre(nextTerrName)
    const found = findTerritorioByName(nextTerrName)
    setMunicipio(found.capital_o_cabecera)
    if (!nombre.trim()) {
      setNombre(`Sede ${found.nombre}`)
    }
    if (!codigoReps.trim()) {
      setCodigoReps(`${found.codigo_divipola.padEnd(5, '0')}0452101`)
    }
  }

  const updateCapItem = (id: string, val: number) => {
    setCapacidadCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, val),
    }))
  }

  // Resumen textual coherente con REPS 3100
  const activeCapItems = CATALOGO_CAPACIDAD_INSTALADA_REPS_3100.filter(
    (c) => (capacidadCantidades[c.id] || 0) > 0,
  )
  const resumenCapacidad3100 =
    activeCapItems.length > 0
      ? activeCapItems
          .map((c) => `${capacidadCantidades[c.id]} ${c.unidad_medida} (${c.grupo})`)
          .join(' · ')
      : 'Sin ambientes físicos registrados'

  const totalConsultorios =
    (capacidadCantidades['reps-cap-cons-ext'] || 0) +
    (capacidadCantidades['reps-cap-cons-urg'] || 0)
  const totalSalas =
    (capacidadCantidades['reps-cap-sala-proc'] || 0) +
    (capacidadCantidades['reps-cap-sala-quir'] || 0) +
    (capacidadCantidades['reps-cap-sala-partos'] || 0)
  const totalCamasCamillas =
    (capacidadCantidades['reps-cap-cama-adulto'] || 0) +
    (capacidadCantidades['reps-cap-cama-ped'] || 0) +
    (capacidadCantidades['reps-cap-cama-obst'] || 0) +
    (capacidadCantidades['reps-cap-cama-uci'] || 0) +
    (capacidadCantidades['reps-cap-cama-ucin'] || 0) +
    (capacidadCantidades['reps-cap-camilla-obs'] || 0) +
    (capacidadCantidades['reps-cap-camilla-rec'] || 0) +
    (capacidadCantidades['reps-cap-camilla-otras'] || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !direccion.trim()) return

    const sedeId = `sede-${terrObj.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-3)}`

    updateDb((draft) => {
      const nuevaSede: Sede = {
        id: sedeId,
        codigo_reps:
          codigoReps.trim() || `${terrObj.codigo_divipola.padEnd(5, '0')}${Date.now().toString().slice(-5)}`,
        nombre: nombre.trim(),
        departamento: terrObj.nombre,
        municipio: municipio.trim() || terrObj.capital_o_cabecera,
        ciudad: `${municipio.trim() || terrObj.capital_o_cabecera}, ${terrObj.nombre}`,
        direccion: direccion.trim(),
        telefono: telefono.trim() || '(601) 600 0000',
        director_responsable: director.trim() || currentUser.nombre_completo,
        fecha_inscripcion_reps: fechaInscripcion,
        fecha_vencimiento_habilitacion: fechaVencimientoHab,
        es_nacional: false,
        activa: true,
        descripcion_infraestructura: `Habilitación ${terrObj.tipo_entidad} ante ${terrObj.ente_territorial_salud}. Ubicación: ${municipio.trim()}, ${terrObj.nombre} (${direccion.trim()}).`,
        capacidad_instalada_resumen: resumenCapacidad3100,
        capacidad_instalada_cantidades: { ...capacidadCantidades },
        area_m2: Number(areaM2) || 500,
        pisos_niveles: Number(pisosNiveles) || 1,
        tenencia_inmueble: tenenciaInmueble,
        accesibilidad_pmr: accesibilidadPmr,
        planta_electrica: plantaElectrica,
        tanque_reserva_agua: tanqueReservaAgua,
        red_gases_medicinales: redGasesMedicinales,
        consultorios_totales: totalConsultorios,
        salas_procedimientos: totalSalas,
        camas_camillas: totalCamasCamillas,
        servicios_habilitados: serviciosSede,
        planos_archivos: [],
        fotos_sede: [],
      }

      draft.sedes.push(nuevaSede)

      // Programar en el Plan de Trabajo la renovación anual de habilitación (30 días antes del vencimiento)
      pushToWorkPlan(draft, {
        titulo: `[RENOVACIÓN ANUAL HABILITACIÓN REPS] ${nuevaSede.nombre}`,
        descripcion: `La habilitación de la sede vence el ${formatDateES(fechaVencimientoHab)}. Debe renovarse obligatoriamente dentro de los 30 días anteriores (desde el ${formatDateES(addDaysISO(fechaVencimientoHab, -30))}); su no realización deja SIN HABILITACIÓN la sede.`,
        sede_id: sedeId,
        modulo_origen: 'Administración',
        referencia_origen_id: `hab-reps-${sedeId}`,
        responsable: director.trim() || currentUser.nombre_completo,
        responsable_correo: responsableCorreo.trim() || currentUser.correo,
        fecha_limite: fechaVencimientoHab,
        usuario_creador: currentUser.nombre_completo,
      })

      if (autoAssignCatalog) {
        const catalogo =
          draft.admin_catalogo && draft.admin_catalogo.length > 0
            ? draft.admin_catalogo
            : CATALOGO_CRITERIOS_ADMIN.map((c) => ({
                id: c.id,
                codigo: c.codigo,
                categoria: c.categoria,
                titulo: c.titulo,
                descripcion_normativa: c.descripcion_normativa,
                periodicidad: c.periodicidad,
                programacion_anual: c.programacion_anual,
                dias_vigencia_default: c.dias_vigencia_default,
                aplica_todas_sedes: !c.aplica_nacional_sugerido,
              }))

        for (const cat of catalogo.filter((x) => x.aplica_todas_sedes)) {
          const recId = `adm-rec-${sedeId}-${cat.codigo}-${Date.now().toString().slice(-3)}`
          const fechaVenc = calculateExpirationByPeriodicidad(today, cat.periodicidad)
          const ptId = pushToWorkPlan(draft, {
            titulo: `[Admin ${cat.codigo} - ${nuevaSede.nombre}] ${cat.titulo}`,
            descripcion: `Cumplimiento obligatorio de criterio (${cat.periodicidad}) en ${nuevaSede.nombre}.`,
            sede_id: sedeId,
            modulo_origen: 'Administración',
            referencia_origen_id: recId,
            responsable: director.trim() || currentUser.nombre_completo,
            responsable_correo: responsableCorreo.trim() || currentUser.correo,
            fecha_limite: fechaVenc,
            usuario_creador: currentUser.nombre_completo,
          })

          draft.admin_criterios.push({
            id: recId,
            criterio_catalogo_id: cat.id,
            codigo: cat.codigo,
            categoria: cat.categoria,
            titulo: cat.titulo,
            descripcion_normativa: cat.descripcion_normativa,
            periodicidad: cat.periodicidad,
            programacion_anual: cat.programacion_anual,
            sede_id: sedeId,
            fecha_programada_inicial: today,
            fecha_vencimiento: fechaVenc,
            responsable: director.trim() || currentUser.nombre_completo,
            responsable_correo: responsableCorreo.trim() || currentUser.correo,
            observaciones: `Asignado automáticamente a ${nuevaSede.nombre} (${terrObj.nombre}).`,
            soportes: [],
            historial: [
              {
                id: `h-${Date.now()}`,
                fecha: today,
                usuario: currentUser.nombre_completo,
                accion: 'Asignación automática de criterio a la sede habilitada',
                justificacion: `Notificación enviada al correo ${responsableCorreo.trim()}.`,
              },
            ],
            plan_trabajo_id: ptId,
          })
        }
      }

      return draft
    }, `Sede "${nombre.trim()}" creada exitosamente en ${terrObj.nombre} con capacidad instalada REPS Res. 3100.`)

    onClose()
  }

  const gruposCapacidad = [
    'Consultorios',
    'Salas',
    'Sillas',
    'Farmacia',
    'Telemedicina',
    'Camas',
    'Camillas',
    'Unidades Móviles y Ambulancias',
  ] as const

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="case-dialog record-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="case-dialog-header">
          <div className="record-dialog-title">
            <span className="record-dialog-title-icon">
              <Building2 size={20} />
            </span>
            <div>
              <small>HABILITACIÓN DE SEDES (REPS · RESOLUCIÓN 3100 DE 2019)</small>
              <h2>Crear Nueva Sede y Registrar Capacidad Instalada</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="case-dialog-body">
          <form onSubmit={handleSubmit}>
            {/* SECCIÓN 1: DATOS DE IDENTIFICACIÓN DE LA SEDE */}
            <section className="case-section">
              <h3>
                <span>1. Datos de Identificación y Ubicación de la Sede</span>
                <span className="plan-badge plan-complete">
                  <ShieldCheck size={13} /> {terrObj.ente_territorial_salud}
                </span>
              </h3>

              <div className="plan-form-grid">
                <label className="form-field">
                  <span>
                    Departamento o Distrito de Habilitación <b>*</b>
                  </span>
                  <select
                    value={terrObj.nombre}
                    onChange={(e) => handleSelectTerritorio(e.target.value)}
                  >
                    <optgroup label="Distritos Especiales con Secretaría de Salud Distrital">
                      {TERRITORIOS_SALUD_COLOMBIA.filter(
                        (t) => t.tipo_entidad === 'Distrito Especial / Salud',
                      ).map((t) => (
                        <option key={t.codigo_divipola} value={t.nombre}>
                          {t.nombre} — ({t.ente_territorial_salud})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Los 32 Departamentos de Colombia">
                      {TERRITORIOS_SALUD_COLOMBIA.filter(
                        (t) => t.tipo_entidad === 'Departamento',
                      ).map((t) => (
                        <option key={t.codigo_divipola} value={t.nombre}>
                          {t.nombre} (Capital: {t.capital_o_cabecera})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Municipio / Localidad <b>*</b>
                  </span>
                  <input
                    required
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Ej. Bucaramanga"
                  />
                </label>

                <label className="form-field">
                  <span>
                    Nombre de la Sede <b>*</b>
                  </span>
                  <input
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={`Ej. Sede ${terrObj.nombre}`}
                  />
                </label>

                <label className="form-field">
                  <span>
                    Código REPS de Habilitación <b>*</b>
                  </span>
                  <input
                    required
                    value={codigoReps}
                    onChange={(e) => setCodigoReps(e.target.value)}
                    placeholder={`${terrObj.codigo_divipola.padEnd(5, '0')}0452101`}
                  />
                </label>

                <label className="form-field plan-wide">
                  <span>
                    Dirección Física de la Sede <b>*</b>
                  </span>
                  <input
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Cra. 35 # 52 - 18, Edificio Médico Piso 3"
                  />
                </label>

                <label className="form-field">
                  <span>Teléfono de Contacto</span>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="(607) 643 1000"
                  />
                </label>

                <label className="form-field">
                  <span>Área Construida (m²)</span>
                  <input
                    type="number"
                    value={areaM2}
                    onChange={(e) => setAreaM2(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>Pisos / Niveles del Inmueble</span>
                  <input
                    type="number"
                    min="1"
                    value={pisosNiveles}
                    onChange={(e) => setPisosNiveles(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>Tenencia del Inmueble</span>
                  <select
                    value={tenenciaInmueble}
                    onChange={(e) =>
                      setTenenciaInmueble(e.target.value as 'Propio' | 'Arrendado' | 'Comodato')
                    }
                  >
                    <option value="Propio">Propio</option>
                    <option value="Arrendado">Arrendado</option>
                    <option value="Comodato">Comodato</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Accesibilidad PMR (Rampa / Ascensor)</span>
                  <select
                    value={accesibilidadPmr ? 'SI' : 'NO'}
                    onChange={(e) => setAccesibilidadPmr(e.target.value === 'SI')}
                  >
                    <option value="SI">SÍ — Cumple Accesibilidad PMR</option>
                    <option value="NO">NO</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Planta Eléctrica / UPS de Respaldo</span>
                  <select
                    value={plantaElectrica}
                    onChange={(e) => setPlantaElectrica(e.target.value as 'SÍ' | 'NO')}
                  >
                    <option value="SÍ">SÍ</option>
                    <option value="NO">NO</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Tanque de Reserva de Agua Potable</span>
                  <select
                    value={tanqueReservaAgua}
                    onChange={(e) => setTanqueReservaAgua(e.target.value as 'SÍ' | 'NO')}
                  >
                    <option value="SÍ">SÍ</option>
                    <option value="NO">NO</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Red de Gases Medicinales</span>
                  <select
                    value={redGasesMedicinales}
                    onChange={(e) =>
                      setRedGasesMedicinales(
                        e.target.value as 'Centralizada' | 'Cilindros portátiles' | 'No aplica',
                      )
                    }
                  >
                    <option value="Centralizada">Red Centralizada</option>
                    <option value="Cilindros portátiles">Cilindros portátiles</option>
                    <option value="No aplica">No aplica</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Director / Responsable de la Sede <b>*</b>
                  </span>
                  <input
                    required
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>
                    Correo Electrónico del Responsable (Alertas) <b>*</b>
                  </span>
                  <input
                    type="email"
                    required
                    value={responsableCorreo}
                    onChange={(e) => setResponsableCorreo(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>
                    Fecha de Creación / Inscripción REPS <b>*</b>
                  </span>
                  <input
                    type="date"
                    required
                    value={fechaInscripcion}
                    onChange={(e) => {
                      setFechaInscripcion(e.target.value)
                      setFechaVencimientoHab(addDaysISO(e.target.value, 365))
                    }}
                  />
                </label>

                <label className="form-field">
                  <span>
                    Fecha de Vencimiento de la Habilitación (Renovación Anual) <b>*</b>
                  </span>
                  <input
                    type="date"
                    required
                    value={fechaVencimientoHab}
                    onChange={(e) => setFechaVencimientoHab(e.target.value)}
                  />
                </label>

                <div className="uiaf-callout plan-wide" style={{ margin: '6px 0 0' }}>
                  <span>
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <strong>
                      Control de Renovación Anual de Habilitación REPS (Ventana obligatoria: 30 días antes del vencimiento)
                    </strong>
                    <p>
                      {evaluateSedeHabilitacionStatus(fechaVencimientoHab, today).detalle}
                    </p>
                  </div>
                  <span
                    className={`plan-badge ${
                      evaluateSedeHabilitacionStatus(fechaVencimientoHab, today).badgeClass
                    }`}
                  >
                    {evaluateSedeHabilitacionStatus(fechaVencimientoHab, today).label}
                  </span>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: CAPACIDAD INSTALADA OFICIAL RESOLUCIÓN 3100 DE 2019 */}
            <section className="case-section">
              <h3>
                <span>
                  2. Capacidad Instalada de la Sede (Resolución 3100 de 2019)
                </span>
                <span className="plan-badge plan-future">
                  Consultorios · Salas · Sillas · Farmacia · Telemedicina · Camas · Camillas · Móviles
                </span>
              </h3>
              <p>
                Registra las unidades de capacidad instalada habilitadas en la sede de acuerdo con la clasificación oficial del Registro Especial de Prestadores de Servicios de Salud (REPS):
              </p>

              <div style={{ display: 'grid', gap: 14 }}>
                {gruposCapacidad.map((grupo) => {
                  const conceptos = CATALOGO_CAPACIDAD_INSTALADA_REPS_3100.filter(
                    (c) => c.grupo === grupo,
                  )
                  return (
                    <div
                      key={grupo}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: 12,
                        background: '#f8fafc',
                      }}
                    >
                      <strong style={{ fontSize: 12.5, color: '#1e3a8a', display: 'block', marginBottom: 8 }}>
                        Grupo REPS: {grupo}
                      </strong>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: 10,
                        }}
                      >
                        {conceptos.map((item) => (
                          <label
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: '#ffffff',
                              border:
                                (capacidadCantidades[item.id] || 0) > 0
                                  ? '1.5px solid #2563eb'
                                  : '1px solid #e2e8f0',
                              fontSize: 11.5,
                            }}
                          >
                            <span style={{ flex: 1 }}>
                              <strong>{item.unidad_medida}</strong>
                              <small style={{ display: 'block', color: '#64748b', fontSize: 10.5 }}>
                                {item.concepto}
                              </small>
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={capacidadCantidades[item.id] ?? 0}
                              onChange={(e) =>
                                updateCapItem(item.id, Number(e.target.value) || 0)
                              }
                              style={{
                                width: 64,
                                height: 34,
                                padding: '0 8px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                textAlign: 'center',
                                fontWeight: 700,
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  fontSize: 12,
                }}
              >
                <strong>Resumen consolidado de Capacidad Instalada REPS para la sede:</strong>{' '}
                {resumenCapacidad3100}
              </div>
            </section>

            {/* SECCIÓN 3: CREACIÓN DE SERVICIOS DE SALUD HABILITADOS EN LA SEDE (MODALIDADES MÚLTIPLES REPS) */}
            <section className="case-section">
              <h3>
                <span>
                  3. Servicios de Salud Prestados en la Sede y Modalidades (Res. 3100 y Res. 2654 de 2019)
                </span>
                <span className="plan-badge plan-complete">
                  {serviciosSede.length} servicio(s) configurado(s)
                </span>
              </h3>
              <SedeServiciosREPSManager
                servicios={serviciosSede}
                onChange={setServiciosSede}
              />

              <label
                className="case-check"
                style={{
                  marginTop: 14,
                  padding: 10,
                  borderRadius: 8,
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  fontSize: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={autoAssignCatalog}
                  onChange={(e) => setAutoAssignCatalog(e.target.checked)}
                />
                <span>
                  <strong>Asignar automáticamente todos los criterios del cronograma administrativo</strong>{' '}
                  a esta sede y activar las alertas al correo del responsable.
                </span>
              </label>
            </section>

            <div className="case-save-actions">
              <span>
                La sede quedará habilitada con sus datos de identificación y capacidad instalada.
              </span>
              <button type="button" className="button button-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="button button-primary">
                <Building2 size={14} /> Crear Sede
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
