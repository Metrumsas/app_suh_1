import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from 'lucide-react'
import type {
  ComplejidadServicio,
  GrupoServicio3100,
  SedeServicioHabilitadoREPS,
} from '../lib/types'
import {
  GRUPOS_SERVICIOS_3100_OFICIAL,
  TABLA_PARAMETROS_SERVICIOS_3100,
  type ParametroServicio3100,
} from '../lib/catalogo-servicios-3100'
import { formatDateES, summarizeModalidadesREPS, todayISO } from '../lib/calculations'

const GRUPOS_SERVICIO_REPS: GrupoServicio3100[] = [
  ...GRUPOS_SERVICIOS_3100_OFICIAL,
]

function sanitizeModalidadesForService(
  current: SedeServicioHabilitadoREPS['modalidades'],
  param?: ParametroServicio3100,
): SedeServicioHabilitadoREPS['modalidades'] {
  if (!param) return current
  const m = param.modalidades_permitidas
  return {
    intramural: m.intramural ? current.intramural : false,
    extramural_unidad_movil: m.extramural_unidad_movil ? current.extramural_unidad_movil : false,
    extramural_domiciliario: m.extramural_domiciliario ? current.extramural_domiciliario : false,
    extramural_jornada_salud: m.extramural_jornada_salud ? current.extramural_jornada_salud : false,
    extramural_transporte_aph: current.extramural_transporte_aph && param.grupo === 'Atención Inmediata',
    telemedicina_ref_interactiva: m.telemedicina_ref_interactiva ? current.telemedicina_ref_interactiva : false,
    telemedicina_ref_no_interactiva: m.telemedicina_ref_no_interactiva ? current.telemedicina_ref_no_interactiva : false,
    telemedicina_ref_telexperticia: m.telemedicina_ref_telexperticia ? current.telemedicina_ref_telexperticia : false,
    telemedicina_ref_telemonitoreo: m.telemedicina_ref_telemonitoreo ? current.telemedicina_ref_telemonitoreo : false,
    telemedicina_rem_telexperticia: m.telemedicina_rem_telexperticia ? current.telemedicina_rem_telexperticia : false,
    telemedicina_rem_telemonitoreo: m.telemedicina_rem_telemonitoreo ? current.telemedicina_rem_telemonitoreo : false,
  }
}

export function createEmptyServicioREPS(): SedeServicioHabilitadoREPS {
  const first =
    TABLA_PARAMETROS_SERVICIOS_3100.find((s) => s.codigo === '328') ??
    TABLA_PARAMETROS_SERVICIOS_3100[0]
  return {
    id: `srv-reps-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    grupo: first.grupo as GrupoServicio3100,
    codigo_servicio: first.codigo,
    nombre_servicio: first.nombre.toUpperCase(),
    numero_distintivo: '',
    complejidad: first.complejidades_permitidas[0] ?? 'Baja',
    fecha_apertura: todayISO(),
    especificidades: '',
    horarios: {
      lunes: '07:00 a 17:00',
      martes: '07:00 a 17:00',
      miercoles: '07:00 a 17:00',
      jueves: '07:00 a 17:00',
      viernes: '07:00 a 17:00',
      sabado: '07:00 a 12:00',
      domingo: '',
    },
    modalidades: {
      intramural: false,
      extramural_unidad_movil: false,
      extramural_domiciliario: false,
      extramural_jornada_salud: false,
      extramural_transporte_aph: false,
      telemedicina_ref_interactiva: false,
      telemedicina_ref_no_interactiva: false,
      telemedicina_ref_telexperticia: false,
      telemedicina_ref_telemonitoreo: false,
      telemedicina_rem_telexperticia: false,
      telemedicina_rem_telemonitoreo: false,
    },
  }
}

export default function SedeServiciosREPSManager({
  servicios,
  onChange,
  readOnly = false,
}: {
  servicios: SedeServicioHabilitadoREPS[]
  onChange: (next: SedeServicioHabilitadoREPS[]) => void
  readOnly?: boolean
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailViewItem, setDetailViewItem] = useState<SedeServicioHabilitadoREPS | null>(null)
  const [draft, setDraft] = useState<SedeServicioHabilitadoREPS>(() => createEmptyServicioREPS())
  const [searchFilter, setSearchFilter] = useState('')
  const [showAllGroupsInSelect, setShowAllGroupsInSelect] = useState(false)
  const [formError, setFormError] = useState('')
  const [horaInicioH, setHoraInicioH] = useState('07')
  const [horaInicioM, setHoraInicioM] = useState('00')
  const [horaFinH, setHoraFinH] = useState('17')
  const [horaFinM, setHoraFinM] = useState('00')
  const [diasActivosHorario, setDiasActivosHorario] = useState<
    Record<keyof SedeServicioHabilitadoREPS['horarios'], boolean>
  >({
    lunes: true,
    martes: true,
    miercoles: true,
    jueves: true,
    viernes: true,
    sabado: true,
    domingo: false,
  })

  const buildHorariosFromSelector = (
    hIni: string,
    mIni: string,
    hFin: string,
    mFin: string,
    dias: Record<keyof SedeServicioHabilitadoREPS['horarios'], boolean>,
  ): SedeServicioHabilitadoREPS['horarios'] => {
    const rango = `${hIni}:${mIni} a ${hFin}:${mFin}`
    return {
      lunes: dias.lunes ? rango : '',
      martes: dias.martes ? rango : '',
      miercoles: dias.miercoles ? rango : '',
      jueves: dias.jueves ? rango : '',
      viernes: dias.viernes ? rango : '',
      sabado: dias.sabado ? rango : '',
      domingo: dias.domingo ? rango : '',
    }
  }

  const syncHorarioStateFromRecord = (horarios?: SedeServicioHabilitadoREPS['horarios']) => {
    const sample = horarios?.lunes || horarios?.martes || '07:00 a 17:00'
    const match = sample.match(/(\d{2}):(\d{2})\s*(?:a|A|-)\s*(\d{2}):(\d{2})/)
    const hi = match ? match[1] : '07'
    const mi = match ? match[2] : '00'
    const hf = match ? match[3] : '17'
    const mf = match ? match[4] : '00'
    setHoraInicioH(hi)
    setHoraInicioM(mi)
    setHoraFinH(hf)
    setHoraFinM(mf)
    setDiasActivosHorario({
      lunes: Boolean(horarios?.lunes),
      martes: Boolean(horarios?.martes),
      miercoles: Boolean(horarios?.miercoles),
      jueves: Boolean(horarios?.jueves),
      viernes: Boolean(horarios?.viernes),
      sabado: Boolean(horarios?.sabado),
      domingo: Boolean(horarios?.domingo),
    })
  }

  const selectedServiceParam = useMemo(
    () => TABLA_PARAMETROS_SERVICIOS_3100.find((s) => s.codigo === draft.codigo_servicio),
    [draft.codigo_servicio],
  )

  const filteredCatalogServices = useMemo(() => {
    const q = searchFilter.trim().toLowerCase()
    return TABLA_PARAMETROS_SERVICIOS_3100.filter((s) => {
      const matchesGroup = showAllGroupsInSelect || s.grupo === draft.grupo
      if (!matchesGroup) return false
      if (!q) return true
      return (
        s.codigo.toLowerCase().includes(q) ||
        s.nombre.toLowerCase().includes(q) ||
        s.grupo.toLowerCase().includes(q)
      )
    }).sort(
      (a, b) =>
        (parseInt(a.codigo, 10) || 0) - (parseInt(b.codigo, 10) || 0) ||
        a.codigo.localeCompare(b.codigo, undefined, { numeric: true }),
    )
  }, [draft.grupo, searchFilter, showAllGroupsInSelect])

  const serviciosOrdenados = useMemo(
    () =>
      [...servicios].sort(
        (a, b) =>
          (parseInt(a.codigo_servicio, 10) || 0) - (parseInt(b.codigo_servicio, 10) || 0) ||
          a.codigo_servicio.localeCompare(b.codigo_servicio, undefined, { numeric: true }),
      ),
    [servicios],
  )

  const applyServiceParamSelection = (param: ParametroServicio3100) => {
    setDraft((prev) => {
      const nextComp = param.complejidades_permitidas.includes(prev.complejidad)
        ? prev.complejidad
        : param.complejidades_permitidas[0] ?? 'Baja'
      const currentSpecs = prev.especificidades
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      const validSpecs = currentSpecs.filter((sp) =>
        param.especificidades_permitidas.includes(sp),
      )
      return {
        ...prev,
        codigo_servicio: param.codigo,
        nombre_servicio: param.nombre.toUpperCase(),
        grupo: param.grupo as GrupoServicio3100,
        complejidad: nextComp,
        especificidades: validSpecs.join(', '),
        modalidades: sanitizeModalidadesForService(prev.modalidades, param),
      }
    })
  }

  const toggleEspecificidad = (specName: string) => {
    setDraft((prev) => {
      const current = prev.especificidades
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      const exists = current.includes(specName)
      const next = exists
        ? current.filter((x) => x !== specName)
        : [...current, specName]
      return {
        ...prev,
        especificidades: next.join(', '),
      }
    })
  }

  const openAdd = () => {
    setEditingId(null)
    setSearchFilter('')
    setFormError('')
    const fresh = createEmptyServicioREPS()
    setDraft(fresh)
    syncHorarioStateFromRecord(fresh.horarios)
    setFormOpen(true)
  }

  const openEdit = (srv: SedeServicioHabilitadoREPS) => {
    setEditingId(srv.id)
    setSearchFilter('')
    setFormError('')
    const copy = structuredClone(srv)
    setDraft(copy)
    syncHorarioStateFromRecord(copy.horarios)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    onChange(servicios.filter((s) => s.id !== id))
    if (detailViewItem?.id === id) setDetailViewItem(null)
  }

  const handleSaveService = () => {
    if (!draft.numero_distintivo.trim()) {
      setFormError('Debes ingresar el Número Distintivo del servicio.')
      return
    }
    const hasAnyMod = Object.values(draft.modalidades).some(Boolean)
    if (!hasAnyMod) {
      setFormError('Debes seleccionar al menos una Modalidad de prestación para el servicio.')
      return
    }
    setFormError('')

    const nextList = editingId
      ? servicios.map((s) => (s.id === editingId ? draft : s))
      : [...servicios, draft]

    nextList.sort(
      (a, b) =>
        (parseInt(a.codigo_servicio, 10) || 0) - (parseInt(b.codigo_servicio, 10) || 0) ||
        a.codigo_servicio.localeCompare(b.codigo_servicio, undefined, { numeric: true }),
    )

    onChange(nextList)
    setFormOpen(false)
    setEditingId(null)
  }

  const toggleMod = (key: keyof SedeServicioHabilitadoREPS['modalidades']) => {
    setDraft((prev) => ({
      ...prev,
      modalidades: {
        ...prev.modalidades,
        [key]: !prev.modalidades[key],
      },
    }))
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <strong style={{ fontSize: 13.5, color: '#172c4c' }}>
            Servicios de Salud Habilitados en la Sede ({servicios.length}) · Catálogo Oficial 157 Servicios REPS 3100
          </strong>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
            Incluye los 5 Grupos Oficiales, 157 Servicios REPS, Reglas de Complejidad, Especificidades Oficiales y Modalidades permitidas por norma.
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="button button-primary"
            onClick={openAdd}
          >
            <Plus size={14} /> Agregar Servicio de Salud
          </button>
        )}
      </div>

      {/* Formulario Desplegable para Crear o Actualizar Servicio de Salud (Idéntico al REPS con Reglas de Parámetros 3100) */}
      {formOpen && (
        <div
          style={{
            border: '1.5px solid #2563eb',
            borderRadius: 12,
            padding: 16,
            background: '#f8fafc',
            display: 'grid',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, color: '#172c4c', fontSize: 14 }}>
              {editingId ? `Actualizar Servicio · ${draft.codigo_servicio}-${draft.nombre_servicio}` : 'Registrar Servicio de Salud (Catálogo Oficial 157 Servicios Res. 3100/2019)'}
            </h4>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setFormOpen(false)
                setEditingId(null)
              }}
            >
              <X size={16} />
            </button>
          </div>

          {formError && (
            <div className="portal-error" role="alert">
              {formError}
            </div>
          )}

          <div className="plan-form-grid">
            <label className="form-field">
              <span>
                Grupo de Servicio (5 Grupos Oficiales Res. 3100) <b>*</b>
              </span>
              <select
                value={draft.grupo}
                onChange={(e) => {
                  const nextGrupo = e.target.value as GrupoServicio3100
                  const firstInGroup = TABLA_PARAMETROS_SERVICIOS_3100.find(
                    (s) => s.grupo === nextGrupo,
                  )
                  if (firstInGroup) {
                    applyServiceParamSelection(firstInGroup)
                  } else {
                    setDraft({ ...draft, grupo: nextGrupo })
                  }
                }}
              >
                {GRUPOS_SERVICIO_REPS.map((g) => {
                  const count = TABLA_PARAMETROS_SERVICIOS_3100.filter((s) => s.grupo === g).length
                  return (
                    <option key={g} value={g}>
                      {g} ({count} servicios)
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="form-field">
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span>
                  Buscar / Filtrar Servicio ({filteredCatalogServices.length} disponibles)
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllGroupsInSelect((v) => !v)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showAllGroupsInSelect ? 'Ver solo grupo actual' : 'Ver los 157 servicios'}
                </button>
              </span>
              <input
                value={searchFilter}
                onChange={(e) => {
                  const nextQ = e.target.value
                  setSearchFilter(nextQ)
                  const q = nextQ.trim().toLowerCase()
                  const matches = TABLA_PARAMETROS_SERVICIOS_3100.filter((s) => {
                    const matchesGroup = showAllGroupsInSelect || s.grupo === draft.grupo
                    if (!matchesGroup) return false
                    if (!q) return true
                    return (
                      s.codigo.toLowerCase().includes(q) ||
                      s.nombre.toLowerCase().includes(q) ||
                      s.grupo.toLowerCase().includes(q)
                    )
                  })
                  if (
                    matches.length > 0 &&
                    !matches.some((m) => m.codigo === draft.codigo_servicio)
                  ) {
                    applyServiceParamSelection(matches[0])
                  }
                }}
                placeholder="Buscar por código (ej. 328, 706, 1101) o nombre..."
              />
            </label>

            <label className="form-field">
              <span>
                Servicio Oficial REPS (Tabla Parámetros 3100) <b>*</b>
              </span>
              <select
                value={draft.codigo_servicio}
                onChange={(e) => {
                  const found = TABLA_PARAMETROS_SERVICIOS_3100.find(
                    (s) => s.codigo === e.target.value,
                  )
                  if (found) {
                    applyServiceParamSelection(found)
                  }
                }}
              >
                {filteredCatalogServices.map((s) => (
                  <option key={s.codigo} value={s.codigo}>
                    {s.codigo} - {s.nombre.toUpperCase()} ({s.grupo})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>
                Complejidad del Servicio (Baja / Mediana / Alta / Sin Complejidad) <b>*</b>
              </span>
              <select
                value={draft.complejidad}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    complejidad: e.target.value as ComplejidadServicio,
                  })
                }
              >
                {(
                  [
                    ['Baja', 'BAJA COMPLEJIDAD'],
                    ['Media', 'MEDIANA COMPLEJIDAD'],
                    ['Alta', 'ALTA COMPLEJIDAD'],
                    ['Sin complejidad', 'SIN COMPLEJIDAD'],
                  ] as const
                ).map(([compVal, compLabel]) => (
                  <option key={compVal} value={compVal}>
                    {compLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>
                Fecha Apertura del Servicio <b>*</b>
              </span>
              <input
                type="date"
                required
                value={draft.fecha_apertura}
                onChange={(e) => setDraft({ ...draft, fecha_apertura: e.target.value })}
              />
            </label>

            <label className="form-field">
              <span>
                Número Distintivo <b>*</b>
              </span>
              <input
                required
                value={draft.numero_distintivo}
                onChange={(e) =>
                  setDraft({ ...draft, numero_distintivo: e.target.value.toUpperCase() })
                }
              />
            </label>

            {/* Reglas de Especificidades Oficiales según tabla_parametros_servicios_310011.xlsx */}
            {selectedServiceParam && selectedServiceParam.especificidades_permitidas.length > 0 && (
              <div className="form-field plan-wide">
                <span>
                  Especificidades Oficiales Aplicables (Selección Múltiple Res. 3100)
                </span>
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: 10,
                    background: '#fff',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 6,
                    }}
                  >
                    {selectedServiceParam.especificidades_permitidas.map((spec) => {
                      const activeList = draft.especificidades
                        .split(',')
                        .map((x) => x.trim())
                        .filter(Boolean)
                      const checked = activeList.includes(spec)
                      return (
                        <label
                          key={spec}
                          className="case-check"
                          style={{
                            fontSize: 11.5,
                            background: checked ? '#eff6ff' : '#f8fafc',
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: checked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEspecificidad(spec)}
                          />
                          <span>{spec}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Información de Capacidad Instalada Asociada e Interdependencia según el Excel */}
            {selectedServiceParam && (
              <div
                className="plan-wide"
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 11.5,
                  color: '#1e3a8a',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <strong>Reglas Normativas ({selectedServiceParam.codigo} - {selectedServiceParam.nombre}):</strong>{' '}
                  Complejidades válidas:{' '}
                  <strong>{selectedServiceParam.complejidades_permitidas.join(', ')}</strong> ·{' '}
                  Permite Interdependencia:{' '}
                  <strong>{selectedServiceParam.interdependencia ? 'SÍ' : 'NO'}</strong>
                </span>
                {selectedServiceParam.capacidad_instalada_asociada.length > 0 && (
                  <span>
                    <strong>Ambientes / Capacidad Instalada Asociada:</strong>{' '}
                    {selectedServiceParam.capacidad_instalada_asociada
                      .map(
                        (ci) =>
                          `${ci.nombre_capacidad} (${ci.obligatoria ? 'Obligatoria' : 'Opcional'})`,
                      )
                      .join(' · ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Constructor de Horarios Variados 24 Horas (Permite distintos horarios por día o grupos de días) */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: 14,
              background: '#ffffff',
              display: 'grid',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 14,
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              {/* Hora de inicio */}
              <div style={{ display: 'grid', gap: 6 }}>
                <strong style={{ fontSize: 12.5, color: '#1e293b' }}>Hora de inicio</strong>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <select
                    value={horaInicioH}
                    onChange={(e) => setHoraInicioH(e.target.value)}
                    style={{
                      height: 36,
                      minWidth: 70,
                      padding: '0 8px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((hh) => (
                      <option key={hh} value={hh}>
                        {hh}
                      </option>
                    ))}
                  </select>
                  <strong style={{ fontSize: 15, color: '#334155' }}>:</strong>
                  <select
                    value={horaInicioM}
                    onChange={(e) => setHoraInicioM(e.target.value)}
                    style={{
                      height: 36,
                      minWidth: 70,
                      padding: '0 8px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((mm) => (
                      <option key={mm} value={mm}>
                        {mm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hora de fin */}
              <div style={{ display: 'grid', gap: 6 }}>
                <strong style={{ fontSize: 12.5, color: '#1e293b' }}>Hora de fin</strong>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <select
                    value={horaFinH}
                    onChange={(e) => setHoraFinH(e.target.value)}
                    style={{
                      height: 36,
                      minWidth: 70,
                      padding: '0 8px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((hh) => (
                      <option key={hh} value={hh}>
                        {hh}
                      </option>
                    ))}
                  </select>
                  <strong style={{ fontSize: 15, color: '#334155' }}>:</strong>
                  <select
                    value={horaFinM}
                    onChange={(e) => setHoraFinM(e.target.value)}
                    style={{
                      height: 36,
                      minWidth: 70,
                      padding: '0 8px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((mm) => (
                      <option key={mm} value={mm}>
                        {mm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Días a los que se asignará esta franja */}
              <div style={{ display: 'grid', gap: 6, flex: '1 1 250px' }}>
                <strong style={{ fontSize: 12, color: '#1e293b' }}>
                  Selecciona los días para este horario:
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(
                    [
                      ['lunes', 'Lun'],
                      ['martes', 'Mar'],
                      ['miercoles', 'Mié'],
                      ['jueves', 'Jue'],
                      ['viernes', 'Vie'],
                      ['sabado', 'Sáb'],
                      ['domingo', 'Dom'],
                    ] as const
                  ).map(([dKey, dShort]) => {
                    const active = diasActivosHorario[dKey]
                    return (
                      <button
                        key={dKey}
                        type="button"
                        onClick={() =>
                          setDiasActivosHorario((prev) => ({
                            ...prev,
                            [dKey]: !prev[dKey],
                          }))
                        }
                        style={{
                          height: 34,
                          padding: '0 10px',
                          borderRadius: 6,
                          border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          background: active ? '#eff6ff' : '#ffffff',
                          color: active ? '#1d4ed8' : '#64748b',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {dShort}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Botones para asignar este horario a los días marcados o sumar turno */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    const nuevoRango = `${horaInicioH}:${horaInicioM} a ${horaFinH}:${horaFinM}`
                    setDraft((prev) => {
                      const nextH = { ...prev.horarios }
                      ;(Object.keys(diasActivosHorario) as (keyof typeof nextH)[]).forEach((k) => {
                        if (diasActivosHorario[k]) {
                          nextH[k] = nuevoRango
                        }
                      })
                      return { ...prev, horarios: nextH }
                    })
                  }}
                >
                  <Plus size={14} /> Asignar a días marcados
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  title="Agrega una segunda jornada en el mismo día (ej. mañana y tarde)"
                  onClick={() => {
                    const nuevoRango = `${horaInicioH}:${horaInicioM} a ${horaFinH}:${horaFinM}`
                    setDraft((prev) => {
                      const nextH = { ...prev.horarios }
                      ;(Object.keys(diasActivosHorario) as (keyof typeof nextH)[]).forEach((k) => {
                        if (diasActivosHorario[k]) {
                          const actual = (nextH[k] || '').trim()
                          if (!actual) {
                            nextH[k] = nuevoRango
                          } else if (!actual.includes(nuevoRango)) {
                            nextH[k] = `${actual} / ${nuevoRango}`
                          }
                        }
                      })
                      return { ...prev, horarios: nextH }
                    })
                  }}
                >
                  + Sumar doble jornada
                </button>
              </div>
            </div>

            {/* Resumen interactivo de cómo queda cada día de la semana (Permite horarios distintos por día y cerrar días con ×) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 6,
              }}
            >
              {(
                [
                  ['lunes', 'Lunes'],
                  ['martes', 'Martes'],
                  ['miercoles', 'Miércoles'],
                  ['jueves', 'Jueves'],
                  ['viernes', 'Viernes'],
                  ['sabado', 'Sábado'],
                  ['domingo', 'Domingo'],
                ] as const
              ).map(([dKey, dLabel]) => {
                const valorDia = draft.horarios[dKey]
                const tieneHorario = Boolean(valorDia && valorDia.trim())
                return (
                  <div
                    key={dKey}
                    style={{
                      border: tieneHorario ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: tieneHorario ? '#eff6ff' : '#f8fafc',
                      padding: '7px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 11,
                          color: tieneHorario ? '#1e3a8a' : '#64748b',
                        }}
                      >
                        {dLabel}
                      </strong>
                      {tieneHorario && (
                        <button
                          type="button"
                          title={`Dejar ${dLabel} sin atención (Cerrado)`}
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              horarios: { ...prev.horarios, [dKey]: '' },
                            }))
                          }
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: tieneHorario ? 600 : 500,
                        color: tieneHorario ? '#0f172a' : '#94a3b8',
                        lineHeight: 1.3,
                      }}
                    >
                      {tieneHorario ? valorDia : 'Cerrado'}
                    </span>
                  </div>
                )
              })}
            </div>

            <small style={{ color: '#475569', fontSize: 11.5 }}>
              Puedes configurar horarios diferentes por día: marca por ejemplo <strong>Lun, Mar, Mié</strong> (08:00 a 12:00) y pulsa <strong>"Asignar a días marcados"</strong>; luego marca <strong>Vie, Sáb</strong> con otro horario y vuelve a pulsar <strong>"Asignar a días marcados"</strong>.
            </small>
          </div>

          {/* Modalidades Múltiples según Resolución 3100 de 2019 y Resolución 2654 de 2019 (Con validación automática del Excel) */}
          <div style={{ display: 'grid', gap: 10 }}>
            <strong style={{ fontSize: 12.5, color: '#172c4c' }}>
              Modalidades de Prestación Permitidas según Tabla de Parámetros Res. 3100 y Res. 2654 *
            </strong>

            {/* 1. Intramural */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: '#1e3a8a', color: '#fff', padding: '5px 12px', fontSize: 11.5, fontWeight: 700 }}>
                1. Modalidad Intramural
              </div>
              <div style={{ padding: 10 }}>
                {(() => {
                  const allowed = selectedServiceParam?.modalidades_permitidas.intramural ?? true
                  return (
                    <label
                      className="case-check"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: allowed ? 1 : 0.48,
                        cursor: allowed ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={!allowed}
                        checked={draft.modalidades.intramural}
                        onChange={() => allowed && toggleMod('intramural')}
                      />
                      <span>
                        Intramural: {draft.modalidades.intramural ? 'SÍ' : 'NO'}
                        {!allowed ? ' (NO APLICA POR NORMA)' : ''}
                      </span>
                    </label>
                  )
                })()}
              </div>
            </div>

            {/* 2. Extramural */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: '#1e3a8a', color: '#fff', padding: '5px 12px', fontSize: 11.5, fontWeight: 700 }}>
                2. Modalidad Extramural (Habilitada por Servicio: {selectedServiceParam?.modalidades_permitidas.extramural ? 'SÍ' : 'NO'})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 8,
                  padding: 10,
                }}
              >
                {(
                  [
                    ['extramural_unidad_movil', 'Extramural Unidad Móvil', selectedServiceParam?.modalidades_permitidas.extramural_unidad_movil ?? true],
                    ['extramural_domiciliario', 'Extramural Domiciliario', selectedServiceParam?.modalidades_permitidas.extramural_domiciliario ?? true],
                    ['extramural_jornada_salud', 'Extramural Jornada de Salud', selectedServiceParam?.modalidades_permitidas.extramural_jornada_salud ?? true],
                    ['extramural_transporte_aph', 'Transporte Asistencial y APH', selectedServiceParam?.grupo === 'Atención Inmediata'],
                  ] as const
                ).map(([mKey, mLabel, allowed]) => (
                  <label
                    key={mKey}
                    className="case-check"
                    style={{
                      fontSize: 11.5,
                      opacity: allowed ? 1 : 0.48,
                      cursor: allowed ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={!allowed}
                      checked={draft.modalidades[mKey]}
                      onChange={() => allowed && toggleMod(mKey)}
                    />
                    <span>
                      {mLabel}: <strong>{draft.modalidades[mKey] ? 'SÍ' : 'NO'}</strong>
                      {!allowed ? ' (No aplica)' : ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Telemedicina - Resolución 2654 de 2019 */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: '#1e3a8a', color: '#fff', padding: '5px 12px', fontSize: 11.5, fontWeight: 700 }}>
                3. Telemedicina — Resolución 2654 de 2019 (Habilitada por Servicio: {selectedServiceParam?.modalidades_permitidas.telemedicina ? 'SÍ' : 'NO'})
              </div>
              <div style={{ padding: 10, display: 'grid', gap: 10 }}>
                <div>
                  <small style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Telemedicina Prestador de Referencia:
                  </small>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {(
                      [
                        ['telemedicina_ref_interactiva', 'Telemedicina Interactiva', selectedServiceParam?.modalidades_permitidas.telemedicina_ref_interactiva ?? true],
                        ['telemedicina_ref_no_interactiva', 'Telemedicina No Interactiva', selectedServiceParam?.modalidades_permitidas.telemedicina_ref_no_interactiva ?? true],
                        ['telemedicina_ref_telexperticia', 'Telexperticia (Referencia)', selectedServiceParam?.modalidades_permitidas.telemedicina_ref_telexperticia ?? true],
                        ['telemedicina_ref_telemonitoreo', 'Telemonitoreo (Referencia)', selectedServiceParam?.modalidades_permitidas.telemedicina_ref_telemonitoreo ?? true],
                      ] as const
                    ).map(([mKey, mLabel, allowed]) => (
                      <label
                        key={mKey}
                        className="case-check"
                        style={{
                          fontSize: 11.5,
                          opacity: allowed ? 1 : 0.48,
                          cursor: allowed ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={!allowed}
                          checked={draft.modalidades[mKey]}
                          onChange={() => allowed && toggleMod(mKey)}
                        />
                        <span>
                          {mLabel}: <strong>{draft.modalidades[mKey] ? 'SÍ' : 'NO'}</strong>
                          {!allowed ? ' (No aplica)' : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                  <small style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Telemedicina Prestador Remisor:
                  </small>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {(
                      [
                        ['telemedicina_rem_telexperticia', 'Telexperticia (Remisor)', selectedServiceParam?.modalidades_permitidas.telemedicina_rem_telexperticia ?? true],
                        ['telemedicina_rem_telemonitoreo', 'Telemonitoreo (Remisor)', selectedServiceParam?.modalidades_permitidas.telemedicina_rem_telemonitoreo ?? true],
                      ] as const
                    ).map(([mKey, mLabel, allowed]) => (
                      <label
                        key={mKey}
                        className="case-check"
                        style={{
                          fontSize: 11.5,
                          opacity: allowed ? 1 : 0.48,
                          cursor: allowed ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={!allowed}
                          checked={draft.modalidades[mKey]}
                          onChange={() => allowed && toggleMod(mKey)}
                        />
                        <span>
                          {mLabel}: <strong>{draft.modalidades[mKey] ? 'SÍ' : 'NO'}</strong>
                          {!allowed ? ' (No aplica)' : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setFormOpen(false)
                setEditingId(null)
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={handleSaveService}
            >
              <CheckCircle2 size={14} />{' '}
              {editingId ? 'Guardar Cambios del Servicio' : 'Agregar Servicio a la Sede'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla Resumen Ordenada y Centrada de Servicios Habilitados en la Sede */}
      {servicios.length === 0 ? (
        <div
          style={{
            padding: '18px 16px',
            borderRadius: 10,
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            color: '#64748b',
            fontSize: 12.5,
            textAlign: 'center',
          }}
        >
          No se han registrado servicios de salud en esta sede. Usa el botón{' '}
          <strong>"Agregar Servicio de Salud"</strong> para inscribirlos.
        </div>
      ) : (
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th
                  style={{
                    width: readOnly ? '38%' : '26%',
                    padding: '11px 14px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Servicio y Grupo
                </th>
                <th
                  style={{
                    width: readOnly ? '30%' : '24%',
                    padding: '11px 10px',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Modalidades Habilitadas
                </th>
                <th
                  style={{
                    width: readOnly ? '18%' : '14%',
                    padding: '11px 8px',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Complejidad
                </th>
                <th
                  style={{
                    width: readOnly ? '14%' : '14%',
                    padding: '11px 8px',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Apertura
                </th>
                {!readOnly && (
                  <th
                    style={{
                      width: '22%',
                      padding: '11px 14px',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#334155',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {serviciosOrdenados.map((srv, idx) => {
                const mods = summarizeModalidadesREPS(srv.modalidades)
                const isDetailOpen = detailViewItem?.id === srv.id
                return (
                  <tr
                    key={srv.id}
                    style={{
                      borderTop: idx === 0 ? 'none' : '1px solid #e2e8f0',
                      background: isDetailOpen ? '#f0f7ff' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <button
                          type="button"
                          onClick={() => setDetailViewItem(isDetailOpen ? null : srv)}
                          title="Haz clic para ver u ocultar la descripción del servicio"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: 0,
                            border: 'none',
                            background: 'transparent',
                            color: isDetailOpen ? '#1d4ed8' : '#0f172a',
                            fontSize: 12.5,
                            fontWeight: 700,
                            textAlign: 'left',
                            cursor: 'pointer',
                            lineHeight: 1.3,
                          }}
                        >
                          <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                            {srv.codigo_servicio} — {srv.nombre_servicio}
                          </span>
                          {isDetailOpen ? (
                            <ChevronUp size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                          ) : (
                            <ChevronDown size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                          )}
                        </button>
                        <span
                          style={{
                            display: 'inline-flex',
                            width: 'fit-content',
                            padding: '2px 8px',
                            borderRadius: 5,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          {srv.grupo}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        {mods.map((m) => (
                          <span key={m} className="plan-badge plan-complete">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <span className="plan-badge plan-future" style={{ fontWeight: 700 }}>
                          {srv.complejidad.toUpperCase()}
                        </span>
                        {srv.especificidades && (
                          <small style={{ color: '#64748b', fontSize: 10.5 }}>
                            {srv.especificidades}
                          </small>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px 8px',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ color: '#334155', fontWeight: 600, fontSize: 12 }}>
                        {formatDateES(srv.fecha_apertura)}
                      </span>
                    </td>
                    {!readOnly && (
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            flexWrap: 'nowrap',
                            width: '100%',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openEdit(srv)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              height: 32,
                              minWidth: 76,
                              padding: '0 10px',
                              borderRadius: 6,
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxSizing: 'border-box',
                            }}
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(srv.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              height: 32,
                              minWidth: 82,
                              padding: '0 10px',
                              borderRadius: 6,
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxSizing: 'border-box',
                            }}
                          >
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Ampliada del Servicio seleccionado (Con Horario de Atención y Modalidades en grilla limpia) */}
      {detailViewItem && (
        <div
          style={{
            border: '1.5px solid #1e3a8a',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <div
            style={{
              background: '#1e3a8a',
              color: '#fff',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong style={{ fontSize: 12.5 }}>
              FICHA DEL SERVICIO · {detailViewItem.codigo_servicio} —{' '}
              {detailViewItem.nombre_servicio}
            </strong>
            <button
              type="button"
              className="icon-button"
              style={{ color: '#fff' }}
              onClick={() => setDetailViewItem(null)}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 16, display: 'grid', gap: 12, fontSize: 12 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 10,
                padding: 12,
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: 10.5 }}>
                  GRUPO DE SERVICIO
                </small>
                <strong style={{ color: '#0f172a' }}>{detailViewItem.grupo}</strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: 10.5 }}>
                  CÓDIGO Y NOMBRE DEL SERVICIO
                </small>
                <strong style={{ color: '#0f172a' }}>
                  {detailViewItem.codigo_servicio} — {detailViewItem.nombre_servicio}
                </strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: 10.5 }}>
                  NÚMERO DISTINTIVO
                </small>
                <strong style={{ color: '#1d4ed8' }}>
                  {detailViewItem.numero_distintivo || 'No registrado'}
                </strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: 10.5 }}>
                  COMPLEJIDAD Y FECHA DE APERTURA
                </small>
                <strong style={{ color: '#0f172a' }}>
                  {detailViewItem.complejidad.toUpperCase()} · {formatDateES(detailViewItem.fecha_apertura)}
                </strong>
              </div>
            </div>

            {/* Horario de Atención en la Ficha/Descripción del Servicio */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div
                style={{
                  background: '#f1f5f9',
                  borderBottom: '1px solid #cbd5e1',
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#1e3a8a',
                }}
              >
                HORARIO DE ATENCIÓN DEL SERVICIO (LUNES A DOMINGO)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  textAlign: 'center',
                }}
              >
                {(
                  [
                    ['Lunes', detailViewItem.horarios?.lunes],
                    ['Martes', detailViewItem.horarios?.martes],
                    ['Miércoles', detailViewItem.horarios?.miercoles],
                    ['Jueves', detailViewItem.horarios?.jueves],
                    ['Viernes', detailViewItem.horarios?.viernes],
                    ['Sábado', detailViewItem.horarios?.sabado],
                    ['Domingo', detailViewItem.horarios?.domingo],
                  ] as const
                ).map(([label, val], i) => (
                  <div
                    key={label}
                    style={{
                      borderRight: i < 6 ? '1px solid #e2e8f0' : 'none',
                    }}
                  >
                    <div
                      style={{
                        background: '#1e3a8a',
                        color: '#fff',
                        padding: '5px 4px',
                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ padding: '7px 4px', fontSize: 11, fontWeight: 600, color: '#334155' }}>
                      {val || 'Cerrado'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 tarjetas de Modalidades alineadas en grilla simétrica */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', color: '#1e3a8a', marginBottom: 4 }}>
                  1. Modalidad Intramural
                </strong>
                <span>Intramural: <strong>{detailViewItem.modalidades.intramural ? 'SÍ' : 'NO'}</strong></span>
              </div>
              <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', color: '#1e3a8a', marginBottom: 4 }}>
                  2. Modalidad Extramural
                </strong>
                <span>
                  Unidad Móvil (<strong>{detailViewItem.modalidades.extramural_unidad_movil ? 'SÍ' : 'NO'}</strong>) · Domiciliario (<strong>{detailViewItem.modalidades.extramural_domiciliario ? 'SÍ' : 'NO'}</strong>) · Jornada (<strong>{detailViewItem.modalidades.extramural_jornada_salud ? 'SÍ' : 'NO'}</strong>)
                </span>
              </div>
              <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', color: '#1e3a8a', marginBottom: 4 }}>
                  3. Telemedicina — Prestador de Referencia
                </strong>
                <span>
                  Interactiva (<strong>{detailViewItem.modalidades.telemedicina_ref_interactiva ? 'SÍ' : 'NO'}</strong>) · No Interactiva (<strong>{detailViewItem.modalidades.telemedicina_ref_no_interactiva ? 'SÍ' : 'NO'}</strong>) · Telexperticia (<strong>{detailViewItem.modalidades.telemedicina_ref_telexperticia ? 'SÍ' : 'NO'}</strong>) · Telemonitoreo (<strong>{detailViewItem.modalidades.telemedicina_ref_telemonitoreo ? 'SÍ' : 'NO'}</strong>)
                </span>
              </div>
              <div style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', color: '#1e3a8a', marginBottom: 4 }}>
                  4. Telemedicina — Prestador Remisor
                </strong>
                <span>
                  Telexperticia (<strong>{detailViewItem.modalidades.telemedicina_rem_telexperticia ? 'SÍ' : 'NO'}</strong>) · Telemonitoreo (<strong>{detailViewItem.modalidades.telemedicina_rem_telemonitoreo ? 'SÍ' : 'NO'}</strong>)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
