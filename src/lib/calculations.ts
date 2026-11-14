import type {
  AdminCriterionRecord,
  ComiteInstitucional,
  ActaReunion,
  FrecuenciaMantenimientoEquipo,
  EquipoMaintenanceDate,
  ServicioCapacidadConfig,
  HallazgoCalidad,
  Evaluacion3100Sede,
  Estandar3100Key,
} from './types'
import { ESTANDARES_3100 } from './normativa-3100'

export function todayISO(): string {
  // Fecha de referencia del entorno o fecha actual
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateES(iso?: string | null): string {
  if (!iso) return 'Sin fecha'
  const parts = iso.slice(0, 10).split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const mi = Number(m) - 1
  return `${Number(d)} ${months[mi] ?? m} ${y}`
}

export function formatCOP(val?: number | null): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '$ 0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(val))
}

export function diffDays(targetISO: string, fromISO: string = todayISO()): number {
  const t = new Date(`${targetISO.slice(0, 10)}T12:00:00Z`).getTime()
  const f = new Date(`${fromISO.slice(0, 10)}T12:00:00Z`).getTime()
  return Math.round((t - f) / (1000 * 60 * 60 * 24))
}

// ============================================================================
// SEMÁFORO DE 30 / 60 / +60 DÍAS (Administración, Infraestructura, Equipos)
// Crítico: <= 30 días (o vencido)
// Prioridad: 31 a 60 días
// Sin prioridad: > 60 días
// ============================================================================
export type SemaphoreLevel = 'critico' | 'prioridad' | 'sin_prioridad' | 'cumple_ejecutado'

export interface SemaphoreResult {
  level: SemaphoreLevel
  label: string
  days: number
  countdown: string
  badgeClass: string
  dotColor: string
}

export function evaluateSemaphore3060(
  dueDateISO: string,
  today: string = todayISO(),
  isCompleted: boolean = false,
): SemaphoreResult {
  const days = diffDays(dueDateISO, today)
  if (isCompleted && days > 60) {
    return {
      level: 'sin_prioridad',
      label: 'Sin prioridad (> 60 días)',
      days,
      countdown: `En ${days} días`,
      badgeClass: 'plan-complete',
      dotColor: '#15966a',
    }
  }
  if (days < 0) {
    return {
      level: 'critico',
      label: `Crítico · Vencido (${Math.abs(days)} d)`,
      days,
      countdown: `Vencido hace ${Math.abs(days)} días`,
      badgeClass: 'plan-overdue',
      dotColor: '#d94f56',
    }
  }
  if (days <= 30) {
    return {
      level: 'critico',
      label: `Crítico (≤ 30 días · ${days} d)`,
      days,
      countdown: days === 0 ? 'Vence hoy' : `Vence en ${days} días`,
      badgeClass: 'plan-urgent',
      dotColor: '#d94f56',
    }
  }
  if (days <= 60) {
    return {
      level: 'prioridad',
      label: `Prioridad (31-60 días · ${days} d)`,
      days,
      countdown: `Vence en ${days} días`,
      badgeClass: 'plan-month',
      dotColor: '#d69016',
    }
  }
  return {
    level: 'sin_prioridad',
    label: `Sin prioridad (> 60 días · ${days} d)`,
    days,
    countdown: `Vence en ${days} días`,
    badgeClass: 'plan-complete',
    dotColor: '#15966a',
  }
}

export function summarizeModalidadesREPS(
  mod: import('./types').SedeServicioHabilitadoREPS['modalidades'],
): string[] {
  const list: string[] = []
  if (mod.intramural) list.push('Intramural')
  if (mod.extramural_unidad_movil) list.push('Extramural Unidad Móvil')
  if (mod.extramural_domiciliario) list.push('Extramural Domiciliario')
  if (mod.extramural_jornada_salud) list.push('Extramural Jornada de Salud')
  if (mod.extramural_transporte_aph) list.push('Extramural Transporte Asistencial / APH')
  if (mod.telemedicina_ref_interactiva) list.push('Telemedicina Ref. Interactiva')
  if (mod.telemedicina_ref_no_interactiva) list.push('Telemedicina Ref. No Interactiva')
  if (mod.telemedicina_ref_telexperticia) list.push('Telemedicina Ref. Telexperticia')
  if (mod.telemedicina_ref_telemonitoreo) list.push('Telemedicina Ref. Telemonitoreo')
  if (mod.telemedicina_rem_telexperticia) list.push('Telemedicina Remisor Telexperticia')
  if (mod.telemedicina_rem_telemonitoreo) list.push('Telemedicina Remisor Telemonitoreo')
  return list.length > 0 ? list : ['Intramural']
}

export function addDaysISO(dateISO: string, daysToAdd: number): string {
  const d = new Date(`${dateISO.slice(0, 10)}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + daysToAdd)
  return d.toISOString().slice(0, 10)
}

// ============================================================================
// SEMÁFORO DE VIGENCIA Y RENOVACIÓN ANUAL DE LA HABILITACIÓN REPS DE LA SEDE
// La habilitación se renueva anualmente y debe realizarse dentro de los 30 días
// anteriores al vencimiento. Su no realización deja SIN HABILITACIÓN la sede.
// ============================================================================
export function evaluateSedeHabilitacionStatus(
  fechaVencimientoISO?: string,
  today: string = todayISO(),
): {
  days: number
  fechaInicioVentana30d: string
  estado: 'vigente' | 'proximo_ventana' | 'ventana_renovacion_30d' | 'sin_habilitacion'
  label: string
  detalle: string
  badgeClass: string
} {
  const venc = fechaVencimientoISO || addDaysISO(today, 365)
  const days = diffDays(venc, today)
  const inicioVentana = addDaysISO(venc, -30)

  if (days < 0) {
    return {
      days,
      fechaInicioVentana30d: inicioVentana,
      estado: 'sin_habilitacion',
      label: `Sede sin habilitación (Venció hace ${Math.abs(days)} días)`,
      detalle: `La habilitación REPS venció el ${formatDateES(venc)} sin renovación oportuna.`,
      badgeClass: 'plan-overdue',
    }
  }
  if (days <= 30) {
    return {
      days,
      fechaInicioVentana30d: inicioVentana,
      estado: 'ventana_renovacion_30d',
      label: `Crítico · Ventana de renovación (${days} días restantes)`,
      detalle: `En ventana crítica de 30 días previos (${formatDateES(inicioVentana)} a ${formatDateES(venc)}). Si no se renueva queda sin habilitación.`,
      badgeClass: 'plan-urgent',
    }
  }
  if (days <= 60) {
    return {
      days,
      fechaInicioVentana30d: inicioVentana,
      estado: 'proximo_ventana',
      label: `Prioridad · Próxima a renovación (${days} d)`,
      detalle: `Ventana obligatoria de renovación (30 días antes) inicia el ${formatDateES(inicioVentana)}.`,
      badgeClass: 'plan-month',
    }
  }
  return {
    days,
    fechaInicioVentana30d: inicioVentana,
    estado: 'vigente',
    label: `Habilitación vigente (${days} días · Vence ${formatDateES(venc)})`,
    detalle: `Renovación anual obligatoria entre el ${formatDateES(inicioVentana)} y el ${formatDateES(venc)}.`,
    badgeClass: 'plan-complete',
  }
}

export function addMonthsISO(dateISO: string, monthsToAdd: number): string {
  const parts = dateISO.slice(0, 10).split('-')
  const y = Number(parts[0]) || 2026
  const m = (Number(parts[1]) || 1) - 1
  const d = Number(parts[2]) || 1
  const target = new Date(Date.UTC(y, m + monthsToAdd, d, 12, 0, 0))
  return target.toISOString().slice(0, 10)
}

// ============================================================================
// GENERADOR DE PROGRAMACIÓN ANUAL DE EJECUCIÓN (Cubre 1 año completo de fechas
// según la frecuencia: Mensual=12, Bimestral=6, Trimestral=4, Cuatrimestral=3,
// Semestral=2, Anual/Según vigencia/Única vez=1)
// ============================================================================
export function generateAnnualScheduleDates(
  firstExecutionISO: string,
  periodicidad?: string,
  existingDates?: import('./types').AdminScheduledExecutionDate[],
): import('./types').AdminScheduledExecutionDate[] {
  const start = firstExecutionISO || todayISO()
  let count = 1
  let stepMonths = 12
  let prefix = 'Ejecución Anual'

  if (periodicidad === 'Mensual') {
    count = 12
    stepMonths = 1
    prefix = 'Mes'
  } else if (periodicidad === 'Bimestral') {
    count = 6
    stepMonths = 2
    prefix = 'Bimestre'
  } else if (periodicidad === 'Trimestral') {
    count = 4
    stepMonths = 3
    prefix = 'Trimestre'
  } else if (periodicidad === 'Cuatrimestral') {
    count = 3
    stepMonths = 4
    prefix = 'Cuatrimestre'
  } else if (periodicidad === 'Semestral') {
    count = 2
    stepMonths = 6
    prefix = 'Semestre'
  } else {
    count = 1
    stepMonths = 12
    prefix = 'Programación Anual'
  }

  const out: import('./types').AdminScheduledExecutionDate[] = []
  for (let i = 0; i < count; i++) {
    const prev = existingDates?.[i]
    const fechaProg = addMonthsISO(start, i * stepMonths)
    out.push({
      id: prev?.id || `prog-anual-${Date.now()}-${i + 1}`,
      numero: i + 1,
      etiqueta: count === 1 ? 'Ejecución Anual #1' : `${prefix} #${i + 1} de ${count}`,
      fecha_programada: fechaProg,
      estado: prev?.estado === 'ejecutada' ? 'ejecutada' : 'pendiente',
      fecha_ejecutada: prev?.fecha_ejecutada,
      soporte_version: prev?.soporte_version,
    })
  }
  return out
}

export function calculateExpirationByPeriodicidad(
  emissionDateISO: string,
  periodicidad?: string,
): string {
  if (periodicidad === 'Mensual') return addDaysISO(emissionDateISO, 30)
  if (periodicidad === 'Bimestral') return addDaysISO(emissionDateISO, 60)
  if (periodicidad === 'Trimestral') return addDaysISO(emissionDateISO, 90)
  if (periodicidad === 'Cuatrimestral') return addDaysISO(emissionDateISO, 120)
  if (periodicidad === 'Semestral') return addDaysISO(emissionDateISO, 180)
  if (periodicidad === 'Anual') return addDaysISO(emissionDateISO, 365)
  if (periodicidad === 'Cada 2 años') return addDaysISO(emissionDateISO, 730)
  if (periodicidad === 'Segun necesidad') return addDaysISO(emissionDateISO, 30)
  if (periodicidad === 'Segun vigencia') return addDaysISO(emissionDateISO, 365)
  if (periodicidad === 'Unica vez' || periodicidad === 'Única vez / Permanente') return addDaysISO(emissionDateISO, 1825)
  return addDaysISO(emissionDateISO, 365)
}

// ============================================================================
// EVALUACIÓN DE CRITERIO ADMINISTRATIVO, ESTADO DINÁMICO Y REGLAS DE ALERTA POR CORREO
// - Si no existe soporte o está vencido -> No cumple (Estado bloqueado en rojo hasta ejecutar)
// - Si existe soporte y está vigente -> Cumple (El estado se ajusta con el tiempo: >60d, 31-60d, <=30d)
// - Alerta por correo:
//   * Próximo a vencer (Semáforo <=30d o 31-60d) -> Alerta preventiva al correo
//   * Día del vencimiento (0 días) -> Alerta de vencimiento hoy
//   * Posterior al vencimiento (<0 días o sin soporte vencido) -> AVISO TODOS LOS DÍAS al correo
//     y el estado NO cambia hasta que se ejecute el compromiso con soporte vigente.
// ============================================================================
export function evaluateAdminCriterion(record: AdminCriterionRecord, today: string = todayISO()): {
  cumple: boolean
  estadoLabel: 'Cumple' | 'No cumple'
  estadoSeguimiento:
    | 'Cumple · En término (>60d)'
    | 'Cumple · Prioridad renovación (31-60d)'
    | 'Cumple · Crítico próximo a vencer (≤30d)'
    | 'No cumple · Vencido (Alerta Diaria Activa)'
    | 'No cumple · Pendiente de ejecución'
  motivo: string
  ultimoSoporte: AdminCriterionRecord['soportes'][number] | null
  fechaEfectivaVencimiento: string
  semaforo: SemaphoreResult
  alertaCorreo: {
    activa: boolean
    frecuencia: 'Ninguna (En término)' | 'Preventiva (Próximo a vencer)' | 'Hoy (Día de vencimiento)' | 'DIARIA (Post-vencimiento hasta cumplir compromiso)'
    badgeClass: string
    mensajeCorreoResumen: string
  }
} {
  const ultimo = record.soportes.length > 0 ? record.soportes[record.soportes.length - 1] : null
  const fechaVenc = ultimo ? ultimo.fecha_vencimiento : record.fecha_vencimiento || record.fecha_programada_inicial
  const sem = evaluateSemaphore3060(fechaVenc, today)
  const days = diffDays(fechaVenc, today)
  const correo = record.responsable_correo || 'calidad@calidadips.co'

  if (!ultimo) {
    const isPastDue = days < 0
    return {
      cumple: false,
      estadoLabel: 'No cumple',
      estadoSeguimiento: isPastDue
        ? 'No cumple · Vencido (Alerta Diaria Activa)'
        : 'No cumple · Pendiente de ejecución',
      motivo: isPastDue
        ? `Sin ejecutar y plazo vencido hace ${Math.abs(days)} día(s). Estado fijo en NO CUMPLE hasta adjuntar soporte.`
        : `Pendiente de ejecución inicial (Plazo: ${formatDateES(fechaVenc)}).`,
      ultimoSoporte: null,
      fechaEfectivaVencimiento: fechaVenc,
      semaforo: sem,
      alertaCorreo: {
        activa: isPastDue || days <= 60,
        frecuencia: isPastDue
          ? 'DIARIA (Post-vencimiento hasta cumplir compromiso)'
          : days === 0
            ? 'Hoy (Día de vencimiento)'
            : days <= 60
              ? 'Preventiva (Próximo a vencer)'
              : 'Ninguna (En término)',
        badgeClass: isPastDue || days <= 30 ? 'plan-overdue' : 'plan-month',
        mensajeCorreoResumen: isPastDue
          ? `AVISO DIARIO a ${correo}: Compromiso vencido hace ${Math.abs(days)} días sin soporte.`
          : `Aviso preventivo a ${correo}: Vence en ${days} días.`,
      },
    }
  }

  if (days < 0) {
    return {
      cumple: false,
      estadoLabel: 'No cumple',
      estadoSeguimiento: 'No cumple · Vencido (Alerta Diaria Activa)',
      motivo: `Soporte v${ultimo.version} vencido hace ${Math.abs(days)} días (${formatDateES(ultimo.fecha_vencimiento)}). El estado NO cambia hasta ejecutar renovación.`,
      ultimoSoporte: ultimo,
      fechaEfectivaVencimiento: ultimo.fecha_vencimiento,
      semaforo: sem,
      alertaCorreo: {
        activa: true,
        frecuencia: 'DIARIA (Post-vencimiento hasta cumplir compromiso)',
        badgeClass: 'plan-overdue',
        mensajeCorreoResumen: `AVISO DIARIO a ${correo}: Soporte vencido hace ${Math.abs(days)} días. Renovar soporte.`,
      },
    }
  }

  const estadoSeg =
    days <= 30
      ? ('Cumple · Crítico próximo a vencer (≤30d)' as const)
      : days <= 60
        ? ('Cumple · Prioridad renovación (31-60d)' as const)
        : ('Cumple · En término (>60d)' as const)

  return {
    cumple: true,
    estadoLabel: 'Cumple',
    estadoSeguimiento: estadoSeg,
    motivo: `Soporte v${ultimo.version} vigente hasta ${formatDateES(ultimo.fecha_vencimiento)} (${days} días restantes)`,
    ultimoSoporte: ultimo,
    fechaEfectivaVencimiento: ultimo.fecha_vencimiento,
    semaforo: sem,
    alertaCorreo: {
      activa: days <= 60,
      frecuencia:
        days === 0
          ? 'Hoy (Día de vencimiento)'
          : days <= 60
            ? 'Preventiva (Próximo a vencer)'
            : 'Ninguna (En término)',
      badgeClass: days <= 30 ? 'plan-urgent' : days <= 60 ? 'plan-month' : 'plan-complete',
      mensajeCorreoResumen:
        days <= 60
          ? `Alerta activa a ${correo}: Próximo a vencer en ${days} días (${sem.label}).`
          : `En término (>60d) · Responsable: ${correo}`,
    },
  }
}

// ============================================================================
// MOTOR DE CAPACIDAD INSTALADA — TALENTO HUMANO
// Intramural: (Espacios * ((Horas L-V * Días L-V) + (Horas Sáb * Sábados)) * 60) / Tiempo Atención (min)
// Extramural: (N.º Profesionales * Horas contratadas mes * 60) / Tiempo Atención con transporte (min)
// Telemedicina: (N.º Profesionales/Módulos * Horas disponibles mes * 60) / Tiempo Atención (min)
// ============================================================================
export function calculateCapacidadInstaladaMes(cfg: ServicioCapacidadConfig): {
  horasTotalesMes: number
  minutosTotalesMes: number
  capacidadPacientesMes: number
  formulaExplicacion: string
} {
  const tiempo = Math.max(5, Number(cfg.tiempo_atencion_minutos) || 30)

  if (cfg.modalidad === 'Intramural') {
    const espacios = Math.max(1, Number(cfg.cantidad_espacios_fisicos) || 1)
    const horasLV = Math.max(0, Number(cfg.horas_lunes_viernes_dia) || 0) * Math.max(1, Number(cfg.dias_habiles_lv_mes) || 20)
    const horasSab = Math.max(0, Number(cfg.horas_sabado_dia) || 0) * Math.max(0, Number(cfg.sabados_mes) || 4)
    const horasPorEspacio = horasLV + horasSab
    const horasTotalesMes = espacios * horasPorEspacio
    const minutosTotalesMes = horasTotalesMes * 60
    const capacidadPacientesMes = Math.floor(minutosTotalesMes / tiempo)
    return {
      horasTotalesMes,
      minutosTotalesMes,
      capacidadPacientesMes,
      formulaExplicacion: `${espacios} ${cfg.tipo_espacio_fisico.toLowerCase()} × (${cfg.horas_lunes_viernes_dia}h×${cfg.dias_habiles_lv_mes}d L-V + ${cfg.horas_sabado_dia}h×${cfg.sabados_mes} sáb = ${horasPorEspacio}h/mes) ÷ ${tiempo} min/atención`,
    }
  }

  // Extramural o Telemedicina
  const profs = Math.max(1, Number(cfg.numero_profesionales) || 1)
  const horasPorProf =
    Number(cfg.horas_contratadas_mes_por_prof) > 0
      ? Number(cfg.horas_contratadas_mes_por_prof)
      : Math.max(0, Number(cfg.horas_lunes_viernes_dia) || 0) * Math.max(1, Number(cfg.dias_habiles_lv_mes) || 20) +
        Math.max(0, Number(cfg.horas_sabado_dia) || 0) * Math.max(0, Number(cfg.sabados_mes) || 4)
  const horasTotalesMes = profs * horasPorProf
  const minutosTotalesMes = horasTotalesMes * 60
  const capacidadPacientesMes = Math.floor(minutosTotalesMes / tiempo)

  return {
    horasTotalesMes,
    minutosTotalesMes,
    capacidadPacientesMes,
    formulaExplicacion: `${profs} profesional(es) × ${horasPorProf} h/mes (${horasTotalesMes} h totales) ÷ ${tiempo} min/atención${cfg.incluye_transporte ? ' (incluye desplazamiento)' : ''}`,
  }
}

export function evaluateCapacidadBalance(capacidadMes: number, prestadosMes: number): {
  diferencia: number
  porcentajeOcupacion: number
  estado: 'Holgura adecuada' | 'Capacidad óptima' | 'Alerta límite' | 'Deficiencia (Sobreocupación)'
  badgeClass: string
} {
  const diferencia = capacidadMes - prestadosMes
  const porcentajeOcupacion = capacidadMes > 0 ? Math.round((prestadosMes / capacidadMes) * 1000) / 10 : 0

  if (prestadosMes > capacidadMes) {
    return {
      diferencia,
      porcentajeOcupacion,
      estado: 'Deficiencia (Sobreocupación)',
      badgeClass: 'plan-overdue',
    }
  }
  if (porcentajeOcupacion >= 90) {
    return {
      diferencia,
      porcentajeOcupacion,
      estado: 'Alerta límite',
      badgeClass: 'plan-month',
    }
  }
  if (porcentajeOcupacion >= 70) {
    return {
      diferencia,
      porcentajeOcupacion,
      estado: 'Capacidad óptima',
      badgeClass: 'plan-complete',
    }
  }
  return {
    diferencia,
    porcentajeOcupacion,
    estado: 'Holgura adecuada',
    badgeClass: 'plan-future',
  }
}

// ============================================================================
// GENERADOR DE FECHAS DE MANTENIMIENTO ANUAL — EQUIPOS FIJOS
// Mensual: 12 fechas | Trimestral: 4 fechas | Semestral: 2 fechas | Anual: 1 fecha
// ============================================================================
export function generateAnnualMaintenanceSchedule(
  year: number,
  frecuencia: FrecuenciaMantenimientoEquipo,
  dayOfMonth: number = 15,
): EquipoMaintenanceDate[] {
  const safeDay = String(Math.min(28, Math.max(1, dayOfMonth))).padStart(2, '0')
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]

  let months: number[] = [6]
  if (frecuencia === 'Mensual') months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  else if (frecuencia === 'Trimestral') months = [3, 6, 9, 12]
  else if (frecuencia === 'Semestral') months = [6, 12]
  else months = [11]

  return months.map((m, idx) => {
    const mm = String(m).padStart(2, '0')
    return {
      id: `mto-${year}-${mm}-${idx}`,
      periodo_label: `${monthNames[m - 1]} ${year}`,
      fecha_programada: `${year}-${mm}-${safeDay}`,
      estado: 'Pendiente',
    }
  })
}

// ============================================================================
// SEMÁFORO DE VIGENCIA DOCUMENTAL (Actualización obligatoria cada 2 años)
// ============================================================================
export function addYearsISO(dateISO: string, years: number = 2): string {
  const parts = dateISO.slice(0, 10).split('-').map(Number)
  if (parts.length !== 3) return dateISO
  const [y, m, d] = parts
  return `${y + years}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// ============================================================================
// REGLA DE COMITÉS Y REUNIONES:
// Todos los comités son mensuales. Si no se ha ejecutado el comité del mes vencido
// dentro de los primeros 10 días hábiles del mes siguiente -> HALLAZGO CRÍTICO
// ============================================================================
export function tenthBusinessDayOfMonth(year: number, month1to12: number): string {
  let businessCount = 0
  let day = 1
  while (businessCount < 10 && day <= 31) {
    const d = new Date(Date.UTC(year, month1to12 - 1, day))
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) {
      businessCount++
    }
    if (businessCount === 10) break
    day++
  }
  return `${year}-${String(month1to12).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function evaluateComiteStatus(
  comite: ComiteInstitucional,
  actas: ActaReunion[],
  today: string = todayISO(),
): {
  ultimaActa: ActaReunion | null
  tieneActaMesActual: boolean
  tieneActaMesAnterior: boolean
  esHallazgoCritico: boolean
  semaforoLabel: string
  badgeClass: string
  explicacion: string
  fechaLimiteMesAnterior: string
} {
  const comiteActas = [...actas]
    .filter((a) => a.comite_id === comite.id)
    .sort((a, b) => b.fecha_reunion.localeCompare(a.fecha_reunion))

  const ultimaActa = comiteActas[0] ?? null
  const [currY, currM] = today.slice(0, 7).split('-').map(Number)
  const periodoActual = `${currY}-${String(currM).padStart(2, '0')}`

  const prevM = currM === 1 ? 12 : currM - 1
  const prevY = currM === 1 ? currY - 1 : currY
  const periodoAnterior = `${prevY}-${String(prevM).padStart(2, '0')}`

  const tieneActaMesActual = comiteActas.some((a) => a.periodo_mes === periodoActual)
  const tieneActaMesAnterior = comiteActas.some((a) => a.periodo_mes === periodoAnterior)

  const limiteDiezHabiles = tenthBusinessDayOfMonth(currY, currM)
  const pasoDiezHabiles = today > limiteDiezHabiles

  if (!tieneActaMesAnterior && pasoDiezHabiles) {
    return {
      ultimaActa,
      tieneActaMesActual,
      tieneActaMesAnterior,
      esHallazgoCritico: true,
      semaforoLabel: 'HALLAZGO CRÍTICO · Mes vencido sin acta (>10 días hábiles)',
      badgeClass: 'plan-overdue',
      explicacion: `Falta el acta del periodo ${periodoAnterior} y ya superó el 10.º día hábil (${formatDateES(limiteDiezHabiles)}).`,
      fechaLimiteMesAnterior: limiteDiezHabiles,
    }
  }

  if (!tieneActaMesAnterior && !pasoDiezHabiles) {
    return {
      ultimaActa,
      tieneActaMesActual,
      tieneActaMesAnterior,
      esHallazgoCritico: false,
      semaforoLabel: `Pendiente cierre mes anterior (Plazo: ${formatDateES(limiteDiezHabiles)})`,
      badgeClass: 'plan-month',
      explicacion: `Dentro de los primeros 10 días hábiles para cargar acta de ${periodoAnterior}.`,
      fechaLimiteMesAnterior: limiteDiezHabiles,
    }
  }

  if (tieneActaMesActual) {
    return {
      ultimaActa,
      tieneActaMesActual,
      tieneActaMesAnterior,
      esHallazgoCritico: false,
      semaforoLabel: `Al día · Ejecutado (${periodoActual})`,
      badgeClass: 'plan-complete',
      explicacion: `Reunión mensual de ${periodoActual} ejecutada con soporte PDF.`,
      fechaLimiteMesAnterior: limiteDiezHabiles,
    }
  }

  return {
    ultimaActa,
    tieneActaMesActual,
    tieneActaMesAnterior,
    esHallazgoCritico: false,
    semaforoLabel: `Programado mes en curso (Día ${comite.dia_programado_mes})`,
    badgeClass: 'plan-future',
    explicacion: `Mes anterior (${periodoAnterior}) cumplido. Próxima sesión día ${comite.dia_programado_mes} de ${periodoActual}.`,
    fechaLimiteMesAnterior: limiteDiezHabiles,
  }
}

// ============================================================================
// CÁLCULO CUANTITATIVO DE EFECTIVIDAD DE HALLAZGOS (Gestión del Cambio)
// ============================================================================
export function calculateHallazgoEffectiveness(
  hallazgo: HallazgoCalidad,
  seRepite: boolean,
): {
  porcentaje: number
  concepto: HallazgoCalidad['efectividad']['concepto']
} {
  const totalAcciones = hallazgo.acciones.length
  const cerradas = hallazgo.acciones.filter((a) => a.estado === 'Cerrada' || a.estado === 'Ejecutada').length
  const ratioAcciones = totalAcciones > 0 ? (cerradas / totalAcciones) * 50 : 0
  const puntajeNoRepeticion = seRepite ? 0 : 50
  const porcentaje = Math.round(ratioAcciones + puntajeNoRepeticion)

  if (seRepite) {
    return { porcentaje: Math.min(porcentaje, 45), concepto: 'Inefectivo (Reincidente)' }
  }
  if (porcentaje >= 85) {
    return { porcentaje, concepto: 'Efectivo' }
  }
  return { porcentaje, concepto: 'Parcialmente Efectivo' }
}

// ============================================================================
// CÁLCULO DE PUNTAJES Y RANKING — CUMPLIMIENTO RESOLUCIÓN 3100 DE 2019
// Cumple = 100 pts, Parcial = 50 pts, No cumple = 0 pts, No aplica = Excluido
// ============================================================================
export function summarizeEvaluacion3100(evalSede: Evaluacion3100Sede) {
  const totalCriterios = evalSede.respuestas.length
  const calificados = evalSede.respuestas.filter((r) => r.calificacion !== '').length
  const cumple = evalSede.respuestas.filter((r) => r.calificacion === 'cumple').length
  const parcial = evalSede.respuestas.filter((r) => r.calificacion === 'parcial').length
  const noCumple = evalSede.respuestas.filter((r) => r.calificacion === 'no_cumple').length
  const noAplica = evalSede.respuestas.filter((r) => r.calificacion === 'no_aplica').length
  const aplicables = cumple + parcial + noCumple

  const porcentajeGeneral =
    aplicables > 0 ? Math.round(((cumple * 100 + parcial * 50) / aplicables) * 10) / 10 : 0

  const porEstandar: Record<
    Estandar3100Key,
    {
      key: Estandar3100Key
      nombre: string
      corto: string
      total: number
      aplicables: number
      cumple: number
      parcial: number
      noCumple: number
      noAplica: number
      porcentaje: number
    }
  > = {} as never

  for (const est of ESTANDARES_3100) {
    const rows = evalSede.respuestas.filter((r) => r.estandar === est.key)
    const c = rows.filter((r) => r.calificacion === 'cumple').length
    const p = rows.filter((r) => r.calificacion === 'parcial').length
    const nc = rows.filter((r) => r.calificacion === 'no_cumple').length
    const na = rows.filter((r) => r.calificacion === 'no_aplica').length
    const ap = c + p + nc
    porEstandar[est.key] = {
      key: est.key,
      nombre: est.nombre,
      corto: est.corto,
      total: rows.length,
      aplicables: ap,
      cumple: c,
      parcial: p,
      noCumple: nc,
      noAplica: na,
      porcentaje: ap > 0 ? Math.round(((c * 100 + p * 50) / ap) * 10) / 10 : 0,
    }
  }

  return {
    totalCriterios,
    calificados,
    aplicables,
    cumple,
    parcial,
    noCumple,
    noAplica,
    hallazgosTotales: parcial + noCumple,
    porcentajeGeneral,
    porEstandar,
  }
}
