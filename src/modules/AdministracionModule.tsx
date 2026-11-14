import { useEffect, useState } from 'react'
import {
  BellRing,
  Box,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileDown,
  FilePlus2,
  Layers,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import type {
  AdminCatalogCriterion,
  AdminCriterionRecord,
  AdminEmailNotificationLog,
  AdminScheduledExecutionDate,
  AppUser,
  PeriodicidadCriterioAdmin,
  Sede,
  SedeAreaPhoto,
  SuhDatabase,
} from '../lib/types'
import {
  CATALOGO_CRITERIOS_ADMIN,
  CLASIFICACIONES_CRONOGRAMA_ADMIN,
  FRECUENCIAS_CRONOGRAMA_ADMIN,
} from '../lib/normativa-3100'
import {
  calculateExpirationByPeriodicidad,
  diffDays,
  evaluateAdminCriterion,
  evaluateSedeHabilitacionStatus,
  formatDateES,
  generateAnnualScheduleDates,
  todayISO,
} from '../lib/calculations'
import { pushToWorkPlan, updateDb } from '../lib/store'
import { generateAdminSedePdf, generateSedeFichaTecnicaPdf } from '../lib/pdf-reports'
import { CATALOGO_CAPACIDAD_INSTALADA_REPS_3100 } from '../lib/colombia-reps-map'
import SedeGeoModal from './SedeGeoModal'
import SedeServiciosREPSManager from './SedeServiciosREPSManager'

const GRUPOS_CAPACIDAD_REPS_3100 = [
  'Consultorios',
  'Salas',
  'Sillas',
  'Farmacia',
  'Telemedicina',
  'Camas',
  'Camillas',
  'Unidades Móviles y Ambulancias',
] as const

function buildInitialCapacidadCantidades(sede: Sede): Record<string, number> {
  if (sede.capacidad_instalada_cantidades) {
    return { ...sede.capacidad_instalada_cantidades }
  }
  return {
    'reps-cap-cons-ext': sede.consultorios_totales || 0,
    'reps-cap-cons-urg': 0,
    'reps-cap-sala-proc': sede.salas_procedimientos || 0,
    'reps-cap-sala-quir': 0,
    'reps-cap-sala-partos': 0,
    'reps-cap-silla-odon': 0,
    'reps-cap-silla-hemo': 0,
    'reps-cap-silla-quimio': 0,
    'reps-cap-silla-sm': 0,
    'reps-cap-cama-adulto': sede.camas_camillas || 0,
    'reps-cap-cama-ped': 0,
    'reps-cap-cama-obst': 0,
    'reps-cap-cama-uci': 0,
    'reps-cap-cama-ucin': 0,
    'reps-cap-camilla-obs': 0,
    'reps-cap-camilla-rec': 0,
    'reps-cap-camilla-otras': 0,
    'reps-cap-farm-ventanillas': 1,
    'reps-cap-tele-modulos': 1,
    'reps-cap-amb-tab': 0,
    'reps-cap-amb-tam': 0,
    'reps-cap-umovil': 0,
  }
}

function getAdminCatalog(db: SuhDatabase): AdminCatalogCriterion[] {
  const officialBase: AdminCatalogCriterion[] = CATALOGO_CRITERIOS_ADMIN.map((c) => ({
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
  // Conservar únicamente ítems adicionales que el usuario haya creado manualmente con el botón "+ Crear Nuevo Criterio" (id que inicia con 'adm-cat-custom-')
  const customItems = (db.admin_catalogo ?? []).filter((x) =>
    x.id.startsWith('adm-cat-custom-'),
  )
  return [...officialBase, ...customItems]
}

export default function AdministracionModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const today = todayISO()
  const [windowView, setWindowView] = useState<
    'tarjetas' | 'listado' | 'calendario15' | 'catalogo' | 'alertas_correo'
  >('tarjetas')
  const [selectedSedeIds, setSelectedSedeIds] = useState<string[]>([]) // vacío = todas
  const [activeMatrixSedeId, setActiveMatrixSedeId] = useState<string>(
    db.sedes.find((s) => !s.es_nacional)?.id || db.sedes[0]?.id || '',
  )
  const [collapsedClasifs, setCollapsedClasifs] = useState<Record<string, boolean>>({})
  const [calendarFilterLevel, setCalendarFilterLevel] = useState<
    'todos' | 'cumple' | 'no_cumple'
  >('todos')
  const [calendarMonth, setCalendarMonth] = useState(() => today.slice(0, 7))
  const [calendarYear, setCalendarYear] = useState(() => today.slice(0, 4))
  const [alertTabFilter, setAlertTabFilter] = useState<
    'todas' | 'vencidos' | 'mes_o_criticos' | 'preventivas'
  >('todas')

  // Modales
  const [showSedeGeoModal, setShowSedeGeoModal] = useState(false)
  const [selectedSedeFicha, setSelectedSedeFicha] = useState<Sede | null>(null)
  const [editingSedeFicha, setEditingSedeFicha] = useState(false)
  const [editSedeNombre, setEditSedeNombre] = useState('')
  const [editSedeReps, setEditSedeReps] = useState('')
  const [editSedeDep, setEditSedeDep] = useState('')
  const [editSedeMun, setEditSedeMun] = useState('')
  const [editSedeDir, setEditSedeDir] = useState('')
  const [editSedeTel, setEditSedeTel] = useState('')
  const [editSedeArea, setEditSedeArea] = useState('')
  const [editSedeDirector, setEditSedeDirector] = useState('')
  const [editSedeInscripcion, setEditSedeInscripcion] = useState('')
  const [editSedeVencHab, setEditSedeVencHab] = useState('')
  const [editSedeCapacidad, setEditSedeCapacidad] = useState('')
  const [editSedePisos, setEditSedePisos] = useState('1')
  const [editSedeTenencia, setEditSedeTenencia] = useState<'Propio' | 'Arrendado' | 'Comodato'>('Arrendado')
  const [editSedePmr, setEditSedePmr] = useState(true)
  const [editSedePlanta, setEditSedePlanta] = useState<'SÍ' | 'NO'>('SÍ')
  const [editSedeTanque, setEditSedeTanque] = useState<'SÍ' | 'NO'>('SÍ')
  const [editSedeGases, setEditSedeGases] = useState<'Centralizada' | 'Cilindros portátiles' | 'No aplica'>('Cilindros portátiles')
  const [editCapacidadCantidades, setEditCapacidadCantidades] = useState<Record<string, number>>({})

  // Estado para Agregar / Actualizar Área con Fotografías (Política PESV: Mínimo 1, Máximo 4 fotos por área)
  const [showAddAreaForm, setShowAddAreaForm] = useState(false)
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)
  const [areaNombre, setAreaNombre] = useState('')
  const [areaDescripcion, setAreaDescripcion] = useState('')
  const [areaMetros, setAreaMetros] = useState('45')
  const [areaPisoNivel, setAreaPisoNivel] = useState('Piso 1')
  const [areaVentilacion, setAreaVentilacion] = useState('Aire acondicionado')
  const [editingLinks3dPlanos, setEditingLinks3dPlanos] = useState(false)
  const [draftUrlPlanos, setDraftUrlPlanos] = useState('')
  const [draftUrlModelo3d, setDraftUrlModelo3d] = useState('')
  const [areaPhotoSlots, setAreaPhotoSlots] = useState<(SedeAreaPhoto | null)[]>([
    null,
    null,
    null,
    null,
  ])
  const [areaFormError, setAreaFormError] = useState('')
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; title: string } | null>(null)

  const handleUploadAreaSlotPhoto = (slotIndex: number, file: File | null, customLabel: string) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setAreaFormError('Política PESV: Cada fotografía debe pesar máximo 10 MB.')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (file.type && !allowed.includes(file.type)) {
      setAreaFormError('Formato no permitido. Sube una imagen JPG, PNG o WEBP.')
      return
    }
    setAreaFormError('')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAreaPhotoSlots((prev) =>
          prev.map((item, idx) =>
            idx === slotIndex
              ? {
                  id: `foto-area-${Date.now()}-${slotIndex}`,
                  titulo: customLabel || file.name,
                  dataUrl: reader.result as string,
                  subido_en: today,
                }
              : item,
          ),
        )
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveNewAreaSede = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSedeFicha) return
    const validPhotos = areaPhotoSlots.filter((p): p is SedeAreaPhoto => p !== null)
    if (!areaNombre.trim() || !areaDescripcion.trim()) {
      setAreaFormError('Ingresa el nombre y la descripción del área.')
      return
    }
    if (validPhotos.length < 1 || validPhotos.length > 4) {
      setAreaFormError(
        'Política fotográfica: Debes adjuntar mínimo 1 fotografía y máximo 4 fotografías por área.',
      )
      return
    }

    updateDb((draft) => {
      const target = draft.sedes.find((s) => s.id === selectedSedeFicha.id)
      if (!target) return draft
      if (!target.areas_sede) target.areas_sede = []

      if (editingAreaId) {
        target.areas_sede = target.areas_sede.map((a) =>
          a.id === editingAreaId
            ? {
                ...a,
                nombre: areaNombre.trim(),
                descripcion: areaDescripcion.trim(),
                metros_cuadrados: Number(areaMetros) || 20,
                piso_nivel: areaPisoNivel,
                tipo_ventilacion: areaVentilacion,
                fotos: validPhotos,
              }
            : a,
        )
      } else {
        target.areas_sede.push({
          id: `area-${Date.now()}`,
          nombre: areaNombre.trim(),
          descripcion: areaDescripcion.trim(),
          metros_cuadrados: Number(areaMetros) || 20,
          piso_nivel: areaPisoNivel,
          tipo_ventilacion: areaVentilacion,
          fotos: validPhotos,
        })
      }
      setSelectedSedeFicha({ ...target })
      return draft
    }, editingAreaId ? `Área "${areaNombre.trim()}" y su registro fotográfico actualizados.` : `Área "${areaNombre.trim()}" agregada a la Ficha Técnica con ${validPhotos.length} fotografía(s).`)

    setEditingAreaId(null)
    setAreaNombre('')
    setAreaDescripcion('')
    setAreaMetros('45')
    setAreaPisoNivel('Piso 1')
    setAreaVentilacion('Aire acondicionado')
    setAreaPhotoSlots([null, null, null, null])
    setAreaFormError('')
    setShowAddAreaForm(false)
  }

  const handleOpenEditArea = (area: NonNullable<Sede['areas_sede']>[number]) => {
    setEditingAreaId(area.id)
    setAreaNombre(area.nombre)
    setAreaDescripcion(area.descripcion)
    setAreaMetros(String(area.metros_cuadrados))
    setAreaPisoNivel(area.piso_nivel || 'Piso 1')
    setAreaVentilacion(area.tipo_ventilacion || 'Aire acondicionado')
    const slots: (SedeAreaPhoto | null)[] = [
      area.fotos[0] ?? null,
      area.fotos[1] ?? null,
      area.fotos[2] ?? null,
      area.fotos[3] ?? null,
    ]
    setAreaPhotoSlots(slots)
    setAreaFormError('')
    setShowAddAreaForm(true)
  }

  const handleDeleteArea = (areaId: string) => {
    if (!selectedSedeFicha) return
    updateDb((draft) => {
      const target = draft.sedes.find((s) => s.id === selectedSedeFicha.id)
      if (!target || !target.areas_sede) return draft
      target.areas_sede = target.areas_sede.filter((a) => a.id !== areaId)
      setSelectedSedeFicha({ ...target })
      return draft
    }, 'Área y registro fotográfico eliminados de la Ficha Técnica.')
  }

  const [activeCriterion, setActiveCriterion] = useState<AdminCriterionRecord | null>(null)
  const [modalMode, setModalMode] = useState<
    'ficha' | 'actualizar' | 'soporte' | 'agregar' | 'crear_catalogo' | 'programar_anual' | null
  >(null)

  // Estado para el Programador Anual de Ejecución de un Criterio (Frecuencia + Fechas múltiples del año + Control de Versiones v1, v2...)
  const [progPeriodicidad, setProgPeriodicidad] = useState<PeriodicidadCriterioAdmin>('Trimestral')
  const [progFechaInicial, setProgFechaInicial] = useState(today)
  const [progFechasAnuales, setProgFechasAnuales] = useState<AdminScheduledExecutionDate[]>([])
  const [progResponsable, setProgResponsable] = useState(currentUser.nombre_completo)
  const [progResponsableCorreo, setProgResponsableCorreo] = useState(currentUser.correo)
  const [progJustificacion, setProgJustificacion] = useState('')
  const [progError, setProgError] = useState('')

  const openProgramarModal = (record: AdminCriterionRecord) => {
    setActiveCriterion(record)
    const per =
      (record.periodicidad as PeriodicidadCriterioAdmin) || 'Trimestral'
    setProgPeriodicidad(per)
    const initD =
      record.fecha_programada_inicial || record.fecha_vencimiento || today
    setProgFechaInicial(initD)
    setProgResponsable(record.responsable)
    setProgResponsableCorreo(record.responsable_correo || currentUser.correo)
    setProgFechasAnuales(
      record.fechas_programadas_anual &&
        record.fechas_programadas_anual.length > 0
        ? structuredClone(record.fechas_programadas_anual)
        : generateAnnualScheduleDates(initD, per),
    )
    setProgJustificacion('')
    setProgError('')
    setModalMode('programar_anual')
  }

  const catalogoActual = getAdminCatalog(db)

  // Form Agregar / Asignar Criterio a Sede(s) con correo obligatorio para alertas
  const [catId, setCatId] = useState(catalogoActual[0]?.id || 'adm-cat-01')
  const [newSedeId, setNewSedeId] = useState('TODAS_LAS_SEDES')
  const [newPeriodicidad, setNewPeriodicidad] =
    useState<PeriodicidadCriterioAdmin>('Mensual')
  const [newFechaProg, setNewFechaProg] = useState(today)
  const [newFechaVenc, setNewFechaVenc] = useState(() =>
    calculateExpirationByPeriodicidad(today, 'Mensual'),
  )
  const [newResp, setNewResp] = useState(currentUser.nombre_completo)
  const [newRespCorreo, setNewRespCorreo] = useState(currentUser.correo)
  const [newObs, setNewObs] = useState('')

  // Form Crear Nuevo Criterio en el Catálogo Maestro (ej. Cámara de Comercio mensual)
  const [catNewCodigo, setCatNewCodigo] = useState('')
  const [catNewCategoria, setCatNewCategoria] = useState<
    AdminCatalogCriterion['categoria']
  >('Administrativo')
  const [catNewTitulo, setCatNewTitulo] = useState('')
  const [catNewDesc, setCatNewDesc] = useState('')
  const [catNewPeriodicidad, setCatNewPeriodicidad] =
    useState<PeriodicidadCriterioAdmin>('Mensual')
  const [catNewAlcance, setCatNewAlcance] = useState<'todas_sedes' | 'nacional'>('todas_sedes')
  const [catNewResp, setCatNewResp] = useState(currentUser.nombre_completo)
  const [catNewRespCorreo, setCatNewRespCorreo] = useState(currentUser.correo)

  // Form Actualizar Criterio (con justificación)
  const [updFechaVenc, setUpdFechaVenc] = useState('')
  const [updResp, setUpdResp] = useState('')
  const [updRespCorreo, setUpdRespCorreo] = useState('')
  const [updObs, setUpdObs] = useState('')
  const [updJustificacion, setUpdJustificacion] = useState('')

  // Form Ejecutar Criterio / Agregar Soporte (Descripción, Fecha de vencimiento, Soporte)
  const [sopTitulo, setSopTitulo] = useState('')
  const [sopDesc, setSopDesc] = useState('')
  const [sopEmision, setSopEmision] = useState(today)
  const [sopVencimiento, setSopVencimiento] = useState('')
  const [sopResp, setSopResp] = useState(currentUser.nombre_completo)
  const [sopRespCorreo, setSopRespCorreo] = useState(currentUser.correo)
  const [sopArchivo, setSopArchivo] = useState('')

  const sedeNacional = db.sedes.find((s) => s.es_nacional)

  // Ordenar sedes: Primero NACIONAL, luego alfabético
  const sedesOrdenadas = [...db.sedes].sort((a, b) => {
    if (a.es_nacional && !b.es_nacional) return -1
    if (!a.es_nacional && b.es_nacional) return 1
    return a.nombre.localeCompare(b.nombre, 'es')
  })

  const toggleSedeFilter = (id: string) => {
    setActiveMatrixSedeId(id)
    setSelectedSedeIds((prev) =>
      prev.length === 1 && prev[0] === id ? [] : [id],
    )
  }

  const q = query.trim().toLowerCase()
  const filteredCriteria = db.admin_criterios
    .filter((c) => selectedSedeIds.length === 0 || selectedSedeIds.includes(c.sede_id))
    .filter(
      (c) =>
        !q ||
        `${c.codigo} ${c.titulo} ${c.categoria} ${c.responsable} ${c.responsable_correo ?? ''} ${c.observaciones}`
          .toLowerCase()
          .includes(q),
    )

  const evaluatedAll = filteredCriteria.map((c) => ({
    record: c,
    eval: evaluateAdminCriterion(c, today),
  }))

  // KPIs Globales
  const totalCount = evaluatedAll.length
  const cumpleCount = evaluatedAll.filter((x) => x.eval.cumple).length
  const noCumpleCount = totalCount - cumpleCount
  const criticoCount = evaluatedAll.filter((x) => x.eval.semaforo.level === 'critico').length
  const prioridadCount = evaluatedAll.filter((x) => x.eval.semaforo.level === 'prioridad').length
  const alertasDiariasCount = evaluatedAll.filter((x) =>
    x.eval.alertaCorreo.frecuencia.startsWith('DIARIA'),
  ).length
  const pctCumplimiento = totalCount > 0 ? Math.round((cumpleCount / totalCount) * 1000) / 10 : 0

  // Sincronizar / Garantizar que NACIONAL y cada Sede Operativa tengan ÚNICAMENTE los 35 criterios oficiales de la lista (más los nuevos que cree manualmente el usuario)
  const handleSyncTotalCriteriosPorSede = () => {
    updateDb((draft) => {
      const officialCatalog = getAdminCatalog(draft)
      draft.admin_catalogo = officialCatalog

      const operativas = draft.sedes.filter((s) => !s.es_nacional)
      const cleanedCriteria: AdminCriterionRecord[] = []
      let seq = 0

      for (const cat of officialCatalog) {
        if (!cat.aplica_todas_sedes) {
          // Criterio exclusivamente NACIONAL
          const prevNac = draft.admin_criterios.find(
            (r) =>
              r.sede_id === 'sede-nacional' &&
              (r.criterio_catalogo_id === cat.id ||
                r.titulo.trim().toLowerCase() === cat.titulo.trim().toLowerCase()),
          )
          const fechasAnio =
            prevNac?.fechas_programadas_anual &&
            prevNac.fechas_programadas_anual.length > 0
              ? prevNac.fechas_programadas_anual
              : generateAnnualScheduleDates(
                  prevNac?.fecha_programada_inicial || today,
                  prevNac?.periodicidad || cat.periodicidad,
                )
          const venc =
            prevNac?.fecha_vencimiento ||
            fechasAnio[0]?.fecha_programada ||
            calculateExpirationByPeriodicidad(today, cat.periodicidad)

          cleanedCriteria.push({
            id: prevNac?.id || `adm-rec-nac-${cat.codigo}-${Date.now()}-${++seq}`,
            criterio_catalogo_id: cat.id,
            codigo: cat.codigo,
            categoria: cat.categoria,
            titulo: cat.titulo,
            descripcion_normativa: cat.descripcion_normativa,
            periodicidad: prevNac?.periodicidad || cat.periodicidad,
            programacion_anual: prevNac?.programacion_anual || cat.programacion_anual,
            fechas_programadas_anual: fechasAnio,
            sede_id: 'sede-nacional',
            fecha_programada_inicial: prevNac?.fecha_programada_inicial || today,
            fecha_vencimiento: venc,
            responsable: prevNac?.responsable || currentUser.nombre_completo,
            responsable_correo: prevNac?.responsable_correo || currentUser.correo,
            observaciones:
              prevNac?.observaciones ||
              `Criterio NACIONAL (${cat.periodicidad}) asignado según lista oficial.`,
            soportes: prevNac?.soportes ?? [],
            historial: prevNac?.historial ?? [],
            plan_trabajo_id: prevNac?.plan_trabajo_id,
          })
        } else {
          // Criterio exclusivamente por CADA SEDE OPERATIVA
          for (const sede of operativas) {
            const prevSede = draft.admin_criterios.find(
              (r) =>
                r.sede_id === sede.id &&
                (r.criterio_catalogo_id === cat.id ||
                  r.titulo.trim().toLowerCase() === cat.titulo.trim().toLowerCase()),
            )
            const fechasAnio =
              prevSede?.fechas_programadas_anual &&
              prevSede.fechas_programadas_anual.length > 0
                ? prevSede.fechas_programadas_anual
                : generateAnnualScheduleDates(
                    prevSede?.fecha_programada_inicial || today,
                    prevSede?.periodicidad || cat.periodicidad,
                  )
            const venc =
              prevSede?.fecha_vencimiento ||
              fechasAnio[0]?.fecha_programada ||
              calculateExpirationByPeriodicidad(today, cat.periodicidad)

            cleanedCriteria.push({
              id: prevSede?.id || `adm-rec-${sede.id}-${cat.codigo}-${Date.now()}-${++seq}`,
              criterio_catalogo_id: cat.id,
              codigo: cat.codigo,
              categoria: cat.categoria,
              titulo: cat.titulo,
              descripcion_normativa: cat.descripcion_normativa,
              periodicidad: prevSede?.periodicidad || cat.periodicidad,
              programacion_anual: prevSede?.programacion_anual || cat.programacion_anual,
              fechas_programadas_anual: fechasAnio,
              sede_id: sede.id,
              fecha_programada_inicial: prevSede?.fecha_programada_inicial || today,
              fecha_vencimiento: venc,
              responsable:
                prevSede?.responsable ||
                sede.director_responsable ||
                currentUser.nombre_completo,
              responsable_correo: prevSede?.responsable_correo || currentUser.correo,
              observaciones:
                prevSede?.observaciones ||
                `Criterio de SEDE (${cat.periodicidad}) asignado a ${sede.nombre}.`,
              soportes: prevSede?.soportes ?? [],
              historial: prevSede?.historial ?? [],
              plan_trabajo_id: prevSede?.plan_trabajo_id,
            })
          }
        }
      }

      draft.admin_criterios = cleanedCriteria
      return draft
    }, 'Criterios depurados y unificados: ahora existen únicamente los criterios del listado oficial.')
  }

  useEffect(() => {
    const officialCatalog = getAdminCatalog(db)
    const operativas = db.sedes.filter((s) => !s.es_nacional)
    const expectedTotal =
      officialCatalog.filter((c) => !c.aplica_todas_sedes).length +
      officialCatalog.filter((c) => c.aplica_todas_sedes).length * operativas.length

    const hasOldDuplicatesOrMismatch =
      db.admin_criterios.length !== expectedTotal ||
      db.admin_criterios.some(
        (r) =>
          r.codigo.startsWith('CTA-') ||
          !officialCatalog.some(
            (cat) =>
              cat.id === r.criterio_catalogo_id &&
              cat.titulo === r.titulo &&
              cat.codigo === r.codigo,
          ),
      )

    if (hasOldDuplicatesOrMismatch) {
      handleSyncTotalCriteriosPorSede()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.sedes.length, db.admin_criterios.length])

  // Crear un nuevo criterio en el Catálogo Maestro y asignarlo a las sedes
  const handleCreateCatalogCriterion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!catNewTitulo.trim() || !catNewCodigo.trim() || !catNewRespCorreo.trim()) return

    const diasMap: Record<PeriodicidadCriterioAdmin, number> = {
      Mensual: 30,
      Bimestral: 60,
      Trimestral: 90,
      Cuatrimestral: 120,
      Semestral: 180,
      Anual: 365,
      'Cada 2 años': 730,
      'Segun vigencia': 365,
      'Segun necesidad': 30,
      'Unica vez': 1825,
      'Única vez / Permanente': 1825,
    }

    updateDb((draft) => {
      if (!draft.admin_catalogo || draft.admin_catalogo.length === 0) {
        draft.admin_catalogo = getAdminCatalog(draft)
      }
      if (!draft.admin_notificaciones) {
        draft.admin_notificaciones = []
      }

      const newCat: AdminCatalogCriterion = {
        id: `adm-cat-custom-${Date.now()}`,
        codigo: catNewCodigo.trim().toUpperCase(),
        categoria: catNewCategoria,
        titulo: catNewTitulo.trim(),
        descripcion_normativa:
          catNewDesc.trim() ||
          `Criterio ${catNewTitulo.trim()} con actualización ${catNewPeriodicidad}.`,
        periodicidad: catNewPeriodicidad,
        dias_vigencia_default: diasMap[catNewPeriodicidad] || 30,
        aplica_todas_sedes: catNewAlcance === 'todas_sedes',
      }
      draft.admin_catalogo.push(newCat)

      const targetSedes =
        catNewAlcance === 'nacional'
          ? draft.sedes.filter((s) => s.es_nacional)
          : draft.sedes.filter((s) => !s.es_nacional)

      const fechaVenc = calculateExpirationByPeriodicidad(today, catNewPeriodicidad)

      for (const s of targetSedes) {
        const recId = `adm-rec-${s.id}-${newCat.codigo}-${Date.now().toString().slice(-3)}`
        const ptId = pushToWorkPlan(draft, {
          titulo: `[Admin ${newCat.codigo} - ${s.nombre}] ${newCat.titulo}`,
          descripcion: `Criterio ${newCat.periodicidad}: ${newCat.descripcion_normativa}`,
          sede_id: s.id,
          modulo_origen: 'Administración',
          referencia_origen_id: recId,
          responsable: catNewResp.trim(),
          responsable_correo: catNewRespCorreo.trim(),
          fecha_limite: fechaVenc,
          usuario_creador: currentUser.nombre_completo,
        })

        draft.admin_criterios.push({
          id: recId,
          criterio_catalogo_id: newCat.id,
          codigo: newCat.codigo,
          categoria: newCat.categoria,
          titulo: newCat.titulo,
          descripcion_normativa: newCat.descripcion_normativa,
          periodicidad: newCat.periodicidad,
          sede_id: s.id,
          fecha_programada_inicial: today,
          fecha_vencimiento: fechaVenc,
          responsable: catNewResp.trim(),
          responsable_correo: catNewRespCorreo.trim(),
          observaciones: `Criterio (${newCat.periodicidad}) asignado con alerta de correo a ${catNewRespCorreo.trim()}.`,
          ultima_notificacion_fecha: today,
          notificaciones_enviadas_count: 1,
          soportes: [],
          historial: [
            {
              id: `h-${Date.now()}`,
              fecha: today,
              usuario: currentUser.nombre_completo,
              accion: `Creación de criterio (${newCat.periodicidad}) y notificación al correo ${catNewRespCorreo.trim()}`,
              justificacion: 'Criterio creado en catálogo y desplegado a las sedes.',
            },
          ],
          plan_trabajo_id: ptId,
        })

        draft.admin_notificaciones.unshift({
          id: `not-${Date.now()}-${s.id}`,
          fecha_hora: `${today} 08:30`,
          criterio_id: recId,
          criterio_codigo: newCat.codigo,
          criterio_titulo: newCat.titulo,
          sede_nombre: s.nombre,
          destinatario_nombre: catNewResp.trim(),
          destinatario_correo: catNewRespCorreo.trim(),
          tipo_alerta: 'Creación / Asignación de Criterio',
          asunto: `[NUEVO CRITERIO ${newCat.codigo}] ${newCat.titulo} (${newCat.periodicidad}) — ${s.nombre}`,
          mensaje: `Se te ha asignado como responsable del criterio "${newCat.titulo}" en ${s.nombre}. Fecha límite de ejecución: ${formatDateES(fechaVenc)}. El semáforo enviará alertas preventivas y avisos diarios si se vence sin soporte.`,
          estado_criterio_momento: 'Pendiente de ejecución',
        })
      }

      return draft
    }, `Criterio "${catNewTitulo.trim()}" (${catNewPeriodicidad}) creado, asignado a las sedes y notificado a ${catNewRespCorreo.trim()}.`)

    setModalMode(null)
  }

  // Asignar criterio existente desde catálogo a una o a todas las sedes
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault()
    const plantilla =
      catalogoActual.find((x) => x.id === catId) || catalogoActual[0]

    updateDb((draft) => {
      if (!draft.admin_notificaciones) draft.admin_notificaciones = []

      const sedesDestino =
        newSedeId === 'TODAS_LAS_SEDES'
          ? draft.sedes.filter((s) => !s.es_nacional)
          : draft.sedes.filter((s) => s.id === newSedeId)

      for (const s of sedesDestino) {
        const id = `adm-rec-${s.id}-${Date.now()}`
        const ptId = pushToWorkPlan(draft, {
          titulo: `[Admin ${plantilla.codigo}] ${plantilla.titulo}`,
          descripcion: `Criterio administrativo/financiero (${newPeriodicidad}). ${newObs}`,
          sede_id: s.id,
          modulo_origen: 'Administración',
          referencia_origen_id: id,
          responsable: newResp.trim(),
          responsable_correo: newRespCorreo.trim(),
          fecha_limite: newFechaVenc || newFechaProg,
          usuario_creador: currentUser.nombre_completo,
        })

        draft.admin_criterios.push({
          id,
          criterio_catalogo_id: plantilla.id,
          codigo: plantilla.codigo,
          categoria: plantilla.categoria,
          titulo: plantilla.titulo,
          descripcion_normativa: plantilla.descripcion_normativa,
          periodicidad: newPeriodicidad,
          sede_id: s.id,
          fecha_programada_inicial: newFechaProg,
          fecha_vencimiento: newFechaVenc || newFechaProg,
          responsable: newResp.trim(),
          responsable_correo: newRespCorreo.trim(),
          observaciones: newObs,
          ultima_notificacion_fecha: today,
          notificaciones_enviadas_count: 1,
          soportes: [],
          historial: [
            {
              id: `h-${Date.now()}`,
              fecha: today,
              usuario: currentUser.nombre_completo,
              accion: `Programación inicial (${newPeriodicidad}) y alerta configurada a ${newRespCorreo.trim()}`,
              justificacion: 'Incorporación desde catálogo de criterios Res. 3100.',
            },
          ],
          plan_trabajo_id: ptId,
        })

        draft.admin_notificaciones.unshift({
          id: `not-${Date.now()}-${s.id}`,
          fecha_hora: `${today} 09:00`,
          criterio_id: id,
          criterio_codigo: plantilla.codigo,
          criterio_titulo: plantilla.titulo,
          sede_nombre: s.nombre,
          destinatario_nombre: newResp.trim(),
          destinatario_correo: newRespCorreo.trim(),
          tipo_alerta: 'Creación / Asignación de Criterio',
          asunto: `[ASIGNACIÓN ${plantilla.codigo}] ${plantilla.titulo} — ${s.nombre}`,
          mensaje: `Has sido asignado como responsable del criterio ${plantilla.codigo} (${newPeriodicidad}) con vencimiento ${formatDateES(newFechaVenc)}.`,
          estado_criterio_momento: 'Pendiente de ejecución',
        })
      }

      return draft
    }, `Criterio asignado y notificación de correo enviada a ${newRespCorreo.trim()}.`)
    setModalMode(null)
  }

  // Actualizar criterio con justificación e historial + snapshot de versión del criterio
  const handleUpdateCriterion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCriterion || !updJustificacion.trim()) return

    updateDb((draft) => {
      const target = draft.admin_criterios.find((x) => x.id === activeCriterion.id)
      if (!target) return draft

      const nextCritVer = (target.version_criterio || 1) + 1
      const prevDetail = `Versión anterior v${target.version_criterio || 1}: Vencimiento ${formatDateES(target.fecha_vencimiento)} | Frecuencia: ${target.periodicidad || 'Anual'} | Resp: ${target.responsable} (${target.responsable_correo || 'sin correo'})`

      if (!target.versiones_criterio) target.versiones_criterio = []
      target.versiones_criterio.unshift({
        id: `snap-crit-${Date.now()}`,
        version: nextCritVer,
        fecha_registro: `${today} ${new Date().toTimeString().slice(0, 5)}`,
        usuario: currentUser.nombre_completo,
        tipo_cambio: 'Ajuste de criterio',
        periodicidad: target.periodicidad || 'Anual',
        fecha_vencimiento: updFechaVenc,
        responsable: updResp.trim(),
        responsable_correo: updRespCorreo.trim(),
        observaciones: updObs,
        resumen_programacion: target.programacion_anual || formatDateES(updFechaVenc),
        justificacion: updJustificacion.trim(),
        valores_anteriores: prevDetail,
      })
      target.version_criterio = nextCritVer

      target.fecha_vencimiento = updFechaVenc
      target.responsable = updResp.trim()
      target.responsable_correo = updRespCorreo.trim()
      target.observaciones = updObs
      target.historial.unshift({
        id: `h-${Date.now()}`,
        fecha: today,
        usuario: currentUser.nombre_completo,
        accion: `Ajuste de criterio registrado — Versión v${nextCritVer}`,
        justificacion: updJustificacion.trim(),
        detalle_anterior: prevDetail,
      })

      pushToWorkPlan(draft, {
        titulo: `[Admin ${target.codigo} v${nextCritVer}] ${target.titulo}`,
        descripcion: `Actualizado (v${nextCritVer}): ${updObs}`,
        sede_id: target.sede_id,
        modulo_origen: 'Administración',
        referencia_origen_id: target.id,
        responsable: updResp.trim(),
        responsable_correo: updRespCorreo.trim(),
        fecha_limite: updFechaVenc,
        usuario_creador: currentUser.nombre_completo,
      })

      return draft
    }, 'Criterio ajustado: nueva versión guardada en el control de auditoría con su justificación.')
    setModalMode(null)
  }

  // Ejecutar Criterio (Descripción, Fecha de vencimiento, Soporte) + Versión de Soporte y Snapshot del Criterio
  const handleExecuteCriterionSupport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCriterion || !sopTitulo.trim() || !sopVencimiento) return

    updateDb((draft) => {
      const target = draft.admin_criterios.find((x) => x.id === activeCriterion.id)
      if (!target) return draft

      const prevSupport =
        target.soportes.length > 0 ? target.soportes[target.soportes.length - 1] : null
      const prevValuesSummary = prevSupport
        ? `Soporte anterior v${prevSupport.version} (${prevSupport.titulo} · Vencía: ${formatDateES(prevSupport.fecha_vencimiento)})`
        : `Sin soporte previo (Vencimiento anterior: ${formatDateES(target.fecha_vencimiento)})`

      const nextVer = target.soportes.length + 1
      target.soportes.push({
        id: `sop-${Date.now()}`,
        version: nextVer,
        titulo: sopTitulo.trim(),
        descripcion: sopDesc.trim(),
        fecha_emision: sopEmision,
        fecha_vencimiento: sopVencimiento,
        responsable: sopResp.trim(),
        responsable_correo: sopRespCorreo.trim(),
        archivo_nombre: sopArchivo.trim() || `Soporte_${target.codigo}_v${nextVer}.pdf`,
        creado_en: today,
      })

      // Si el criterio cuenta con programación anual de múltiples fechas, marca como ejecutada la primera fecha pendiente y avanza el compromiso a la siguiente
      if (target.fechas_programadas_anual && target.fechas_programadas_anual.length > 0) {
        const nextPendingIdx = target.fechas_programadas_anual.findIndex(
          (f) => f.estado === 'pendiente',
        )
        if (nextPendingIdx >= 0) {
          target.fechas_programadas_anual[nextPendingIdx].estado = 'ejecutada'
          target.fechas_programadas_anual[nextPendingIdx].fecha_ejecutada = sopEmision
          target.fechas_programadas_anual[nextPendingIdx].soporte_version = nextVer
        }
        const followingPending = target.fechas_programadas_anual.find(
          (f) => f.estado === 'pendiente',
        )
        if (followingPending) {
          target.fecha_vencimiento = followingPending.fecha_programada
        } else {
          target.fecha_vencimiento = sopVencimiento
        }
      } else {
        target.fecha_vencimiento = sopVencimiento
      }

      const nextCritVer = (target.version_criterio || 1) + 1
      if (!target.versiones_criterio) target.versiones_criterio = []
      target.versiones_criterio.unshift({
        id: `snap-exec-${Date.now()}`,
        version: nextCritVer,
        fecha_registro: `${today} ${new Date().toTimeString().slice(0, 5)}`,
        usuario: currentUser.nombre_completo,
        tipo_cambio: 'Ejecución de soporte',
        periodicidad: target.periodicidad || 'Anual',
        fecha_vencimiento: target.fecha_vencimiento,
        responsable: sopResp.trim(),
        responsable_correo: sopRespCorreo.trim(),
        observaciones: sopDesc.trim(),
        resumen_programacion: `Soporte v${nextVer}: ${sopTitulo.trim()}`,
        justificacion: sopDesc.trim(),
        valores_anteriores: prevValuesSummary,
      })
      target.version_criterio = nextCritVer

      target.responsable = sopResp.trim()
      target.responsable_correo = sopRespCorreo.trim()
      target.observaciones = sopDesc.trim()
      target.historial.unshift({
        id: `h-${Date.now()}`,
        fecha: today,
        usuario: currentUser.nombre_completo,
        accion: `Ejecución de criterio y cargue de soporte versión v${nextVer} (Versión criterio v${nextCritVer})`,
        justificacion: `${sopTitulo.trim()} — ${sopDesc.trim()} (Nuevo vencimiento: ${formatDateES(target.fecha_vencimiento)})`,
        detalle_anterior: prevValuesSummary,
      })

      pushToWorkPlan(draft, {
        titulo: `[Renovación Soporte ${target.codigo} v${nextVer}] ${target.titulo}`,
        descripcion: `Soporte v${nextVer} ejecutado. Próximo vencimiento: ${formatDateES(target.fecha_vencimiento)}.`,
        sede_id: target.sede_id,
        modulo_origen: 'Administración',
        referencia_origen_id: target.id,
        responsable: sopResp.trim(),
        responsable_correo: sopRespCorreo.trim(),
        fecha_limite: target.fecha_vencimiento,
        usuario_creador: currentUser.nombre_completo,
      })

      return draft
    }, 'Criterio ejecutado con soporte vigente: versión guardada en auditoría y estado actualizado a CUMPLE.')
    setModalMode(null)
  }

  // Guardar la Programación Anual de Ejecución con Control de Versiones (v1 no pide justificación; v2, v3... exige justificación obligatoria)
  const handleSaveAnnualSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCriterion || progFechasAnuales.length === 0) return

    const existingScheduleVersions = activeCriterion.versiones_programacion ?? []
    const isReprogramming = existingScheduleVersions.length > 0

    if (isReprogramming && !progJustificacion.trim()) {
      setProgError(
        'Control de Auditoría: Como estás ajustando una programación ya existente, debes ingresar la justificación obligatoria del cambio para generar la nueva versión.',
      )
      return
    }
    setProgError('')

    const nextScheduleVer = existingScheduleVersions.length + 1

    updateDb((draft) => {
      const target = draft.admin_criterios.find((x) => x.id === activeCriterion.id)
      if (!target) return draft

      const prevScheduleSummary =
        target.versiones_programacion && target.versiones_programacion.length > 0
          ? `Versión anterior v${target.version_programacion || target.versiones_programacion.length}: Frecuencia ${target.periodicidad || 'Anual'} · Fechas: ${target.programacion_anual || formatDateES(target.fecha_vencimiento)} · Resp: ${target.responsable}`
          : undefined

      const orderedDates = [...progFechasAnuales]
        .sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada))
        .map((item, idx) => ({
          ...item,
          numero: idx + 1,
        }))

      const resumenFechas = orderedDates
        .map((d) => `#${d.numero}: ${formatDateES(d.fecha_programada)}`)
        .join(' · ')

      const justificacionFinal = isReprogramming
        ? progJustificacion.trim()
        : 'Programación inicial del año (Versión v1)'

      if (!target.versiones_programacion) target.versiones_programacion = []
      target.versiones_programacion.unshift({
        id: `ver-prog-${Date.now()}-v${nextScheduleVer}`,
        version: nextScheduleVer,
        fecha_registro: `${today} ${new Date().toTimeString().slice(0, 5)}`,
        usuario: currentUser.nombre_completo,
        periodicidad: progPeriodicidad,
        responsable: progResponsable.trim() || target.responsable,
        responsable_correo: progResponsableCorreo.trim() || target.responsable_correo,
        fechas_programadas: orderedDates.map((d) => ({
          numero: d.numero,
          etiqueta: d.etiqueta,
          fecha_programada: d.fecha_programada,
          estado: d.estado,
        })),
        resumen_fechas: resumenFechas,
        justificacion: justificacionFinal,
        detalle_anterior: prevScheduleSummary,
      })
      target.version_programacion = nextScheduleVer

      const nextCritVer = (target.version_criterio || 0) + 1
      if (!target.versiones_criterio) target.versiones_criterio = []
      target.versiones_criterio.unshift({
        id: `snap-prog-${Date.now()}-v${nextCritVer}`,
        version: nextCritVer,
        fecha_registro: `${today} ${new Date().toTimeString().slice(0, 5)}`,
        usuario: currentUser.nombre_completo,
        tipo_cambio: isReprogramming ? 'Reprogramación de fechas' : 'Programación inicial',
        periodicidad: progPeriodicidad,
        fecha_vencimiento:
          orderedDates.find((f) => f.estado === 'pendiente')?.fecha_programada ||
          target.fecha_vencimiento,
        responsable: progResponsable.trim() || target.responsable,
        responsable_correo: progResponsableCorreo.trim() || target.responsable_correo || '',
        observaciones: target.observaciones,
        resumen_programacion: `Prog. v${nextScheduleVer} (${progPeriodicidad}): ${resumenFechas}`,
        justificacion: justificacionFinal,
        valores_anteriores: prevScheduleSummary,
      })
      target.version_criterio = nextCritVer

      target.periodicidad = progPeriodicidad
      target.fecha_programada_inicial = orderedDates[0]?.fecha_programada || progFechaInicial
      target.fechas_programadas_anual = orderedDates
      target.responsable = progResponsable.trim() || target.responsable
      target.responsable_correo = progResponsableCorreo.trim() || target.responsable_correo

      const nextPending = orderedDates.find((f) => f.estado === 'pendiente')
      if (nextPending) {
        target.fecha_vencimiento = nextPending.fecha_programada
      }

      target.programacion_anual = resumenFechas

      target.historial.unshift({
        id: `h-prog-${Date.now()}`,
        fecha: today,
        usuario: currentUser.nombre_completo,
        accion: isReprogramming
          ? `Reprogramación anual guardada — Versión de Programación v${nextScheduleVer}`
          : `Programación anual inicial creada — Versión v1`,
        justificacion: justificacionFinal,
        detalle_anterior: prevScheduleSummary,
      })

      pushToWorkPlan(draft, {
        titulo: `[Programación v${nextScheduleVer} · ${target.codigo} - ${progPeriodicidad}] ${target.titulo}`,
        descripcion: `Cronograma anual v${nextScheduleVer} (${orderedDates.length} ejecuciones): ${resumenFechas}`,
        sede_id: target.sede_id,
        modulo_origen: 'Administración',
        referencia_origen_id: target.id,
        responsable: target.responsable,
        responsable_correo: target.responsable_correo,
        fecha_limite: target.fecha_vencimiento,
        usuario_creador: currentUser.nombre_completo,
      })

      return draft
    }, isReprogramming ? `Reprogramación guardada como Versión v${nextScheduleVer} con su justificación de auditoría.` : 'Programación anual inicial (Versión v1) registrada exitosamente.')

    setModalMode(null)
  }

  // Disparar barrido de notificaciones por correo
  const handleRunDailyEmailNotifications = () => {
    updateDb((draft) => {
      if (!draft.admin_notificaciones) draft.admin_notificaciones = []
      let enviados = 0

      for (const c of draft.admin_criterios) {
        const ev = evaluateAdminCriterion(c, today)
        if (!ev.alertaCorreo.activa) continue

        const sede = draft.sedes.find((s) => s.id === c.sede_id)
        const correo = c.responsable_correo || 'calidad@calidadips.co'
        const d = ev.semaforo.days
        const tipoAlerta: AdminEmailNotificationLog['tipo_alerta'] =
          d < 0
            ? 'Alerta DIARIA Post-Vencimiento (Incumplimiento)'
            : d === 0
              ? 'Día de vencimiento'
              : 'Próximo a vencer (Semáforo)'

        c.ultima_notificacion_fecha = today
        c.notificaciones_enviadas_count = (c.notificaciones_enviadas_count || 0) + 1

        draft.admin_notificaciones.unshift({
          id: `not-${Date.now()}-${c.id}-${enviados}`,
          fecha_hora: `${today} ${new Date().toTimeString().slice(0, 5)}`,
          criterio_id: c.id,
          criterio_codigo: c.codigo,
          criterio_titulo: c.titulo,
          sede_nombre: sede?.nombre ?? c.sede_id,
          destinatario_nombre: c.responsable,
          destinatario_correo: correo,
          tipo_alerta: tipoAlerta,
          asunto:
            d < 0
              ? `[AVISO DIARIO OBLIGATORIO - VENCIDO HACE ${Math.abs(d)} DÍAS] ${c.codigo} · ${c.titulo} (${sede?.nombre})`
              : `[ALERTA SEMÁFORO ${ev.semaforo.label}] ${c.codigo} · ${c.titulo} (${sede?.nombre})`,
          mensaje:
            d < 0
              ? `Estimado(a) ${c.responsable}: El criterio "${c.titulo}" en ${sede?.nombre} se encuentra VENCIDO / SIN SOPORTE VIGENTE. Su estado permanece en NO CUMPLE y continuará recibiendo este aviso TODOS LOS DÍAS hasta que ejecute el compromiso y cargue el soporte actualizado.`
              : `Estimado(a) ${c.responsable}: El criterio "${c.titulo}" en ${sede?.nombre} vence el ${formatDateES(ev.fechaEfectivaVencimiento)} (${ev.semaforo.countdown}). Por favor ejecute la actualización oportunamente.`,
          estado_criterio_momento: ev.estadoSeguimiento,
        })
        enviados++
      }
      return draft
    }, 'Correos electrónicos de alerta (preventivos y diarios post-vencimiento) enviados a los responsables.')
  }

  const proximos15Items = evaluatedAll
    .filter((item) => {
      const days = item.eval.semaforo.days
      const within15OrOverdue = days <= 15
      if (!within15OrOverdue) return false
      if (calendarFilterLevel === 'cumple') return item.eval.cumple
      if (calendarFilterLevel === 'no_cumple') return !item.eval.cumple
      return true
    })
    .sort((a, b) =>
      a.eval.fechaEfectivaVencimiento.localeCompare(b.eval.fechaEfectivaVencimiento),
    )

  const currentMonthPrefix = today.slice(0, 7)

  // Alertas de vencimiento y semáforo (Vencidos, Mes en curso / <=30d y Preventivas 31-60d)
  const activeAlertsList = evaluatedAll
    .filter(({ eval: ev }) => {
      const days = ev.semaforo.days
      const isInCurrentMonth = ev.fechaEfectivaVencimiento.startsWith(`${currentMonthPrefix}-`)
      return days < 0 || isInCurrentMonth || days <= 60 || !ev.cumple
    })
    .sort((a, b) => a.eval.semaforo.days - b.eval.semaforo.days)

  // KPI 4: Avance de la Programación Anual (Cronograma del Año)
  let totalFechasAnioCount = 0
  let ejecutadasFechasAnioCount = 0
  let programadasMesActualCount = 0

  for (const { record } of evaluatedAll) {
    const dates =
      record.fechas_programadas_anual && record.fechas_programadas_anual.length > 0
        ? record.fechas_programadas_anual
        : generateAnnualScheduleDates(
            record.fecha_programada_inicial || record.fecha_vencimiento || today,
            record.periodicidad || 'Anual',
          )
    totalFechasAnioCount += dates.length
    ejecutadasFechasAnioCount += dates.filter((d) => d.estado === 'ejecutada').length
    programadasMesActualCount += dates.filter((d) =>
      d.fecha_programada.startsWith(`${currentMonthPrefix}-`),
    ).length
  }

  const pctProgramacionAnual =
    totalFechasAnioCount > 0
      ? Math.round((ejecutadasFechasAnioCount / totalFechasAnioCount) * 1000) / 10
      : 0

  return (
    <div className="work-plan">
      {/* KPIs Superiores */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Cumplimiento Soportes Vigentes</h2>
            <span className="complaint-kpi-icon">
              <CheckCircle2 size={19} />
            </span>
          </div>
          <strong>{pctCumplimiento} %</strong>
          <p>
            {cumpleCount} de {totalCount} criterios ejecutados con soporte vigente.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-red">
          <div className="complaint-kpi-heading">
            <h2>No Cumplen y Alertas Diarias</h2>
            <span className="complaint-kpi-icon">
              <BellRing size={19} />
            </span>
          </div>
          <strong>
            {noCumpleCount} No Cumplen ({alertasDiariasCount} con Alerta Diaria)
          </strong>
          <p>
            Tras el vencimiento se avisa todos los días al correo y el estado no cambia hasta cumplir.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-amber">
          <div className="complaint-kpi-heading">
            <h2>Semáforo de Vencimientos</h2>
            <span className="complaint-kpi-icon">
              <CalendarClock size={19} />
            </span>
          </div>
          <strong>{criticoCount} Críticos</strong>
          <p>
            ≤30 días: {criticoCount} críticos · 31-60 días: {prioridadCount} prioridad · &gt;60 días:{' '}
            {totalCount - criticoCount - prioridadCount} sin prioridad
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Avance de Programación Anual</h2>
            <span className="complaint-kpi-icon">
              <ListChecks size={19} />
            </span>
          </div>
          <strong>
            {pctProgramacionAnual} % ({ejecutadasFechasAnioCount}/{totalFechasAnioCount})
          </strong>
          <p>
            {ejecutadasFechasAnioCount} de {totalFechasAnioCount} fechas anuales ejecutadas ·{' '}
            {programadasMesActualCount} programada(s) en este mes.
          </p>
        </article>
      </div>

      {/* Barra de controles principal: Ventanas + Botones de Crear Sede Georreferenciada y Crear Criterio */}
      <div className="plan-controls">
        <div className="view-toggle">
          <button
            type="button"
            className={windowView === 'tarjetas' ? 'view-selected' : ''}
            onClick={() => setWindowView('tarjetas')}
          >
            1. Tarjetas por Sede
          </button>
          <button
            type="button"
            className={windowView === 'calendario15' ? 'view-selected' : ''}
            onClick={() => setWindowView('calendario15')}
          >
            2. Prioridades y Calendario
          </button>
          <button
            type="button"
            className={windowView === 'listado' ? 'view-selected' : ''}
            onClick={() => setWindowView('listado')}
          >
            3. Matriz de Ejecución
          </button>
          <button
            type="button"
            className={windowView === 'catalogo' ? 'view-selected' : ''}
            onClick={() => setWindowView('catalogo')}
          >
            4. Catálogo de Criterios ({catalogoActual.length})
          </button>
          <button
            type="button"
            className={windowView === 'alertas_correo' ? 'view-selected' : ''}
            onClick={() => setWindowView('alertas_correo')}
          >
            5. Alertas ({activeAlertsList.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setShowSedeGeoModal(true)}
          >
            <Building2 size={14} /> + Crear Sede
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setCatNewCodigo(`CTA-0${catalogoActual.length + 1}`)
              setCatNewTitulo('')
              setCatNewDesc('')
              setCatNewPeriodicidad('Mensual')
              setCatNewResp(currentUser.nombre_completo)
              setCatNewRespCorreo(currentUser.correo)
              setModalMode('crear_catalogo')
            }}
          >
            <ListChecks size={14} /> + Crear Nuevo Criterio
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setCatId(catalogoActual[0]?.id || 'adm-cat-01')
              setNewSedeId('TODAS_LAS_SEDES')
              setNewPeriodicidad('Mensual')
              setNewFechaProg(today)
              setNewFechaVenc(calculateExpirationByPeriodicidad(today, 'Mensual'))
              setNewResp(currentUser.nombre_completo)
              setNewRespCorreo(currentUser.correo)
              setNewObs('')
              setModalMode('agregar')
            }}
          >
            <Plus size={14} /> Asignar Criterio a Sede(s)
          </button>
        </div>
      </div>

      {/* Selector de Sede (En Matriz y Ejecución selecciona 1 sola sede sin mezclar; en otras vistas permite ver todas o una) */}
      <div
        className="plan-controls"
        style={{
          padding: '10px 14px',
          background: '#fff',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
            {windowView === 'listado' ? 'Sede seleccionada:' : 'Filtro por sede:'}
          </span>
          {windowView !== 'listado' && (
            <button
              type="button"
              className={`button ${selectedSedeIds.length === 0 ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setSelectedSedeIds([])}
            >
              Todas ({db.sedes.length})
            </button>
          )}
          {sedesOrdenadas.map((s) => {
            const active =
              windowView === 'listado'
                ? activeMatrixSedeId === s.id
                : selectedSedeIds.includes(s.id)
            return (
              <button
                type="button"
                key={s.id}
                className={`button ${active ? 'button-primary' : 'button-secondary'}`}
                onClick={() => {
                  if (windowView === 'listado') {
                    setActiveMatrixSedeId(s.id)
                    setSelectedSedeIds([s.id])
                  } else {
                    toggleSedeFilter(s.id)
                  }
                }}
              >
                {s.es_nacional ? 'NACIONAL' : s.nombre}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={handleSyncTotalCriteriosPorSede}
          title="Garantiza que cada sede tenga asignada la totalidad de criterios del catálogo"
        >
          <CheckCircle2 size={14} /> Garantizar Totalidad de Criterios en Todas las Sedes
        </button>
      </div>

      {/* ====================================================================
          VENTANA 1: TARJETAS RESUMIDAS POR SEDE (Identificación, Capacidad Instalada y Cumplimiento)
         ==================================================================== */}
      {windowView === 'tarjetas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {sedesOrdenadas
            .filter((s) => selectedSedeIds.length === 0 || selectedSedeIds.includes(s.id))
            .map((sede) => {
              const sedeCriterios = db.admin_criterios.filter((c) =>
                sede.es_nacional
                  ? c.sede_id === sede.id
                  : c.sede_id === sede.id || (sedeNacional && c.sede_id === sedeNacional.id),
              )
              const evals = sedeCriterios.map((c) => ({
                c,
                ev: evaluateAdminCriterion(c, today),
              }))
              const tot = evals.length
              const ok = evals.filter((x) => x.ev.cumple).length
              const incumplimientos = evals.filter((x) => !x.ev.cumple)
              const pct = tot > 0 ? Math.round((ok / tot) * 100) : 0

              return (
                <section key={sede.id} className="panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <span className={`plan-badge ${sede.es_nacional ? 'plan-future' : 'plan-complete'}`}>
                        {sede.es_nacional
                          ? 'TRANSVERSAL A TODAS LAS SEDES'
                          : `${(sede.departamento || sede.ciudad).toUpperCase()} · REPS ${sede.codigo_reps}`}
                      </span>
                      <h2 style={{ margin: '6px 0 2px', fontSize: 16 }}>{sede.nombre}</h2>
                      <small style={{ color: '#68778b', display: 'block' }}>
                        {sede.departamento ? `${sede.municipio || sede.ciudad}, ${sede.departamento}` : sede.ciudad} ·{' '}
                        {sede.direccion} · {sede.area_m2} m²
                      </small>
                      <small style={{ color: '#334155', display: 'block', marginTop: 3 }}>
                        <strong>Capacidad Instalada:</strong> {sede.capacidad_instalada_resumen}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <strong
                        style={{
                          fontSize: 23,
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          color: pct >= 85 ? '#15966a' : pct >= 60 ? '#d69016' : '#d94f56',
                        }}
                      >
                        {pct}%
                      </strong>
                      <small style={{ display: 'block', color: '#68778b', whiteSpace: 'nowrap' }}>
                        {ok}/{tot} cumplen
                      </small>
                    </div>
                  </div>

                  {/* Semáforo de Vigencia y Renovación Anual de la Habilitación REPS de la Sede */}
                  {!sede.es_nacional && (
                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <small style={{ fontWeight: 700, color: '#1e293b' }}>
                          Vigencia Habilitación REPS (Inscripción:{' '}
                          {formatDateES(sede.fecha_inscripcion_reps || '2026-01-15')})
                        </small>
                        <span
                          className={`plan-badge ${
                            evaluateSedeHabilitacionStatus(sede.fecha_vencimiento_habilitacion, today)
                              .badgeClass
                          }`}
                        >
                          {
                            evaluateSedeHabilitacionStatus(sede.fecha_vencimiento_habilitacion, today)
                              .label
                          }
                        </span>
                      </div>
                      <small style={{ color: '#475569' }}>
                        {
                          evaluateSedeHabilitacionStatus(sede.fecha_vencimiento_habilitacion, today)
                            .detalle
                        }
                      </small>
                    </div>
                  )}

                  {/* Barra gráfica de cumplimiento general */}
                  <div>
                    <div className="audit-progress-track" style={{ height: 10 }}>
                      <div
                        className={`audit-progress-fill ${pct >= 85 ? 'audit-fill-green' : pct >= 60 ? 'audit-fill-yellow' : 'audit-fill-red'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#52617a' }}>
                      <span>Cumplen: {ok}</span>
                      <span>Incumplimientos: {incumplimientos.length}</span>
                      <span>
                        Críticos (≤30d): {evals.filter((x) => x.ev.semaforo.level === 'critico').length}
                      </span>
                    </div>
                  </div>

                  {/* Cumplimiento por Grupo de Clasificación con su respectiva barra de color semáforo */}
                  <div
                    style={{
                      borderTop: '1px solid #e8edf5',
                      paddingTop: 12,
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    <strong style={{ fontSize: 12, color: '#1e293b' }}>
                      Cumplimiento por Clasificación:
                    </strong>
                    {CLASIFICACIONES_CRONOGRAMA_ADMIN.map((clasif) => {
                      const itemsClasif = evals.filter(({ c }) => {
                        if (c.categoria === clasif) return true
                        if (
                          clasif === 'Administrativo' &&
                          c.categoria === 'Capacidad Técnico-Administrativa'
                        )
                          return true
                        if (
                          clasif === 'Financiero' &&
                          c.categoria === 'Suficiencia Patrimonial y Financiera'
                        )
                          return true
                        if (
                          clasif === 'Calidad y SST' &&
                          c.categoria === 'Sistema Obligatorio SOGCS'
                        )
                          return true
                        return false
                      })
                      const totC = itemsClasif.length
                      const okC = itemsClasif.filter((x) => x.ev.cumple).length
                      const pctC = totC > 0 ? Math.round((okC / totC) * 100) : 0
                      const barTone =
                        totC === 0
                          ? 'audit-fill-neutral'
                          : pctC >= 85
                            ? 'audit-fill-green'
                            : pctC >= 60
                              ? 'audit-fill-yellow'
                              : 'audit-fill-red'

                      return (
                        <div key={clasif} style={{ display: 'grid', gap: 4 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: 11.5,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#334155' }}>{clasif}</span>
                            <span style={{ color: '#475569', fontWeight: 600 }}>
                              {totC > 0 ? `${pctC}% (${okC}/${totC})` : 'Sin ítems (0/0)'}
                            </span>
                          </div>
                          <div className="audit-progress-track" style={{ height: 6 }}>
                            <div
                              className={`audit-progress-fill ${barTone}`}
                              style={{ width: `${totC > 0 ? pctC : 0}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Acciones de la tarjeta: Ficha Técnica de Sede, Ver Criterios y PDF */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 'auto',
                      paddingTop: 6,
                      borderTop: '1px solid #e8edf5',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        setSelectedSedeFicha(sede)
                        setEditingSedeFicha(false)
                        setEditingLinks3dPlanos(false)
                        setEditSedeNombre(sede.nombre)
                        setEditSedeReps(sede.codigo_reps)
                        setEditSedeDep(sede.departamento || sede.ciudad)
                        setEditSedeMun(sede.municipio || sede.ciudad)
                        setEditSedeDir(sede.direccion)
                        setEditSedeTel(sede.telefono)
                        setEditSedeArea(String(sede.area_m2 || 0))
                        setEditSedePisos(String(sede.pisos_niveles || 1))
                        setEditSedeTenencia(sede.tenencia_inmueble || 'Arrendado')
                        setEditSedePmr(sede.accesibilidad_pmr ?? true)
                        setEditSedePlanta(
                          sede.planta_electrica === 'NO' ? 'NO' : 'SÍ',
                        )
                        setEditSedeTanque(
                          sede.tanque_reserva_agua === 'NO' ? 'NO' : 'SÍ',
                        )
                        setEditSedeGases(sede.red_gases_medicinales || 'Cilindros portátiles')
                        setEditCapacidadCantidades(buildInitialCapacidadCantidades(sede))
                        setDraftUrlPlanos(sede.url_planos_arquitectonicos || '')
                        setDraftUrlModelo3d(sede.url_modelo_3d || '')
                        setEditSedeDirector(sede.director_responsable)
                        setEditSedeInscripcion(sede.fecha_inscripcion_reps || '2026-01-15')
                        setEditSedeVencHab(sede.fecha_vencimiento_habilitacion || '2027-01-15')
                        setEditSedeCapacidad(sede.capacidad_instalada_resumen)
                      }}
                    >
                      <Eye size={14} /> Ficha Técnica de la Sede
                    </button>

                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        setActiveMatrixSedeId(sede.id)
                        setSelectedSedeIds([sede.id])
                        setWindowView('listado')
                      }}
                    >
                      Ver criterios ({tot})
                    </button>
                  </div>
                </section>
              )
            })}
        </div>
      )}

      {/* ====================================================================
          VENTANA 2: MATRIZ Y EJECUCIÓN POR SEDE (1 Sola Sede Seleccionada + Nacional,
          separada en Secciones por Clasificación con Criterio, Estado, Último Soporte y Botones de Ejecución)
         ==================================================================== */}
      {windowView === 'listado' && (() => {
        const currentSede =
          sedesOrdenadas.find((s) => s.id === activeMatrixSedeId) ||
          sedesOrdenadas.find((s) => !s.es_nacional) ||
          sedesOrdenadas[0]

        if (!currentSede) return null

        // Incluye los criterios propios de la sede seleccionada + los criterios NACIONALES (sin mezclar con otras sedes)
        const rawCriteriosSede = db.admin_criterios
          .filter((c) =>
            currentSede.es_nacional
              ? c.sede_id === currentSede.id
              : c.sede_id === currentSede.id || (sedeNacional && c.sede_id === sedeNacional.id),
          )
          .filter(
            (c) =>
              !q ||
              `${c.codigo} ${c.titulo} ${c.categoria} ${c.responsable} ${c.responsable_correo ?? ''} ${c.observaciones}`
                .toLowerCase()
                .includes(q),
          )

        const rowsSede = rawCriteriosSede.map((record) => ({
          record,
          eval: evaluateAdminCriterion(record, today),
          esNacional: sedeNacional ? record.sede_id === sedeNacional.id : false,
        }))

        const totSede = rowsSede.length
        const okSede = rowsSede.filter((x) => x.eval.cumple).length
        const pctSede = totSede > 0 ? Math.round((okSede / totSede) * 100) : 0

        const matchesClasificacion = (categoria: string, clasif: string) => {
          if (categoria === clasif) return true
          if (clasif === 'Administrativo' && categoria === 'Capacidad Técnico-Administrativa')
            return true
          if (clasif === 'Financiero' && categoria === 'Suficiencia Patrimonial y Financiera')
            return true
          if (clasif === 'Calidad y SST' && categoria === 'Sistema Obligatorio SOGCS')
            return true
          return false
        }

        return (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Cabecera de la Sede Activa en la Matriz */}
            <section
              className="panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`plan-badge ${currentSede.es_nacional ? 'plan-future' : 'plan-complete'}`}>
                    {currentSede.es_nacional
                      ? 'SEDE TRANSVERSAL · CRITERIOS NACIONALES'
                      : `MATRIZ DE SEDE + CRITERIOS NACIONALES · ${currentSede.departamento ? `${currentSede.municipio}, ${currentSede.departamento}` : currentSede.ciudad}`}
                  </span>
                  <span className="plan-badge plan-future">
                    REPS: {currentSede.codigo_reps}
                  </span>
                </div>
                <h2 style={{ margin: '6px 0 2px', fontSize: 17, color: '#0f172a' }}>
                  {currentSede.nombre} — {totSede} criterios evaluados ({okSede} vigentes · {pctSede}% cumplimiento)
                </h2>
                <small style={{ color: '#64748b' }}>
                  {currentSede.es_nacional
                    ? 'Visualizando únicamente los criterios transversales de nivel NACIONAL.'
                    : `Visualizando únicamente los criterios propios de ${currentSede.nombre} más los criterios NACIONALES aplicables, agrupados por Clasificación.`}
                </small>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {!currentSede.es_nacional && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => generateAdminSedePdf(currentSede, sedeNacional, db.admin_criterios)}
                  >
                    <FileDown size={14} /> Exportar Matriz PDF ({currentSede.nombre} + Nacional)
                  </button>
                )}
              </div>
            </section>

            {/* Secciones separadas por cada Clasificación del Cronograma */}
            {CLASIFICACIONES_CRONOGRAMA_ADMIN.map((clasif, cIndex) => {
              const itemsClasif = rowsSede
                .filter((x) => matchesClasificacion(x.record.categoria, clasif))
                .sort(
                  (a, b) =>
                    Number(b.esNacional) - Number(a.esNacional) ||
                    a.record.codigo.localeCompare(b.record.codigo, undefined, { numeric: true }),
                )

              const totC = itemsClasif.length
              const okC = itemsClasif.filter((x) => x.eval.cumple).length
              const pctC = totC > 0 ? Math.round((okC / totC) * 100) : 0
              const barTone =
                totC === 0
                  ? 'audit-fill-neutral'
                  : pctC >= 85
                    ? 'audit-fill-green'
                    : pctC >= 60
                      ? 'audit-fill-yellow'
                      : 'audit-fill-red'
              const isCollapsed = Boolean(collapsedClasifs[clasif])

              return (
                <section
                  key={clasif}
                  className="panel"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                    borderRadius: 12,
                  }}
                >
                  {/* Encabezado de la Sección (Clasificación) con su barra de avance semáforo */}
                  <div
                    onClick={() =>
                      setCollapsedClasifs((prev) => ({
                        ...prev,
                        [clasif]: !prev[clasif],
                      }))
                    }
                    style={{
                      padding: '13px 18px',
                      background: '#f8fafc',
                      borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 14,
                      flexWrap: 'wrap',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: '#1e3a8a',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 11.5,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        0{cIndex + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a' }}>
                          Sección: {clasif}
                        </strong>
                        <small style={{ display: 'block', color: '#64748b', fontSize: 11.5 }}>
                          {totC} criterio(s) en esta clasificación · Haz clic para {isCollapsed ? 'mostrar' : 'ocultar'}
                        </small>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        minWidth: 230,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 11.5,
                            fontWeight: 700,
                            marginBottom: 4,
                            color: '#1e293b',
                          }}
                        >
                          <span>Cumplimiento {clasif}</span>
                          <span>
                            {totC > 0 ? `${pctC}% (${okC}/${totC})` : '0/0'}
                          </span>
                        </div>
                        <div className="audit-progress-track" style={{ height: 7 }}>
                          <div
                            className={`audit-progress-fill ${barTone}`}
                            style={{ width: `${totC > 0 ? pctC : 0}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className="plan-badge plan-future"
                        style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        {isCollapsed ? 'Expandir' : 'Contraer'}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Criterios debajo de la Sección de Clasificación */}
                  {!isCollapsed && (
                    totC === 0 ? (
                      <div
                        style={{
                          padding: '14px 18px',
                          color: '#64748b',
                          fontSize: 12,
                          background: '#ffffff',
                        }}
                      >
                        No hay criterios asignados en la clasificación <strong>{clasif}</strong> para esta sede.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', background: '#ffffff' }}>
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            minWidth: 840,
                          }}
                        >
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                              <th
                                style={{
                                  width: '21%',
                                  padding: '10px 14px',
                                  textAlign: 'left',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#334155',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Criterio y Alcance
                              </th>
                              <th
                                style={{
                                  width: '22%',
                                  padding: '10px 10px',
                                  textAlign: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#334155',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Programación Anual
                              </th>
                              <th
                                style={{
                                  width: '16%',
                                  padding: '10px 10px',
                                  textAlign: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#334155',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Estado y Semáforo
                              </th>
                              <th
                                style={{
                                  width: '18%',
                                  padding: '10px 10px',
                                  textAlign: 'left',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#334155',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Último Soporte Ejecutado
                              </th>
                              <th
                                style={{
                                  width: '11%',
                                  padding: '10px 8px',
                                  textAlign: 'left',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#334155',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Responsable
                              </th>
                              <th
                                style={{
                                  width: '12%',
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#334155',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemsClasif.map(({ record, eval: ev, esNacional }, rIdx) => {
                              const annualDates =
                                record.fechas_programadas_anual &&
                                record.fechas_programadas_anual.length > 0
                                  ? record.fechas_programadas_anual
                                  : generateAnnualScheduleDates(
                                      record.fecha_programada_inicial || today,
                                      record.periodicidad || 'Anual',
                                    )
                              const executedDatesCount = annualDates.filter(
                                (f) => f.estado === 'ejecutada',
                              ).length

                              return (
                              <tr
                                key={record.id}
                                style={{
                                  borderTop: rIdx === 0 ? 'none' : '1px solid #edf2f7',
                                  background: '#ffffff',
                                }}
                              >
                                {/* 1. Criterio y Alcance */}
                                <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveCriterion(record)
                                        setModalMode('ficha')
                                      }}
                                      title="Haz clic para ver la Ficha e Historial del criterio"
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        padding: 0,
                                        textAlign: 'left',
                                        color: '#0f172a',
                                        fontWeight: 700,
                                        fontSize: 12.5,
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: 3,
                                        lineHeight: 1.35,
                                      }}
                                    >
                                      {record.codigo} — {record.titulo}
                                    </button>
                                    <div>
                                      <span
                                        className={`plan-badge ${esNacional ? 'plan-future' : 'plan-complete'}`}
                                        style={{ fontSize: 10 }}
                                      >
                                        {esNacional ? 'NACIONAL' : currentSede.nombre}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Programación Anual (Frecuencia, Avance y Fechas del Año) */}
                                <td
                                  style={{
                                    padding: '12px 10px',
                                    verticalAlign: 'middle',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        gap: 4,
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <span className="plan-badge plan-future" style={{ fontSize: 10, fontWeight: 700 }}>
                                        {record.periodicidad || 'Anual'}
                                      </span>
                                      <span className="plan-badge plan-month" style={{ fontSize: 10, fontWeight: 700 }}>
                                        {executedDatesCount}/{annualDates.length} en el año
                                      </span>
                                      <span
                                        className={`plan-badge ${
                                          (record.version_programacion || 1) > 1
                                            ? 'plan-reprogrammed'
                                            : 'plan-complete'
                                        }`}
                                        style={{ fontSize: 10, fontWeight: 700 }}
                                      >
                                        Prog. v{record.version_programacion || 1}
                                        {(record.version_programacion || 1) > 1
                                          ? ` · Reprogramada`
                                          : ''}
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      {annualDates.slice(0, 4).map((d) => (
                                        <span
                                          key={d.id}
                                          style={{
                                            display: 'inline-block',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            background:
                                              d.estado === 'ejecutada' ? '#dcfce7' : '#f1f5f9',
                                            color:
                                              d.estado === 'ejecutada' ? '#166534' : '#334155',
                                            border:
                                              d.estado === 'ejecutada'
                                                ? '1px solid #86efac'
                                                : '1px solid #cbd5e1',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          #{d.numero}: {formatDateES(d.fecha_programada)}
                                        </span>
                                      ))}
                                      {annualDates.length > 4 && (
                                        <span
                                          style={{
                                            display: 'inline-block',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            background: '#eff6ff',
                                            color: '#1d4ed8',
                                          }}
                                        >
                                          +{annualDates.length - 4} fechas más
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Estado y Semáforo */}
                                <td
                                  style={{
                                    padding: '12px 10px',
                                    verticalAlign: 'middle',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <span
                                      className={`plan-badge ${ev.cumple ? 'plan-complete' : 'plan-overdue'}`}
                                      style={{ fontWeight: 700 }}
                                    >
                                      {ev.estadoSeguimiento}
                                    </span>
                                    <span className={`plan-badge ${ev.semaforo.badgeClass}`} style={{ fontSize: 10.5 }}>
                                      Vence: {formatDateES(ev.fechaEfectivaVencimiento)}
                                    </span>
                                  </div>
                                </td>

                                {/* 4. Último Soporte Ejecutado */}
                                <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                  {ev.ultimoSoporte ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <strong style={{ color: '#0f172a', fontSize: 11.5 }}>
                                        v{ev.ultimoSoporte.version} · {ev.ultimoSoporte.titulo}
                                      </strong>
                                      <small style={{ color: '#475569', fontSize: 10.5 }}>
                                        Emisión: {formatDateES(ev.ultimoSoporte.fecha_emision)}
                                      </small>
                                      <small
                                        style={{
                                          color: '#2563eb',
                                          fontSize: 10.5,
                                          fontWeight: 600,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {ev.ultimoSoporte.archivo_nombre}
                                      </small>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <span style={{ color: '#b42318', fontWeight: 700, fontSize: 11.5 }}>
                                        Sin ejecutar / Sin soporte
                                      </span>
                                      <small style={{ color: '#64748b', fontSize: 10.5 }}>
                                        Pendiente de cargue de evidencia
                                      </small>
                                    </div>
                                  )}
                                </td>

                                {/* 5. Responsable */}
                                <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <strong style={{ fontSize: 11.5, color: '#1e293b' }}>
                                      {record.responsable}
                                    </strong>
                                    <small
                                      style={{
                                        color: '#2563eb',
                                        fontSize: 10.5,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {record.responsable_correo || 'calidad@calidadips.co'}
                                    </small>
                                  </div>
                                </td>

                                {/* 6. Botones de Acción Apilados Verticalmente con Tamaño y Estilo Estandarizado */}
                                <td
                                  style={{
                                    padding: '10px 12px',
                                    verticalAlign: 'middle',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'stretch',
                                      justifyContent: 'center',
                                      gap: 5,
                                      width: '100%',
                                      maxWidth: 116,
                                      margin: '0 auto',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      title="Ejecutar criterio y cargar soporte"
                                      onClick={() => {
                                        setActiveCriterion(record)
                                        setSopTitulo(
                                          `Ejecución ${record.codigo} (${record.periodicidad || 'Vigente'})`,
                                        )
                                        setSopDesc('')
                                        setSopEmision(today)
                                        setSopVencimiento(
                                          calculateExpirationByPeriodicidad(
                                            today,
                                            record.periodicidad,
                                          ),
                                        )
                                        setSopResp(record.responsable)
                                        setSopRespCorreo(
                                          record.responsable_correo || currentUser.correo,
                                        )
                                        setSopArchivo('')
                                        setModalMode('soporte')
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                        width: '100%',
                                        height: 29,
                                        padding: '0 8px',
                                        borderRadius: 6,
                                        border: '1px solid #2563eb',
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      <FilePlus2 size={12} /> Ejecutar
                                    </button>
                                    <button
                                      type="button"
                                      title="Programar frecuencia y fechas anuales de ejecución"
                                      onClick={() => openProgramarModal(record)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                        width: '100%',
                                        height: 29,
                                        padding: '0 8px',
                                        borderRadius: 6,
                                        border: '1px solid #bfdbfe',
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      <CalendarClock size={12} /> Programar
                                    </button>
                                    <button
                                      type="button"
                                      title="Ajustar criterio con control de versión y justificación"
                                      onClick={() => {
                                        setActiveCriterion(record)
                                        setUpdFechaVenc(record.fecha_vencimiento)
                                        setUpdResp(record.responsable)
                                        setUpdRespCorreo(
                                          record.responsable_correo || currentUser.correo,
                                        )
                                        setUpdObs(record.observaciones)
                                        setUpdJustificacion('')
                                        setModalMode('actualizar')
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                        width: '100%',
                                        height: 29,
                                        padding: '0 8px',
                                        borderRadius: 6,
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        color: '#334155',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      <Pencil size={12} /> Ajustar
                                    </button>
                                    <button
                                      type="button"
                                      title="Ver Ficha e Historial de versiones y auditoría"
                                      onClick={() => {
                                        setActiveCriterion(record)
                                        setModalMode('ficha')
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                        width: '100%',
                                        height: 29,
                                        padding: '0 8px',
                                        borderRadius: 6,
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#334155',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      <Eye size={12} /> Historial
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </section>
              )
            })}
          </div>
        )
      })()}

      {/* ====================================================================
          VENTANA 2: PRIORIDADES Y CALENDARIO DE PROGRAMACIÓN (Estilo SARLAFT WorkPlan)
          Muestra toda la programación definida para el módulo (todas las sedes + NACIONAL,
          o filtrado por la sede seleccionada en la barra superior)
         ==================================================================== */}
      {windowView === 'calendario15' && (() => {
        // Filtrar criterios según el filtro superior de sedes (vacío = Todas las sedes + Nacional)
        const baseCriteriaForCalendar = db.admin_criterios
          .filter((c) => {
            if (selectedSedeIds.length === 0) return true
            return selectedSedeIds.includes(c.sede_id)
          })
          .filter(
            (c) =>
              !q ||
              `${c.codigo} ${c.titulo} ${c.categoria} ${c.responsable} ${c.responsable_correo ?? ''}`
                .toLowerCase()
                .includes(q),
          )

        // Expandir todas las fechas programadas en el año de cada criterio
        type CalendarScheduledItem = {
          id: string
          criterio: AdminCriterionRecord
          eval: ReturnType<typeof evaluateAdminCriterion>
          sedeNombre: string
          esNacional: boolean
          numeroFecha: number
          totalFechasAnio: number
          etiquetaFecha: string
          fechaProgramada: string
          estadoFecha: 'pendiente' | 'ejecutada'
          daysDiff: number
          tone: 'complete' | 'month' | 'urgent' | 'overdue' | 'future'
          statusLabel: string
        }

        const allScheduledItems: CalendarScheduledItem[] = []

        for (const crit of baseCriteriaForCalendar) {
          const ev = evaluateAdminCriterion(crit, today)
          const sedeObj = db.sedes.find((s) => s.id === crit.sede_id)
          const sedeNombre = sedeObj?.es_nacional
            ? 'NACIONAL'
            : sedeObj?.nombre || crit.sede_id
          const esNacional = Boolean(sedeObj?.es_nacional)

          const datesList =
            crit.fechas_programadas_anual && crit.fechas_programadas_anual.length > 0
              ? crit.fechas_programadas_anual
              : generateAnnualScheduleDates(
                  crit.fecha_programada_inicial || crit.fecha_vencimiento || today,
                  crit.periodicidad || 'Anual',
                )

          for (const dItem of datesList) {
            const dDiff = diffDays(dItem.fecha_programada, today)
            const isExec = dItem.estado === 'ejecutada'
            let tone: CalendarScheduledItem['tone'] = 'future'
            let statusLabel = `Programada (${dDiff} d)`

            if (isExec) {
              tone = 'complete'
              statusLabel = 'Cumplida / Ejecutada'
            } else if (dDiff < 0) {
              tone = 'overdue'
              statusLabel = `Vencida hace ${Math.abs(dDiff)} d`
            } else if (dDiff <= 15) {
              tone = 'urgent'
              statusLabel = dDiff === 0 ? 'Vence hoy' : `Crítico (${dDiff} d)`
            } else if (dItem.fecha_programada.startsWith(`${calendarMonth}-`) || dDiff <= 60) {
              tone = 'month'
              statusLabel = `En ${dDiff} días`
            } else {
              tone = 'future'
              statusLabel = `En ${dDiff} días`
            }

            allScheduledItems.push({
              id: `${crit.id}__${dItem.id}`,
              criterio: crit,
              eval: ev,
              sedeNombre,
              esNacional,
              numeroFecha: dItem.numero,
              totalFechasAnio: datesList.length,
              etiquetaFecha: dItem.etiqueta,
              fechaProgramada: dItem.fecha_programada,
              estadoFecha: dItem.estado,
              daysDiff: dDiff,
              tone,
              statusLabel,
            })
          }
        }

        // Filtrar por el selector de estado (Todos / Pendientes-Vencidos / Ejecutados) y año
        const filteredScheduled = allScheduledItems
          .filter((item) => {
            if (calendarYear !== 'TODOS' && !item.fechaProgramada.startsWith(`${calendarYear}-`)) {
              return false
            }
            if (calendarFilterLevel === 'cumple') return item.estadoFecha === 'ejecutada'
            if (calendarFilterLevel === 'no_cumple') return item.estadoFecha !== 'ejecutada'
            return true
          })
          .sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada))

        const monthItems = filteredScheduled.filter((item) =>
          item.fechaProgramada.startsWith(`${calendarMonth}-`),
        )

        // Prioridades y atrasos (Vencidas o en próximos 30 días sin ejecutar)
        const prioritySidebarItems = allScheduledItems
          .filter((item) => item.estadoFecha !== 'ejecutada' && item.daysDiff <= 30)
          .sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada))

        const startMonthDate = new Date(`${calendarMonth}-01T12:00:00Z`)
        const daysInMonth = new Date(
          Date.UTC(startMonthDate.getUTCFullYear(), startMonthDate.getUTCMonth() + 1, 0),
        ).getUTCDate()
        const startOffset = (startMonthDate.getUTCDay() + 6) % 7

        const moveCalendarMonth = (delta: number) => {
          const next = new Date(startMonthDate)
          next.setUTCMonth(next.getUTCMonth() + delta)
          const isoMonth = next.toISOString().slice(0, 7)
          setCalendarMonth(isoMonth)
          setCalendarYear(isoMonth.slice(0, 4))
        }

        const availableYears = Array.from(
          new Set([
            today.slice(0, 4),
            ...allScheduledItems.map((x) => x.fechaProgramada.slice(0, 4)),
          ]),
        ).sort()

        const activeSedeFilterName =
          selectedSedeIds.length === 0
            ? `Todas las Sedes + NACIONAL (${db.sedes.length})`
            : db.sedes.find((s) => s.id === selectedSedeIds[0])?.nombre || 'Sede seleccionada'

        return (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Barra de herramientas del Calendario y Filtro de Estado */}
            <section
              className="panel"
              style={{
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="plan-badge plan-complete">
                    Vista activa: {activeSedeFilterName}
                  </span>
                  <span className="plan-badge plan-future">
                    {filteredScheduled.length} ejecuciones programadas en el cronograma
                  </span>
                </div>
                <h2 style={{ margin: '6px 0 2px', fontSize: 16.5, color: '#0f172a' }}>
                  Calendario y Cronograma General de Programación del Módulo
                </h2>
                <small style={{ color: '#64748b' }}>
                  Usa los botones superiores de <strong>Filtro por sede</strong> para ver todas las sedes y NACIONAL al tiempo, o seleccionar únicamente una sede. Haz clic sobre cualquier actividad del calendario para ejecutarla o reprogramarla.
                </small>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                  Año:
                  <select
                    value={calendarYear}
                    onChange={(e) => {
                      const y = e.target.value
                      setCalendarYear(y)
                      if (y !== 'TODOS') {
                        setCalendarMonth(`${y}-${calendarMonth.slice(5, 7)}`)
                      }
                    }}
                    style={{
                      height: 34,
                      padding: '0 10px',
                      borderRadius: 7,
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <option value="TODOS">Todos los años</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="view-toggle">
                  <button
                    type="button"
                    className={calendarFilterLevel === 'todos' ? 'view-selected' : ''}
                    onClick={() => setCalendarFilterLevel('todos')}
                  >
                    Toda la programación ({allScheduledItems.length})
                  </button>
                  <button
                    type="button"
                    className={calendarFilterLevel === 'no_cumple' ? 'view-selected' : ''}
                    onClick={() => setCalendarFilterLevel('no_cumple')}
                  >
                    Pendientes / Vencidas
                  </button>
                  <button
                    type="button"
                    className={calendarFilterLevel === 'cumple' ? 'view-selected' : ''}
                    onClick={() => setCalendarFilterLevel('cumple')}
                  >
                    Ejecutadas
                  </button>
                </div>
              </div>
            </section>

            {/* CALENDARIO MENSUAL ESTILO SARLAFT + PANEL LATERAL DE PRIORIDADES Y ATRASOS */}
            <section className="plan-schedule">
              <div className="panel plan-calendar">
                <div className="plan-controls">
                  <h2>Programación del mes ({monthItems.length} actividades en {calendarMonth})</h2>
                  <div>
                    <button
                      type="button"
                      className="button button-secondary"
                      aria-label="Mes anterior"
                      onClick={() => moveCalendarMonth(-1)}
                    >
                      ‹ Anterior
                    </button>
                    <label>
                      <input
                        type="month"
                        min="2020-01"
                        max="2035-12"
                        value={calendarMonth}
                        onChange={(e) => {
                          if (/^\d{4}-\d{2}$/.test(e.target.value)) {
                            setCalendarMonth(e.target.value)
                            setCalendarYear(e.target.value.slice(0, 4))
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="button button-secondary"
                      aria-label="Mes siguiente"
                      onClick={() => moveCalendarMonth(1)}
                    >
                      Siguiente ›
                    </button>
                  </div>
                </div>

                <p>
                  Amarillo: programada en el mes · Rojo: próximos 15 días o vencida · Verde: ejecutada con soporte
                </p>

                <div className="plan-calendar-grid">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                    <strong key={d}>{d}</strong>
                  ))}
                  {Array.from({ length: startOffset }, (_, i) => (
                    <div key={`empty-${i}`} aria-hidden="true" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayISO = `${calendarMonth}-${String(i + 1).padStart(2, '0')}`
                    const dayEvents = monthItems.filter((evItem) => evItem.fechaProgramada === dayISO)
                    return (
                      <div
                        key={dayISO}
                        className={`plan-day ${dayISO === today ? 'plan-day-today' : ''}`}
                      >
                        <span style={{ fontWeight: dayISO === today ? 700 : 600 }}>{i + 1}</span>
                        {dayEvents.map((evItem) => (
                          <button
                            key={evItem.id}
                            type="button"
                            title={`[${evItem.sedeNombre}] ${evItem.criterio.codigo} · ${evItem.criterio.titulo} (${evItem.etiquetaFecha}) — ${evItem.statusLabel}`}
                            className={`plan-calendar-event plan-${evItem.tone}`}
                            onClick={() => {
                              setActiveCriterion(evItem.criterio)
                              setSopTitulo(
                                `Ejecución ${evItem.criterio.codigo} (${evItem.etiquetaFecha})`,
                              )
                              setSopDesc('')
                              setSopEmision(today)
                              setSopVencimiento(
                                calculateExpirationByPeriodicidad(
                                  today,
                                  evItem.criterio.periodicidad,
                                ),
                              )
                              setSopResp(evItem.criterio.responsable)
                              setSopRespCorreo(
                                evItem.criterio.responsable_correo || currentUser.correo,
                              )
                              setSopArchivo('')
                              setModalMode('soporte')
                            }}
                          >
                            <strong>[{evItem.sedeNombre}]</strong> {evItem.criterio.titulo} (
                            {evItem.numeroFecha}/{evItem.totalFechasAnio})
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Panel derecho: Prioridades y atrasos (estilo SARLAFT) */}
              <aside className="panel plan-priorities">
                <h2>Prioridades y atrasos ({prioritySidebarItems.length})</h2>
                <p>
                  Actividades vencidas sin cumplir o programadas para los próximos 30 días ({activeSedeFilterName}).
                </p>
                {prioritySidebarItems.length === 0 ? (
                  <p style={{ color: '#15966a', fontWeight: 600 }}>
                    No hay actividades vencidas ni críticas en los próximos 30 días para el filtro actual.
                  </p>
                ) : (
                  prioritySidebarItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveCriterion(item.criterio)
                        setSopTitulo(`Ejecución ${item.criterio.codigo} (${item.etiquetaFecha})`)
                        setSopDesc('')
                        setSopEmision(today)
                        setSopVencimiento(
                          calculateExpirationByPeriodicidad(
                            today,
                            item.criterio.periodicidad,
                          ),
                        )
                        setSopResp(item.criterio.responsable)
                        setSopRespCorreo(
                          item.criterio.responsable_correo || currentUser.correo,
                        )
                        setSopArchivo('')
                        setModalMode('soporte')
                      }}
                    >
                      <strong>
                        [{item.sedeNombre}] {item.criterio.codigo} — {item.criterio.titulo}
                      </strong>
                      <div className="plan-deadline">
                        <span className={`plan-badge plan-${item.tone}`}>
                          {item.statusLabel}
                        </span>
                        <strong>{formatDateES(item.fechaProgramada)}</strong>
                        <small>
                          {item.etiquetaFecha} · Resp: {item.criterio.responsable}
                        </small>
                      </div>
                    </button>
                  ))
                )}
              </aside>
            </section>

            {/* Tabla cronológica completa de toda la programación del módulo */}
            <section className="panel plan-table-panel">
              <div className="plan-controls">
                <div>
                  <h2>
                    Cronograma Completo de Actividades Programadas ({filteredScheduled.length})
                  </h2>
                  <p>
                    Orden cronológico de todas las fechas programadas ({activeSedeFilterName}), desde la más próxima hasta la más lejana.
                  </p>
                </div>
              </div>

              <div className="plan-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>Fecha Programada</th>
                      <th style={{ width: '15%' }}>Sede / Alcance</th>
                      <th style={{ width: '25%' }}>Criterio y Clasificación</th>
                      <th style={{ width: '16%' }}>Frecuencia y Ciclo</th>
                      <th style={{ width: '14%' }}>Estado</th>
                      <th style={{ width: '14%', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScheduled.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{formatDateES(item.fechaProgramada)}</strong>
                          <br />
                          <small style={{ color: item.daysDiff < 0 ? '#a32828' : '#64748b', fontWeight: 600 }}>
                            {item.statusLabel}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`plan-badge ${
                              item.esNacional ? 'plan-future' : 'plan-complete'
                            }`}
                          >
                            {item.sedeNombre}
                          </span>
                        </td>
                        <td>
                          <strong>
                            {item.criterio.codigo} — {item.criterio.titulo}
                          </strong>
                          <br />
                          <small style={{ color: '#64748b' }}>
                            Clasificación: {item.criterio.categoria}
                          </small>
                        </td>
                        <td>
                          <span className="plan-badge plan-future">
                            {item.criterio.periodicidad || 'Anual'}
                          </span>
                          <br />
                          <small>{item.etiquetaFecha}</small>
                        </td>
                        <td>
                          <span className={`plan-badge plan-${item.tone}`}>
                            {item.estadoFecha === 'ejecutada' ? 'Ejecutada' : item.statusLabel}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 5,
                              maxWidth: 116,
                              margin: '0 auto',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCriterion(item.criterio)
                                setSopTitulo(
                                  `Ejecución ${item.criterio.codigo} (${item.etiquetaFecha})`,
                                )
                                setSopDesc('')
                                setSopEmision(today)
                                setSopVencimiento(
                                  calculateExpirationByPeriodicidad(
                                    today,
                                    item.criterio.periodicidad,
                                  ),
                                )
                                setSopResp(item.criterio.responsable)
                                setSopRespCorreo(
                                  item.criterio.responsable_correo || currentUser.correo,
                                )
                                setSopArchivo('')
                                setModalMode('soporte')
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                height: 28,
                                padding: '0 8px',
                                borderRadius: 6,
                                border: '1px solid #2563eb',
                                background: '#2563eb',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <FilePlus2 size={12} /> Ejecutar
                            </button>
                            <button
                              type="button"
                              onClick={() => openProgramarModal(item.criterio)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                height: 28,
                                padding: '0 8px',
                                borderRadius: 6,
                                border: '1px solid #bfdbfe',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <CalendarClock size={12} /> Programar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )
      })()}

      {/* ====================================================================
          VENTANA 4: CATÁLOGO DE CRITERIOS ORGANIZADO POR SECCIONES DE CLASIFICACIÓN
         ==================================================================== */}
      {windowView === 'catalogo' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <section
            className="panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, color: '#0f172a' }}>
                Catálogo Maestro de Criterios Administrativos y Financieros ({catalogoActual.length})
              </h2>
              <small style={{ color: '#64748b' }}>
                Organizado por las 7 Clasificaciones Oficiales. Aquí puedes consultar la asignación (Nacional vs. Sede) o crear nuevos criterios para desplegarlos en las sedes.
              </small>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setCatNewCodigo(`CTA-0${catalogoActual.length + 1}`)
                setCatNewTitulo('')
                setCatNewDesc('')
                setCatNewPeriodicidad('Mensual')
                setCatNewResp(currentUser.nombre_completo)
                setCatNewRespCorreo(currentUser.correo)
                setModalMode('crear_catalogo')
              }}
            >
              <Plus size={14} /> Crear Nuevo Criterio en el Catálogo
            </button>
          </section>

          {CLASIFICACIONES_CRONOGRAMA_ADMIN.map((clasif, cIndex) => {
            const itemsCatClasif = catalogoActual.filter((cat) => {
              if (cat.categoria === clasif) return true
              if (
                clasif === 'Administrativo' &&
                cat.categoria === 'Capacidad Técnico-Administrativa'
              )
                return true
              if (
                clasif === 'Financiero' &&
                cat.categoria === 'Suficiencia Patrimonial y Financiera'
              )
                return true
              if (
                clasif === 'Calidad y SST' &&
                cat.categoria === 'Sistema Obligatorio SOGCS'
              )
                return true
              return false
            })

            const nacCount = itemsCatClasif.filter((x) => !x.aplica_todas_sedes).length
            const sedeCount = itemsCatClasif.filter((x) => x.aplica_todas_sedes).length
            const collapseKey = `cat-${clasif}`
            const isCollapsed = Boolean(collapsedClasifs[collapseKey])

            return (
              <section
                key={clasif}
                className="panel"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                }}
              >
                <div
                  onClick={() =>
                    setCollapsedClasifs((prev) => ({
                      ...prev,
                      [collapseKey]: !prev[collapseKey],
                    }))
                  }
                  style={{
                    padding: '13px 18px',
                    background: '#f8fafc',
                    borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 14,
                    flexWrap: 'wrap',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: '#1e3a8a',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11.5,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      0{cIndex + 1}
                    </span>
                    <div>
                      <strong style={{ fontSize: 14, color: '#0f172a' }}>
                        Clasificación: {clasif} ({itemsCatClasif.length} criterios)
                      </strong>
                      <small style={{ display: 'block', color: '#64748b', fontSize: 11.5 }}>
                        {sedeCount} por Sede Operativa · {nacCount} de nivel Nacional
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {sedeCount > 0 && (
                      <span className="plan-badge plan-month">
                        Sede: {sedeCount}
                      </span>
                    )}
                    {nacCount > 0 && (
                      <span className="plan-badge plan-future">
                        Nacional: {nacCount}
                      </span>
                    )}
                    <span className="plan-badge plan-complete" style={{ fontWeight: 700 }}>
                      {isCollapsed ? 'Expandir' : 'Contraer'}
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div style={{ overflowX: 'auto', background: '#ffffff' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        minWidth: 780,
                      }}
                    >
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                          <th
                            style={{
                              width: '26%',
                              padding: '10px 14px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Código / Elemento (Ítem)
                          </th>
                          <th
                            style={{
                              width: '16%',
                              padding: '10px 10px',
                              textAlign: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Alcance (Sede / Nacional)
                          </th>
                          <th
                            style={{
                              width: '22%',
                              padding: '10px 10px',
                              textAlign: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Frecuencia y Programación Anual
                          </th>
                          <th
                            style={{
                              width: '36%',
                              padding: '10px 14px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Descripción Normativa
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsCatClasif.map((cat, idx) => (
                          <tr
                            key={cat.id}
                            style={{
                              borderTop: idx === 0 ? 'none' : '1px solid #edf2f7',
                              background: '#ffffff',
                            }}
                          >
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                              <strong style={{ color: '#0f172a', fontSize: 12.5 }}>
                                {cat.codigo} — {cat.titulo}
                              </strong>
                            </td>
                            <td
                              style={{
                                padding: '12px 10px',
                                verticalAlign: 'middle',
                                textAlign: 'center',
                              }}
                            >
                              <span
                                className={`plan-badge ${
                                  cat.aplica_todas_sedes ? 'plan-month' : 'plan-future'
                                }`}
                                style={{ fontWeight: 700 }}
                              >
                                {cat.aplica_todas_sedes ? 'Sede' : 'Nacional'}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '12px 10px',
                                verticalAlign: 'middle',
                                textAlign: 'center',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                <span className="plan-badge plan-complete">
                                  {cat.periodicidad}
                                </span>
                                {cat.programacion_anual && (
                                  <small style={{ color: '#64748b', fontSize: 10.5 }}>
                                    {cat.programacion_anual}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: '12px 14px',
                                verticalAlign: 'middle',
                                color: '#334155',
                                fontSize: 12,
                              }}
                            >
                              {cat.descripcion_normativa}
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

      {/* ====================================================================
          VENTANA 5: CENTRO DE ALERTAS DE VENCIMIENTOS Y SEMÁFORO
          Inicia por Vencidos, luego Próximos a Vencer en el Mes en Curso / Críticos (<=30d)
          y Preventivas (31-60d). Soporta filtro por Todas las Sedes o por Sede individual.
         ==================================================================== */}
      {windowView === 'alertas_correo' && (() => {
        const activeSedeLabel =
          selectedSedeIds.length === 0
            ? `Todas las Sedes + NACIONAL (${db.sedes.length})`
            : db.sedes.find((s) => s.id === selectedSedeIds[0])?.nombre || 'Sede seleccionada'

        // Si el usuario seleccionó una sede operativa en el filtro superior, incluimos también las alertas NACIONALES que aplican a esa sede
        const criteriaForAlerts = db.admin_criterios
          .filter((c) => {
            if (selectedSedeIds.length === 0) return true
            const selectedSedeObj = db.sedes.find((s) => s.id === selectedSedeIds[0])
            if (selectedSedeObj?.es_nacional) {
              return c.sede_id === selectedSedeObj.id
            }
            return (
              selectedSedeIds.includes(c.sede_id) ||
              (sedeNacional && c.sede_id === sedeNacional.id)
            )
          })
          .filter(
            (c) =>
              !q ||
              `${c.codigo} ${c.titulo} ${c.categoria} ${c.responsable} ${c.responsable_correo ?? ''}`
                .toLowerCase()
                .includes(q),
          )
          .map((record) => ({
            record,
            eval: evaluateAdminCriterion(record, today),
          }))

        // Clasificar en los 3 niveles de alerta ordenados de más crítico (menor días) a más lejano
        const groupVencidos = criteriaForAlerts
          .filter(({ eval: ev }) => ev.semaforo.days < 0)
          .sort((a, b) => a.eval.semaforo.days - b.eval.semaforo.days)

        const groupMesOCriticos = criteriaForAlerts
          .filter(({ eval: ev }) => {
            if (ev.semaforo.days < 0) return false
            const inCurrentMonth = ev.fechaEfectivaVencimiento.startsWith(
              `${currentMonthPrefix}-`,
            )
            return inCurrentMonth || ev.semaforo.days <= 30
          })
          .sort((a, b) => a.eval.semaforo.days - b.eval.semaforo.days)

        const groupPreventivas = criteriaForAlerts
          .filter(({ eval: ev }) => {
            if (ev.semaforo.days < 0) return false
            const inCurrentMonth = ev.fechaEfectivaVencimiento.startsWith(
              `${currentMonthPrefix}-`,
            )
            if (inCurrentMonth || ev.semaforo.days <= 30) return false
            return ev.semaforo.days <= 60 || !ev.cumple
          })
          .sort((a, b) => a.eval.semaforo.days - b.eval.semaforo.days)

        const totalAlertasSede =
          groupVencidos.length + groupMesOCriticos.length + groupPreventivas.length

        const sectionsAlertas = [
          {
            key: 'vencidos' as const,
            numero: '01',
            titulo: 'ALERTA ROJA · CRITERIOS VENCIDOS (Atención Inmediata)',
            subtitulo:
              'Criterios cuya fecha de vencimiento o programación ya se superó sin soporte vigente. Ordenados desde el más antiguo.',
            badgeText: `${groupVencidos.length} vencido(s)`,
            badgeClass: 'plan-overdue',
            headerBorder: '#fca5a5',
            headerBg: '#fef2f2',
            items: groupVencidos,
          },
          {
            key: 'mes_o_criticos' as const,
            numero: '02',
            titulo: `ALERTA CRÍTICA · PRÓXIMOS A VENCER EN EL MES EN CURSO O ≤ 30 DÍAS (${currentMonthPrefix})`,
            subtitulo:
              'Criterios que vencen durante el mes en curso o dentro de la ventana crítica de los próximos 30 días del semáforo.',
            badgeText: `${groupMesOCriticos.length} crítico(s) / mes actual`,
            badgeClass: 'plan-urgent',
            headerBorder: '#fdba74',
            headerBg: '#fff7ed',
            items: groupMesOCriticos,
          },
          {
            key: 'preventivas' as const,
            numero: '03',
            titulo: 'ALERTA PREVENTIVA · PRÓXIMOS A VENCER SEGÚN SEMÁFORO (31 A 60 DÍAS / PENDIENTES)',
            subtitulo:
              'Criterios en franja amarilla de prioridad (31 a 60 días) o pendientes de ejecución inicial para gestión anticipada.',
            badgeText: `${groupPreventivas.length} preventivo(s)`,
            badgeClass: 'plan-month',
            headerBorder: '#fde047',
            headerBg: '#fefce8',
            items: groupPreventivas,
          },
        ].filter((sec) => alertTabFilter === 'todas' || sec.key === alertTabFilter)

        return (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Barra de control superior de Alertas */}
            <section
              className="panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="plan-badge plan-complete">
                    Alcance activo: {activeSedeLabel}
                  </span>
                  <span className="plan-badge plan-overdue">
                    {groupVencidos.length} Vencidos
                  </span>
                  <span className="plan-badge plan-urgent">
                    {groupMesOCriticos.length} Mes en curso / ≤30d
                  </span>
                  <span className="plan-badge plan-month">
                    {groupPreventivas.length} Preventivos (31-60d)
                  </span>
                </div>
                <h2 style={{ margin: '6px 0 2px', fontSize: 17, color: '#0f172a' }}>
                  Centro de Alertas de Vencimiento y Semáforo ({totalAlertasSede} alertas activas)
                </h2>
                <small style={{ color: '#64748b' }}>
                  Aquí reposan únicamente las alertas activas, iniciando por los criterios vencidos y los próximos a vencer en el mes en curso según el semáforo. Usa el filtro superior de sedes para ver todas las sedes o una sede específica.
                </small>
              </div>

              <div className="view-toggle">
                <button
                  type="button"
                  className={alertTabFilter === 'todas' ? 'view-selected' : ''}
                  onClick={() => setAlertTabFilter('todas')}
                >
                  Todas ({totalAlertasSede})
                </button>
                <button
                  type="button"
                  className={alertTabFilter === 'vencidos' ? 'view-selected' : ''}
                  onClick={() => setAlertTabFilter('vencidos')}
                >
                  1. Vencidos ({groupVencidos.length})
                </button>
                <button
                  type="button"
                  className={alertTabFilter === 'mes_o_criticos' ? 'view-selected' : ''}
                  onClick={() => setAlertTabFilter('mes_o_criticos')}
                >
                  2. Mes en Curso / ≤30d ({groupMesOCriticos.length})
                </button>
                <button
                  type="button"
                  className={alertTabFilter === 'preventivas' ? 'view-selected' : ''}
                  onClick={() => setAlertTabFilter('preventivas')}
                >
                  3. Preventivas ({groupPreventivas.length})
                </button>
              </div>
            </section>

            {/* Secciones jerárquicas de Alertas */}
            {sectionsAlertas.map((sec) => (
              <section
                key={sec.key}
                className="panel"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: `1px solid ${sec.headerBorder}`,
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    padding: '13px 18px',
                    background: sec.headerBg,
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: '#1e3a8a',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11.5,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {sec.numero}
                    </span>
                    <div>
                      <strong style={{ fontSize: 13.5, color: '#0f172a' }}>{sec.titulo}</strong>
                      <small style={{ display: 'block', color: '#475569', fontSize: 11.5 }}>
                        {sec.subtitulo}
                      </small>
                    </div>
                  </div>
                  <span className={`plan-badge ${sec.badgeClass}`} style={{ fontWeight: 700 }}>
                    {sec.badgeText}
                  </span>
                </div>

                {sec.items.length === 0 ? (
                  <div
                    style={{
                      padding: '14px 18px',
                      background: '#ffffff',
                      color: '#15966a',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Sin alertas en este nivel para el filtro de sede seleccionado.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', background: '#ffffff' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        minWidth: 820,
                      }}
                    >
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th
                            style={{
                              width: '18%',
                              padding: '10px 14px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Semáforo y Vencimiento
                          </th>
                          <th
                            style={{
                              width: '16%',
                              padding: '10px 10px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Sede y Clasificación
                          </th>
                          <th
                            style={{
                              width: '24%',
                              padding: '10px 10px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Criterio y Frecuencia
                          </th>
                          <th
                            style={{
                              width: '18%',
                              padding: '10px 10px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Estado Actual / Soporte
                          </th>
                          <th
                            style={{
                              width: '12%',
                              padding: '10px 8px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Responsable
                          </th>
                          <th
                            style={{
                              width: '12%',
                              padding: '10px 12px',
                              textAlign: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              textTransform: 'uppercase',
                            }}
                          >
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.items.map(({ record, eval: ev }, idx) => {
                          const sedeObj = db.sedes.find((s) => s.id === record.sede_id)
                          const esNac = Boolean(sedeObj?.es_nacional)
                          const days = ev.semaforo.days
                          const venceMesActual = ev.fechaEfectivaVencimiento.startsWith(
                            `${currentMonthPrefix}-`,
                          )

                          return (
                            <tr
                              key={record.id}
                              style={{
                                borderTop: idx === 0 ? 'none' : '1px solid #edf2f7',
                                background: '#ffffff',
                              }}
                            >
                              <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span
                                    className={`plan-badge ${ev.semaforo.badgeClass}`}
                                    style={{ width: 'fit-content', fontWeight: 700 }}
                                  >
                                    {days < 0
                                      ? `Vencido hace ${Math.abs(days)} d`
                                      : days === 0
                                        ? 'Vence hoy'
                                        : `Vence en ${days} d`}
                                  </span>
                                  <strong style={{ fontSize: 12, color: '#0f172a' }}>
                                    {formatDateES(ev.fechaEfectivaVencimiento)}
                                  </strong>
                                  {venceMesActual && days >= 0 && (
                                    <span
                                      className="plan-badge plan-urgent"
                                      style={{ width: 'fit-content', fontSize: 9.5 }}
                                    >
                                      Mes en curso
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span
                                    className={`plan-badge ${
                                      esNac ? 'plan-future' : 'plan-complete'
                                    }`}
                                    style={{ width: 'fit-content', fontSize: 10.5 }}
                                  >
                                    {esNac ? 'NACIONAL' : sedeObj?.nombre || record.sede_id}
                                  </span>
                                  <small style={{ color: '#475569', fontWeight: 600 }}>
                                    {record.categoria}
                                  </small>
                                </div>
                              </td>

                              <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <strong style={{ fontSize: 12.5, color: '#0f172a' }}>
                                    {record.codigo} — {record.titulo}
                                  </strong>
                                  <span
                                    className="plan-badge plan-future"
                                    style={{ width: 'fit-content', fontSize: 10 }}
                                  >
                                    Frecuencia: {record.periodicidad || 'Anual'}
                                  </span>
                                </div>
                              </td>

                              <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <span
                                    className={`plan-badge ${
                                      ev.cumple ? 'plan-month' : 'plan-overdue'
                                    }`}
                                    style={{ width: 'fit-content', fontSize: 10.5 }}
                                  >
                                    {ev.estadoSeguimiento}
                                  </span>
                                  <small style={{ color: '#64748b', fontSize: 10.5 }}>
                                    {ev.ultimoSoporte
                                      ? `Último: v${ev.ultimoSoporte.version} (${ev.ultimoSoporte.archivo_nombre})`
                                      : 'Sin soporte ejecutado'}
                                  </small>
                                </div>
                              </td>

                              <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <strong style={{ fontSize: 11.5, color: '#1e293b' }}>
                                    {record.responsable}
                                  </strong>
                                  <small
                                    style={{
                                      color: '#2563eb',
                                      fontSize: 10.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {record.responsable_correo || 'calidad@calidadips.co'}
                                  </small>
                                </div>
                              </td>

                              <td
                                style={{
                                  padding: '10px 12px',
                                  verticalAlign: 'middle',
                                  textAlign: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 5,
                                    maxWidth: 116,
                                    margin: '0 auto',
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCriterion(record)
                                      setSopTitulo(
                                        `Ejecución ${record.codigo} (${record.periodicidad || 'Vigente'})`,
                                      )
                                      setSopDesc('')
                                      setSopEmision(today)
                                      setSopVencimiento(
                                        calculateExpirationByPeriodicidad(
                                          today,
                                          record.periodicidad,
                                        ),
                                      )
                                      setSopResp(record.responsable)
                                      setSopRespCorreo(
                                        record.responsable_correo || currentUser.correo,
                                      )
                                      setSopArchivo('')
                                      setModalMode('soporte')
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5,
                                      width: '100%',
                                      height: 29,
                                      padding: '0 8px',
                                      borderRadius: 6,
                                      border: '1px solid #2563eb',
                                      background: '#2563eb',
                                      color: '#ffffff',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <FilePlus2 size={12} /> Ejecutar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCriterion(record)
                                      setModalMode('ficha')
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5,
                                      width: '100%',
                                      height: 29,
                                      padding: '0 8px',
                                      borderRadius: 6,
                                      border: '1px solid #cbd5e1',
                                      background: '#ffffff',
                                      color: '#334155',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <Eye size={12} /> Historial
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )
      })()}

      {/* Modal de Creación de Sede */}
      <SedeGeoModal
        db={db}
        currentUser={currentUser}
        isOpen={showSedeGeoModal}
        onClose={() => setShowSedeGeoModal(false)}
      />

      {/* Modal de Ficha Técnica de la Sede (Solo lectura + Botón de Edición) */}
      {selectedSedeFicha && (
        <div className="modal-backdrop" onClick={() => setSelectedSedeFicha(null)}>
          <div className="case-dialog record-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <Building2 size={20} />
                </span>
                <div>
                  <small>FICHA TÉCNICA DE LA SEDE · REPS {selectedSedeFicha.codigo_reps}</small>
                  <h2>{selectedSedeFicha.nombre}</h2>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!editingSedeFicha && (
                  <>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() =>
                        generateSedeFichaTecnicaPdf(
                          selectedSedeFicha,
                          sedeNacional,
                          db.admin_criterios,
                        )
                      }
                    >
                      <FileDown size={14} /> Imprimir Ficha Técnica PDF
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setEditingSedeFicha(true)}
                    >
                      <Pencil size={14} /> Editar datos de la sede
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setSelectedSedeFicha(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="case-dialog-body">
              {!editingSedeFicha ? (
                <>
                  <section className="case-section">
                    <h3>Datos de Identificación y Vigencia de Habilitación</h3>
                    <dl className="record-fields">
                      <div>
                        <dt>Nombre de la Sede</dt>
                        <dd>
                          <strong>{selectedSedeFicha.nombre}</strong>
                        </dd>
                      </div>
                      <div>
                        <dt>Código REPS de Habilitación</dt>
                        <dd>{selectedSedeFicha.codigo_reps}</dd>
                      </div>
                      <div>
                        <dt>Departamento / Distrito</dt>
                        <dd>{selectedSedeFicha.departamento || selectedSedeFicha.ciudad}</dd>
                      </div>
                      <div>
                        <dt>Municipio / Localidad</dt>
                        <dd>{selectedSedeFicha.municipio || selectedSedeFicha.ciudad}</dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Dirección Física</dt>
                        <dd>{selectedSedeFicha.direccion}</dd>
                      </div>
                      <div>
                        <dt>Teléfono de Contacto</dt>
                        <dd>{selectedSedeFicha.telefono}</dd>
                      </div>
                      <div>
                        <dt>Área Construida y Niveles</dt>
                        <dd>
                          <strong>{selectedSedeFicha.area_m2} m²</strong> ·{' '}
                          {selectedSedeFicha.pisos_niveles || 1} piso(s)
                        </dd>
                      </div>
                      <div>
                        <dt>Tenencia del Inmueble y Accesibilidad PMR</dt>
                        <dd>
                          {selectedSedeFicha.tenencia_inmueble || 'Arrendado'} ·{' '}
                          <span
                            className={`plan-badge ${
                              (selectedSedeFicha.accesibilidad_pmr ?? true)
                                ? 'plan-complete'
                                : 'plan-overdue'
                            }`}
                          >
                            {(selectedSedeFicha.accesibilidad_pmr ?? true)
                              ? 'Accesible PMR (SÍ)'
                              : 'Sin PMR'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Planta Eléctrica / Respaldo UPS</dt>
                        <dd>
                          <span
                            className={`plan-badge ${
                              selectedSedeFicha.planta_electrica === 'NO'
                                ? 'plan-future'
                                : 'plan-complete'
                            }`}
                          >
                            {selectedSedeFicha.planta_electrica === 'NO' ? 'NO' : 'SÍ'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Tanque de Reserva de Agua Potable</dt>
                        <dd>
                          <span
                            className={`plan-badge ${
                              selectedSedeFicha.tanque_reserva_agua === 'NO'
                                ? 'plan-future'
                                : 'plan-complete'
                            }`}
                          >
                            {selectedSedeFicha.tanque_reserva_agua === 'NO' ? 'NO' : 'SÍ'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Red de Gases Medicinales</dt>
                        <dd>{selectedSedeFicha.red_gases_medicinales || 'Cilindros portátiles'}</dd>
                      </div>
                      <div>
                        <dt>Director / Responsable de la Sede</dt>
                        <dd>{selectedSedeFicha.director_responsable}</dd>
                      </div>
                      <div>
                        <dt>Fecha de Inscripción REPS</dt>
                        <dd>{formatDateES(selectedSedeFicha.fecha_inscripcion_reps || '2026-01-15')}</dd>
                      </div>
                      <div>
                        <dt>Fecha de Vencimiento Habilitación</dt>
                        <dd>{formatDateES(selectedSedeFicha.fecha_vencimiento_habilitacion || '2027-01-15')}</dd>
                      </div>
                      <div>
                        <dt>Estado de Vigencia REPS</dt>
                        <dd>
                          <span
                            className={`plan-badge ${
                              evaluateSedeHabilitacionStatus(
                                selectedSedeFicha.fecha_vencimiento_habilitacion,
                                today,
                              ).badgeClass
                            }`}
                          >
                            {
                              evaluateSedeHabilitacionStatus(
                                selectedSedeFicha.fecha_vencimiento_habilitacion,
                                today,
                              ).label
                            }
                          </span>
                        </dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Capacidad Instalada Declarada (Resolución 3100 de 2019)</dt>
                        <dd>{selectedSedeFicha.capacidad_instalada_resumen}</dd>
                      </div>
                    </dl>
                  </section>

                  {/* 2. SERVICIOS DE SALUD DE LA SEDE Y MODALIDADES MÚLTIPLES (DEBAJO DE DATOS DE IDENTIFICACIÓN Y ARRIBA DE LAS FOTOS) */}
                  <section className="case-section">
                    <SedeServiciosREPSManager
                      servicios={selectedSedeFicha.servicios_habilitados ?? []}
                      onChange={(nextServicios) => {
                        updateDb((draft) => {
                          const target = draft.sedes.find((s) => s.id === selectedSedeFicha.id)
                          if (!target) return draft
                          target.servicios_habilitados = nextServicios
                          setSelectedSedeFicha({ ...target })
                          return draft
                        }, 'Servicios de salud y modalidades actualizados en la Ficha Técnica de la sede.')
                      }}
                    />
                  </section>

                  {/* 3. SECCIÓN DE ÁREAS DE LA SEDE Y REGISTRO FOTOGRÁFICO (DEBAJO DE LOS SERVICIOS · MÍN. 1, MÁX. 4 FOTOS) */}
                  <section className="case-section">
                    <h3>
                      <span>
                        Áreas Físicas de la Sede y Evidencia Fotográfica Auditada (
                        {selectedSedeFicha.areas_sede?.length ?? 0} áreas)
                      </span>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => {
                          setEditingAreaId(null)
                          setAreaNombre('')
                          setAreaDescripcion('')
                          setAreaMetros('45')
                          setAreaPisoNivel('Piso 1')
                          setAreaVentilacion('Aire acondicionado')
                          setAreaPhotoSlots([null, null, null, null])
                          setAreaFormError('')
                          setShowAddAreaForm((v) => !v)
                        }}
                      >
                        <Plus size={14} /> {showAddAreaForm ? 'Cerrar formulario de área' : 'Agregar Área y Fotografías (1 a 4 fotos)'}
                      </button>
                    </h3>
                    <p>
                      Cada sede cuenta con áreas específicas. Registra los enlaces de Planos y Modelo 3D de la sede y cada área física con su nombre, piso/nivel, climatización, metros cuadrados (m²) y evidencia fotográfica (mínimo 1 foto y máximo 4 fotos por área).
                    </p>

                    {/* BLOQUE DIVIDIDO EN DOS: 1. PLANOS ARQUITECTÓNICOS | 2. MODELO 3D INTERACTIVO DE LA SEDE */}
                    <div
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        padding: 14,
                        background: '#f8fafc',
                        marginBottom: 16,
                        display: 'grid',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <strong style={{ fontSize: 13, color: '#172c4c' }}>
                          Recursos Gráficos y Espaciales de la Sede (1. Planos PDF · 2. Modelo 3D)
                        </strong>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => {
                            setDraftUrlPlanos(selectedSedeFicha.url_planos_arquitectonicos || '')
                            setDraftUrlModelo3d(selectedSedeFicha.url_modelo_3d || '')
                            setEditingLinks3dPlanos((v) => !v)
                          }}
                        >
                          <Pencil size={13} />{' '}
                          {editingLinks3dPlanos ? 'Cancelar' : 'Cargar Planos PDF / URL Modelo 3D'}
                        </button>
                      </div>

                      {editingLinks3dPlanos ? (
                        <div style={{ display: 'grid', gap: 12 }}>
                          <div className="plan-form-grid">
                            <div className="form-field">
                              <span>1. Planos Arquitectónicos de la Sede (Formato PDF)</span>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
                                <label
                                  className="button button-secondary"
                                  style={{ cursor: 'pointer', flex: 1 }}
                                >
                                  <FilePlus2 size={14} />{' '}
                                  {draftUrlPlanos ? 'Reemplazar archivo PDF' : 'Subir archivo PDF de Planos'}
                                  <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      const reader = new FileReader()
                                      reader.onload = () => {
                                        if (typeof reader.result === 'string') {
                                          setDraftUrlPlanos(reader.result)
                                        }
                                      }
                                      reader.readAsDataURL(file)
                                    }}
                                  />
                                </label>
                                {draftUrlPlanos && (
                                  <button
                                    type="button"
                                    className="button button-secondary button-danger"
                                    onClick={() => setDraftUrlPlanos('')}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <label className="form-field">
                              <span>2. URL de Modelo 3D Interactivo de la Sede</span>
                              <input
                                type="url"
                                value={draftUrlModelo3d}
                                onChange={(e) => setDraftUrlModelo3d(e.target.value)}
                                placeholder="https://my.matterport.com/... o visor BIM / 3D"
                              />
                            </label>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => {
                                updateDb((draft) => {
                                  const target = draft.sedes.find(
                                    (s) => s.id === selectedSedeFicha.id,
                                  )
                                  if (!target) return draft
                                  target.url_planos_arquitectonicos = draftUrlPlanos.trim()
                                  target.url_modelo_3d = draftUrlModelo3d.trim()
                                  setSelectedSedeFicha({ ...target })
                                  return draft
                                }, 'Planos Arquitectónicos (PDF) y URL de Modelo 3D actualizados.')
                                setEditingLinks3dPlanos(false)
                              }}
                            >
                              <CheckCircle2 size={14} /> Guardar Planos PDF y Modelo 3D
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 12,
                          }}
                        >
                          {/* 1. Tarjeta de Planos Arquitectónicos (Formato PDF) */}
                          <div
                            style={{
                              border: '1px solid #dce3ee',
                              borderRadius: 10,
                              padding: '12px 14px',
                              background: '#ffffff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <span
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  display: 'grid',
                                  placeItems: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Layers size={18} />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ display: 'block', fontSize: 12.5, color: '#0f172a' }}>
                                  1. Planos Arquitectónicos (PDF)
                                </strong>
                                <small
                                  style={{
                                    display: 'block',
                                    color: '#64748b',
                                    fontSize: 11,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {selectedSedeFicha.url_planos_arquitectonicos
                                    ? 'Documento de planos en formato PDF cargado'
                                    : 'Sin archivo PDF de planos cargado'}
                                </small>
                              </div>
                            </div>
                            {selectedSedeFicha.url_planos_arquitectonicos ? (
                              <a
                                href={selectedSedeFicha.url_planos_arquitectonicos}
                                download={`Planos_${selectedSedeFicha.nombre.replace(/\s+/g, '_')}.pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="button button-primary"
                                style={{ textDecoration: 'none', flexShrink: 0 }}
                              >
                                <FileDown size={13} /> Ver / Descargar PDF
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="button button-secondary"
                                style={{ flexShrink: 0 }}
                                onClick={() => setEditingLinks3dPlanos(true)}
                              >
                                <FilePlus2 size={13} /> Subir PDF
                              </button>
                            )}
                          </div>

                          {/* 2. Tarjeta de Modelo 3D de la Sede */}
                          <div
                            style={{
                              border: '1px solid #dce3ee',
                              borderRadius: 10,
                              padding: '12px 14px',
                              background: '#ffffff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <span
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  display: 'grid',
                                  placeItems: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Box size={18} />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ display: 'block', fontSize: 12.5, color: '#0f172a' }}>
                                  2. Modelo 3D de la Sede
                                </strong>
                                <small
                                  style={{
                                    display: 'block',
                                    color: '#64748b',
                                    fontSize: 11,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {selectedSedeFicha.url_modelo_3d ||
                                    'Sin URL de modelo 3D registrada'}
                                </small>
                              </div>
                            </div>
                            {selectedSedeFicha.url_modelo_3d ? (
                              <a
                                href={selectedSedeFicha.url_modelo_3d}
                                target="_blank"
                                rel="noreferrer"
                                className="button button-primary"
                                style={{ textDecoration: 'none', flexShrink: 0 }}
                              >
                                <ExternalLink size={13} /> Abrir Modelo 3D
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="button button-secondary"
                                style={{ flexShrink: 0 }}
                                onClick={() => setEditingLinks3dPlanos(true)}
                              >
                                + Agregar URL
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {showAddAreaForm && (
                      <form
                        onSubmit={handleSaveNewAreaSede}
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          border: '1.5px solid #2563eb',
                          background: '#f8fafc',
                          marginBottom: 18,
                        }}
                      >
                        <h4 style={{ margin: '0 0 12px', color: '#172c4c' }}>
                          {editingAreaId
                            ? `Actualizar Área y Registro Fotográfico en ${selectedSedeFicha.nombre}`
                            : `Registrar Nueva Área en ${selectedSedeFicha.nombre}`}
                        </h4>
                        {areaFormError && (
                          <div className="portal-error" role="alert">
                            {areaFormError}
                          </div>
                        )}
                        <div className="plan-form-grid">
                          <label className="form-field">
                            <span>
                              Nombre del Área <b>*</b>
                            </span>
                            <input
                              required
                              value={areaNombre}
                              onChange={(e) => setAreaNombre(e.target.value)}
                              placeholder="Ej. Área de Dispensación Farmacéutica / Consultorio 101"
                            />
                          </label>
                          <label className="form-field">
                            <span>
                              Metros Cuadrados (m²) del Área <b>*</b>
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              required
                              value={areaMetros}
                              onChange={(e) => setAreaMetros(e.target.value)}
                            />
                          </label>
                          <label className="form-field">
                            <span>Piso / Nivel de Ubicación</span>
                            <select
                              value={areaPisoNivel}
                              onChange={(e) => setAreaPisoNivel(e.target.value)}
                            >
                              <option value="Sótano / Semisótano">Sótano / Semisótano</option>
                              <option value="Piso 1">Piso 1</option>
                              <option value="Piso 2">Piso 2</option>
                              <option value="Piso 3">Piso 3</option>
                              <option value="Piso 4 o superior">Piso 4 o superior</option>
                            </select>
                          </label>
                          <label className="form-field">
                            <span>Ventilación / Climatización del Área</span>
                            <select
                              value={areaVentilacion}
                              onChange={(e) => setAreaVentilacion(e.target.value)}
                            >
                              <option value="Aire acondicionado">Aire acondicionado</option>
                              <option value="Ventilación natural">Ventilación natural</option>
                              <option value="Mixta (Natural + A/A)">Mixta (Natural + A/A)</option>
                              <option value="Presión controlada / Extractor mecánico">
                                Presión controlada / Extractor mecánico
                              </option>
                            </select>
                          </label>
                          <label className="form-field plan-wide">
                            <span>
                              Descripción Técnica del Área <b>*</b>
                            </span>
                            <textarea
                              required
                              value={areaDescripcion}
                              onChange={(e) => setAreaDescripcion(e.target.value)}
                              placeholder="Describe las condiciones locativas, acabados, ventilación, iluminación y dotación del área..."
                            />
                          </label>
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <strong style={{ display: 'block', fontSize: 12.5, color: '#172c4c', marginBottom: 8 }}>
                            Evidencia Fotográfica del Área (Mínimo 1 obligatoria, Máximo 4 fotografías · JPG/PNG/WEBP máx. 10 MB) *
                          </strong>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: 12,
                            }}
                          >
                            {[
                              '1. Fotografía Principal del Área (Obligatoria *)',
                              '2. Fotografía Ángulo / Dotación (Opcional)',
                              '3. Fotografía Acabados / Lavamanos / Señalización (Opcional)',
                              '4. Fotografía Detalle Adicional (Opcional)',
                            ].map((slotLabel, idx) => {
                              const currentPhoto = areaPhotoSlots[idx]
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    border: currentPhoto
                                      ? '1.5px solid #15966a'
                                      : idx === 0
                                        ? '1.5px dashed #2563eb'
                                        : '1px solid #dce3ee',
                                    borderRadius: 10,
                                    padding: 12,
                                    background: '#ffffff',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: 8,
                                    }}
                                  >
                                    <strong style={{ fontSize: 11.5, color: '#1d324f' }}>
                                      {slotLabel}
                                    </strong>
                                    {currentPhoto && (
                                      <button
                                        type="button"
                                        className="button button-secondary button-danger"
                                        onClick={() =>
                                          setAreaPhotoSlots((prev) =>
                                            prev.map((p, i) => (i === idx ? null : p)),
                                          )
                                        }
                                      >
                                        <Trash2 size={12} /> Quitar
                                      </button>
                                    )}
                                  </div>

                                  {currentPhoto && (
                                    <img
                                      src={currentPhoto.dataUrl}
                                      alt={currentPhoto.titulo}
                                      onClick={() =>
                                        setPreviewPhoto({
                                          src: currentPhoto.dataUrl,
                                          title: `${areaNombre || 'Nueva Área'} · ${slotLabel}`,
                                        })
                                      }
                                      style={{
                                        width: '100%',
                                        height: 140,
                                        objectFit: 'cover',
                                        borderRadius: 8,
                                        border: '1px solid #d5dfec',
                                        marginBottom: 8,
                                        cursor: 'zoom-in',
                                      }}
                                    />
                                  )}

                                  <label
                                    className="button button-secondary"
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  >
                                    <Camera size={14} />{' '}
                                    {currentPhoto ? 'Reemplazar fotografía' : 'Subir fotografía'}
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                      style={{ display: 'none' }}
                                      onChange={(e) =>
                                        handleUploadAreaSlotPhoto(
                                          idx,
                                          e.target.files?.[0] ?? null,
                                          slotLabel,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => setShowAddAreaForm(false)}
                          >
                            Cancelar
                          </button>
                          <button type="submit" className="button button-primary">
                            Guardar Área y Fotografías
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Listado de Áreas Registradas en la Sede con sus 1 a 4 Fotos */}
                    {!selectedSedeFicha.areas_sede ||
                    selectedSedeFicha.areas_sede.length === 0 ? (
                      <p style={{ color: '#64748b' }}>
                        Aún no se han registrado áreas específicas con fotografías en esta sede. Haz clic en <strong>"Agregar Área y Fotografías (1 a 4 fotos)"</strong> para crear la primera.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: 14 }}>
                        {selectedSedeFicha.areas_sede.map((area) => (
                          <div
                            key={area.id}
                            style={{
                              border: '1px solid #dce3ee',
                              borderRadius: 12,
                              padding: 14,
                              background: '#fafbfd',
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                alignItems: 'flex-start',
                                gap: 14,
                                marginBottom: 10,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: 14, color: '#172c4c' }}>
                                    {area.nombre}
                                  </strong>
                                  {area.piso_nivel && (
                                    <span className="plan-badge plan-future">
                                      {area.piso_nivel}
                                    </span>
                                  )}
                                  {area.tipo_ventilacion && (
                                    <span className="plan-badge plan-month">
                                      {area.tipo_ventilacion}
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: '5px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                                  {area.descripcion}
                                </p>
                              </div>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  gap: 6,
                                  alignItems: 'center',
                                  flexWrap: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                <span className="plan-badge plan-complete" style={{ whiteSpace: 'nowrap' }}>
                                  {area.metros_cuadrados} m²
                                </span>
                                <span className="plan-badge plan-future" style={{ whiteSpace: 'nowrap' }}>
                                  {area.fotos.length} / 4 foto(s)
                                </span>
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  style={{ whiteSpace: 'nowrap' }}
                                  onClick={() => handleOpenEditArea(area)}
                                >
                                  <Pencil size={13} /> Actualizar Área / Fotos
                                </button>
                                <button
                                  type="button"
                                  className="button button-secondary button-danger"
                                  style={{ whiteSpace: 'nowrap' }}
                                  onClick={() => handleDeleteArea(area.id)}
                                >
                                  <Trash2 size={13} /> Eliminar Área y Fotos
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                                gap: 10,
                                marginTop: 10,
                              }}
                            >
                              {area.fotos.map((foto, fIdx) => (
                                <div
                                  key={foto.id}
                                  style={{
                                    border: '1px solid #e0e7f1',
                                    borderRadius: 10,
                                    padding: 8,
                                    background: '#ffffff',
                                  }}
                                >
                                  <img
                                    src={foto.dataUrl}
                                    alt={foto.titulo}
                                    title="Haz clic para ampliar la fotografía (Vista completa PESV)"
                                    onClick={() =>
                                      setPreviewPhoto({
                                        src: foto.dataUrl,
                                        title: `${selectedSedeFicha.nombre} · ${area.nombre} (${area.metros_cuadrados} m²) · Foto #${fIdx + 1}`,
                                      })
                                    }
                                    style={{
                                      width: '100%',
                                      height: 135,
                                      objectFit: 'cover',
                                      borderRadius: 7,
                                      border: '1px solid #d5dfec',
                                      cursor: 'zoom-in',
                                    }}
                                  />
                                  <small
                                    style={{
                                      display: 'block',
                                      marginTop: 6,
                                      fontWeight: 600,
                                      color: '#334155',
                                      fontSize: 11,
                                    }}
                                  >
                                    {foto.titulo}
                                  </small>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="case-save-actions">
                    <span>
                      Vista de consulta de la Ficha Técnica. Usa el botón Editar para actualizar los datos de la sede.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setSelectedSedeFicha(null)}
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => setEditingSedeFicha(true)}
                    >
                      <Pencil size={14} /> Editar datos de la sede
                    </button>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const activeCapItems = CATALOGO_CAPACIDAD_INSTALADA_REPS_3100.filter(
                      (c) => (editCapacidadCantidades[c.id] || 0) > 0,
                    )
                    const nextResumenCapacidad =
                      activeCapItems.length > 0
                        ? activeCapItems
                            .map((c) => `${editCapacidadCantidades[c.id]} ${c.unidad_medida} (${c.grupo})`)
                            .join(' · ')
                        : editSedeCapacidad.trim() || 'Sin ambientes físicos registrados'

                    const nextConsultorios =
                      (editCapacidadCantidades['reps-cap-cons-ext'] || 0) +
                      (editCapacidadCantidades['reps-cap-cons-urg'] || 0)
                    const nextSalas =
                      (editCapacidadCantidades['reps-cap-sala-proc'] || 0) +
                      (editCapacidadCantidades['reps-cap-sala-quir'] || 0) +
                      (editCapacidadCantidades['reps-cap-sala-partos'] || 0)
                    const nextCamasCamillas =
                      (editCapacidadCantidades['reps-cap-cama-adulto'] || 0) +
                      (editCapacidadCantidades['reps-cap-cama-ped'] || 0) +
                      (editCapacidadCantidades['reps-cap-cama-obst'] || 0) +
                      (editCapacidadCantidades['reps-cap-cama-uci'] || 0) +
                      (editCapacidadCantidades['reps-cap-cama-ucin'] || 0) +
                      (editCapacidadCantidades['reps-cap-camilla-obs'] || 0) +
                      (editCapacidadCantidades['reps-cap-camilla-rec'] || 0) +
                      (editCapacidadCantidades['reps-cap-camilla-otras'] || 0)

                    updateDb((draft) => {
                      const target = draft.sedes.find((s) => s.id === selectedSedeFicha.id)
                      if (!target) return draft
                      target.nombre = editSedeNombre.trim() || target.nombre
                      target.codigo_reps = editSedeReps.trim() || target.codigo_reps
                      target.departamento = editSedeDep.trim()
                      target.municipio = editSedeMun.trim()
                      target.ciudad = `${editSedeMun.trim()}, ${editSedeDep.trim()}`
                      target.direccion = editSedeDir.trim()
                      target.telefono = editSedeTel.trim()
                      target.area_m2 = Number(editSedeArea) || target.area_m2
                      target.pisos_niveles = Number(editSedePisos) || 1
                      target.tenencia_inmueble = editSedeTenencia
                      target.accesibilidad_pmr = editSedePmr
                      target.planta_electrica = editSedePlanta
                      target.tanque_reserva_agua = editSedeTanque
                      target.red_gases_medicinales = editSedeGases
                      target.director_responsable = editSedeDirector.trim()
                      target.fecha_inscripcion_reps = editSedeInscripcion
                      target.fecha_vencimiento_habilitacion = editSedeVencHab
                      target.capacidad_instalada_cantidades = { ...editCapacidadCantidades }
                      target.capacidad_instalada_resumen = nextResumenCapacidad
                      target.consultorios_totales = nextConsultorios
                      target.salas_procedimientos = nextSalas
                      target.camas_camillas = nextCamasCamillas
                      setSelectedSedeFicha({ ...target })
                      return draft
                    }, `Datos y Capacidad Instalada de la sede "${editSedeNombre.trim()}" actualizados correctamente.`)
                    setEditingSedeFicha(false)
                  }}
                >
                  <section className="case-section">
                    <h3>1. Actualizar Datos de Identificación de la Sede</h3>
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Nombre de la Sede <b>*</b>
                        </span>
                        <input
                          required
                          value={editSedeNombre}
                          onChange={(e) => setEditSedeNombre(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Código REPS <b>*</b>
                        </span>
                        <input
                          required
                          value={editSedeReps}
                          onChange={(e) => setEditSedeReps(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Departamento / Distrito</span>
                        <input
                          value={editSedeDep}
                          onChange={(e) => setEditSedeDep(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Municipio / Localidad</span>
                        <input
                          value={editSedeMun}
                          onChange={(e) => setEditSedeMun(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Dirección Física</span>
                        <input
                          value={editSedeDir}
                          onChange={(e) => setEditSedeDir(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Teléfono</span>
                        <input
                          value={editSedeTel}
                          onChange={(e) => setEditSedeTel(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Área Construida (m²)</span>
                        <input
                          type="number"
                          value={editSedeArea}
                          onChange={(e) => setEditSedeArea(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Pisos / Niveles del Inmueble</span>
                        <input
                          type="number"
                          min="1"
                          value={editSedePisos}
                          onChange={(e) => setEditSedePisos(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Tenencia del Inmueble</span>
                        <select
                          value={editSedeTenencia}
                          onChange={(e) =>
                            setEditSedeTenencia(e.target.value as 'Propio' | 'Arrendado' | 'Comodato')
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
                          value={editSedePmr ? 'SI' : 'NO'}
                          onChange={(e) => setEditSedePmr(e.target.value === 'SI')}
                        >
                          <option value="SI">SÍ — Cumple Accesibilidad PMR</option>
                          <option value="NO">NO</option>
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Planta Eléctrica / UPS de Respaldo</span>
                        <select
                          value={editSedePlanta}
                          onChange={(e) => setEditSedePlanta(e.target.value as 'SÍ' | 'NO')}
                        >
                          <option value="SÍ">SÍ</option>
                          <option value="NO">NO</option>
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Tanque de Reserva de Agua Potable</span>
                        <select
                          value={editSedeTanque}
                          onChange={(e) => setEditSedeTanque(e.target.value as 'SÍ' | 'NO')}
                        >
                          <option value="SÍ">SÍ</option>
                          <option value="NO">NO</option>
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Red de Gases Medicinales</span>
                        <select
                          value={editSedeGases}
                          onChange={(e) =>
                            setEditSedeGases(
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
                        <span>Director / Responsable</span>
                        <input
                          value={editSedeDirector}
                          onChange={(e) => setEditSedeDirector(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Fecha de Inscripción REPS</span>
                        <input
                          type="date"
                          value={editSedeInscripcion}
                          onChange={(e) => setEditSedeInscripcion(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Fecha de Vencimiento Habilitación</span>
                        <input
                          type="date"
                          value={editSedeVencHab}
                          onChange={(e) => setEditSedeVencHab(e.target.value)}
                        />
                      </label>
                    </div>
                  </section>

                  {/* SECCIÓN 2: CAPACIDAD INSTALADA OFICIAL RESOLUCIÓN 3100 DE 2019 (IDÉNTICA A CREAR SEDE) */}
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
                      Actualiza las unidades de capacidad instalada habilitadas en la sede de acuerdo con la clasificación oficial del REPS:
                    </p>

                    <div style={{ display: 'grid', gap: 14 }}>
                      {GRUPOS_CAPACIDAD_REPS_3100.map((grupo) => {
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
                            <strong
                              style={{
                                fontSize: 12.5,
                                color: '#1e3a8a',
                                display: 'block',
                                marginBottom: 8,
                              }}
                            >
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
                                      (editCapacidadCantidades[item.id] || 0) > 0
                                        ? '1.5px solid #2563eb'
                                        : '1px solid #e2e8f0',
                                    fontSize: 11.5,
                                  }}
                                >
                                  <span style={{ flex: 1 }}>
                                    <strong>{item.unidad_medida}</strong>
                                    <small
                                      style={{
                                        display: 'block',
                                        color: '#64748b',
                                        fontSize: 10.5,
                                      }}
                                    >
                                      {item.concepto}
                                    </small>
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editCapacidadCantidades[item.id] ?? 0}
                                    onChange={(e) =>
                                      setEditCapacidadCantidades((prev) => ({
                                        ...prev,
                                        [item.id]: Math.max(0, Number(e.target.value) || 0),
                                      }))
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
                      {CATALOGO_CAPACIDAD_INSTALADA_REPS_3100.filter(
                        (c) => (editCapacidadCantidades[c.id] || 0) > 0,
                      )
                        .map((c) => `${editCapacidadCantidades[c.id]} ${c.unidad_medida} (${c.grupo})`)
                        .join(' · ') || 'Sin ambientes físicos registrados'}
                    </div>
                  </section>

                  <div className="case-save-actions">
                    <span>Guarda los cambios para actualizar la Ficha Técnica de la sede.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setEditingSedeFicha(false)}
                    >
                      Cancelar edición
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar cambios de la sede
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODALES DE CRITERIOS: EJECUCIÓN, CREACIÓN EN CATÁLOGO, ASIGNACIÓN Y FICHA
         ==================================================================== */}
      {modalMode && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div
            className="case-dialog record-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <Building2 size={20} />
                </span>
                <div>
                  <small>MÓDULO DE ADMINISTRACIÓN · EJECUCIÓN, SEMÁFOROS Y ALERTAS POR CORREO</small>
                  <h2>
                    {modalMode === 'crear_catalogo' &&
                      'Crear Nuevo Criterio en el Catálogo Administrativo'}
                    {modalMode === 'agregar' &&
                      'Asignar Criterio a Sede(s) con Alerta por Correo Electrónico'}
                    {modalMode === 'ficha' &&
                      `Ficha Técnica · ${activeCriterion?.codigo} ${activeCriterion?.titulo}`}
                    {modalMode === 'actualizar' &&
                      `Actualizar Criterio (Con Justificación) · ${activeCriterion?.codigo}`}
                    {modalMode === 'programar_anual' &&
                      `Programación Anual de Ejecución · ${activeCriterion?.codigo} ${activeCriterion?.titulo}`}
                    {modalMode === 'soporte' &&
                      `Ejecutar Criterio y Cargar Soporte · ${activeCriterion?.codigo}`}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {modalMode === 'crear_catalogo' && (
                <form onSubmit={handleCreateCatalogCriterion}>
                  <section className="case-section">
                    <h3>Definición del Nuevo Criterio y Regla de Actualización</h3>
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Código del Criterio <b>*</b>
                        </span>
                        <input
                          required
                          value={catNewCodigo}
                          onChange={(e) => setCatNewCodigo(e.target.value)}
                          placeholder="Ej. CTA-13"
                        />
                      </label>
                      <label className="form-field">
                        <span>Clasificación (Pestaña Cronograma)</span>
                        <select
                          value={catNewCategoria}
                          onChange={(e) =>
                            setCatNewCategoria(
                              e.target.value as AdminCatalogCriterion['categoria'],
                            )
                          }
                        >
                          {CLASIFICACIONES_CRONOGRAMA_ADMIN.map((cl) => (
                            <option key={cl} value={cl}>
                              {cl}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Nombre / Elemento del Criterio (Ítem) <b>*</b>
                        </span>
                        <input
                          required
                          value={catNewTitulo}
                          onChange={(e) => setCatNewTitulo(e.target.value)}
                          placeholder="Ej. Cámara de comercio, Lavado de tanques, Fumigación, RETIE..."
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Frecuencia de Actualización <b>*</b>
                        </span>
                        <select
                          value={catNewPeriodicidad}
                          onChange={(e) =>
                            setCatNewPeriodicidad(
                              e.target.value as PeriodicidadCriterioAdmin,
                            )
                          }
                        >
                          {FRECUENCIAS_CRONOGRAMA_ADMIN.map((fr) => (
                            <option key={fr} value={fr}>
                              {fr}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Alcance por Sede</span>
                        <select
                          value={catNewAlcance}
                          onChange={(e) =>
                            setCatNewAlcance(
                              e.target.value as 'todas_sedes' | 'nacional',
                            )
                          }
                        >
                          <option value="todas_sedes">
                            Se evalúa y cumple individualmente en CADA Sede
                          </option>
                          <option value="nacional">
                            Criterio NACIONAL (Se cumple en NACIONAL para todas las sedes)
                          </option>
                        </select>
                      </label>
                      <label className="form-field plan-wide">
                        <span>Descripción / Requisito Normativo</span>
                        <textarea
                          value={catNewDesc}
                          onChange={(e) => setCatNewDesc(e.target.value)}
                          placeholder="Describe el soporte requerido para dar cumplimiento a este criterio..."
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Nombre del Responsable <b>*</b>
                        </span>
                        <input
                          required
                          value={catNewResp}
                          onChange={(e) => setCatNewResp(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Correo Electrónico del Responsable (Para Alertas) <b>*</b>
                        </span>
                        <input
                          type="email"
                          required
                          value={catNewRespCorreo}
                          onChange={(e) => setCatNewRespCorreo(e.target.value)}
                          placeholder="responsable@calidadips.co"
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>
                      Al crear el criterio se notificará al correo del responsable y se activará el semáforo de vencimiento.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Crear Criterio y Activar Alertas
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'ficha' && activeCriterion && (() => {
                const fichaAnnualDates =
                  activeCriterion.fechas_programadas_anual &&
                  activeCriterion.fechas_programadas_anual.length > 0
                    ? activeCriterion.fechas_programadas_anual
                    : generateAnnualScheduleDates(
                        activeCriterion.fecha_programada_inicial || today,
                        activeCriterion.periodicidad || 'Anual',
                      )
                const fichaExecutedCount = fichaAnnualDates.filter(
                  (d) => d.estado === 'ejecutada',
                ).length

                return (
                <>
                  <section className="case-section">
                    <h3>Ficha Técnica del Criterio Administrativo / Financiero</h3>
                    <dl className="record-fields">
                      <div>
                        <dt>Código y Nombre del Criterio</dt>
                        <dd>
                          <strong>
                            {activeCriterion.codigo} — {activeCriterion.titulo}
                          </strong>
                        </dd>
                      </div>
                      <div>
                        <dt>Clasificación</dt>
                        <dd>{activeCriterion.categoria}</dd>
                      </div>
                      <div>
                        <dt>Sede Aplicable</dt>
                        <dd>
                          {db.sedes.find((s) => s.id === activeCriterion.sede_id)?.nombre ??
                            activeCriterion.sede_id}
                        </dd>
                      </div>
                      <div>
                        <dt>Responsable y Correo de Alerta</dt>
                        <dd>
                          {activeCriterion.responsable} ({activeCriterion.responsable_correo || 'calidad@calidadips.co'})
                        </dd>
                      </div>
                      <div className="record-field-wide">
                        <dt>Requisito Normativo (Resolución 3100 de 2019)</dt>
                        <dd>{activeCriterion.descripcion_normativa}</dd>
                      </div>
                      <div>
                        <dt>Fecha Programada Inicial</dt>
                        <dd>{formatDateES(activeCriterion.fecha_programada_inicial)}</dd>
                      </div>
                      <div>
                        <dt>Fecha de Vencimiento Vigente</dt>
                        <dd>{formatDateES(activeCriterion.fecha_vencimiento)}</dd>
                      </div>
                      <div>
                        <dt>Versión de Programación Anual</dt>
                        <dd>
                          <span
                            className={`plan-badge ${
                              (activeCriterion.version_programacion || 1) > 1
                                ? 'plan-reprogrammed'
                                : 'plan-complete'
                            }`}
                          >
                            Programación v{activeCriterion.version_programacion || 1}
                            {(activeCriterion.version_programacion || 1) > 1
                              ? ' (Reprogramada con justificación)'
                              : ' (Programación inicial)'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Versión General del Criterio (Auditoría)</dt>
                        <dd>
                          <span className="plan-badge plan-future">
                            Versión Criterio v{activeCriterion.version_criterio || 1}
                          </span>
                        </dd>
                      </div>

                      {/* Fila inferior completa: Datos de la Programación Anual, Frecuencia y Fechas Programadas */}
                      <div className="record-field-wide">
                        <dt>
                          Programación Anual Vigente · Frecuencia y Fechas de Ejecución en el Año
                        </dt>
                        <dd style={{ marginTop: 6 }}>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 8,
                              paddingBottom: 8,
                              borderBottom: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className="plan-badge plan-future" style={{ fontWeight: 700 }}>
                                Frecuencia: {activeCriterion.periodicidad || 'Anual'}
                              </span>
                              <span className="plan-badge plan-month" style={{ fontWeight: 700 }}>
                                Avance Anual: {fichaExecutedCount} de {fichaAnnualDates.length} fecha(s) ejecutadas
                              </span>
                            </div>
                            <small style={{ color: '#64748b', fontSize: 11 }}>
                              Observación: {activeCriterion.observaciones || 'Sin observaciones'}
                            </small>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                              gap: 8,
                            }}
                          >
                            {fichaAnnualDates.map((dItem) => {
                              const isExec = dItem.estado === 'ejecutada'
                              return (
                                <div
                                  key={dItem.id}
                                  style={{
                                    padding: '7px 10px',
                                    borderRadius: 7,
                                    border: isExec
                                      ? '1px solid #86efac'
                                      : '1px solid #cbd5e1',
                                    background: isExec ? '#f0fdf4' : '#f8fafc',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <div>
                                    <small
                                      style={{
                                        display: 'block',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: isExec ? '#166534' : '#475569',
                                      }}
                                    >
                                      {dItem.etiqueta}
                                    </small>
                                    <strong style={{ fontSize: 12, color: '#0f172a' }}>
                                      {formatDateES(dItem.fecha_programada)}
                                    </strong>
                                  </div>
                                  <span
                                    className={`plan-badge ${
                                      isExec ? 'plan-complete' : 'plan-future'
                                    }`}
                                    style={{ fontSize: 10 }}
                                  >
                                    {isExec ? 'Ejecutada' : 'Programada'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {/* 1. Historial de Ejecuciones y Versiones de Soportes */}
                  <section className="case-section">
                    <h3>
                      1. Versiones de Ejecución y Soportes Cargados ({activeCriterion.soportes.length})
                    </h3>
                    {activeCriterion.soportes.length === 0 ? (
                      <p style={{ color: '#a32828' }}>
                        No existen soportes registrados para este criterio. Estado actual:{' '}
                        <strong>NO CUMPLE (Con Alerta Diaria tras vencimiento)</strong>.
                      </p>
                    ) : (
                      <ul className="case-files">
                        {[...activeCriterion.soportes].reverse().map((s) => (
                          <li key={s.id}>
                            <span>
                              <span className="plan-badge plan-complete">
                                Soporte v{s.version}
                              </span>{' '}
                              <strong>{s.titulo}</strong>
                              <br />
                              {s.descripcion}
                              <br />
                              <small>
                                Emisión: {formatDateES(s.fecha_emision)} · Vencimiento:{' '}
                                <strong>{formatDateES(s.fecha_vencimiento)}</strong> · Responsable:{' '}
                                {s.responsable} · Archivo: <u>{s.archivo_nombre}</u>
                              </small>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {/* 2. Bitácora Inmutable Unificada de Versiones, Programación y Ajustes del Criterio */}
                  <section className="case-section">
                    <h3>
                      2. Bitácora Inmutable de Versiones y Ajustes del Criterio (
                      {activeCriterion.versiones_criterio &&
                      activeCriterion.versiones_criterio.length > 0
                        ? activeCriterion.versiones_criterio.length
                        : Math.max(1, activeCriterion.historial.length)}{' '}
                      versión/es)
                    </h3>
                    {activeCriterion.versiones_criterio &&
                    activeCriterion.versiones_criterio.length > 0 ? (
                      <ul className="case-files">
                        {activeCriterion.versiones_criterio.map((vc) => {
                          const badgeTone =
                            vc.tipo_cambio === 'Reprogramación de fechas'
                              ? 'plan-reprogrammed'
                              : vc.tipo_cambio === 'Programación inicial' ||
                                  vc.tipo_cambio === 'Ejecución de soporte'
                                ? 'plan-complete'
                                : 'plan-future'
                          return (
                            <li key={vc.id}>
                              <span>
                                <span className={`plan-badge ${badgeTone}`}>
                                  Versión v{vc.version} · {vc.tipo_cambio}
                                </span>{' '}
                                <strong>
                                  {vc.fecha_registro} · Usuario: {vc.usuario} · Frecuencia:{' '}
                                  {vc.periodicidad}
                                </strong>
                                <br />
                                <strong>Detalle de la versión v{vc.version}:</strong>{' '}
                                {vc.resumen_programacion} · <strong>Responsable:</strong>{' '}
                                {vc.responsable} ({vc.responsable_correo})
                                <br />
                                <strong>Justificación de auditoría:</strong> {vc.justificacion}
                                {vc.valores_anteriores && (
                                  <>
                                    <br />
                                    <small style={{ color: '#64748b' }}>
                                      {vc.valores_anteriores}
                                    </small>
                                  </>
                                )}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    ) : activeCriterion.historial.length === 0 ? (
                      <ul className="case-files">
                        <li>
                          <span>
                            <span className="plan-badge plan-complete">
                              Versión v1 · Programación inicial
                            </span>{' '}
                            <strong>
                              Frecuencia: {activeCriterion.periodicidad || 'Anual'} · Responsable:{' '}
                              {activeCriterion.responsable} (
                              {activeCriterion.responsable_correo || 'calidad@calidadips.co'})
                            </strong>
                            <br />
                            <strong>Fechas programadas en el año:</strong>{' '}
                            {(
                              activeCriterion.fechas_programadas_anual ??
                              generateAnnualScheduleDates(
                                activeCriterion.fecha_programada_inicial || today,
                                activeCriterion.periodicidad || 'Anual',
                              )
                            )
                              .map((d) => `#${d.numero}: ${formatDateES(d.fecha_programada)}`)
                              .join(' · ')}
                            <br />
                            <strong>Justificación de auditoría:</strong> Programación inicial del año (Versión v1)
                          </span>
                        </li>
                      </ul>
                    ) : (
                      <ul className="case-files">
                        {activeCriterion.historial.map((h) => (
                          <li key={h.id}>
                            <span>
                              <strong>
                                {formatDateES(h.fecha)} · {h.accion} ({h.usuario})
                              </strong>
                              <br />
                              Justificación: {h.justificacion}
                              {h.detalle_anterior && (
                                <>
                                  <br />
                                  <small>{h.detalle_anterior}</small>
                                </>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
                )
              })()}

              {modalMode === 'agregar' && (
                <form onSubmit={handleAddCriterion}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Seleccionar Criterio del Catálogo <b>*</b>
                        </span>
                        <select
                          value={catId}
                          onChange={(e) => {
                            setCatId(e.target.value)
                            const found = catalogoActual.find((x) => x.id === e.target.value)
                            if (found) {
                              setNewPeriodicidad(found.periodicidad)
                              setNewFechaVenc(
                                calculateExpirationByPeriodicidad(newFechaProg, found.periodicidad),
                              )
                            }
                          }}
                        >
                          {catalogoActual.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              [{cat.codigo}] {cat.titulo} ({cat.periodicidad})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>
                          Sede Destino <b>*</b>
                        </span>
                        <select value={newSedeId} onChange={(e) => setNewSedeId(e.target.value)}>
                          <option value="TODAS_LAS_SEDES">
                            Todas las Sedes Operativas (Cumplimiento en cada sede)
                          </option>
                          {sedesOrdenadas.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Frecuencia de Actualización</span>
                        <select
                          value={newPeriodicidad}
                          onChange={(e) => {
                            const per = e.target.value as PeriodicidadCriterioAdmin
                            setNewPeriodicidad(per)
                            setNewFechaVenc(calculateExpirationByPeriodicidad(newFechaProg, per))
                          }}
                        >
                          {FRECUENCIAS_CRONOGRAMA_ADMIN.map((fr) => (
                            <option key={fr} value={fr}>
                              {fr}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>
                          Nombre del Responsable <b>*</b>
                        </span>
                        <input
                          required
                          value={newResp}
                          onChange={(e) => setNewResp(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Correo Electrónico del Responsable (Obligatorio para Alertas) <b>*</b>
                        </span>
                        <input
                          type="email"
                          required
                          value={newRespCorreo}
                          onChange={(e) => setNewRespCorreo(e.target.value)}
                          placeholder="responsable@calidadips.co"
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Fecha Programada Inicial <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={newFechaProg}
                          onChange={(e) => setNewFechaProg(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Fecha de Vencimiento <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={newFechaVenc}
                          onChange={(e) => setNewFechaVenc(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Observación inicial</span>
                        <textarea
                          value={newObs}
                          onChange={(e) => setNewObs(e.target.value)}
                          placeholder="Observaciones de programación (se enviará al Plan de Trabajo y se activarán alertas al correo)..."
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>
                      Se avisará por correo al responsable antes del vencimiento, el día del vencimiento y diariamente si se vence sin cumplir.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar, Notificar al Correo y Enviar a Plan de Trabajo
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'actualizar' && activeCriterion && (
                <form onSubmit={handleUpdateCriterion}>
                  <section className="case-section">
                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Nueva Fecha de Vencimiento / Programación <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={updFechaVenc}
                          onChange={(e) => setUpdFechaVenc(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Responsable <b>*</b>
                        </span>
                        <input
                          required
                          value={updResp}
                          onChange={(e) => setUpdResp(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Correo Electrónico del Responsable (Recibe Alertas de Semáforo) <b>*</b>
                        </span>
                        <input
                          type="email"
                          required
                          value={updRespCorreo}
                          onChange={(e) => setUpdRespCorreo(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Observaciones del criterio</span>
                        <textarea
                          value={updObs}
                          onChange={(e) => setUpdObs(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Justificación obligatoria de la actualización <b>*</b>
                        </span>
                        <textarea
                          required
                          value={updJustificacion}
                          onChange={(e) => setUpdJustificacion(e.target.value)}
                          placeholder="Indica el motivo del cambio para conservar en el historial de auditoría..."
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>Se conservará el historial de actualizaciones y se sincronizará con Plan de Trabajo.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Guardar actualización justificada
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'soporte' && activeCriterion && (
                <form onSubmit={handleExecuteCriterionSupport}>
                  <section className="case-section">
                    <h3>
                      Ejecución del Criterio: {activeCriterion.codigo} · {activeCriterion.titulo}
                    </h3>
                    <p>
                      Al ejecutar el criterio adjuntando su descripción, fecha de vencimiento y soporte, el estado cambia a <strong>Cumple</strong> (ajustándose dinámicamente con el tiempo) y se detienen los avisos diarios de incumplimiento hasta el nuevo ciclo.
                    </p>
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Título del Soporte Ejecutado <b>*</b>
                        </span>
                        <input
                          required
                          value={sopTitulo}
                          onChange={(e) => setSopTitulo(e.target.value)}
                          placeholder="Ej. Certificado Cámara de Comercio Renovado Mes Noviembre 2026"
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>
                          Descripción del Seguimiento / Ejecución <b>*</b>
                        </span>
                        <textarea
                          required
                          value={sopDesc}
                          onChange={(e) => setSopDesc(e.target.value)}
                          placeholder="Describe la gestión realizada y el contenido del soporte que demuestra el cumplimiento..."
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Fecha de Emisión / Ejecución <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={sopEmision}
                          onChange={(e) => {
                            setSopEmision(e.target.value)
                            setSopVencimiento(
                              calculateExpirationByPeriodicidad(
                                e.target.value,
                                activeCriterion.periodicidad,
                              ),
                            )
                          }}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Nueva Fecha de Vencimiento ({activeCriterion.periodicidad || 'Según vigencia'}) <b>*</b>
                        </span>
                        <input
                          type="date"
                          required
                          value={sopVencimiento}
                          onChange={(e) => setSopVencimiento(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Responsable <b>*</b>
                        </span>
                        <input
                          required
                          value={sopResp}
                          onChange={(e) => setSopResp(e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>
                          Correo del Responsable (Alertas próximo vencimiento) <b>*</b>
                        </span>
                        <input
                          type="email"
                          required
                          value={sopRespCorreo}
                          onChange={(e) => setSopRespCorreo(e.target.value)}
                        />
                      </label>
                      <label className="form-field plan-wide">
                        <span>Archivo Soporte (PDF / Imagen) *</span>
                        <input
                          type="file"
                          onChange={(e) => setSopArchivo(e.target.files?.[0]?.name || '')}
                        />
                      </label>
                    </div>
                  </section>
                  <div className="case-save-actions">
                    <span>
                      Se creará la versión v{(activeCriterion.soportes.length || 0) + 1} conservando el historial de versiones anteriores.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      Registrar Ejecución y Cumplir Compromiso
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'programar_anual' && activeCriterion && (
                <form onSubmit={handleSaveAnnualSchedule}>
                  <section className="case-section">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <h3 style={{ margin: 0 }}>
                        Programador Anual de Ejecución: {activeCriterion.codigo} — {activeCriterion.titulo}
                      </h3>
                      <span
                        className={`plan-badge ${
                          (activeCriterion.versiones_programacion?.length || 0) > 0
                            ? 'plan-reprogrammed'
                            : 'plan-complete'
                        }`}
                      >
                        {(activeCriterion.versiones_programacion?.length || 0) > 0
                          ? `Ajuste sobre v${activeCriterion.versiones_programacion?.length} → Creará Versión v${(activeCriterion.versiones_programacion?.length || 0) + 1} (Requiere Justificación)`
                          : 'Programación Inicial — Versión v1 (Sin justificación)'}
                      </span>
                    </div>

                    {progError && (
                      <div className="portal-error" role="alert" style={{ marginBottom: 12 }}>
                        {progError}
                      </div>
                    )}

                    <p>
                      Selecciona la <strong>frecuencia de ejecución</strong> y elige la <strong>Fecha #1</strong>: el sistema calculará y llenará automáticamente todas las fechas siguientes del año como sugerencia, permitiéndote editar cualquiera de ellas si necesitas un ajuste puntual.
                    </p>

                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Frecuencia de Ejecución Anual (Define cuántas veces se programa en el año) <b>*</b>
                        </span>
                        <select
                          value={progPeriodicidad}
                          onChange={(e) => {
                            const nextPer = e.target.value as PeriodicidadCriterioAdmin
                            setProgPeriodicidad(nextPer)
                            const baseDate =
                              progFechasAnuales[0]?.fecha_programada || progFechaInicial
                            setProgFechaInicial(baseDate)
                            setProgFechasAnuales(
                              generateAnnualScheduleDates(
                                baseDate,
                                nextPer,
                                progFechasAnuales,
                              ),
                            )
                          }}
                        >
                          {FRECUENCIAS_CRONOGRAMA_ADMIN.map((fr) => (
                            <option key={fr} value={fr}>
                              {fr}{' '}
                              {fr === 'Mensual'
                                ? '— 12 veces al año (autocompleta cada +1 mes)'
                                : fr === 'Bimestral'
                                  ? '— 6 veces al año (autocompleta cada +2 meses)'
                                  : fr === 'Trimestral'
                                    ? '— 4 veces al año (autocompleta cada +3 meses)'
                                    : fr === 'Cuatrimestral'
                                      ? '— 3 veces al año (autocompleta cada +4 meses)'
                                      : fr === 'Semestral'
                                        ? '— 2 veces al año (autocompleta cada +6 meses)'
                                        : '— 1 vez al año'}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="form-field">
                        <span>
                          Responsable del Criterio <b>*</b>
                        </span>
                        <input
                          required
                          value={progResponsable}
                          onChange={(e) => setProgResponsable(e.target.value)}
                        />
                      </label>

                      <label className="form-field">
                        <span>
                          Correo del Responsable (Notificaciones de cada fecha) <b>*</b>
                        </span>
                        <input
                          type="email"
                          required
                          value={progResponsableCorreo}
                          onChange={(e) => setProgResponsableCorreo(e.target.value)}
                        />
                      </label>
                    </div>

                    {/* Grilla editable de las fechas de ejecución del año con autocompletado desde la Fecha #1 */}
                    <div
                      style={{
                        marginTop: 14,
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        padding: 14,
                        background: '#f8fafc',
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 13, color: '#172c4c', display: 'block' }}>
                            Fechas de Ejecución Programadas en el Año ({progFechasAnuales.length} fecha(s))
                          </strong>
                          <small style={{ color: '#475569', fontSize: 11.5 }}>
                            Al seleccionar o cambiar la <strong>Fecha #1</strong>, las fechas siguientes se autocompletan automáticamente según la frecuencia elegida (y puedes ajustar cualquiera manualmente).
                          </small>
                        </div>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => {
                            const lastDate =
                              progFechasAnuales[progFechasAnuales.length - 1]?.fecha_programada ||
                              progFechaInicial
                            const nextNum = progFechasAnuales.length + 1
                            setProgFechasAnuales([
                              ...progFechasAnuales,
                              {
                                id: `prog-extra-${Date.now()}-${nextNum}`,
                                numero: nextNum,
                                etiqueta: `Fecha Programada #${nextNum}`,
                                fecha_programada: calculateExpirationByPeriodicidad(
                                  lastDate,
                                  progPeriodicidad,
                                ),
                                estado: 'pendiente',
                              },
                            ])
                          }}
                        >
                          <Plus size={13} /> Agregar fecha adicional al año
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: 10,
                        }}
                      >
                        {progFechasAnuales.map((item, idx) => {
                          const isFirst = idx === 0
                          const stepLabel =
                            progPeriodicidad === 'Mensual'
                              ? `+${idx} mes(es)`
                              : progPeriodicidad === 'Bimestral'
                                ? `+${idx * 2} meses`
                                : progPeriodicidad === 'Trimestral'
                                  ? `+${idx * 3} meses`
                                  : progPeriodicidad === 'Cuatrimestral'
                                    ? `+${idx * 4} meses`
                                    : progPeriodicidad === 'Semestral'
                                      ? `+${idx * 6} meses`
                                      : 'Editable'

                          return (
                            <div
                              key={item.id}
                              style={{
                                border:
                                  item.estado === 'ejecutada'
                                    ? '1.5px solid #15966a'
                                    : isFirst
                                      ? '1.5px solid #2563eb'
                                      : '1px solid #cbd5e1',
                                borderRadius: 8,
                                padding: 10,
                                background: isFirst ? '#eff6ff' : '#ffffff',
                                display: 'grid',
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <strong style={{ fontSize: 12, color: '#0f172a' }}>
                                  {item.etiqueta}
                                </strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span
                                    className={`plan-badge ${
                                      item.estado === 'ejecutada'
                                        ? 'plan-complete'
                                        : isFirst
                                          ? 'plan-month'
                                          : 'plan-future'
                                    }`}
                                    style={{ fontSize: 10 }}
                                  >
                                    {item.estado === 'ejecutada'
                                      ? 'Ejecutada'
                                      : isFirst
                                        ? '1.ª Fecha Base'
                                        : `Sugerida (${stepLabel})`}
                                  </span>
                                  {progFechasAnuales.length > 1 && !isFirst && (
                                    <button
                                      type="button"
                                      title="Quitar esta fecha"
                                      onClick={() =>
                                        setProgFechasAnuales((prev) =>
                                          prev.filter((_, i) => i !== idx),
                                        )
                                      }
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#dc2626',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontSize: 14,
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>

                              <input
                                type="date"
                                value={item.fecha_programada}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (!val) return
                                  if (isFirst) {
                                    // Al cambiar la 1.ª fecha, recalcula y autocompleta automáticamente todas las siguientes fechas del año
                                    setProgFechaInicial(val)
                                    setProgFechasAnuales(
                                      generateAnnualScheduleDates(
                                        val,
                                        progPeriodicidad,
                                        progFechasAnuales,
                                      ),
                                    )
                                  } else {
                                    // Permite editar libremente cualquiera de las fechas siguientes (#2..#N) si requiere ajuste
                                    setProgFechasAnuales((prev) =>
                                      prev.map((f, i) =>
                                        i === idx ? { ...f, fecha_programada: val } : f,
                                      ),
                                    )
                                  }
                                }}
                                style={{
                                  height: 36,
                                  padding: '0 10px',
                                  borderRadius: 6,
                                  border: isFirst ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  fontSize: 12.5,
                                  fontWeight: isFirst ? 600 : 500,
                                }}
                              />

                              <small style={{ fontSize: 10.5, color: isFirst ? '#1d4ed8' : '#64748b' }}>
                                {isFirst
                                  ? 'Cambia esta fecha para autocompletar las siguientes'
                                  : 'Fecha sugerida automáticamente · Puedes editarla'}
                              </small>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Control de Auditoría: Si ya existe una programación (v1), solicita justificación obligatoria para crear v2, v3... */}
                    {(activeCriterion.versiones_programacion?.length || 0) > 0 && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: 14,
                          borderRadius: 10,
                          border: '1.5px solid #f59e0b',
                          background: '#fffbeb',
                        }}
                      >
                        <label className="form-field" style={{ marginBottom: 0 }}>
                          <span style={{ color: '#92400e', fontWeight: 700, fontSize: 12.5 }}>
                            Control de Auditoría · Justificación obligatoria del ajuste de programación (Se guardará como Versión v
                            {(activeCriterion.versiones_programacion?.length || 0) + 1} conservando la v
                            {activeCriterion.versiones_programacion?.length}) <b>*</b>
                          </span>
                          <textarea
                            required
                            value={progJustificacion}
                            onChange={(e) => setProgJustificacion(e.target.value)}
                            placeholder="Explica el motivo por el cual se reprograman o ajustan las fechas de este criterio para dejar trazabilidad en auditoría..."
                            style={{
                              marginTop: 6,
                              background: '#ffffff',
                              border: '1px solid #fcd34d',
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </section>

                  <div className="case-save-actions">
                    <span>
                      {(activeCriterion.versiones_programacion?.length || 0) > 0
                        ? `Se conservará la versión anterior y se registrará la nueva Versión v${(activeCriterion.versiones_programacion?.length || 0) + 1} con tu justificación.`
                        : 'Esta es la primera programación del criterio (Versión v1) y no requiere justificación.'}
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      <CheckCircle2 size={14} />{' '}
                      {(activeCriterion.versiones_programacion?.length || 0) > 0
                        ? `Guardar Reprogramación (Versión v${(activeCriterion.versiones_programacion?.length || 0) + 1})`
                        : 'Guardar Programación Inicial (Versión v1)'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visor Ampliado de Fotografía (Lightbox estilo PESV) */}
      {previewPhoto && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 130 }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="case-dialog record-dialog"
            style={{ width: 'min(780px, calc(100vw - 40px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <Camera size={20} />
                </span>
                <div>
                  <small>REGISTRO FOTOGRÁFICO DE ÁREA · AUDITORÍA LOCATIVA</small>
                  <h2>{previewPhoto.title}</h2>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setPreviewPhoto(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="case-dialog-body" style={{ textAlign: 'center' }}>
              <img
                src={previewPhoto.src}
                alt={previewPhoto.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '68vh',
                  objectFit: 'contain',
                  borderRadius: 12,
                  border: '1px solid #d5dfec',
                  margin: '0 auto',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
