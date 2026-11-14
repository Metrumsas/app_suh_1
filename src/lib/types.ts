// ============================================================================
// SISTEMA OBLIGATORIO DE GARANTÍA DE LA CALIDAD EN SALUD (SOGCS)
// RESOLUCIÓN 3100 DE 2019 — TIPOS Y MODELOS CENTRALES
// ============================================================================

export type UserRole =
  | 'superusuario'
  | 'lider_calidad'
  | 'auditor'
  | 'lider_infraestructura'
  | 'lider_talento_humano'
  | 'consulta'

export interface AppUser {
  id: string
  nombre_completo: string
  correo: string
  cargo: string
  rol: UserRole
  sede_asignada: string // 'TODAS' o sedeId
  estado: 'activo' | 'pendiente' | 'suspendido'
  bloqueado: boolean
  password?: string
  invitado_en: string
  ultimo_acceso: string | null
  modulos_permitidos: string[] // ['*'] para todos
}

export interface SedeAreaPhoto {
  id: string
  titulo: string
  dataUrl: string
  subido_en: string
}

export interface SedeAreaFisica {
  id: string
  nombre: string
  descripcion: string
  metros_cuadrados: number
  piso_nivel?: string // ej. 'Piso 1', 'Piso 2', 'Sótano'
  tipo_ventilacion?: string // ej. 'Aire acondicionado', 'Ventilación natural', 'Presión controlada / Extractor'
  fotos: SedeAreaPhoto[] // Mínimo 1, Máximo 4 fotos por área (Política PESV)
}

// Servicio de Salud Habilitado en la Sede según Formulario Oficial REPS (Res. 3100/2019 y Res. 2654/2019)
export interface SedeServicioHabilitadoREPS {
  id: string
  grupo: GrupoServicio3100
  codigo_servicio: string
  nombre_servicio: string
  numero_distintivo: string // ej. DHSS0729494
  complejidad: ComplejidadServicio // Baja, Media, Alta
  fecha_apertura: string // YYYY-MM-DD
  especificidades: string
  horarios: {
    lunes: string
    martes: string
    miercoles: string
    jueves: string
    viernes: string
    sabado: string
    domingo: string
  }
  modalidades: {
    intramural: boolean
    extramural_unidad_movil: boolean
    extramural_domiciliario: boolean
    extramural_jornada_salud: boolean
    extramural_transporte_aph: boolean
    // Telemedicina - Resolución 2654 de 2019 (Prestador de Referencia)
    telemedicina_ref_interactiva: boolean
    telemedicina_ref_no_interactiva: boolean
    telemedicina_ref_telexperticia: boolean
    telemedicina_ref_telemonitoreo: boolean
    // Telemedicina - Resolución 2654 de 2019 (Prestador Remisor)
    telemedicina_rem_telexperticia: boolean
    telemedicina_rem_telemonitoreo: boolean
  }
}

export interface Sede {
  id: string
  codigo_reps: string
  nombre: string
  departamento?: string
  municipio?: string
  ciudad: string
  direccion: string
  latitud?: number
  longitud?: number
  telefono: string
  director_responsable: string
  fecha_inscripcion_reps?: string
  fecha_vencimiento_habilitacion?: string
  es_nacional: boolean // true para la sede NACIONAL transversal
  activa: boolean
  // Ficha descriptiva de infraestructura (Módulo Infraestructura)
  descripcion_infraestructura: string
  capacidad_instalada_resumen: string
  area_m2: number
  pisos_niveles: number
  cuartos_ambientes?: number
  banos_unidades?: number
  descripcion_pisos?: string
  tenencia_inmueble?: 'Propio' | 'Arrendado' | 'Comodato'
  accesibilidad_pmr?: boolean
  planta_electrica?: 'SÍ' | 'NO' | string
  tanque_reserva_agua?: 'SÍ' | 'NO' | string
  red_gases_medicinales?: 'Centralizada' | 'Cilindros portátiles' | 'No aplica'
  url_planos_arquitectonicos?: string
  url_modelo_3d?: string
  capacidad_instalada_cantidades?: Record<string, number>
  consultorios_totales: number
  salas_procedimientos: number
  camas_camillas: number
  servicios_habilitados?: SedeServicioHabilitadoREPS[]
  areas_sede?: SedeAreaFisica[]
  planos_archivos: { id: string; nombre: string; fecha: string; tipo: 'plano_arquitectonico' | 'ruta_evacuacion' | 'ruta_residuos' | 'red_hidrosanitaria_electrica'; url_simulada: string; observacion: string }[]
  fotos_sede: { id: string; titulo: string; area: string; fecha: string; dataUrl: string }[]
}

// ----------------------------------------------------------------------------
// 1. MÓDULO DE ADMINISTRACIÓN (Criterios de la pestaña Cronograma del Excel)
// ----------------------------------------------------------------------------
export type ClasificacionCriterioAdmin =
  | 'Administrativo'
  | 'Financiero'
  | 'Calidad y SST'
  | 'Higiene y sanidad'
  | 'Historia clinica'
  | 'Infraestructura'
  | 'Interdependencia'
  | 'Capacidad Técnico-Administrativa'
  | 'Suficiencia Patrimonial y Financiera'
  | 'Sistema Obligatorio SOGCS'

export type PeriodicidadCriterioAdmin =
  | 'Mensual'
  | 'Bimestral'
  | 'Trimestral'
  | 'Cuatrimestral'
  | 'Semestral'
  | 'Anual'
  | 'Cada 2 años'
  | 'Segun vigencia'
  | 'Segun necesidad'
  | 'Unica vez'
  | 'Única vez / Permanente'

export interface AdminCatalogCriterion {
  id: string
  codigo: string
  categoria: ClasificacionCriterioAdmin
  titulo: string
  descripcion_normativa: string
  periodicidad: PeriodicidadCriterioAdmin
  programacion_anual?: string
  dias_vigencia_default: number
  aplica_todas_sedes: boolean // true: se evalúa en cada sede; false: criterio NACIONAL transversal
}

export interface AdminEmailNotificationLog {
  id: string
  fecha_hora: string
  criterio_id: string
  criterio_codigo: string
  criterio_titulo: string
  sede_nombre: string
  destinatario_nombre: string
  destinatario_correo: string
  tipo_alerta: 'Próximo a vencer (Semáforo)' | 'Día de vencimiento' | 'Alerta DIARIA Post-Vencimiento (Incumplimiento)' | 'Creación / Asignación de Criterio'
  asunto: string
  mensaje: string
  estado_criterio_momento: string
}

export interface AdminSupportVersion {
  id: string
  version: number
  titulo: string
  descripcion: string
  fecha_emision: string
  fecha_vencimiento: string
  responsable: string
  responsable_correo?: string
  archivo_nombre: string
  archivo_data?: string
  creado_en: string
}

export interface AdminCriterionHistory {
  id: string
  fecha: string
  usuario: string
  accion: string
  justificacion: string
  detalle_anterior?: string
}

export interface AdminScheduledExecutionDate {
  id: string
  numero: number // 1..N en el año
  etiqueta: string // ej. '1.º Trimestre', 'Mes 1 (Enero)', 'Programación Anual #1'
  fecha_programada: string // YYYY-MM-DD
  estado: 'pendiente' | 'ejecutada'
  fecha_ejecutada?: string
  soporte_version?: number
}

export interface AdminScheduleVersion {
  id: string
  version: number
  fecha_registro: string
  usuario: string
  periodicidad: PeriodicidadCriterioAdmin
  responsable: string
  responsable_correo?: string
  fechas_programadas: {
    numero: number
    etiqueta: string
    fecha_programada: string
    estado: 'pendiente' | 'ejecutada'
  }[]
  resumen_fechas: string
  justificacion: string // 'Programación inicial (v1)' o la justificación obligatoria en v2, v3...
  detalle_anterior?: string
}

export interface AdminCriterionVersionSnapshot {
  id: string
  version: number
  fecha_registro: string
  usuario: string
  tipo_cambio: 'Programación inicial' | 'Reprogramación de fechas' | 'Ejecución de soporte' | 'Ajuste de criterio'
  periodicidad: string
  fecha_vencimiento: string
  responsable: string
  responsable_correo: string
  observaciones: string
  resumen_programacion: string
  justificacion: string
  valores_anteriores?: string
}

export interface AdminCriterionRecord {
  id: string
  criterio_catalogo_id: string
  codigo: string
  categoria: ClasificacionCriterioAdmin
  titulo: string
  descripcion_normativa: string
  periodicidad?: PeriodicidadCriterioAdmin
  programacion_anual?: string
  fechas_programadas_anual?: AdminScheduledExecutionDate[]
  version_programacion?: number
  versiones_programacion?: AdminScheduleVersion[]
  version_criterio?: number
  versiones_criterio?: AdminCriterionVersionSnapshot[]
  presupuesto?: number
  sede_id: string // 'sede-nacional' o sede específica
  fecha_programada_inicial: string
  fecha_vencimiento: string
  responsable: string
  responsable_correo?: string
  observaciones: string
  ultima_notificacion_fecha?: string
  notificaciones_enviadas_count?: number
  soportes: AdminSupportVersion[] // El último soporte determina vigencia
  historial: AdminCriterionHistory[]
  plan_trabajo_id?: string
}

// ----------------------------------------------------------------------------
// 2. MÓDULO DE TALENTO HUMANO (Capacidad Instalada vs Servicios Prestados)
// ----------------------------------------------------------------------------
export type ModalidadServicio = 'Intramural' | 'Extramural' | 'Telemedicina'
export type ComplejidadServicio = 'Sin complejidad' | 'Baja' | 'Media' | 'Alta'
export type GrupoServicio3100 =
  | 'Consulta Externa'
  | 'Apoyo Diagnóstico y Complementación Terapéutica'
  | 'Internación'
  | 'Quirúrgicos'
  | 'Atención Inmediata'
  | 'Otros Servicios'

export interface ServicioCapacidadConfig {
  id: string
  sede_id: string
  codigo_servicio: string
  nombre_servicio: string
  grupo_servicio: GrupoServicio3100
  complejidad: ComplejidadServicio
  modalidad: ModalidadServicio
  // Parámetros Intramural (Capacidad instalada oficial REPS Resolución 3100 de 2019)
  tipo_espacio_fisico:
    | 'Consultorios'
    | 'Consultorios en Consulta Externa'
    | 'Consultorios en el Servicio de Urgencias'
    | 'Salas de Procedimientos'
    | 'Salas de Cirugía / Quirófanos'
    | 'Salas de Partos / TPR'
    | 'Sillas'
    | 'Sillas de Odontología'
    | 'Sillas de Hemodiálisis'
    | 'Sillas de Quimioterapia / Infusión'
    | 'Sillas de Salud Mental / Hospital Día'
    | 'Camas Hospitalarias / Internación'
    | 'Camas UCI / Cuidado Intermedio / Incubadoras'
    | 'Camillas / Cubículos'
    | 'Camillas de Observación Urgencias'
    | 'Camillas de Recuperación Post-Quirúrgica'
    | 'Módulos de atención'
    | 'Ambulancias TAB / TAM y Unidades Móviles'
  cantidad_espacios_fisicos: number
  horas_lunes_viernes_dia: number // ej. 7 horas (8-12 y 2-5)
  horas_sabado_dia: number // ej. 4 horas (8-12)
  dias_habiles_lv_mes: number // ej. 20
  sabados_mes: number // ej. 4
  // Parámetros Extramural / Telemedicina (y apoyo de personal)
  numero_profesionales: number
  perfil_profesional: string
  horas_contratadas_mes_por_prof: number // ej. 160
  // Tiempo de atención por paciente (minutos)
  tiempo_atencion_minutos: number // ej. 30 o 45 (incluye transporte en extramural)
  incluye_transporte: boolean
  observaciones: string
}

export interface ServicioPrestadoMensual {
  id: string
  servicio_capacidad_id: string
  sede_id: string
  nombre_servicio: string
  modalidad: ModalidadServicio
  periodo: string // YYYY-MM (ej. '2026-06', '2026-07', ..., '2026-11')
  atenciones_realizadas: number
  capacidad_calculada_mes: number
  actualizado_en: string
  responsable_registro: string
  observacion?: string
}

// ----------------------------------------------------------------------------
// 3. MÓDULO DE INFRAESTRUCTURA (Mantenimiento, Sede y Evaluación Física)
// ----------------------------------------------------------------------------
export interface InfraFollowUp {
  id: string
  fecha: string
  descripcion: string
  estado_resultante: 'Programada' | 'En ejecución' | 'Ejecutada' | 'Reprogramada'
  responsable: string
  presupuesto_ejecutado?: number
  soporte_pdf_nombre?: string
  soporte_pdf_data?: string
  soportes_archivos: string[]
  fotos: { id: string; leyenda: string; url: string }[] // Mínimo 1, Máximo 4
}

export interface InfraChangeLog {
  id: string
  fecha: string
  tipo: 'Actualización' | 'Reprogramación' | 'Seguimiento' | 'Programación inicial'
  justificacion: string
  usuario: string
  fecha_anterior?: string
  fecha_nueva?: string
  version?: number
  detalle_version?: string
  valores_anteriores?: string
}

export type ClasificacionMantenimientoInfra =
  | 'Obra Civil, Pisos y Pintura'
  | 'Hidrosanitario'
  | 'Eléctrico e Iluminación'
  | 'Cubiertas y Techos'
  | 'Carpintería, Puertas y Ventanas'
  | 'Sistemas de Emergencia y Detección'
  | 'Accesibilidad y Señalización'

export interface InfraMaintenanceActivity {
  id: string
  sede_id: string
  clasificacion: ClasificacionMantenimientoInfra
  titulo: string
  descripcion: string
  periodicidad?: PeriodicidadCriterioAdmin
  fechas_programadas_anual?: AdminScheduledExecutionDate[]
  version_programacion?: number
  version_actividad?: number
  presupuesto?: number
  presupuesto_ejecutado?: number
  soporte_pdf_nombre?: string
  soporte_pdf_data?: string
  plazo_ejecucion: string // YYYY-MM-DD (próxima fecha programada o vencimiento actual)
  responsable: string
  responsable_correo?: string
  estado: 'Programada' | 'En ejecución' | 'Ejecutada' | 'Reprogramada'
  seguimientos: InfraFollowUp[]
  historial: InfraChangeLog[]
  plan_trabajo_id?: string
}

export type CalificacionCondicionFisica = 'cumple' | 'parcial' | 'no_cumple'

export interface InfraPhysicalItemEval {
  item_key: string
  item_nombre: string
  calificacion: CalificacionCondicionFisica
  observacion: string
  hallazgo?: string
  plan_trabajo_id?: string
}

export interface InfraSedeEvaluation {
  id: string
  sede_id: string
  fecha_evaluacion: string
  evaluador: string
  observacion_general: string
  items: InfraPhysicalItemEval[]
}

// ----------------------------------------------------------------------------
// 4. MÓDULO DE EQUIPOS FIJOS
// ----------------------------------------------------------------------------
export type TipoTecnologiaEquipo =
  | 'Aires acondicionados'
  | 'Equipos industriales de uso hospitalario'
  | 'Cómputo y comunicación'

export type EstadoOperativoEquipo = 'Activo' | 'Inactivo' | 'Fallando' | 'Inoperativo'
export type FrecuenciaMantenimientoEquipo = 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual'

export interface EquipoMaintenanceDate {
  id: string
  periodo_label: string
  fecha_programada: string
  estado: 'Pendiente' | 'Ejecutado' | 'Vencido'
  fecha_ejecucion?: string
  descripcion_seguimiento?: string
  tecnico_responsable?: string
  soporte_archivo?: string
}

export interface EquipoFijo {
  id: string
  codigo_inventario: string
  nombre: string
  marca: string
  modelo: string
  serie: string
  tipo_tecnologia: TipoTecnologiaEquipo
  sede_id: string
  localizacion: string
  estado_operativo: EstadoOperativoEquipo
  frecuencia_mantenimiento: FrecuenciaMantenimientoEquipo
  anio_programa: number
  responsable: string
  foto_url: string
  observaciones: string
  cronograma_anual: EquipoMaintenanceDate[]
}

// ----------------------------------------------------------------------------
// 5. MÓDULO DE INFORMACIÓN DOCUMENTADA (Documentos y Actas)
// ----------------------------------------------------------------------------
export interface DocumentoVersionItem {
  version: number
  fecha_aprobacion: string
  fecha_vencimiento: string
  archivo_pdf_nombre: string
  archivo_pdf_url: string
  justificacion_cambio: string
  autor_cambio: string
}

export interface DocumentoMaestro {
  id: string
  codigo: string
  proceso:
    | 'Dirección y Planeación'
    | 'Calidad y Habilitación SOGCS'
    | 'Seguridad del Paciente'
    | 'Atención Asistencial'
    | 'Gestión de Medicamentos y Dispositivos'
    | 'Talento Humano'
    | 'Infraestructura y Ambiente Físico'
    | 'Historia Clínica y Registros'
  tipo_documento: 'Manual' | 'Protocolo' | 'Procedimiento' | 'Guía de Práctica Clínica' | 'Formato / Instructivo' | 'Política'
  titulo: string
  objetivo_descripcion: string
  sede_id: string // 'sede-nacional' o sede
  version_actual: number
  fecha_aprobacion: string // Cada 2 años vence
  fecha_vencimiento: string
  responsable: string
  archivo_pdf_nombre: string
  archivo_pdf_url: string
  historial_versiones: DocumentoVersionItem[]
}

export type TipoComiteNombre =
  | 'Seguridad del Paciente'
  | 'Historias Clínicas'
  | 'Tecnovigilancia'
  | 'Farmacovigilancia'
  | 'Infecciones y PROA (IAAS)'
  | 'Ética Hospitalaria y Bioética'
  | 'Calidad y Mejoramiento PAMEC'
  | 'GAGAS (Gestión Ambiental y Residuos)'

export interface ActaVersionHistory {
  version: number
  fecha_actualizacion: string
  resumen_anterior: string
  archivo_pdf_nombre: string
  justificacion: string
  usuario: string
}

export interface CompromisoComite {
  id: string
  descripcion: string
  responsable: string
  fecha_limite: string
  plan_trabajo_id?: string
}

export interface ActaReunion {
  id: string
  comite_id: string
  tipo_comite: TipoComiteNombre
  sede_id: string
  numero_acta: string
  anio: number
  periodo_mes: string // YYYY-MM
  fecha_reunion: string // YYYY-MM-DD
  asistentes: string[]
  resumen: string
  compromisos: CompromisoComite[]
  archivo_pdf_nombre: string
  archivo_pdf_url: string
  version: number
  historial_versiones: ActaVersionHistory[]
}

// ----------------------------------------------------------------------------
// 6. MÓDULO DE COMITÉS Y REUNIONES
// ----------------------------------------------------------------------------
export interface IntegranteComite {
  nombre: string
  cargo: string
  rol_comite: 'Presidente' | 'Secretario Técnico' | 'Integrante Permanente' | 'Invitado'
  correo: string
}

export interface ComiteInstitucional {
  id: string
  codigo: string
  tipo_comite: TipoComiteNombre
  nombre: string
  sede_id: string
  fecha_conformacion: string
  resolucion_acta_conformacion: string
  archivo_conformacion_pdf: string
  periodicidad: 'Mensual'
  dia_programado_mes: number // ej. día 15 de cada mes
  objetivo_funciones: string
  integrantes: IntegranteComite[]
  activo: boolean
}

// ----------------------------------------------------------------------------
// 7. MÓDULO PLAN DE TRABAJO (Modelo app_sarlatf)
// ----------------------------------------------------------------------------
export type EstadoActividadPlan = 'programada' | 'en_ejecucion' | 'completa' | 'atrasada' | 'reprogramada'

export interface EventoActividadPlan {
  id: string
  fecha: string
  tipo: 'creacion' | 'seguimiento' | 'reprogramacion' | 'edicion' | 'cierre'
  descripcion: string
  justificacion?: string
  usuario: string
  soporte_nombre?: string
}

export interface ActividadPlanTrabajo {
  id: string
  codigo: string
  titulo: string
  descripcion: string
  sede_id: string
  modulo_origen:
    | 'Administración'
    | 'Talento Humano'
    | 'Infraestructura'
    | 'Equipos Fijos'
    | 'Información Documentada'
    | 'Comités y Reuniones'
    | 'Gestión del Cambio'
    | 'Auditoría Interna/Externa'
    | 'Cumplimiento Res. 3100'
    | 'Plan de Trabajo'
  referencia_origen_id?: string
  responsable: string
  responsable_correo: string
  fecha_original: string
  fecha_limite: string
  estado: EstadoActividadPlan
  reprogramaciones: number
  presupuesto: number
  ejecutado: number
  observaciones: string
  eventos: EventoActividadPlan[]
}

// ----------------------------------------------------------------------------
// 8. MÓDULO DE GESTIÓN DEL CAMBIO Y HALLAZGOS (5 PORQUÉS / PAMEC)
// ----------------------------------------------------------------------------
export type EstadoAccionHallazgo = 'Por iniciar' | 'Programada' | 'En ejecución' | 'Ejecutada' | 'Cerrada' | 'Atrasada'

export interface SeguimientoAccionHallazgo {
  id: string
  fecha: string
  avance_porcentaje: number
  descripcion_seguimiento: string
  estado_resultante: EstadoAccionHallazgo
  evidencia_soporte: string
  usuario: string
}

export interface AccionHallazgo {
  id: string
  codigo: string
  hallazgo_id: string
  titulo: string
  descripcion: string
  responsable: string
  fecha_programada: string
  fecha_cierre?: string
  estado: EstadoAccionHallazgo
  seguimientos: SeguimientoAccionHallazgo[]
  plan_trabajo_id?: string
}

export interface CincoPorques {
  porque_1: string
  porque_2: string
  porque_3: string
  porque_4: string
  porque_5: string
  causa_raiz_identificada: string
  factor_causal: 'Talento Humano / Competencia' | 'Proceso / Método' | 'Infraestructura / Dotación' | 'Insumos / Medicamentos' | 'Sistemas de Información' | 'Organizacional / Financiero'
}

export interface EvaluacionEfectividadHallazgo {
  evaluado: boolean
  fecha_evaluacion?: string
  evaluador?: string
  se_repite_hallazgo: boolean // Si se repite = NO efectivo
  evidencia_verificacion?: string
  porcentaje_efectividad: number // 0 - 100
  concepto: 'Efectivo' | 'Parcialmente Efectivo' | 'Inefectivo (Reincidente)' | 'Pendiente de cierre'
}

export interface HallazgoCalidad {
  id: string
  codigo: string
  plan_accion_id: string
  sede_id: string
  origen:
    | 'Auditoría Interna'
    | 'Auditoría Externa (Secretaría / Supersalud)'
    | 'Auditoría Externa (EPS / Cliente)'
    | 'Autoevaluación Res. 3100'
    | 'Ronda de Infraestructura'
    | 'Comités Institucionales'
    | 'PAMEC / Seguridad del Paciente'
  estandar_relacionado: string
  titulo: string
  descripcion_hallazgo: string
  fecha_identificacion: string
  responsable_lider: string
  criticidad: 'Crítico' | 'Mayor' | 'Menor / Observación'
  cinco_porques: CincoPorques
  acciones: AccionHallazgo[]
  estado_hallazgo: 'Identificado' | 'En gestión' | 'Acciones ejecutadas' | 'Cerrado'
  efectividad: EvaluacionEfectividadHallazgo
}

export interface PlanAccionMejora {
  id: string
  codigo: string
  nombre: string
  sede_id: string
  proceso_objetivo: string
  origen_principal: string
  fecha_apertura: string
  fecha_meta_cierre: string
  lider_plan: string
  descripcion: string
  estado: 'Activo' | 'En verificación de efectividad' | 'Cerrado'
}

// ----------------------------------------------------------------------------
// 9. MÓDULO DE AUDITORÍA (INTERNA ISO 19011 Y EXTERNA)
// ----------------------------------------------------------------------------
export interface AuditoriaInterna {
  id: string
  codigo: string
  titulo_programa: string
  sede_id: string
  proceso_auditado: string
  estandar_norma: 'Resolución 3100 de 2019' | 'PAMEC / Decreto 1011' | 'Seguridad del Paciente' | 'NTC-ISO 9001 / NTC-ISO 19011'
  equipo_auditor: string
  auditado_lider: string
  fecha_programada: string
  fecha_ejecucion?: string
  estado: 'Programada' | 'En curso' | 'Informe emitido' | 'Cerrada'
  resultado_puntaje: number | null // 0 a 100
  resumen_informe: string
  informe_pdf_nombre?: string
  hallazgos_ids: string[]
  plan_trabajo_id?: string
}

export interface AuditoriaExterna {
  id: string
  codigo: string
  tipo_ente: 'Ente de Control' | 'Cliente / EPS'
  nombre_ente_auditor: string // ej. Secretaría Distrital de Salud, Supersalud, EPS Sura, Nueva EPS, Sanitas
  sede_id: string
  alcance_visita: string
  fecha_visita: string
  fecha_entrega_informe: string
  auditor_externo_lider: string
  recibido_por: string
  resultado_puntaje: number // 0 a 100
  concepto_visita: 'Favorable sin requerimientos' | 'Favorable con plan de mejora' | 'Condicionado / Requerimiento prioritario'
  resumen_informe: string
  informe_pdf_nombre: string
  hallazgos_ids: string[]
  plan_trabajo_id?: string
}

// ----------------------------------------------------------------------------
// 10. MÓDULO DE CUMPLIMIENTO RESOLUCIÓN 3100 DE 2019 (Lista de Chequeo Variable)
// ----------------------------------------------------------------------------
export type Estandar3100Key =
  | 'talento_humano'
  | 'infraestructura'
  | 'dotacion'
  | 'medicamentos_dispositivos'
  | 'procesos_prioritarios'
  | 'historia_clinica'
  | 'interdependencia'

export type Calificacion3100 = 'cumple' | 'parcial' | 'no_cumple' | 'no_aplica' | ''

export interface Criterio3100Plantilla {
  id: string
  codigo: string
  estandar: Estandar3100Key
  estandar_nombre: string
  aplica_todos_servicios: boolean
  grupos_servicio?: GrupoServicio3100[]
  servicios_especificos?: string[] // códigos o nombres
  modalidades?: ModalidadServicio[]
  complejidades?: ComplejidadServicio[]
  criterio_texto: string
  evidencia_requerida: string
}

export interface RespuestaCriterio3100 {
  criterio_id: string
  codigo: string
  estandar: Estandar3100Key
  servicio_asociado: string // 'Todos los servicios' o nombre del servicio
  modalidad_asociada: string
  complejidad_asociada: string
  criterio_texto: string
  evidencia_requerida: string
  calificacion: Calificacion3100
  descripcion_cumplimiento: string
  justificacion_no_aplica?: string
  accion_mejora_titulo?: string
  accion_mejora_responsable?: string
  accion_mejora_fecha?: string
  plan_trabajo_id?: string
}

export interface Evaluacion3100Sede {
  id: string
  codigo: string
  nombre: string
  sede_id: string
  periodo: string
  fecha_evaluacion: string
  evaluador: string
  estado: 'borrador' | 'cerrada_vigente' | 'historica'
  // Configuración de servicios seleccionada para generar la lista variable
  servicios_evaluados: {
    codigo: string
    nombre: string
    grupo: GrupoServicio3100
    modalidad: ModalidadServicio
    complejidad: ComplejidadServicio
  }[]
  respuestas: RespuestaCriterio3100[]
  observacion_general: string
  cerrada_en?: string
}

// ----------------------------------------------------------------------------
// ESTADO GLOBAL DEL SISTEMA SUH-1
// ----------------------------------------------------------------------------
export interface SuhDatabase {
  usuarios: AppUser[]
  sedes: Sede[]
  admin_catalogo?: AdminCatalogCriterion[]
  admin_notificaciones?: AdminEmailNotificationLog[]
  admin_criterios: AdminCriterionRecord[]
  th_capacidad: ServicioCapacidadConfig[]
  th_prestados: ServicioPrestadoMensual[]
  infra_mantenimientos: InfraMaintenanceActivity[]
  infra_evaluaciones: InfraSedeEvaluation[]
  equipos_fijos: EquipoFijo[]
  documentos: DocumentoMaestro[]
  actas: ActaReunion[]
  comites: ComiteInstitucional[]
  plan_trabajo: ActividadPlanTrabajo[]
  planes_accion: PlanAccionMejora[]
  hallazgos: HallazgoCalidad[]
  auditorias_internas: AuditoriaInterna[]
  auditorias_externas: AuditoriaExterna[]
  evaluaciones_3100: Evaluacion3100Sede[]
}
