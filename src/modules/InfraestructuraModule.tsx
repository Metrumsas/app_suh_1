import { useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileDown,
  FilePlus2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  Wrench,
  X,
} from 'lucide-react'
import type {
  AdminScheduledExecutionDate,
  AppUser,
  CalificacionCondicionFisica,
  ClasificacionMantenimientoInfra,
  InfraMaintenanceActivity,
  InfraPhysicalItemEval,
  PeriodicidadCriterioAdmin,
  Sede,
  SuhDatabase,
} from '../lib/types'
import { CONDICIONES_FISICAS_SEDE, FRECUENCIAS_CRONOGRAMA_ADMIN } from '../lib/normativa-3100'
import {
  calculateExpirationByPeriodicidad,
  diffDays,
  evaluateSemaphore3060,
  formatCOP,
  formatDateES,
  generateAnnualScheduleDates,
  todayISO,
} from '../lib/calculations'
import { pushToWorkPlan, updateDb } from '../lib/store'
import { SarlaftPdfTemplate } from '../lib/pdf-reports'

const CLASIFICACIONES_INFRA: ClasificacionMantenimientoInfra[] = [
  'Obra Civil, Pisos y Pintura',
  'Hidrosanitario',
  'Eléctrico e Iluminación',
  'Cubiertas y Techos',
  'Carpintería, Puertas y Ventanas',
  'Sistemas de Emergencia y Detección',
  'Accesibilidad y Señalización',
]

function defaultClasifForPhysicalItem(key: string): ClasificacionMantenimientoInfra {
  if (key === 'pintura' || key === 'piso') return 'Obra Civil, Pisos y Pintura'
  if (key === 'techos') return 'Cubiertas y Techos'
  if (key === 'ventanas' || key === 'puertas') return 'Carpintería, Puertas y Ventanas'
  if (key === 'iluminacion' || key === 'apagadores' || key === 'puntos_electricos')
    return 'Eléctrico e Iluminación'
  if (
    key === 'luces_emergencia' ||
    key === 'detectores_humo' ||
    key === 'alarma_emergencias'
  )
    return 'Sistemas de Emergencia y Detección'
  if (key === 'banos') return 'Hidrosanitario'
  if (key === 'accesibilidad' || key === 'senalizacion')
    return 'Accesibilidad y Señalización'
  return 'Obra Civil, Pisos y Pintura'
}

function getActivityDates(act: InfraMaintenanceActivity, today: string): AdminScheduledExecutionDate[] {
  if (act.fechas_programadas_anual && act.fechas_programadas_anual.length > 0) {
    return act.fechas_programadas_anual
  }
  const generated = generateAnnualScheduleDates(
    act.plazo_ejecucion || today,
    act.periodicidad || 'Semestral',
  )
  if (act.estado === 'Ejecutada' && generated.length > 0) {
    generated[0].estado = 'ejecutada'
  }
  return generated
}

function generateInfraSedePlanPdf(
  sede: Sede,
  activities: InfraMaintenanceActivity[],
  evalFisica: InfraPhysicalItemEval[],
) {
  const today = todayISO()
  const tpl = new SarlaftPdfTemplate(
    `Plan Anual de Mantenimiento de Infraestructura y Condiciones Locativas — ${sede.nombre}`,
    'Módulo de Infraestructura · Res. 3100',
    sede.codigo_reps || sede.id,
  )

  const totalAct = activities.length
  const totalExec = activities.filter((a) => a.estado === 'Ejecutada').length
  const pctAct = totalAct > 0 ? Math.round((totalExec / totalAct) * 100) : 0
  const presProg = activities.reduce((acc, a) => acc + (Number(a.presupuesto) || 0), 0)
  const presEjec = activities.reduce((acc, a) => acc + (Number(a.presupuesto_ejecutado) || 0), 0)

  tpl.box(
    'RESUMEN EJECUTIVO DEL PLAN ANUAL DE MANTENIMIENTO LOCATIVO DE LA SEDE',
    `${sede.nombre.toUpperCase()} (REPS: ${sede.codigo_reps}) · Ubicación: ${sede.departamento ? `${sede.municipio}, ${sede.departamento}` : sede.ciudad} (${sede.direccion}) · Avance Anual: ${pctAct}% (${totalExec}/${totalAct} actividades ejecutadas) · Presupuesto Programado: ${formatCOP(presProg)} · Ejecutado: ${formatCOP(presEjec)}`,
    true,
  )

  tpl.section('Actividades programadas en el Plan de Mantenimiento Anual de la Sede')
  if (activities.length === 0) {
    tpl.box('SIN ACTIVIDADES REGISTRADAS', 'No existen actividades de mantenimiento programadas para esta sede.')
  } else {
    const rows = activities.map((act) => {
      const dates = getActivityDates(act, today)
      const sem = evaluateSemaphore3060(
        act.plazo_ejecucion,
        today,
        act.estado === 'Ejecutada',
      )
      const datesStr = dates
        .map(
          (d) =>
            `#${d.numero}: ${formatDateES(d.fecha_programada)} (${d.estado === 'ejecutada' ? 'Ejecutada' : diffDays(d.fecha_programada, today) < 0 ? 'VENCIDA' : 'Prog.'})`,
        )
        .join(' · ')
      const estadoPdf =
        act.estado === 'Ejecutada'
          ? `CUMPLE · EJECUTADA\n(${formatDateES(act.plazo_ejecucion)})`
          : sem.days < 0
            ? `NO CUMPLE · VENCIDA\nHace ${Math.abs(sem.days)} d (${formatDateES(act.plazo_ejecucion)})`
            : `${act.estado.toUpperCase()}\nVence en ${sem.days} d (${formatDateES(act.plazo_ejecucion)})`
      return [
        `${act.titulo}\n(${act.clasificacion})`,
        `${act.periodicidad || 'Semestral'}\n${datesStr}`,
        estadoPdf,
        `${act.responsable}\n${act.responsable_correo || ''}`,
        `Prog: ${formatCOP(act.presupuesto || 0)}\nEjec: ${formatCOP(act.presupuesto_ejecutado || 0)}`,
      ]
    })
    tpl.table(
      [
        'ACTIVIDAD Y CLASIFICACIÓN',
        'FRECUENCIA Y FECHAS DEL AÑO',
        'ESTADO / PLAZO',
        'RESPONSABLE',
        'PRESUPUESTO',
      ],
      rows,
      [0.28, 0.25, 0.15, 0.16, 0.16],
    )
  }

  tpl.section('Evaluación de las 14 condiciones físicas locativas de la sede')
  tpl.table(
    ['ÍTEM EVALUADO', 'CALIFICACIÓN', 'FORTALEZA', 'DEBILIDAD Y ACCIÓN PROGRAMADA'],
    evalFisica.map((it) => {
      const fort = it.fortaleza ?? it.observacion ?? '—'
      const deb = it.debilidad ?? it.hallazgo ?? '—'
      const prog = it.programacion_mantenimiento
      const progStr =
        (it.calificacion === 'parcial' || it.calificacion === 'no_cumple') && prog
          ? `Debilidad: ${deb} | Prog. Mantenimiento: ${prog.titulo} (${prog.clasificacion} · ${prog.periodicidad} · Fecha: ${formatDateES(prog.fecha_ejecucion)} · Presup: ${formatCOP(prog.presupuesto)} · Resp: ${prog.responsable})`
          : deb
      return [
        it.item_nombre,
        it.calificacion === 'cumple'
          ? 'CUMPLE'
          : it.calificacion === 'parcial'
            ? 'CUMPLE PARCIALMENTE'
            : 'NO CUMPLE',
        fort,
        progStr,
      ]
    }),
    [0.28, 0.14, 0.24, 0.34],
  )

  const pdf = tpl.finish()
  pdf.save(`Plan_Mantenimiento_Infraestructura_${sede.nombre.replace(/\s+/g, '_')}.pdf`)
}

export default function InfraestructuraModule({
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

  // 5 Ventanas idénticas en estructura al módulo Administrativo
  const [windowView, setWindowView] = useState<
    'tarjetas' | 'calendario' | 'matriz' | 'evaluacion' | 'alertas'
  >('tarjetas')

  const [selectedSedeIds, setSelectedSedeIds] = useState<string[]>([])
  const [activeSedeId, setActiveSedeId] = useState<string>(
    sedesOperativas[0]?.id || 'sede-bogota',
  )
  const [collapsedClasifs, setCollapsedClasifs] = useState<Record<string, boolean>>({})

  const [calendarMonth, setCalendarMonth] = useState(() => today.slice(0, 7))
  const [calendarYear, setCalendarYear] = useState(() => today.slice(0, 4))
  const [calendarFilterLevel, setCalendarFilterLevel] = useState<'todos' | 'cumple' | 'no_cumple'>(
    'todos',
  )
  const [alertTabFilter, setAlertTabFilter] = useState<
    'todas' | 'vencidos' | 'mes_o_criticos' | 'preventivas'
  >('todas')

  // Modales de Actividades de Mantenimiento Locativo
  const [selectedActivity, setSelectedActivity] = useState<InfraMaintenanceActivity | null>(null)
  const [modalMode, setModalMode] = useState<
    'crear' | 'programar_fechas' | 'seguimiento' | 'ajustar' | 'ficha' | null
  >(null)

  // Campos Formulario Crear / Programar Actividad de Mantenimiento
  const [mSedeId, setMSedeId] = useState(sedesOperativas[0]?.id || 'sede-bogota')
  const [mClasificacion, setMClasificacion] = useState<ClasificacionMantenimientoInfra>(
    'Obra Civil, Pisos y Pintura',
  )
  const [mTitulo, setMTitulo] = useState('')
  const [mDesc, setMDesc] = useState('')
  const [mPeriodicidad, setMPeriodicidad] = useState<PeriodicidadCriterioAdmin>('Semestral')
  const [mFechasAnuales, setMFechasAnuales] = useState<AdminScheduledExecutionDate[]>(() =>
    generateAnnualScheduleDates(today, 'Semestral'),
  )
  const [mPresupuesto, setMPresupuesto] = useState('2500000')
  const [mPresupuestoEjec, setMPresupuestoEjec] = useState('0')
  const [mResp, setMResp] = useState(currentUser.nombre_completo)
  const [mRespCorreo, setMRespCorreo] = useState(currentUser.correo)
  const [mSoportePdfNombre, setMSoportePdfNombre] = useState('')
  const [mSoportePdfData, setMSoportePdfData] = useState('')
  const [mJustificacion, setMJustificacion] = useState('')
  const [mFormError, setMFormError] = useState('')

  // Campos Formulario Ejecutar / Seguimiento (con Soporte PDF + 1 a 4 Fotografías reales)
  const [segDesc, setSegDesc] = useState('')
  const [segEstado, setSegEstado] = useState<InfraMaintenanceActivity['estado']>('Ejecutada')
  const [segPresupuestoEjec, setSegPresupuestoEjec] = useState('0')
  const [segSoporteNombre, setSegSoporteNombre] = useState('')
  const [segSoporteData, setSegSoporteData] = useState('')
  const [segPhotoSlots, setSegPhotoSlots] = useState<
    ({ id: string; leyenda: string; url: string } | null)[]
  >([null, null, null, null])
  const [segError, setSegError] = useState('')
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; title: string } | null>(null)

  // Evaluación de 14 condiciones físicas de la sede activa
  const currentSedeObj =
    sedesOperativas.find((s) => s.id === activeSedeId) || sedesOperativas[0]
  const existingEval = db.infra_evaluaciones.find((e) => e.sede_id === currentSedeObj?.id)

  const buildEvalItemsForSede = (sedeObj?: Sede, foundEval?: typeof existingEval): InfraPhysicalItemEval[] =>
    CONDICIONES_FISICAS_SEDE.map((c) => {
      const found = foundEval?.items.find((i) => i.item_key === c.key)
      const defaultProg = {
        clasificacion: defaultClasifForPhysicalItem(c.key),
        titulo: `Mantenimiento y adecuación locativa — ${c.nombre.split('(')[0].trim()}`,
        descripcion: '',
        periodicidad: 'Unica vez' as PeriodicidadCriterioAdmin,
        fecha_ejecucion: calculateExpirationByPeriodicidad(today, 'Mensual'),
        presupuesto: 0,
        responsable: sedeObj?.director_responsable || currentUser.nombre_completo,
        responsable_correo: currentUser.correo,
        soporte_pdf_nombre: '',
        soporte_pdf_data: '',
      }
      if (found) {
        return {
          ...found,
          fortaleza: found.fortaleza ?? found.observacion ?? 'Verificado en óptimas condiciones.',
          debilidad: found.debilidad ?? found.hallazgo ?? '',
          programacion_mantenimiento: found.programacion_mantenimiento || defaultProg,
        }
      }
      return {
        item_key: c.key,
        item_nombre: c.nombre,
        calificacion: 'cumple',
        observacion: 'Verificado en óptimas condiciones.',
        fortaleza: 'Verificado en óptimas condiciones.',
        debilidad: '',
        hallazgo: '',
        programacion_mantenimiento: defaultProg,
      }
    })

  const [evalItems, setEvalItems] = useState<InfraPhysicalItemEval[]>(() =>
    buildEvalItemsForSede(currentSedeObj, existingEval),
  )

  const [evalPhotoSlots, setEvalPhotoSlots] = useState<
    ({ id: string; leyenda: string; url: string } | null)[]
  >(() => {
    const saved = existingEval?.fotos_evaluacion || []
    return [saved[0] ?? null, saved[1] ?? null, saved[2] ?? null, saved[3] ?? null]
  })
  const [evalFormError, setEvalFormError] = useState('')

  const selectSingleSede = (sedeId: string) => {
    setActiveSedeId(sedeId)
    setSelectedSedeIds([sedeId])
    const targetSede = sedesOperativas.find((s) => s.id === sedeId)
    const foundEval = db.infra_evaluaciones.find((e) => e.sede_id === sedeId)
    setEvalItems(buildEvalItemsForSede(targetSede, foundEval))
    const savedPhotos = foundEval?.fotos_evaluacion || []
    setEvalPhotoSlots([
      savedPhotos[0] ?? null,
      savedPhotos[1] ?? null,
      savedPhotos[2] ?? null,
      savedPhotos[3] ?? null,
    ])
    setEvalFormError('')
  }

  const q = query.trim().toLowerCase()
  const filteredActivities = db.infra_mantenimientos
    .filter((a) => selectedSedeIds.length === 0 || selectedSedeIds.includes(a.sede_id))
    .filter(
      (a) =>
        !q ||
        `${a.clasificacion} ${a.titulo} ${a.descripcion} ${a.responsable} ${a.responsable_correo ?? ''}`
          .toLowerCase()
          .includes(q),
    )

  const evaluatedActivities = filteredActivities.map((act) => ({
    act,
    sem: evaluateSemaphore3060(act.plazo_ejecucion, today, act.estado === 'Ejecutada'),
    dates: getActivityDates(act, today),
  }))

  // KPIs Superiores
  const totalAct = evaluatedActivities.length
  const ejecutadasAct = evaluatedActivities.filter((x) => x.act.estado === 'Ejecutada').length
  const pctEjecucionAct = totalAct > 0 ? Math.round((ejecutadasAct / totalAct) * 100) : 0

  const currentMonthPrefix = today.slice(0, 7)
  let totalFechasAnio = 0
  let ejecutadasFechasAnio = 0
  let fechasMesActual = 0
  for (const item of evaluatedActivities) {
    totalFechasAnio += item.dates.length
    ejecutadasFechasAnio += item.dates.filter((d) => d.estado === 'ejecutada').length
    fechasMesActual += item.dates.filter((d) =>
      d.fecha_programada.startsWith(`${currentMonthPrefix}-`),
    ).length
  }

  const vencidasCount = evaluatedActivities.filter(
    (x) => x.act.estado !== 'Ejecutada' && x.sem.days < 0,
  ).length
  const criticasCount = evaluatedActivities.filter(
    (x) => x.act.estado !== 'Ejecutada' && x.sem.days >= 0 && x.sem.days <= 30,
  ).length
  const preventivasCount = evaluatedActivities.filter(
    (x) => x.act.estado !== 'Ejecutada' && x.sem.days > 30 && x.sem.days <= 60,
  ).length
  const totalAlertasCount = vencidasCount + criticasCount + preventivasCount

  const presupuestoTotalProg = evaluatedActivities.reduce(
    (acc, x) => acc + (Number(x.act.presupuesto) || 0),
    0,
  )
  const presupuestoTotalEjec = evaluatedActivities.reduce(
    (acc, x) => acc + (Number(x.act.presupuesto_ejecutado) || 0),
    0,
  )

  const openCreateModal = (defaultSedeId?: string) => {
    const targetSede = defaultSedeId || activeSedeId || sedesOperativas[0]?.id || 'sede-bogota'
    const sedeObj = sedesOperativas.find((s) => s.id === targetSede)
    setSelectedActivity(null)
    setMSedeId(targetSede)
    setMClasificacion('Obra Civil, Pisos y Pintura')
    setMTitulo('')
    setMDesc('')
    setMPeriodicidad('Semestral')
    setMFechasAnuales(generateAnnualScheduleDates(today, 'Semestral'))
    setMPresupuesto('2500000')
    setMPresupuestoEjec('0')
    setMResp(sedeObj?.director_responsable || currentUser.nombre_completo)
    setMRespCorreo(currentUser.correo)
    setMSoportePdfNombre('')
    setMSoportePdfData('')
    setMJustificacion('')
    setMFormError('')
    setModalMode('crear')
  }

  const openProgramarFechasModal = (act: InfraMaintenanceActivity) => {
    setSelectedActivity(act)
    setMSedeId(act.sede_id)
    setMClasificacion(act.clasificacion)
    setMTitulo(act.titulo)
    setMDesc(act.descripcion)
    const per = act.periodicidad || 'Semestral'
    setMPeriodicidad(per)
    setMFechasAnuales(structuredClone(getActivityDates(act, today)))
    setMPresupuesto(String(act.presupuesto ?? 0))
    setMPresupuestoEjec(String(act.presupuesto_ejecutado ?? 0))
    setMResp(act.responsable)
    setMRespCorreo(act.responsable_correo || currentUser.correo)
    setMSoportePdfNombre(act.soporte_pdf_nombre || '')
    setMSoportePdfData(act.soporte_pdf_data || '')
    setMJustificacion('')
    setMFormError('')
    setModalMode('programar_fechas')
  }

  const openAjustarModal = (act: InfraMaintenanceActivity) => {
    openProgramarFechasModal(act)
    setModalMode('ajustar')
  }

  const openSeguimientoModal = (act: InfraMaintenanceActivity) => {
    setSelectedActivity(act)
    setSegDesc('')
    setSegEstado('Ejecutada')
    setSegPresupuestoEjec(String(act.presupuesto || act.presupuesto_ejecutado || 0))
    setSegSoporteNombre('')
    setSegSoporteData('')
    const lastSeg = act.seguimientos[0]
    if (lastSeg && lastSeg.fotos.length > 0) {
      setSegPhotoSlots([
        lastSeg.fotos[0] ?? null,
        lastSeg.fotos[1] ?? null,
        lastSeg.fotos[2] ?? null,
        lastSeg.fotos[3] ?? null,
      ])
    } else {
      setSegPhotoSlots([null, null, null, null])
    }
    setSegError('')
    setModalMode('seguimiento')
  }

  const handleSaveMaintenanceForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mTitulo.trim() || !mDesc.trim()) {
      setMFormError('Ingresa el título y la descripción técnica de la actividad.')
      return
    }

    const orderedDates = [...mFechasAnuales]
      .sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada))
      .map((d, i) => ({ ...d, numero: i + 1 }))
    const nextPendingDate =
      orderedDates.find((d) => d.estado === 'pendiente')?.fecha_programada ||
      orderedDates[0]?.fecha_programada ||
      today
    const resumenFechas = orderedDates
      .map((d) => `#${d.numero}: ${formatDateES(d.fecha_programada)}`)
      .join(' · ')

    if (modalMode === 'crear') {
      updateDb((draft) => {
        const id = `inf-mto-${Date.now()}`
        const ptId = pushToWorkPlan(draft, {
          titulo: `[Infraestructura - ${mPeriodicidad}] ${mTitulo.trim()}`,
          descripcion: `${mClasificacion}: ${mDesc.trim()} | Fechas: ${resumenFechas}`,
          sede_id: mSedeId,
          modulo_origen: 'Infraestructura',
          referencia_origen_id: id,
          responsable: mResp.trim(),
          responsable_correo: mRespCorreo.trim(),
          fecha_limite: nextPendingDate,
          presupuesto: Number(mPresupuesto) || 0,
          usuario_creador: currentUser.nombre_completo,
        })

        draft.infra_mantenimientos.unshift({
          id,
          sede_id: mSedeId,
          clasificacion: mClasificacion,
          titulo: mTitulo.trim(),
          descripcion: mDesc.trim(),
          periodicidad: mPeriodicidad,
          fechas_programadas_anual: orderedDates,
          version_programacion: 1,
          version_actividad: 1,
          presupuesto: Number(mPresupuesto) || 0,
          presupuesto_ejecutado: Number(mPresupuestoEjec) || 0,
          soporte_pdf_nombre: mSoportePdfNombre || undefined,
          soporte_pdf_data: mSoportePdfData || undefined,
          plazo_ejecucion: nextPendingDate,
          responsable: mResp.trim(),
          responsable_correo: mRespCorreo.trim(),
          estado: 'Programada',
          seguimientos: [],
          historial: [
            {
              id: `h-inf-${Date.now()}`,
              fecha: `${today} ${new Date().toTimeString().slice(0, 5)}`,
              tipo: 'Programación inicial',
              version: 1,
              detalle_version: `Prog. v1 (${mPeriodicidad}): ${resumenFechas} · Presupuesto: ${formatCOP(Number(mPresupuesto) || 0)}`,
              justificacion:
                'Programación inicial del Plan de Mantenimiento Anual de la sede (Versión v1).',
              usuario: currentUser.nombre_completo,
            },
          ],
          plan_trabajo_id: ptId,
        })
        return draft
      }, 'Actividad agregada al Plan de Mantenimiento Anual de la sede (Versión v1).')
      setModalMode(null)
      return
    }

    if (!selectedActivity) return

    const currentProgVer = selectedActivity.version_programacion || 1
    const isReprogOrAdjust = modalMode === 'ajustar' || currentProgVer >= 1

    if (isReprogOrAdjust && !mJustificacion.trim()) {
      setMFormError(
        'Control de Auditoría: Debes registrar la justificación obligatoria del ajuste o reprogramación para guardar la nueva versión.',
      )
      return
    }

    updateDb((draft) => {
      const target = draft.infra_mantenimientos.find((x) => x.id === selectedActivity.id)
      if (!target) return draft

      const prevDates = getActivityDates(target, today)
        .map((d) => `#${d.numero}: ${formatDateES(d.fecha_programada)}`)
        .join(' · ')
      const prevSummary = `Versión anterior v${target.version_actividad || 1}: Frecuencia ${target.periodicidad || 'Semestral'} (${prevDates}) · Presupuesto: ${formatCOP(target.presupuesto || 0)} · Resp: ${target.responsable}`

      const nextProgVer = (target.version_programacion || 1) + 1
      const nextActVer = (target.version_actividad || 1) + 1

      target.clasificacion = mClasificacion
      target.titulo = mTitulo.trim()
      target.descripcion = mDesc.trim()
      target.periodicidad = mPeriodicidad
      target.fechas_programadas_anual = orderedDates
      target.version_programacion = nextProgVer
      target.version_actividad = nextActVer
      target.presupuesto = Number(mPresupuesto) || 0
      target.presupuesto_ejecutado = Number(mPresupuestoEjec) || 0
      if (mSoportePdfNombre) {
        target.soporte_pdf_nombre = mSoportePdfNombre
        target.soporte_pdf_data = mSoportePdfData
      }
      target.plazo_ejecucion = nextPendingDate
      target.responsable = mResp.trim()
      target.responsable_correo = mRespCorreo.trim()
      if (target.estado !== 'Ejecutada') {
        target.estado = 'Reprogramada'
      }

      target.historial.unshift({
        id: `h-inf-${Date.now()}`,
        fecha: `${today} ${new Date().toTimeString().slice(0, 5)}`,
        tipo: modalMode === 'programar_fechas' ? 'Reprogramación' : 'Actualización',
        version: nextActVer,
        detalle_version: `Prog. v${nextProgVer} (${mPeriodicidad}): ${resumenFechas} · Presupuesto: ${formatCOP(target.presupuesto)}`,
        justificacion: mJustificacion.trim(),
        usuario: currentUser.nombre_completo,
        valores_anteriores: prevSummary,
      })

      pushToWorkPlan(draft, {
        titulo: `[Infraestructura v${nextActVer}] ${target.titulo}`,
        descripcion: `${target.clasificacion}: ${target.descripcion} | Fechas: ${resumenFechas}`,
        sede_id: target.sede_id,
        modulo_origen: 'Infraestructura',
        referencia_origen_id: target.id,
        responsable: target.responsable,
        responsable_correo: target.responsable_correo,
        fecha_limite: nextPendingDate,
        presupuesto: target.presupuesto,
        usuario_creador: currentUser.nombre_completo,
      })

      return draft
    }, `Versión v${(selectedActivity.version_actividad || 1) + 1} guardada en la Bitácora de Auditoría con su justificación.`)

    setModalMode(null)
  }

  const handleUploadSegPhoto = (slotIdx: number, file: File | null, defaultLabel: string) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSegPhotoSlots((prev) =>
          prev.map((item, idx) =>
            idx === slotIdx
              ? {
                  id: `ft-inf-${Date.now()}-${slotIdx}`,
                  leyenda: item?.leyenda || defaultLabel || file.name,
                  url: reader.result as string,
                }
              : item,
          ),
        )
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveSeguimiento = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedActivity) return
    if (!segDesc.trim()) {
      setSegError('Describe el mantenimiento o intervención realizada.')
      return
    }
    const validPhotos = segPhotoSlots.filter(
      (p): p is { id: string; leyenda: string; url: string } => p !== null,
    )
    if (validPhotos.length < 1 || validPhotos.length > 4) {
      setSegError('Debes adjuntar mínimo 1 fotografía y máximo 4 fotografías de evidencia.')
      return
    }

    updateDb((draft) => {
      const target = draft.infra_mantenimientos.find((x) => x.id === selectedActivity.id)
      if (!target) return draft

      const dates = getActivityDates(target, today)
      const nextPendIdx = dates.findIndex((d) => d.estado === 'pendiente')
      if (nextPendIdx >= 0 && segEstado === 'Ejecutada') {
        dates[nextPendIdx].estado = 'ejecutada'
        dates[nextPendIdx].fecha_ejecutada = today
      }
      target.fechas_programadas_anual = dates

      const stillPending = dates.find((d) => d.estado === 'pendiente')
      if (stillPending) {
        target.plazo_ejecucion = stillPending.fecha_programada
        target.estado = segEstado === 'Ejecutada' && dates.length > 1 ? 'En ejecución' : segEstado
      } else {
        target.estado = segEstado
      }

      const montoEjec = Number(segPresupuestoEjec) || 0
      if (montoEjec > 0) {
        target.presupuesto_ejecutado = montoEjec
      }
      if (segSoporteNombre) {
        target.soporte_pdf_nombre = segSoporteNombre
        target.soporte_pdf_data = segSoporteData
      }

      const nextVer = (target.version_actividad || 1) + 1
      target.version_actividad = nextVer

      const pdfName =
        segSoporteNombre ||
        target.soporte_pdf_nombre ||
        `Acta_Mantenimiento_${target.id}_v${target.seguimientos.length + 1}.pdf`

      target.seguimientos.unshift({
        id: `seg-inf-${Date.now()}`,
        fecha: today,
        descripcion: segDesc.trim(),
        estado_resultante: segEstado,
        responsable: currentUser.nombre_completo,
        presupuesto_ejecutado: montoEjec,
        soporte_pdf_nombre: pdfName,
        soporte_pdf_data: segSoporteData || undefined,
        soportes_archivos: [pdfName],
        fotos: validPhotos,
      })

      target.historial.unshift({
        id: `h-seg-${Date.now()}`,
        fecha: `${today} ${new Date().toTimeString().slice(0, 5)}`,
        tipo: 'Seguimiento',
        version: nextVer,
        detalle_version: `Ejecución v${target.seguimientos.length} · Estado: ${segEstado} · Ejecutado: ${formatCOP(montoEjec)} · ${validPhotos.length} foto(s) · PDF: ${pdfName}`,
        justificacion: segDesc.trim(),
        usuario: currentUser.nombre_completo,
      })

      return draft
    }, 'Ejecución y soporte de mantenimiento registrados correctamente.')

    setModalMode(null)
  }

  const handleUploadEvalPhoto = (slotIdx: number, file: File | null, defaultLabel: string) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEvalPhotoSlots((prev) =>
          prev.map((item, idx) =>
            idx === slotIdx
              ? {
                  id: `ft-eval-inf-${Date.now()}-${slotIdx}`,
                  leyenda: item?.leyenda || defaultLabel || file.name,
                  url: reader.result as string,
                }
              : item,
          ),
        )
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSavePhysicalEval = () => {
    if (!currentSedeObj) return
    setEvalFormError('')

    const nonCompliantItems = evalItems.filter(
      (i) => i.calificacion === 'parcial' || i.calificacion === 'no_cumple',
    )

    for (const item of nonCompliantItems) {
      const deb = (item.debilidad ?? item.hallazgo ?? '').trim()
      if (!deb) {
        setEvalFormError(
          `El ítem "${item.item_nombre}" está calificado como "${item.calificacion === 'parcial' ? 'Cumple parcialmente' : 'No cumple'}". Debes describir la Debilidad identificada.`,
        )
        return
      }
      const prog = item.programacion_mantenimiento
      if (
        !prog ||
        !prog.titulo.trim() ||
        !prog.descripcion.trim() ||
        !prog.fecha_ejecucion ||
        !prog.responsable.trim()
      ) {
        setEvalFormError(
          `Completa todos los datos de Programación de Actividad de Mantenimiento (Título, Descripción de la actividad, Fecha de ejecución, Frecuencia, Presupuesto y Responsable) para el ítem "${item.item_nombre}".`,
        )
        return
      }
    }

    const validEvalPhotos = evalPhotoSlots.filter(
      (p): p is { id: string; leyenda: string; url: string } => p !== null,
    )

    if (nonCompliantItems.length > 0 && (validEvalPhotos.length < 1 || validEvalPhotos.length > 4)) {
      setEvalFormError(
        'Como se presenta incumplimiento o cumplimiento parcial en la evaluación general de la sede, es obligatorio adjuntar mínimo 1 fotografía y máximo 4 fotografías en el Registro Fotográfico General de la Evaluación.',
      )
      return
    }

    updateDb((draft) => {
      const updatedItems = evalItems.map((item) => {
        const fort = (item.fortaleza ?? item.observacion ?? '').trim()
        const deb = (item.debilidad ?? item.hallazgo ?? '').trim()

        if (item.calificacion === 'parcial' || item.calificacion === 'no_cumple') {
          const prog = item.programacion_mantenimiento!
          const orderedDates = generateAnnualScheduleDates(
            prog.fecha_ejecucion || today,
            prog.periodicidad || 'Unica vez',
          )
          const nextPendingDate = orderedDates[0]?.fecha_programada || prog.fecha_ejecucion || today
          const resumenFechas = orderedDates
            .map((d) => `#${d.numero}: ${formatDateES(d.fecha_programada)}`)
            .join(' · ')

          const mtoId =
            item.infra_mantenimiento_id ||
            `inf-mto-eval-${currentSedeObj.id}-${item.item_key}`

          const ptId = pushToWorkPlan(draft, {
            titulo: `[Infraestructura - ${prog.periodicidad}] ${prog.titulo.trim()}`,
            descripcion: `${prog.clasificacion}: ${prog.descripcion.trim()} | Debilidad (${item.item_nombre}): ${deb} | Fechas: ${resumenFechas}`,
            sede_id: currentSedeObj.id,
            modulo_origen: 'Infraestructura',
            referencia_origen_id: mtoId,
            responsable: prog.responsable.trim(),
            responsable_correo: prog.responsable_correo?.trim() || currentUser.correo,
            fecha_limite: nextPendingDate,
            presupuesto: Number(prog.presupuesto) || 0,
            usuario_creador: currentUser.nombre_completo,
          })

          // Crear o actualizar la actividad en el Plan de Mantenimiento Anual de la Sede (ventana 3 y 1)
          const existingMtoIdx = draft.infra_mantenimientos.findIndex((m) => m.id === mtoId)
          if (existingMtoIdx >= 0) {
            const target = draft.infra_mantenimientos[existingMtoIdx]
            target.clasificacion = prog.clasificacion
            target.titulo = prog.titulo.trim()
            target.descripcion = `${prog.descripcion.trim()} (Origen: Evaluación Condición Física "${item.item_nombre}" — Debilidad: ${deb})`
            target.periodicidad = prog.periodicidad
            target.fechas_programadas_anual = orderedDates
            target.presupuesto = Number(prog.presupuesto) || 0
            if (prog.soporte_pdf_nombre) {
              target.soporte_pdf_nombre = prog.soporte_pdf_nombre
              target.soporte_pdf_data = prog.soporte_pdf_data
            }
            target.plazo_ejecucion = nextPendingDate
            target.responsable = prog.responsable.trim()
            target.responsable_correo = prog.responsable_correo?.trim() || currentUser.correo
            target.plan_trabajo_id = ptId
          } else {
            draft.infra_mantenimientos.unshift({
              id: mtoId,
              sede_id: currentSedeObj.id,
              clasificacion: prog.clasificacion,
              titulo: prog.titulo.trim(),
              descripcion: `${prog.descripcion.trim()} (Origen: Evaluación Condición Física "${item.item_nombre}" — Debilidad: ${deb})`,
              periodicidad: prog.periodicidad,
              fechas_programadas_anual: orderedDates,
              version_programacion: 1,
              version_actividad: 1,
              presupuesto: Number(prog.presupuesto) || 0,
              presupuesto_ejecutado: 0,
              soporte_pdf_nombre: prog.soporte_pdf_nombre || undefined,
              soporte_pdf_data: prog.soporte_pdf_data || undefined,
              plazo_ejecucion: nextPendingDate,
              responsable: prog.responsable.trim(),
              responsable_correo: prog.responsable_correo?.trim() || currentUser.correo,
              estado: 'Programada',
              seguimientos: [],
              historial: [
                {
                  id: `h-inf-eval-${Date.now()}-${item.item_key}`,
                  fecha: `${today} ${new Date().toTimeString().slice(0, 5)}`,
                  tipo: 'Programación inicial',
                  version: 1,
                  detalle_version: `Prog. v1 desde Evaluación Condiciones Físicas (${prog.periodicidad}): ${resumenFechas} · Presupuesto: ${formatCOP(Number(prog.presupuesto) || 0)}`,
                  justificacion: `Hallazgo/Debilidad en "${item.item_nombre}": ${deb}`,
                  usuario: currentUser.nombre_completo,
                },
              ],
              plan_trabajo_id: ptId,
            })
          }

          return {
            ...item,
            observacion: fort,
            fortaleza: fort,
            debilidad: deb,
            hallazgo: deb,
            infra_mantenimiento_id: mtoId,
            plan_trabajo_id: ptId,
          }
        }

        return {
          ...item,
          observacion: fort,
          fortaleza: fort,
          debilidad: deb,
          hallazgo: deb,
        }
      })

      const idx = draft.infra_evaluaciones.findIndex((e) => e.sede_id === currentSedeObj.id)
      const payload = {
        id: `inf-eval-${currentSedeObj.id}`,
        sede_id: currentSedeObj.id,
        fecha_evaluacion: today,
        evaluador: currentUser.nombre_completo,
        observacion_general: `Evaluación física de 14 condiciones locativas de ${currentSedeObj.nombre}.`,
        fotos_evaluacion: validEvalPhotos,
        items: updatedItems,
      }
      if (idx >= 0) draft.infra_evaluaciones[idx] = payload
      else draft.infra_evaluaciones.push(payload)

      return draft
    }, 'Evaluación física guardada y actividades incorporadas automáticamente al Plan de Mantenimiento de la Sede y al Plan de Trabajo.')
  }

  return (
    <div className="work-plan">
      {/* 4 KPIs Superiores */}
      <div className="plan-kpis">
        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Cumplimiento Plan Anual</h2>
            <span className="complaint-kpi-icon">
              <Wrench size={19} />
            </span>
          </div>
          <strong>
            {pctEjecucionAct} % ({ejecutadasAct}/{totalAct})
          </strong>
          <p>
            {ejecutadasFechasAnio} de {totalFechasAnio} fechas anuales ejecutadas · {fechasMesActual} en este mes.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-red">
          <div className="complaint-kpi-heading">
            <h2>Alertas y Semáforo Locativo</h2>
            <span className="complaint-kpi-icon">
              <AlertTriangle size={19} />
            </span>
          </div>
          <strong>
            {vencidasCount} Vencidas · {criticasCount} Críticas
          </strong>
          <p>
            ≤30 días: {criticasCount} críticas · 31-60 días: {preventivasCount} preventivas.
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Presupuesto de Mantenimiento</h2>
            <span className="complaint-kpi-icon">
              <Wallet size={19} />
            </span>
          </div>
          <strong>{formatCOP(presupuestoTotalProg)}</strong>
          <p>
            Ejecutado: <strong>{formatCOP(presupuestoTotalEjec)}</strong> (Saldo:{' '}
            {formatCOP(Math.max(0, presupuestoTotalProg - presupuestoTotalEjec))})
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-amber">
          <div className="complaint-kpi-heading">
            <h2>14 Condiciones Físicas ({currentSedeObj?.nombre})</h2>
            <span className="complaint-kpi-icon">
              <ClipboardList size={19} />
            </span>
          </div>
          <strong>
            {evalItems.filter((i) => i.calificacion === 'cumple').length} / {evalItems.length} Cumplen
          </strong>
          <p>
            {evalItems.filter((i) => i.calificacion !== 'cumple').length} hallazgos locativos vinculados al Plan de Trabajo.
          </p>
        </article>
      </div>

      {/* Barra de Ventanas y Botón Principal */}
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
            className={windowView === 'calendario' ? 'view-selected' : ''}
            onClick={() => setWindowView('calendario')}
          >
            2. Prioridades y Calendario
          </button>
          <button
            type="button"
            className={windowView === 'matriz' ? 'view-selected' : ''}
            onClick={() => setWindowView('matriz')}
          >
            3. Plan de Mantenimiento por Sede
          </button>
          <button
            type="button"
            className={windowView === 'evaluacion' ? 'view-selected' : ''}
            onClick={() => setWindowView('evaluacion')}
          >
            4. Condiciones Físicas (14 Ítems)
          </button>
          <button
            type="button"
            className={windowView === 'alertas' ? 'view-selected' : ''}
            onClick={() => setWindowView('alertas')}
          >
            5. Alertas ({totalAlertasCount})
          </button>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => openCreateModal(activeSedeId)}
        >
          <Plus size={14} /> + Programar Actividad de Mantenimiento
        </button>
      </div>

      {/* Barra de Filtro por Sede */}
      <div
        className="plan-controls"
        style={{
          padding: '10px 14px',
          background: '#ffffff',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
            {windowView === 'matriz' || windowView === 'evaluacion'
              ? 'Sede seleccionada:'
              : 'Filtro por sede:'}
          </span>
          {windowView !== 'matriz' && windowView !== 'evaluacion' && (
            <button
              type="button"
              className={`button ${selectedSedeIds.length === 0 ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setSelectedSedeIds([])}
            >
              Todas las Sedes ({sedesOperativas.length})
            </button>
          )}
          {sedesOperativas.map((s) => {
            const isSingleView = windowView === 'matriz' || windowView === 'evaluacion'
            const active = isSingleView
              ? activeSedeId === s.id
              : selectedSedeIds.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                className={`button ${active ? 'button-primary' : 'button-secondary'}`}
                onClick={() => {
                  if (isSingleView) {
                    selectSingleSede(s.id)
                  } else {
                    setActiveSedeId(s.id)
                    setSelectedSedeIds((prev) =>
                      prev.length === 1 && prev[0] === s.id ? [] : [s.id],
                    )
                  }
                }}
              >
                {s.nombre}
              </button>
            )
          })}
        </div>
      </div>

      {/* ====================================================================
          VENTANA 1: TARJETAS POR SEDE (Plan de Mantenimiento Anual y Cumplimiento por Clasificación)
         ==================================================================== */}
      {windowView === 'tarjetas' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 16,
          }}
        >
          {sedesOperativas
            .filter((s) => selectedSedeIds.length === 0 || selectedSedeIds.includes(s.id))
            .map((sede) => {
              const sedeActs = db.infra_mantenimientos.filter((a) => a.sede_id === sede.id)
              const tot = sedeActs.length
              const ok = sedeActs.filter((a) => a.estado === 'Ejecutada').length
              const enEjec = sedeActs.filter((a) => a.estado === 'En ejecución').length
              const pct = tot > 0 ? Math.round((ok / tot) * 100) : 0
              const presSede = sedeActs.reduce((acc, a) => acc + (Number(a.presupuesto) || 0), 0)
              const ejecSede = sedeActs.reduce(
                (acc, a) => acc + (Number(a.presupuesto_ejecutado) || 0),
                0,
              )

              return (
                <section
                  key={sede.id}
                  className="panel"
                  style={{ padding: 18, display: 'grid', gap: 12 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div>
                      <span className="plan-badge plan-complete">
                        {(sede.departamento || sede.ciudad).toUpperCase()} · REPS {sede.codigo_reps}
                      </span>
                      <h2 style={{ margin: '6px 0 2px', fontSize: 16 }}>{sede.nombre}</h2>
                      <small style={{ color: '#68778b', display: 'block' }}>
                        {sede.direccion} · {sede.area_m2} m² · {sede.pisos_niveles || 1} piso(s)
                      </small>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <strong
                        style={{
                          fontSize: 23,
                          lineHeight: 1.1,
                          color: pct >= 85 ? '#15966a' : pct >= 50 ? '#d69016' : '#d94f56',
                        }}
                      >
                        {pct}%
                      </strong>
                      <small style={{ display: 'block', color: '#68778b' }}>
                        {ok}/{tot} ejecutadas
                      </small>
                    </div>
                  </div>

                  {/* Resumen Presupuestal del Plan Anual de la Sede */}
                  <div
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      fontSize: 11.5,
                    }}
                  >
                    <span>
                      <strong>Presupuesto Anual:</strong> {formatCOP(presSede)}
                    </span>
                    <span style={{ color: '#1d4ed8', fontWeight: 700 }}>
                      Ejecutado: {formatCOP(ejecSede)}
                    </span>
                  </div>

                  {/* Barra de avance general */}
                  <div>
                    <div className="audit-progress-track" style={{ height: 10 }}>
                      <div
                        className={`audit-progress-fill ${
                          pct >= 85
                            ? 'audit-fill-green'
                            : pct >= 50
                              ? 'audit-fill-yellow'
                              : 'audit-fill-red'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 6,
                        fontSize: 11,
                        color: '#52617a',
                      }}
                    >
                      <span>Ejecutadas: {ok}</span>
                      <span>En ejecución: {enEjec}</span>
                      <span>Pendientes: {Math.max(0, tot - ok - enEjec)}</span>
                    </div>
                  </div>

                  {/* Cumplimiento por Clasificación de Mantenimiento Locativo */}
                  <div
                    style={{
                      borderTop: '1px solid #e8edf5',
                      paddingTop: 10,
                      display: 'grid',
                      gap: 7,
                    }}
                  >
                    <strong style={{ fontSize: 12, color: '#1e293b' }}>
                      Avance por Clasificación de Mantenimiento:
                    </strong>
                    {CLASIFICACIONES_INFRA.map((clasif) => {
                      const itemsC = sedeActs.filter((a) => a.clasificacion === clasif)
                      const totC = itemsC.length
                      const okC = itemsC.filter((a) => a.estado === 'Ejecutada').length
                      const pctC = totC > 0 ? Math.round((okC / totC) * 100) : 0
                      const barTone =
                        totC === 0
                          ? 'audit-fill-neutral'
                          : pctC >= 85
                            ? 'audit-fill-green'
                            : pctC >= 50
                              ? 'audit-fill-yellow'
                              : 'audit-fill-red'

                      return (
                        <div key={clasif} style={{ display: 'grid', gap: 3 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 11,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#334155' }}>{clasif}</span>
                            <span style={{ fontWeight: 600, color: '#475569' }}>
                              {totC > 0 ? `${pctC}% (${okC}/${totC})` : 'Sin programar (0/0)'}
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

                  {/* Botones de Acción de la Tarjeta */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 'auto',
                      paddingTop: 8,
                      borderTop: '1px solid #e8edf5',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        selectSingleSede(sede.id)
                        setWindowView('matriz')
                      }}
                    >
                      <Eye size={14} /> Ver Plan ({tot})
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => openCreateModal(sede.id)}
                    >
                      <Plus size={14} /> Programar
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        const sedeEval =
                          db.infra_evaluaciones.find((e) => e.sede_id === sede.id)?.items ??
                          evalItems
                        generateInfraSedePlanPdf(sede, sedeActs, sedeEval)
                      }}
                    >
                      <FileDown size={14} /> PDF Plan Sede
                    </button>
                  </div>
                </section>
              )
            })}
        </div>
      )}

      {/* ====================================================================
          VENTANA 2: PRIORIDADES Y CALENDARIO DE MANTENIMIENTO (Estilo SARLAFT)
         ==================================================================== */}
      {windowView === 'calendario' && (() => {
        type CalendarInfraItem = {
          id: string
          act: InfraMaintenanceActivity
          sedeNombre: string
          numeroFecha: number
          totalFechasAnio: number
          etiquetaFecha: string
          fechaProgramada: string
          estadoFecha: 'pendiente' | 'ejecutada'
          daysDiff: number
          tone: 'complete' | 'month' | 'urgent' | 'overdue' | 'future'
          statusLabel: string
        }

        const allCalItems: CalendarInfraItem[] = []
        for (const { act, dates } of evaluatedActivities) {
          const sedeObj = sedesOperativas.find((s) => s.id === act.sede_id)
          const sedeNombre = sedeObj?.nombre || act.sede_id

          for (const dItem of dates) {
            const dDiff = diffDays(dItem.fecha_programada, today)
            const isExec = dItem.estado === 'ejecutada' || act.estado === 'Ejecutada'
            let tone: CalendarInfraItem['tone'] = 'future'
            let statusLabel = `En ${dDiff} d`
            if (isExec) {
              tone = 'complete'
              statusLabel = 'Ejecutada'
            } else if (dDiff < 0) {
              tone = 'overdue'
              statusLabel = `Vencida hace ${Math.abs(dDiff)} d`
            } else if (dDiff <= 15) {
              tone = 'urgent'
              statusLabel = dDiff === 0 ? 'Hoy' : `Crítico (${dDiff} d)`
            } else if (dItem.fecha_programada.startsWith(`${calendarMonth}-`) || dDiff <= 60) {
              tone = 'month'
              statusLabel = `En ${dDiff} días`
            }

            allCalItems.push({
              id: `${act.id}__${dItem.id}`,
              act,
              sedeNombre,
              numeroFecha: dItem.numero,
              totalFechasAnio: dates.length,
              etiquetaFecha: dItem.etiqueta,
              fechaProgramada: dItem.fecha_programada,
              estadoFecha: isExec ? 'ejecutada' : 'pendiente',
              daysDiff: dDiff,
              tone,
              statusLabel,
            })
          }
        }

        const filteredCal = allCalItems
          .filter((item) => {
            if (calendarYear !== 'TODOS' && !item.fechaProgramada.startsWith(`${calendarYear}-`))
              return false
            if (calendarFilterLevel === 'cumple') return item.estadoFecha === 'ejecutada'
            if (calendarFilterLevel === 'no_cumple') return item.estadoFecha !== 'ejecutada'
            return true
          })
          .sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada))

        const monthItems = filteredCal.filter((x) =>
          x.fechaProgramada.startsWith(`${calendarMonth}-`),
        )
        const prioritySidebar = allCalItems
          .filter((x) => x.estadoFecha !== 'ejecutada' && x.daysDiff <= 30)
          .sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada))

        const startMonthDate = new Date(`${calendarMonth}-01T12:00:00Z`)
        const daysInMonth = new Date(
          Date.UTC(startMonthDate.getUTCFullYear(), startMonthDate.getUTCMonth() + 1, 0),
        ).getUTCDate()
        const startOffset = (startMonthDate.getUTCDay() + 6) % 7

        const moveMonth = (delta: number) => {
          const next = new Date(startMonthDate)
          next.setUTCMonth(next.getUTCMonth() + delta)
          const iso = next.toISOString().slice(0, 7)
          setCalendarMonth(iso)
          setCalendarYear(iso.slice(0, 4))
        }

        return (
          <div style={{ display: 'grid', gap: 16 }}>
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
                <h2 style={{ margin: '0 0 2px', fontSize: 16.5, color: '#0f172a' }}>
                  Calendario y Cronograma General de Mantenimiento Locativo ({filteredCal.length})
                </h2>
                <small style={{ color: '#64748b' }}>
                  Muestra todas las actividades programadas en el año (o filtradas por sede arriba). Haz clic sobre cualquier actividad para registrar su ejecución o reprogramarla.
                </small>
              </div>
              <div className="view-toggle">
                <button
                  type="button"
                  className={calendarFilterLevel === 'todos' ? 'view-selected' : ''}
                  onClick={() => setCalendarFilterLevel('todos')}
                >
                  Todas ({allCalItems.length})
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
            </section>

            <section className="plan-schedule">
              <div className="panel plan-calendar">
                <div className="plan-controls">
                  <h2>Programación del mes ({monthItems.length} en {calendarMonth})</h2>
                  <div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => moveMonth(-1)}
                    >
                      ‹ Anterior
                    </button>
                    <label>
                      <input
                        type="month"
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
                      onClick={() => moveMonth(1)}
                    >
                      Siguiente ›
                    </button>
                  </div>
                </div>
                <p>Amarillo: este mes · Rojo: próximos 15 días o vencida · Verde: ejecutada</p>
                <div className="plan-calendar-grid">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                    <strong key={d}>{d}</strong>
                  ))}
                  {Array.from({ length: startOffset }, (_, i) => (
                    <div key={`empty-${i}`} aria-hidden="true" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayISO = `${calendarMonth}-${String(i + 1).padStart(2, '0')}`
                    const dayEvs = monthItems.filter((ev) => ev.fechaProgramada === dayISO)
                    return (
                      <div
                        key={dayISO}
                        className={`plan-day ${dayISO === today ? 'plan-day-today' : ''}`}
                      >
                        <span style={{ fontWeight: 600 }}>{i + 1}</span>
                        {dayEvs.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            className={`plan-calendar-event plan-${ev.tone}`}
                            onClick={() => openSeguimientoModal(ev.act)}
                          >
                            <strong>[{ev.sedeNombre}]</strong> {ev.act.titulo} ({ev.numeroFecha}/
                            {ev.totalFechasAnio})
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              <aside className="panel plan-priorities">
                <h2>Prioridades y atrasos ({prioritySidebar.length})</h2>
                <p>Mantenimientos vencidos o programados para los próximos 30 días.</p>
                {prioritySidebar.length === 0 ? (
                  <p style={{ color: '#15966a', fontWeight: 600 }}>
                    Sin mantenimientos críticos ni vencidos.
                  </p>
                ) : (
                  prioritySidebar.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSeguimientoModal(item.act)}
                    >
                      <strong>
                        [{item.sedeNombre}] {item.act.titulo}
                      </strong>
                      <div className="plan-deadline">
                        <span className={`plan-badge plan-${item.tone}`}>{item.statusLabel}</span>
                        <strong>{formatDateES(item.fechaProgramada)}</strong>
                        <small>
                          {item.etiquetaFecha} · {formatCOP(item.act.presupuesto || 0)}
                        </small>
                      </div>
                    </button>
                  ))
                )}
              </aside>
            </section>
          </div>
        )
      })()}

      {/* ====================================================================
          VENTANA 3: PLAN DE MANTENIMIENTO Y EJECUCIÓN POR SEDE (Secciones por Clasificación)
         ==================================================================== */}
      {windowView === 'matriz' && currentSedeObj && (() => {
        const sedeActs = db.infra_mantenimientos
          .filter((a) => a.sede_id === currentSedeObj.id)
          .filter(
            (a) =>
              !q ||
              `${a.clasificacion} ${a.titulo} ${a.descripcion} ${a.responsable}`
                .toLowerCase()
                .includes(q),
          )
        const totSede = sedeActs.length
        const okSede = sedeActs.filter((a) => a.estado === 'Ejecutada').length
        const pctSede = totSede > 0 ? Math.round((okSede / totSede) * 100) : 0
        const presSede = sedeActs.reduce((acc, a) => acc + (Number(a.presupuesto) || 0), 0)
        const ejecSede = sedeActs.reduce(
          (acc, a) => acc + (Number(a.presupuesto_ejecutado) || 0),
          0,
        )

        return (
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
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="plan-badge plan-complete">
                    PLAN ANUAL DE MANTENIMIENTO · {currentSedeObj.nombre.toUpperCase()}
                  </span>
                  <span className="plan-badge plan-future">
                    Presupuesto: {formatCOP(presSede)} (Ejecutado: {formatCOP(ejecSede)})
                  </span>
                </div>
                <h2 style={{ margin: '6px 0 2px', fontSize: 17, color: '#0f172a' }}>
                  {currentSedeObj.nombre} — {totSede} actividades programadas ({okSede} ejecutadas · {pctSede}%)
                </h2>
                <small style={{ color: '#64748b' }}>
                  Actividades de mantenimiento preventivo, reparaciones y adecuaciones locativas organizadas por sección de clasificación.
                </small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => generateInfraSedePlanPdf(currentSedeObj, sedeActs, evalItems)}
                >
                  <FileDown size={14} /> Exportar Plan PDF ({currentSedeObj.nombre})
                </button>
              </div>
            </section>

            {CLASIFICACIONES_INFRA.map((clasif, cIndex) => {
              const itemsC = sedeActs.filter((a) => a.clasificacion === clasif)
              const totC = itemsC.length
              const okC = itemsC.filter((a) => a.estado === 'Ejecutada').length
              const pctC = totC > 0 ? Math.round((okC / totC) * 100) : 0
              const barTone =
                totC === 0
                  ? 'audit-fill-neutral'
                  : pctC >= 85
                    ? 'audit-fill-green'
                    : pctC >= 50
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
                        }}
                      >
                        0{cIndex + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a' }}>
                          Sección: {clasif}
                        </strong>
                        <small style={{ display: 'block', color: '#64748b', fontSize: 11.5 }}>
                          {totC} actividad(es) programada(s) en esta sede
                        </small>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 230 }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 11.5,
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          <span>Avance</span>
                          <span>{totC > 0 ? `${pctC}% (${okC}/${totC})` : '0/0'}</span>
                        </div>
                        <div className="audit-progress-track" style={{ height: 7 }}>
                          <div
                            className={`audit-progress-fill ${barTone}`}
                            style={{ width: `${totC > 0 ? pctC : 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="plan-badge plan-future" style={{ fontWeight: 700 }}>
                        {isCollapsed ? 'Expandir' : 'Contraer'}
                      </span>
                    </div>
                  </div>

                  {!isCollapsed &&
                    (totC === 0 ? (
                      <div style={{ padding: '14px 18px', fontSize: 12, color: '#64748b' }}>
                        Sin actividades programadas en <strong>{clasif}</strong> para esta sede.
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
                              <th style={{ width: '23%', padding: '10px 14px', textAlign: 'left', fontSize: 11 }}>
                                ACTIVIDAD Y DESCRIPCIÓN
                              </th>
                              <th style={{ width: '21%', padding: '10px 10px', textAlign: 'center', fontSize: 11 }}>
                                PROGRAMACIÓN ANUAL
                              </th>
                              <th style={{ width: '15%', padding: '10px 10px', textAlign: 'center', fontSize: 11 }}>
                                ESTADO Y SEMÁFORO
                              </th>
                              <th style={{ width: '16%', padding: '10px 10px', textAlign: 'left', fontSize: 11 }}>
                                PRESUPUESTO Y SOPORTE
                              </th>
                              <th style={{ width: '13%', padding: '10px 8px', textAlign: 'left', fontSize: 11 }}>
                                RESPONSABLE
                              </th>
                              <th style={{ width: '12%', padding: '10px 12px', textAlign: 'center', fontSize: 11 }}>
                                ACCIONES
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemsC.map((act, idx) => {
                              const sem = evaluateSemaphore3060(
                                act.plazo_ejecucion,
                                today,
                                act.estado === 'Ejecutada',
                              )
                              const dates = getActivityDates(act, today)
                              const execCount = dates.filter((d) => d.estado === 'ejecutada').length

                              return (
                                <tr
                                  key={act.id}
                                  style={{
                                    borderTop: idx === 0 ? 'none' : '1px solid #edf2f7',
                                    background: '#ffffff',
                                  }}
                                >
                                  <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedActivity(act)
                                          setModalMode('ficha')
                                        }}
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
                                        {act.titulo}
                                      </button>
                                      <small style={{ color: '#64748b', fontSize: 11, lineHeight: 1.35 }}>
                                        {act.descripcion}
                                      </small>
                                    </div>
                                  </td>

                                  <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <span className="plan-badge plan-future" style={{ fontSize: 10, fontWeight: 700 }}>
                                          {act.periodicidad || 'Semestral'}
                                        </span>
                                        <span className="plan-badge plan-month" style={{ fontSize: 10, fontWeight: 700 }}>
                                          {execCount}/{dates.length} en el año
                                        </span>
                                        <span
                                          className={`plan-badge ${
                                            (act.version_programacion || 1) > 1
                                              ? 'plan-reprogrammed'
                                              : 'plan-complete'
                                          }`}
                                          style={{ fontSize: 10, fontWeight: 700 }}
                                        >
                                          Prog. v{act.version_programacion || 1}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                                        {dates.slice(0, 4).map((d) => {
                                          const isDateOverdue =
                                            d.estado !== 'ejecutada' &&
                                            diffDays(d.fecha_programada, today) < 0
                                          return (
                                            <span
                                              key={d.id}
                                              style={{
                                                display: 'inline-block',
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                background:
                                                  d.estado === 'ejecutada'
                                                    ? '#dcfce7'
                                                    : isDateOverdue
                                                      ? '#fef2f2'
                                                      : '#f1f5f9',
                                                color:
                                                  d.estado === 'ejecutada'
                                                    ? '#166534'
                                                    : isDateOverdue
                                                      ? '#b42318'
                                                      : '#334155',
                                                border:
                                                  d.estado === 'ejecutada'
                                                    ? '1px solid #86efac'
                                                    : isDateOverdue
                                                      ? '1px solid #fca5a5'
                                                      : '1px solid #cbd5e1',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              #{d.numero}: {formatDateES(d.fecha_programada)}
                                              {isDateOverdue ? ' · Vencida' : ''}
                                            </span>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  </td>

                                  <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                    {(() => {
                                      const isExecuted = act.estado === 'Ejecutada'
                                      const isOverdue = !isExecuted && sem.days < 0
                                      const isCritical30 = !isExecuted && sem.days >= 0 && sem.days <= 30
                                      const isPriority60 = !isExecuted && sem.days > 30 && sem.days <= 60

                                      const estadoBadgeClass = isExecuted
                                        ? 'plan-complete'
                                        : isOverdue
                                          ? 'plan-overdue'
                                          : isCritical30
                                            ? 'plan-urgent'
                                            : isPriority60 || act.estado === 'En ejecución'
                                              ? 'plan-month'
                                              : 'plan-future'

                                      const estadoDynamicLabel = isExecuted
                                        ? 'Cumple · Ejecutada'
                                        : isOverdue
                                          ? `No cumple · Vencida (Sin soporte)`
                                          : isCritical30
                                            ? `${act.estado} · Crítico (<=30d)`
                                            : isPriority60
                                              ? `${act.estado} · Prioridad (31-60d)`
                                              : `${act.estado} · En término (>60d)`

                                      const semChipText = isExecuted
                                        ? `Ejecutada (${formatDateES(act.plazo_ejecucion)})`
                                        : isOverdue
                                          ? `Vencida hace ${Math.abs(sem.days)} d (${formatDateES(act.plazo_ejecucion)})`
                                          : sem.days === 0
                                            ? `Vence hoy (${formatDateES(act.plazo_ejecucion)})`
                                            : `Vence en ${sem.days} d (${formatDateES(act.plazo_ejecucion)})`

                                      return (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                          <span
                                            className={`plan-badge ${estadoBadgeClass}`}
                                            style={{ fontWeight: 700 }}
                                          >
                                            {estadoDynamicLabel}
                                          </span>
                                          <span className={`plan-badge ${sem.badgeClass}`} style={{ fontSize: 10.5, fontWeight: 600 }}>
                                            {semChipText}
                                          </span>
                                        </div>
                                      )
                                    })()}
                                  </td>

                                  <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <strong style={{ fontSize: 11.5, color: '#0f172a' }}>
                                        Prog: {formatCOP(act.presupuesto || 0)}
                                      </strong>
                                      <small style={{ fontSize: 10.5, color: '#15966a', fontWeight: 600 }}>
                                        Ejec: {formatCOP(act.presupuesto_ejecutado || 0)}
                                      </small>
                                      {act.seguimientos.length > 0 || act.soporte_pdf_nombre ? (
                                        <>
                                          {act.soporte_pdf_nombre && (
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
                                              {act.soporte_pdf_nombre}
                                            </small>
                                          )}
                                          <small style={{ color: '#15966a', fontSize: 10, fontWeight: 600 }}>
                                            {act.seguimientos.length} ejec. ·{' '}
                                            {act.seguimientos.reduce((s, x) => s + x.fotos.length, 0)} foto(s)
                                          </small>
                                        </>
                                      ) : (
                                        <small
                                          style={{
                                            color: sem.days < 0 ? '#b42318' : '#64748b',
                                            fontSize: 10.5,
                                            fontWeight: sem.days < 0 ? 700 : 500,
                                          }}
                                        >
                                          {sem.days < 0
                                            ? 'Sin soporte de ejecución (Vencida)'
                                            : 'Pendiente de soporte (0 ejec.)'}
                                        </small>
                                      )}
                                    </div>
                                  </td>

                                  <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <strong style={{ fontSize: 11.5, color: '#1e293b' }}>
                                        {act.responsable}
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
                                        {act.responsable_correo || 'infraestructura@calidadips.co'}
                                      </small>
                                    </div>
                                  </td>

                                  <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        gap: 5,
                                        width: '100%',
                                        maxWidth: 116,
                                        margin: '0 auto',
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => openSeguimientoModal(act)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 5,
                                          height: 29,
                                          padding: '0 8px',
                                          borderRadius: 6,
                                          border: '1px solid #2563eb',
                                          background: '#2563eb',
                                          color: '#ffffff',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <FilePlus2 size={12} /> Ejecutar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openProgramarFechasModal(act)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 5,
                                          height: 29,
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
                                      <button
                                        type="button"
                                        onClick={() => openAjustarModal(act)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 5,
                                          height: 29,
                                          padding: '0 8px',
                                          borderRadius: 6,
                                          border: '1px solid #e2e8f0',
                                          background: '#f8fafc',
                                          color: '#334155',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <Pencil size={12} /> Ajustar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedActivity(act)
                                          setModalMode('ficha')
                                        }}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 5,
                                          height: 29,
                                          padding: '0 8px',
                                          borderRadius: 6,
                                          border: '1px solid #cbd5e1',
                                          background: '#ffffff',
                                          color: '#334155',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          cursor: 'pointer',
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
                    ))}
                </section>
              )
            })}
          </div>
        )
      })()}

      {/* ====================================================================
          SUB-VISTA 4: EVALUACIÓN DE LAS CONDICIONES FÍSICAS DE LA SEDE
          Columnas: Ítem, Calificación, Fortaleza, Debilidad.
          Si algún ítem es Parcial o No Cumple:
          1. Despliega el formulario completo de Programación de Actividad de Mantenimiento
             para ese ítem (Título, Descripción, Clasificación, Frecuencia, Fecha de ejecución,
             Presupuesto, Responsable, Soporte PDF opcional) y lo incorpora al Plan de Mantenimiento de la Sede.
          2. Solicita a nivel general de la Evaluación entre 1 y 4 fotografías de evidencia.
         ==================================================================== */}
      {windowView === 'evaluacion' && currentSedeObj && (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <div>
              <h2>
                Condiciones Físicas de la Sede — {currentSedeObj.nombre}
              </h2>
              <p>
                Evalúa cada condición registrando su <strong>Calificación</strong>, <strong>Fortaleza</strong> y <strong>Debilidad</strong>. Cuando un ítem se califica en <em>Cumple parcialmente</em> o <em>No cumple</em>, se solicitan los datos de programación para incluir la actividad directamente en el <strong>Plan de Mantenimiento de la Sede</strong> (y en el Plan de Trabajo), además del registro fotográfico general de la evaluación (mínimo 1 y máximo 4 fotos).
              </p>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={handleSavePhysicalEval}
            >
              <CheckCircle2 size={15} /> Guardar Evaluación e Incorporar al Plan de Mantenimiento
            </button>
          </div>

          {evalFormError && (
            <div className="portal-error" role="alert" style={{ marginBottom: 14 }}>
              {evalFormError}
            </div>
          )}

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>Ítem</th>
                  <th style={{ width: '16%' }}>Calificación</th>
                  <th style={{ width: '29%' }}>Fortaleza</th>
                  <th style={{ width: '29%' }}>Debilidad</th>
                </tr>
              </thead>
              <tbody>
                {evalItems.map((item, idx) => {
                  const requiresMaintenance =
                    item.calificacion === 'parcial' || item.calificacion === 'no_cumple'
                  const prog = item.programacion_mantenimiento || {
                    clasificacion: defaultClasifForPhysicalItem(item.item_key),
                    titulo: `Mantenimiento y adecuación locativa — ${item.item_nombre.split('(')[0].trim()}`,
                    descripcion: '',
                    periodicidad: 'Unica vez' as PeriodicidadCriterioAdmin,
                    fecha_ejecucion: calculateExpirationByPeriodicidad(today, 'Mensual'),
                    presupuesto: 0,
                    responsable: currentSedeObj.director_responsable || currentUser.nombre_completo,
                    responsable_correo: currentUser.correo,
                    soporte_pdf_nombre: '',
                    soporte_pdf_data: '',
                  }

                  const updateProgField = <K extends keyof typeof prog>(
                    field: K,
                    value: (typeof prog)[K],
                  ) => {
                    setEvalItems((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? {
                              ...x,
                              programacion_mantenimiento: {
                                ...(x.programacion_mantenimiento || prog),
                                [field]: value,
                              },
                            }
                          : x,
                      ),
                    )
                  }

                  return (
                    <>
                      <tr key={item.item_key}>
                        <td data-label="Ítem">
                          <strong>
                            {idx + 1}. {item.item_nombre}
                          </strong>
                        </td>
                        <td data-label="Calificación">
                          <select
                            value={item.calificacion}
                            onChange={(e) => {
                              const val = e.target.value as CalificacionCondicionFisica
                              setEvalItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        calificacion: val,
                                        programacion_mantenimiento:
                                          x.programacion_mantenimiento || prog,
                                      }
                                    : x,
                                ),
                              )
                            }}
                            style={{
                              width: '100%',
                              padding: '7px 8px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              fontWeight: 700,
                              color:
                                item.calificacion === 'cumple'
                                  ? '#176342'
                                  : item.calificacion === 'parcial'
                                    ? '#b45309'
                                    : '#b42318',
                              background:
                                item.calificacion === 'cumple'
                                  ? '#f0fdf4'
                                  : item.calificacion === 'parcial'
                                    ? '#fffbeb'
                                    : '#fef2f2',
                            }}
                          >
                            <option value="cumple">Cumple</option>
                            <option value="parcial">Cumple parcialmente</option>
                            <option value="no_cumple">No cumple</option>
                          </select>
                        </td>
                        <td data-label="Fortaleza">
                          <input
                            value={item.fortaleza ?? item.observacion ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setEvalItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, fortaleza: val, observacion: val }
                                    : x,
                                ),
                              )
                            }}
                            placeholder="Registrar fortaleza observada en el ítem..."
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                            }}
                          />
                        </td>
                        <td data-label="Debilidad">
                          <input
                            required={requiresMaintenance}
                            value={item.debilidad ?? item.hallazgo ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setEvalItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        debilidad: val,
                                        hallazgo: val,
                                        programacion_mantenimiento: {
                                          ...(x.programacion_mantenimiento || prog),
                                          descripcion:
                                            (x.programacion_mantenimiento || prog).descripcion ||
                                            val,
                                        },
                                      }
                                    : x,
                                ),
                              )
                            }}
                            placeholder={
                              requiresMaintenance
                                ? 'Describir debilidad / hallazgo obligatorio *'
                                : 'Opcional si presenta oportunidad de mejora...'
                            }
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              border: requiresMaintenance
                                ? '1.5px solid #f59e0b'
                                : '1px solid #cbd5e1',
                              background: requiresMaintenance ? '#fffbeb' : '#ffffff',
                              borderRadius: 6,
                            }}
                          />
                        </td>
                      </tr>

                      {/* Fila desplegable automática para programar la actividad en el Plan de Mantenimiento de la Sede */}
                      {requiresMaintenance && (
                        <tr key={`${item.item_key}-prog`} style={{ background: '#f8fafc' }}>
                          <td colSpan={4} style={{ padding: '12px 16px', borderTop: 'none' }}>
                            <div
                              style={{
                                border: '1.5px solid #93c5fd',
                                borderRadius: 10,
                                padding: '14px 16px',
                                background: '#eff6ff',
                                display: 'grid',
                                gap: 12,
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Wrench size={15} style={{ color: '#1d4ed8' }} />
                                  <strong style={{ fontSize: 12.5, color: '#1e3a8a' }}>
                                    Programación en el Plan de Mantenimiento de la Sede ({currentSedeObj.nombre}) — Ítem {idx + 1}: {item.item_nombre}
                                  </strong>
                                </div>
                                <span className="plan-badge plan-urgent" style={{ fontSize: 10.5, fontWeight: 700 }}>
                                  Se envía al Plan de Mantenimiento de la Sede y al Plan de Trabajo
                                </span>
                              </div>

                              <div className="plan-form-grid">
                                <label className="form-field">
                                  <span>
                                    Clasificación de Mantenimiento <b>*</b>
                                  </span>
                                  <select
                                    value={prog.clasificacion}
                                    onChange={(e) =>
                                      updateProgField(
                                        'clasificacion',
                                        e.target.value as ClasificacionMantenimientoInfra,
                                      )
                                    }
                                  >
                                    {CLASIFICACIONES_INFRA.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="form-field">
                                  <span>
                                    Título de la Actividad a Programar <b>*</b>
                                  </span>
                                  <input
                                    required
                                    value={prog.titulo}
                                    onChange={(e) => updateProgField('titulo', e.target.value)}
                                    placeholder="Ej. Resane e impermeabilización de muros..."
                                  />
                                </label>

                                <label className="form-field">
                                  <span>
                                    Frecuencia <b>*</b>
                                  </span>
                                  <select
                                    value={prog.periodicidad}
                                    onChange={(e) =>
                                      updateProgField(
                                        'periodicidad',
                                        e.target.value as PeriodicidadCriterioAdmin,
                                      )
                                    }
                                  >
                                    {FRECUENCIAS_CRONOGRAMA_ADMIN.map((f) => (
                                      <option key={f} value={f}>
                                        {f}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="form-field">
                                  <span>
                                    Fecha Programada de Ejecución <b>*</b>
                                  </span>
                                  <input
                                    type="date"
                                    required
                                    value={prog.fecha_ejecucion}
                                    onChange={(e) =>
                                      updateProgField('fecha_ejecucion', e.target.value)
                                    }
                                  />
                                </label>

                                <label className="form-field">
                                  <span>
                                    Presupuesto Estimado ($ COP) <b>*</b>
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="50000"
                                    required
                                    value={prog.presupuesto}
                                    onChange={(e) =>
                                      updateProgField('presupuesto', Number(e.target.value) || 0)
                                    }
                                  />
                                </label>

                                <label className="form-field">
                                  <span>
                                    Responsable de Ejecución <b>*</b>
                                  </span>
                                  <input
                                    required
                                    value={prog.responsable}
                                    onChange={(e) => updateProgField('responsable', e.target.value)}
                                  />
                                </label>

                                <label className="form-field plan-wide">
                                  <span>
                                    Descripción Técnica de la Actividad de Mantenimiento <b>*</b>
                                  </span>
                                  <input
                                    required
                                    value={prog.descripcion}
                                    onChange={(e) => updateProgField('descripcion', e.target.value)}
                                    placeholder="Describe el alcance del mantenimiento correctivo/preventivo que se ejecutará..."
                                  />
                                </label>

                                <div className="form-field plan-wide">
                                  <span>
                                    Soporte PDF Adjunto (Cotización / Orden / Ficha Técnica - Opcional)
                                  </span>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <label
                                      className="button button-secondary"
                                      style={{ cursor: 'pointer', flex: 1, height: 36 }}
                                    >
                                      <FilePlus2 size={14} />{' '}
                                      {prog.soporte_pdf_nombre
                                        ? `PDF cargado: ${prog.soporte_pdf_nombre}`
                                        : 'Adjuntar soporte PDF (Opcional)'}
                                      <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0]
                                          if (!f) return
                                          const r = new FileReader()
                                          r.onload = () => {
                                            if (typeof r.result === 'string') {
                                              setEvalItems((prev) =>
                                                prev.map((x, i) =>
                                                  i === idx
                                                    ? {
                                                        ...x,
                                                        programacion_mantenimiento: {
                                                          ...(x.programacion_mantenimiento || prog),
                                                          soporte_pdf_nombre: f.name,
                                                          soporte_pdf_data: r.result as string,
                                                        },
                                                      }
                                                    : x,
                                                ),
                                              )
                                            }
                                          }
                                          r.readAsDataURL(f)
                                        }}
                                      />
                                    </label>
                                    {prog.soporte_pdf_nombre && (
                                      <button
                                        type="button"
                                        className="button button-secondary button-danger"
                                        onClick={() => {
                                          updateProgField('soporte_pdf_nombre', '')
                                          updateProgField('soporte_pdf_data', '')
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Bloque de Registro Fotográfico General de la Evaluación (Mínimo 1, Máximo 4 fotos cuando hay Parcial o No Cumple) */}
          {evalItems.some(
            (i) => i.calificacion === 'parcial' || i.calificacion === 'no_cumple',
          ) && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 12,
                border: '1.5px solid #f59e0b',
                background: '#fffbeb',
                display: 'grid',
                gap: 12,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Camera size={18} style={{ color: '#b45309' }} />
                  <div>
                    <strong style={{ fontSize: 13.5, color: '#78350f', display: 'block' }}>
                      Registro Fotográfico General de la Evaluación de Condiciones Físicas (Obligatorio: Mínimo 1 · Máximo 4 fotos)
                    </strong>
                    <small style={{ color: '#92400e', fontSize: 11.5 }}>
                      Como la evaluación general presenta ítems con <em>Cumple parcialmente</em> o <em>No cumple</em>, adjunta de 1 a 4 fotografías de evidencia de los hallazgos encontrados en la sede.
                    </small>
                  </div>
                </div>
                <span className="plan-badge plan-month" style={{ fontWeight: 700 }}>
                  {evalPhotoSlots.filter(Boolean).length} / 4 foto(s) cargada(s)
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 12,
                }}
              >
                {[0, 1, 2, 3].map((slotIdx) => {
                  const slot = evalPhotoSlots[slotIdx]
                  return (
                    <div
                      key={slotIdx}
                      style={{
                        border: '1px solid #fcd34d',
                        borderRadius: 10,
                        padding: 10,
                        background: '#ffffff',
                        display: 'grid',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <strong style={{ fontSize: 11.5, color: '#1e293b' }}>
                          Fotografía #{slotIdx + 1} {slotIdx === 0 ? '(Obligatoria *)' : '(Opcional)'}
                        </strong>
                        {slot && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Eliminar fotografía"
                            onClick={() =>
                              setEvalPhotoSlots((prev) =>
                                prev.map((it, idx) => (idx === slotIdx ? null : it)),
                              )
                            }
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {slot ? (
                        <img
                          src={slot.url}
                          alt={slot.leyenda}
                          onClick={() =>
                            setPreviewPhoto({ src: slot.url, title: slot.leyenda })
                          }
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                          }}
                        />
                      ) : (
                        <label
                          style={{
                            height: 120,
                            border: '1.5px dashed #cbd5e1',
                            borderRadius: 8,
                            display: 'grid',
                            placeItems: 'center',
                            textAlign: 'center',
                            padding: 8,
                            fontSize: 11.5,
                            color: '#64748b',
                            cursor: 'pointer',
                            background: '#f8fafc',
                          }}
                        >
                          <span>
                            <Camera size={18} style={{ display: 'block', margin: '0 auto 4px' }} />
                            Subir Foto #{slotIdx + 1}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              handleUploadEvalPhoto(
                                slotIdx,
                                e.target.files?.[0] ?? null,
                                `Evidencia Evaluación Física #${slotIdx + 1}`,
                              )
                            }
                          />
                        </label>
                      )}

                      <input
                        value={slot?.leyenda || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setEvalPhotoSlots((prev) =>
                            prev.map((it, idx) =>
                              idx === slotIdx && it ? { ...it, leyenda: val } : it,
                            ),
                          )
                        }}
                        placeholder={`Descripción foto #${slotIdx + 1}...`}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          fontSize: 11.5,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          VENTANA 5: CENTRO DE ALERTAS DE MANTENIMIENTO LOCATIVO (Vencidas, Mes Actual / <=30d, Preventivas)
         ==================================================================== */}
      {windowView === 'alertas' && (() => {
        const groupVencidos = evaluatedActivities
          .filter(({ act, sem }) => act.estado !== 'Ejecutada' && sem.days < 0)
          .sort((a, b) => a.sem.days - b.sem.days)

        const groupMesOCriticos = evaluatedActivities
          .filter(({ act, sem }) => {
            if (act.estado === 'Ejecutada' || sem.days < 0) return false
            const inCurrentMonth = act.plazo_ejecucion.startsWith(`${currentMonthPrefix}-`)
            return inCurrentMonth || sem.days <= 30
          })
          .sort((a, b) => a.sem.days - b.sem.days)

        const groupPreventivas = evaluatedActivities
          .filter(({ act, sem }) => {
            if (act.estado === 'Ejecutada' || sem.days < 0) return false
            const inCurrentMonth = act.plazo_ejecucion.startsWith(`${currentMonthPrefix}-`)
            if (inCurrentMonth || sem.days <= 30) return false
            return sem.days <= 60
          })
          .sort((a, b) => a.sem.days - b.sem.days)

        const sections = [
          {
            key: 'vencidos' as const,
            numero: '01',
            titulo: 'ALERTA ROJA · MANTENIMIENTOS LOCATIVOS VENCIDOS',
            subtitulo: 'Actividades cuya fecha programada ya venció sin cierre de ejecución.',
            badgeText: `${groupVencidos.length} vencida(s)`,
            badgeClass: 'plan-overdue',
            border: '#fca5a5',
            bg: '#fef2f2',
            items: groupVencidos,
          },
          {
            key: 'mes_o_criticos' as const,
            numero: '02',
            titulo: `ALERTA CRÍTICA · VENCEN EN EL MES EN CURSO O ≤ 30 DÍAS (${currentMonthPrefix})`,
            subtitulo: 'Mantenimientos locativos programados para el mes actual o próximos 30 días.',
            badgeText: `${groupMesOCriticos.length} crítica(s)`,
            badgeClass: 'plan-urgent',
            border: '#fdba74',
            bg: '#fff7ed',
            items: groupMesOCriticos,
          },
          {
            key: 'preventivas' as const,
            numero: '03',
            titulo: 'ALERTA PREVENTIVA · PRÓXIMOS A VENCER SEGÚN SEMÁFORO (31 A 60 DÍAS)',
            subtitulo: 'Actividades en franja amarilla de prioridad para alistamiento de presupuesto y proveedor.',
            badgeText: `${groupPreventivas.length} preventiva(s)`,
            badgeClass: 'plan-month',
            border: '#fde047',
            bg: '#fefce8',
            items: groupPreventivas,
          },
        ].filter((s) => alertTabFilter === 'todas' || s.key === alertTabFilter)

        return (
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
                  Centro de Alertas del Plan de Mantenimiento de Infraestructura ({totalAlertasCount})
                </h2>
                <small style={{ color: '#64748b' }}>
                  Inicia por actividades vencidas y continúa con las próximas a vencer en el mes en curso según el semáforo.
                </small>
              </div>
              <div className="view-toggle">
                <button
                  type="button"
                  className={alertTabFilter === 'todas' ? 'view-selected' : ''}
                  onClick={() => setAlertTabFilter('todas')}
                >
                  Todas ({totalAlertasCount})
                </button>
                <button
                  type="button"
                  className={alertTabFilter === 'vencidos' ? 'view-selected' : ''}
                  onClick={() => setAlertTabFilter('vencidos')}
                >
                  1. Vencidas ({groupVencidos.length})
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

            {sections.map((sec) => (
              <section
                key={sec.key}
                className="panel"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: `1px solid ${sec.border}`,
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    padding: '13px 18px',
                    background: sec.bg,
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: '#1e3a8a',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11.5,
                        fontWeight: 700,
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
                  <div style={{ padding: '14px 18px', color: '#15966a', fontSize: 12, fontWeight: 600 }}>
                    Sin alertas en este nivel para el filtro de sede seleccionado.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 800 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ width: '18%', padding: '10px 14px', textAlign: 'left', fontSize: 11 }}>
                            SEMÁFORO Y PLAZO
                          </th>
                          <th style={{ width: '16%', padding: '10px 10px', textAlign: 'left', fontSize: 11 }}>
                            SEDE Y CLASIFICACIÓN
                          </th>
                          <th style={{ width: '28%', padding: '10px 10px', textAlign: 'left', fontSize: 11 }}>
                            ACTIVIDAD Y FRECUENCIA
                          </th>
                          <th style={{ width: '14%', padding: '10px 10px', textAlign: 'left', fontSize: 11 }}>
                            PRESUPUESTO
                          </th>
                          <th style={{ width: '12%', padding: '10px 8px', textAlign: 'left', fontSize: 11 }}>
                            RESPONSABLE
                          </th>
                          <th style={{ width: '12%', padding: '10px 12px', textAlign: 'center', fontSize: 11 }}>
                            ACCIONES
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.items.map(({ act, sem }, idx) => {
                          const sObj = sedesOperativas.find((s) => s.id === act.sede_id)
                          return (
                            <tr
                              key={act.id}
                              style={{ borderTop: idx === 0 ? 'none' : '1px solid #edf2f7' }}
                            >
                              <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                                <span className={`plan-badge ${sem.badgeClass}`} style={{ fontWeight: 700 }}>
                                  {sem.label}
                                </span>
                                <strong style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                                  {formatDateES(act.plazo_ejecucion)}
                                </strong>
                              </td>
                              <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                <span className="plan-badge plan-complete" style={{ fontSize: 10 }}>
                                  {sObj?.nombre || act.sede_id}
                                </span>
                                <small style={{ display: 'block', marginTop: 4, color: '#475569', fontWeight: 600 }}>
                                  {act.clasificacion}
                                </small>
                              </td>
                              <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                <strong style={{ fontSize: 12.5, color: '#0f172a' }}>{act.titulo}</strong>
                                <span className="plan-badge plan-future" style={{ display: 'inline-block', marginLeft: 6, fontSize: 10 }}>
                                  {act.periodicidad || 'Semestral'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                <strong style={{ fontSize: 11.5 }}>{formatCOP(act.presupuesto || 0)}</strong>
                              </td>
                              <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                                <strong style={{ fontSize: 11.5 }}>{act.responsable}</strong>
                              </td>
                              <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 116, margin: '0 auto' }}>
                                  <button
                                    type="button"
                                    onClick={() => openSeguimientoModal(act)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5,
                                      height: 29,
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
                                    onClick={() => {
                                      setSelectedActivity(act)
                                      setModalMode('ficha')
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5,
                                      height: 29,
                                      padding: '0 8px',
                                      borderRadius: 6,
                                      border: '1px solid #cbd5e1',
                                      background: '#fff',
                                      color: '#334155',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: 'pointer',
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

      {/* ====================================================================
          MODALES DE PROGRAMACIÓN, EJECUCIÓN CON FOTOS Y BITÁCORA DE AUDITORÍA
         ==================================================================== */}
      {modalMode && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="case-dialog record-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <Wrench size={20} />
                </span>
                <div>
                  <small>MÓDULO DE INFRAESTRUCTURA · PLAN DE MANTENIMIENTO ANUAL POR SEDE</small>
                  <h2>
                    {modalMode === 'crear' &&
                      'Programar Nueva Actividad de Mantenimiento Locativo'}
                    {modalMode === 'programar_fechas' &&
                      `Programador Anual de Fechas · ${selectedActivity?.titulo}`}
                    {modalMode === 'ajustar' &&
                      `Ajustar Actividad y Presupuesto (Control de Auditoría) · ${selectedActivity?.titulo}`}
                    {modalMode === 'seguimiento' &&
                      `Ejecutar Mantenimiento, Soporte PDF y Registro Fotográfico · ${selectedActivity?.titulo}`}
                    {modalMode === 'ficha' &&
                      `Ficha Técnica e Historial de Auditoría · ${selectedActivity?.titulo}`}
                  </h2>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="case-dialog-body">
              {/* MODAL 1: CREAR / PROGRAMAR FECHAS / AJUSTAR ACTIVIDAD */}
              {(modalMode === 'crear' ||
                modalMode === 'programar_fechas' ||
                modalMode === 'ajustar') && (
                <form onSubmit={handleSaveMaintenanceForm}>
                  <section className="case-section">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <h3 style={{ margin: 0 }}>
                        {modalMode === 'crear'
                          ? 'Datos de la Actividad, Presupuesto y Programación Anual'
                          : `Actualización de Programación y Presupuesto`}
                      </h3>
                      <span
                        className={`plan-badge ${
                          modalMode === 'crear' ? 'plan-complete' : 'plan-reprogrammed'
                        }`}
                      >
                        {modalMode === 'crear'
                          ? 'Programación Inicial — Versión v1 (Sin justificación)'
                          : `Ajuste sobre v${selectedActivity?.version_actividad || 1} → Creará Versión v${(selectedActivity?.version_actividad || 1) + 1} (Requiere Justificación)`}
                      </span>
                    </div>

                    {mFormError && (
                      <div className="portal-error" role="alert" style={{ marginBottom: 12 }}>
                        {mFormError}
                      </div>
                    )}

                    <div className="plan-form-grid">
                      <label className="form-field">
                        <span>
                          Sede <b>*</b>
                        </span>
                        <select
                          value={mSedeId}
                          disabled={modalMode !== 'crear'}
                          onChange={(e) => setMSedeId(e.target.value)}
                        >
                          {sedesOperativas.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="form-field">
                        <span>
                          Clasificación de Mantenimiento Locativo <b>*</b>
                        </span>
                        <select
                          value={mClasificacion}
                          onChange={(e) =>
                            setMClasificacion(e.target.value as ClasificacionMantenimientoInfra)
                          }
                        >
                          {CLASIFICACIONES_INFRA.map((cl) => (
                            <option key={cl} value={cl}>
                              {cl}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="form-field plan-wide">
                        <span>
                          Título de la Actividad de Mantenimiento / Reparación Locativa <b>*</b>
                        </span>
                        <input
                          required
                          value={mTitulo}
                          onChange={(e) => setMTitulo(e.target.value)}
                          placeholder="Ej. Mantenimiento de pintura epóxica, impermeabilización de cubierta, red hidrosanitaria..."
                        />
                      </label>

                      <label className="form-field plan-wide">
                        <span>
                          Descripción Técnica y Alcance de la Intervención <b>*</b>
                        </span>
                        <textarea
                          required
                          value={mDesc}
                          onChange={(e) => setMDesc(e.target.value)}
                          placeholder="Describe las áreas a intervenir, materiales, especificaciones locativas y alcance..."
                        />
                      </label>

                      <label className="form-field">
                        <span>
                          Responsable de la Ejecución <b>*</b>
                        </span>
                        <input
                          required
                          value={mResp}
                          onChange={(e) => setMResp(e.target.value)}
                        />
                      </label>

                      <label className="form-field">
                        <span>
                          Correo del Responsable (Alertas) <b>*</b>
                        </span>
                        <input
                          type="email"
                          required
                          value={mRespCorreo}
                          onChange={(e) => setMRespCorreo(e.target.value)}
                        />
                      </label>

                      <label className="form-field">
                        <span>
                          Presupuesto Estimado Anual ($ COP) <b>*</b>
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          required
                          value={mPresupuesto}
                          onChange={(e) => setMPresupuesto(e.target.value)}
                        />
                      </label>

                      <div className="form-field">
                        <span>Soporte PDF de Programación / Cotización (Opcional)</span>
                        <label
                          className="button button-secondary"
                          style={{ cursor: 'pointer', marginTop: 'auto', height: 40 }}
                        >
                          <FilePlus2 size={14} />{' '}
                          {mSoportePdfNombre
                            ? `PDF: ${mSoportePdfNombre.slice(0, 26)}`
                            : 'Adjuntar Soporte en PDF'}
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setMSoportePdfNombre(file.name)
                              const reader = new FileReader()
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setMSoportePdfData(reader.result)
                                }
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                      </div>

                      <label className="form-field plan-wide">
                        <span>
                          Frecuencia de Ejecución en el Año (Autocompleta las fechas desde la Fecha #1) <b>*</b>
                        </span>
                        <select
                          value={mPeriodicidad}
                          onChange={(e) => {
                            const nextPer = e.target.value as PeriodicidadCriterioAdmin
                            setMPeriodicidad(nextPer)
                            const baseD = mFechasAnuales[0]?.fecha_programada || today
                            setMFechasAnuales(
                              generateAnnualScheduleDates(baseD, nextPer, mFechasAnuales),
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
                    </div>

                    {/* Grilla de Fechas Sugeridas Automáticamente desde la Fecha #1 */}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <strong style={{ fontSize: 13, color: '#172c4c', display: 'block' }}>
                            Fechas de Ejecución Programadas en el Año ({mFechasAnuales.length} fecha(s))
                          </strong>
                          <small style={{ color: '#475569', fontSize: 11.5 }}>
                            Al cambiar la <strong>Fecha #1</strong>, las fechas siguientes se autocompletan según la frecuencia (y puedes ajustar cualquiera manualmente).
                          </small>
                        </div>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => {
                            const lastD =
                              mFechasAnuales[mFechasAnuales.length - 1]?.fecha_programada || today
                            const nNum = mFechasAnuales.length + 1
                            setMFechasAnuales([
                              ...mFechasAnuales,
                              {
                                id: `inf-dt-${Date.now()}-${nNum}`,
                                numero: nNum,
                                etiqueta: `Fecha Programada #${nNum}`,
                                fecha_programada: calculateExpirationByPeriodicidad(
                                  lastD,
                                  mPeriodicidad,
                                ),
                                estado: 'pendiente',
                              },
                            ])
                          }}
                        >
                          <Plus size={13} /> Agregar fecha adicional
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                          gap: 10,
                        }}
                      >
                        {mFechasAnuales.map((item, idx) => {
                          const isFirst = idx === 0
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: 11.5, color: '#0f172a' }}>
                                  {item.etiqueta}
                                </strong>
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
                                      : 'Sugerida · Editable'}
                                </span>
                              </div>
                              <input
                                type="date"
                                value={item.fecha_programada}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (!val) return
                                  if (isFirst) {
                                    setMFechasAnuales(
                                      generateAnnualScheduleDates(val, mPeriodicidad, mFechasAnuales),
                                    )
                                  } else {
                                    setMFechasAnuales((prev) =>
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
                                  border: '1px solid #cbd5e1',
                                  background: '#fff',
                                  fontSize: 12.5,
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {modalMode !== 'crear' && (
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
                            Control de Auditoría · Justificación obligatoria del ajuste o reprogramación (Se guardará como Versión v
                            {(selectedActivity?.version_actividad || 1) + 1}) <b>*</b>
                          </span>
                          <textarea
                            required
                            value={mJustificacion}
                            onChange={(e) => setMJustificacion(e.target.value)}
                            placeholder="Explica el motivo por el cual se reprograman las fechas o se ajusta la actividad para dejar trazabilidad en auditoría..."
                            style={{ marginTop: 6, background: '#fff', border: '1px solid #fcd34d' }}
                          />
                        </label>
                      </div>
                    )}
                  </section>

                  <div className="case-save-actions">
                    <span>
                      {modalMode === 'crear'
                        ? 'Se creará la Versión v1 de la actividad y se vinculará al Plan de Trabajo.'
                        : `Se conservará la versión anterior y se guardará la Versión v${(selectedActivity?.version_actividad || 1) + 1} con tu justificación.`}
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
                      {modalMode === 'crear'
                        ? 'Guardar Actividad y Programación (v1)'
                        : `Guardar Versión v${(selectedActivity?.version_actividad || 1) + 1}`}
                    </button>
                  </div>
                </form>
              )}

              {/* MODAL 2: EJECUTAR / SEGUIMIENTO CON SOPORTE PDF Y 1 A 4 FOTOS REALES */}
              {modalMode === 'seguimiento' && selectedActivity && (
                <form onSubmit={handleSaveSeguimiento}>
                  <section className="case-section">
                    <h3>Ejecución de Mantenimiento: {selectedActivity.titulo}</h3>
                    {segError && (
                      <div className="portal-error" role="alert" style={{ marginBottom: 12 }}>
                        {segError}
                      </div>
                    )}
                    <div className="plan-form-grid">
                      <label className="form-field plan-wide">
                        <span>
                          Descripción detallada de la intervención ejecutada <b>*</b>
                        </span>
                        <textarea
                          required
                          value={segDesc}
                          onChange={(e) => setSegDesc(e.target.value)}
                          placeholder="Describe los trabajos locativos realizados, áreas intervenidas y materiales..."
                        />
                      </label>

                      <label className="form-field">
                        <span>Estado resultante de la actividad</span>
                        <select
                          value={segEstado}
                          onChange={(e) =>
                            setSegEstado(e.target.value as InfraMaintenanceActivity['estado'])
                          }
                        >
                          <option value="Ejecutada">Ejecutada / Cumplida</option>
                          <option value="En ejecución">En ejecución (Avance parcial)</option>
                          <option value="Programada">Programada</option>
                        </select>
                      </label>

                      <label className="form-field">
                        <span>Presupuesto Ejecutado ($ COP)</span>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          value={segPresupuestoEjec}
                          onChange={(e) => setSegPresupuestoEjec(e.target.value)}
                        />
                      </label>

                      <div className="form-field plan-wide">
                        <span>Soporte Documental / Acta o Factura en Formato PDF</span>
                        <label
                          className="button button-secondary"
                          style={{ cursor: 'pointer', height: 40 }}
                        >
                          <FilePlus2 size={14} />{' '}
                          {segSoporteNombre
                            ? `PDF cargado: ${segSoporteNombre}`
                            : 'Subir Acta / Soporte en Formato PDF'}
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setSegSoporteNombre(file.name)
                              const reader = new FileReader()
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setSegSoporteData(reader.result)
                                }
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <strong style={{ display: 'block', fontSize: 12.5, color: '#172c4c', marginBottom: 8 }}>
                        Evidencia Fotográfica del Mantenimiento (Mínimo 1 obligatoria, Máximo 4 fotografías) *
                      </strong>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: 12,
                        }}
                      >
                        {[
                          '1. Fotografía Antes / Durante Intervención (Obligatoria *)',
                          '2. Fotografía Acabado Final Verificado (Opcional)',
                          '3. Fotografía Detalle Técnico / Área Limpia (Opcional)',
                          '4. Fotografía Adicional de Cierre (Opcional)',
                        ].map((slotLabel, idx) => {
                          const currentPhoto = segPhotoSlots[idx]
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
                                      setSegPhotoSlots((prev) =>
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
                                  src={currentPhoto.url}
                                  alt={currentPhoto.leyenda}
                                  style={{
                                    width: '100%',
                                    height: 130,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid #d5dfec',
                                    marginBottom: 8,
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
                                    handleUploadSegPhoto(
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
                  </section>

                  <div className="case-save-actions">
                    <span>
                      Al registrar la ejecución se actualiza el avance del Plan Anual de Mantenimiento de la sede y su bitácora de auditoría.
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setModalMode(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="button button-primary">
                      <CheckCircle2 size={14} /> Guardar Ejecución, Soporte PDF y Fotografías
                    </button>
                  </div>
                </form>
              )}

              {/* MODAL 3: FICHA TÉCNICA E HISTORIAL UNIFICADO DE AUDITORÍA */}
              {modalMode === 'ficha' && selectedActivity && (() => {
                const fichaDates = getActivityDates(selectedActivity, today)
                const fichaExecCount = fichaDates.filter((d) => d.estado === 'ejecutada').length

                return (
                  <>
                    <section className="case-section">
                      <h3>Ficha Técnica de la Actividad de Mantenimiento Locativo</h3>
                      <dl className="record-fields">
                        <div>
                          <dt>Actividad</dt>
                          <dd>
                            <strong>{selectedActivity.titulo}</strong>
                          </dd>
                        </div>
                        <div>
                          <dt>Clasificación Locativa</dt>
                          <dd>{selectedActivity.clasificacion}</dd>
                        </div>
                        <div>
                          <dt>Sede</dt>
                          <dd>
                            {sedesOperativas.find((s) => s.id === selectedActivity.sede_id)?.nombre ||
                              selectedActivity.sede_id}
                          </dd>
                        </div>
                        <div>
                          <dt>Responsable</dt>
                          <dd>
                            {selectedActivity.responsable} (
                            {selectedActivity.responsable_correo || 'infraestructura@calidadips.co'})
                          </dd>
                        </div>
                        <div className="record-field-wide">
                          <dt>Descripción Técnica</dt>
                          <dd>{selectedActivity.descripcion}</dd>
                        </div>
                        <div>
                          <dt>Presupuesto Programado</dt>
                          <dd>
                            <strong>{formatCOP(selectedActivity.presupuesto || 0)}</strong>
                          </dd>
                        </div>
                        <div>
                          <dt>Presupuesto Ejecutado</dt>
                          <dd>
                            <strong style={{ color: '#15966a' }}>
                              {formatCOP(selectedActivity.presupuesto_ejecutado || 0)}
                            </strong>
                          </dd>
                        </div>
                        <div>
                          <dt>Versión de Programación</dt>
                          <dd>
                            <span
                              className={`plan-badge ${
                                (selectedActivity.version_programacion || 1) > 1
                                  ? 'plan-reprogrammed'
                                  : 'plan-complete'
                              }`}
                            >
                              Programación v{selectedActivity.version_programacion || 1}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt>Versión General (Auditoría)</dt>
                          <dd>
                            <span className="plan-badge plan-future">
                              Versión v{selectedActivity.version_actividad || 1}
                            </span>
                          </dd>
                        </div>

                        {/* Fila inferior completa: Frecuencia y Fechas Programadas en el Año */}
                        <div className="record-field-wide">
                          <dt>Programación Anual Vigente · Frecuencia y Fechas de Ejecución</dt>
                          <dd style={{ marginTop: 6 }}>
                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap',
                                marginBottom: 8,
                                paddingBottom: 8,
                                borderBottom: '1px solid #e2e8f0',
                              }}
                            >
                              <span className="plan-badge plan-future" style={{ fontWeight: 700 }}>
                                Frecuencia: {selectedActivity.periodicidad || 'Semestral'}
                              </span>
                              <span className="plan-badge plan-month" style={{ fontWeight: 700 }}>
                                Avance Anual: {fichaExecCount} de {fichaDates.length} fecha(s) ejecutadas
                              </span>
                              {selectedActivity.soporte_pdf_nombre && (
                                <span className="plan-badge plan-complete">
                                  Soporte PDF: {selectedActivity.soporte_pdf_nombre}
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                                gap: 8,
                              }}
                            >
                              {fichaDates.map((dItem) => {
                                const isExec = dItem.estado === 'ejecutada'
                                return (
                                  <div
                                    key={dItem.id}
                                    style={{
                                      padding: '7px 10px',
                                      borderRadius: 7,
                                      border: isExec ? '1px solid #86efac' : '1px solid #cbd5e1',
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

                    <section className="case-section">
                      <h3>
                        1. Versiones de Ejecución, Soportes PDF y Registro Fotográfico (
                        {selectedActivity.seguimientos.length})
                      </h3>
                      {selectedActivity.seguimientos.length === 0 ? (
                        <p>No se han registrado ejecuciones aún para esta actividad.</p>
                      ) : (
                        selectedActivity.seguimientos.map((seg, sIdx) => (
                          <div
                            key={seg.id}
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: 10,
                              padding: 14,
                              marginBottom: 14,
                              background: '#fafbfd',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                              <strong>
                                <span className="plan-badge plan-complete">
                                  Ejecución v{selectedActivity.seguimientos.length - sIdx}
                                </span>{' '}
                                {formatDateES(seg.fecha)} · Estado: {seg.estado_resultante} · Resp:{' '}
                                {seg.responsable}
                              </strong>
                              {seg.presupuesto_ejecutado !== undefined && (
                                <span className="plan-badge plan-future">
                                  Ejecutado: {formatCOP(seg.presupuesto_ejecutado)}
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '6px 0' }}>{seg.descripcion}</p>
                            <small style={{ color: '#2563eb', fontWeight: 600 }}>
                              Soporte PDF: {seg.soporte_pdf_nombre || seg.soportes_archivos.join(', ')}
                            </small>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                                gap: 10,
                                marginTop: 10,
                              }}
                            >
                              {seg.fotos.map((f, fIdx) => (
                                <div
                                  key={f.id}
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 8,
                                    padding: 8,
                                    background: '#fff',
                                  }}
                                >
                                  <img
                                    src={f.url}
                                    alt={f.leyenda}
                                    onClick={() =>
                                      setPreviewPhoto({
                                        src: f.url,
                                        title: `${selectedActivity.titulo} · Foto #${fIdx + 1}`,
                                      })
                                    }
                                    style={{
                                      width: '100%',
                                      height: 125,
                                      objectFit: 'cover',
                                      borderRadius: 6,
                                      cursor: 'zoom-in',
                                    }}
                                  />
                                  <small style={{ display: 'block', marginTop: 4, fontWeight: 600 }}>
                                    {f.leyenda}
                                  </small>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </section>

                    <section className="case-section">
                      <h3>
                        2. Bitácora Inmutable de Versiones y Ajustes de la Actividad (
                        {Math.max(1, selectedActivity.historial.length)} versión/es)
                      </h3>
                      {selectedActivity.historial.length === 0 ? (
                        <ul className="case-files">
                          <li>
                            <span>
                              <span className="plan-badge plan-complete">
                                Versión v1 · Programación inicial
                              </span>{' '}
                              <strong>
                                Frecuencia: {selectedActivity.periodicidad || 'Semestral'} · Resp:{' '}
                                {selectedActivity.responsable}
                              </strong>
                              <br />
                              <strong>Presupuesto:</strong> {formatCOP(selectedActivity.presupuesto || 0)}
                              <br />
                              <strong>Justificación de auditoría:</strong> Programación inicial del Plan de Mantenimiento Anual (Versión v1)
                            </span>
                          </li>
                        </ul>
                      ) : (
                        <ul className="case-files">
                          {selectedActivity.historial.map((h, hIdx) => (
                            <li key={h.id}>
                              <span>
                                <span
                                  className={`plan-badge ${
                                    h.tipo === 'Reprogramación'
                                      ? 'plan-reprogrammed'
                                      : h.tipo === 'Seguimiento'
                                        ? 'plan-complete'
                                        : 'plan-future'
                                  }`}
                                >
                                  Versión v{h.version || selectedActivity.historial.length - hIdx} · {h.tipo}
                                </span>{' '}
                                <strong>
                                  {h.fecha} · Usuario: {h.usuario}
                                </strong>
                                {h.detalle_version && (
                                  <>
                                    <br />
                                    <strong>Detalle:</strong> {h.detalle_version}
                                  </>
                                )}
                                <br />
                                <strong>Justificación de auditoría:</strong> {h.justificacion}
                                {h.valores_anteriores && (
                                  <>
                                    <br />
                                    <small style={{ color: '#64748b' }}>
                                      {h.valores_anteriores}
                                    </small>
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
            </div>
          </div>
        </div>
      )}

      {/* Visor de Fotografía Ampliada */}
      {previewPhoto && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 130 }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="case-dialog record-dialog"
            style={{ width: 'min(760px, calc(100vw - 40px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="case-dialog-header">
              <div className="record-dialog-title">
                <span className="record-dialog-title-icon">
                  <Camera size={20} />
                </span>
                <div>
                  <small>EVIDENCIA FOTOGRÁFICA DE MANTENIMIENTO LOCATIVO</small>
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
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
