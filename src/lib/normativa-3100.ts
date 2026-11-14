import type {
  ComplejidadServicio,
  Criterio3100Plantilla,
  Estandar3100Key,
  GrupoServicio3100,
  ModalidadServicio,
  RespuestaCriterio3100,
} from './types'
import { TABLA_PARAMETROS_SERVICIOS_3100 } from './catalogo-servicios-3100'

export const ESTANDARES_3100: { key: Estandar3100Key; numero: number; nombre: string; corto: string }[] = [
  { key: 'talento_humano', numero: 1, nombre: '1. Talento Humano', corto: 'Talento Humano' },
  { key: 'infraestructura', numero: 2, nombre: '2. Infraestructura', corto: 'Infraestructura' },
  { key: 'dotacion', numero: 3, nombre: '3. Dotación', corto: 'Dotación' },
  { key: 'medicamentos_dispositivos', numero: 4, nombre: '4. Medicamentos, Dispositivos Médicos e Insumos', corto: 'Medicamentos y Disp.' },
  { key: 'procesos_prioritarios', numero: 5, nombre: '5. Procesos Prioritarios', corto: 'Procesos Prioritarios' },
  { key: 'historia_clinica', numero: 6, nombre: '6. Historia Clínica y Registros', corto: 'Historia Clínica' },
  { key: 'interdependencia', numero: 7, nombre: '7. Interdependencia', corto: 'Interdependencia' },
]

export const CONDICIONES_FISICAS_SEDE = [
  { key: 'pintura', nombre: 'Pintura (lavable, sin humedad ni desprendimiento)' },
  { key: 'piso', nombre: 'Pisos (impermeables, antideslizantes, continuos, media caña)' },
  { key: 'techos', nombre: 'Techos y cielo rasos (íntegros, lavables, sin filtraciones)' },
  { key: 'ventanas', nombre: 'Ventanas y ventilación natural/artificial' },
  { key: 'iluminacion', nombre: 'Iluminación general y clínica funcional' },
  { key: 'apagadores', nombre: 'Apagadores e interruptores identificados y en buen estado' },
  { key: 'puntos_electricos', nombre: 'Puntos eléctricos (tomas grado hospitalario / polo a tierra)' },
  { key: 'puertas', nombre: 'Puertas (ancho reglamentario, abatimiento y herrajes)' },
  { key: 'luces_emergencia', nombre: 'Luces de emergencia operativas en rutas y áreas críticas' },
  { key: 'detectores_humo', nombre: 'Detectores de humo instalados y verificados' },
  { key: 'alarma_emergencias', nombre: 'Alarma de emergencias sonora y visual operativa' },
  { key: 'banos', nombre: 'Baños (dotación sanitaria, baterías, baño PMR / discapacidad)' },
  { key: 'accesibilidad', nombre: 'Accesibilidad (rampas, pasamanos, ascensor, ingreso PMR)' },
  { key: 'senalizacion', nombre: 'Señalización (áreas, salidas de emergencia, riesgo biológico)' },
] as const

export interface CatalogoCriterioAdmin {
  id: string
  codigo: string
  categoria:
    | 'Administrativo'
    | 'Financiero'
    | 'Calidad y SST'
    | 'Higiene y sanidad'
    | 'Historia clinica'
    | 'Infraestructura'
    | 'Interdependencia'
  titulo: string
  descripcion_normativa: string
  periodicidad:
    | 'Mensual'
    | 'Trimestral'
    | 'Cuatrimestral'
    | 'Semestral'
    | 'Anual'
    | 'Cada 2 años'
    | 'Segun vigencia'
    | 'Segun necesidad'
    | 'Unica vez'
  programacion_anual: string
  dias_vigencia_default: number
  responsable_sugerido_correo: string
  aplica_nacional_sugerido: boolean
}

export const CLASIFICACIONES_CRONOGRAMA_ADMIN = [
  'Administrativo',
  'Financiero',
  'Calidad y SST',
  'Higiene y sanidad',
  'Historia clinica',
  'Infraestructura',
  'Interdependencia',
] as const

export const FRECUENCIAS_CRONOGRAMA_ADMIN = [
  'Mensual',
  'Bimestral',
  'Trimestral',
  'Cuatrimestral',
  'Semestral',
  'Anual',
  'Cada 2 años',
  'Segun vigencia',
  'Segun necesidad',
  'Unica vez',
] as const

// ============================================================================
// LISTA OFICIAL DE ASIGNACIÓN DE CRITERIOS (NACIONAL VS SEDE) POR CLASIFICACIÓN
// Organizada exactamente según la matriz institucional definida por el usuario:
// 1. Administrativo | 2. Calidad y SST (SST) | 3. Financiero | 4. Higiene y sanidad
// 5. Historia clinica | 6. Infraestructura | 7. Interdependencia
// ============================================================================
export const CATALOGO_CRITERIOS_ADMIN: CatalogoCriterioAdmin[] = [
  // ================= 1. ADMINISTRATIVO (2 Nacionales + 2 por Sede) =================
  {
    id: 'adm-cat-01',
    codigo: 'SED-ADM-01',
    categoria: 'Administrativo',
    titulo: 'Camara de comercio',
    descripcion_normativa: 'Certificado de Existencia y Representación Legal / Matrícula mercantil vigente de la sede.',
    periodicidad: 'Mensual',
    programacion_anual: 'Enero a Diciembre (12 ejecuciones al año)',
    dias_vigencia_default: 30,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-02',
    codigo: 'NAC-ADM-01',
    categoria: 'Administrativo',
    titulo: 'RUT',
    descripcion_normativa: 'Registro Único Tributario DIAN vigente con códigos CIIU de salud.',
    periodicidad: 'Anual',
    programacion_anual: 'Enero (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-03',
    codigo: 'NAC-ADM-02',
    categoria: 'Administrativo',
    titulo: 'CC representante legal',
    descripcion_normativa: 'Documento de identidad vigente del Representante Legal inscrito en REPS.',
    periodicidad: 'Unica vez',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 1825,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-04',
    codigo: 'SED-ADM-02',
    categoria: 'Administrativo',
    titulo: 'Polizas',
    descripcion_normativa: 'Pólizas de Responsabilidad Civil Clínicas y Hospitalarias vigentes para la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Renovación anual según vigencia',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },

  // ================= 2. SST / CALIDAD Y SST (2 por Sede) =================
  {
    id: 'adm-cat-05',
    codigo: 'SED-SST-01',
    categoria: 'Calidad y SST',
    titulo: 'Certificacion bomberos',
    descripcion_normativa: 'Concepto técnico de seguridad humana y protección contra incendios emitido por el Cuerpo de Bomberos para la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Agosto (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'sst@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-06',
    codigo: 'SED-SST-02',
    categoria: 'Calidad y SST',
    titulo: 'Plan de emergencias y desastres',
    descripcion_normativa: 'Plan hospitalario de gestión del riesgo, emergencias, contingencias y simulacros de la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Agosto (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'sst@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },

  // ================= 3. FINANCIERO (14 Nacionales) =================
  {
    id: 'adm-cat-07',
    codigo: 'NAC-FIN-01',
    categoria: 'Financiero',
    titulo: 'TP contador',
    descripcion_normativa: 'Tarjeta Profesional vigente del Contador Público.',
    periodicidad: 'Unica vez',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 1825,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-08',
    codigo: 'NAC-FIN-02',
    categoria: 'Financiero',
    titulo: 'CC contador',
    descripcion_normativa: 'Cédula de ciudadanía del Contador Público de la institución.',
    periodicidad: 'Unica vez',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 1825,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-09',
    codigo: 'NAC-FIN-03',
    categoria: 'Financiero',
    titulo: 'Antecedentes contador',
    descripcion_normativa: 'Certificado de antecedentes disciplinarios de la Junta Central de Contadores (JCC) del Contador.',
    periodicidad: 'Trimestral',
    programacion_anual: 'Enero, Abril, Julio, Octubre (4 ejecuciones al año)',
    dias_vigencia_default: 90,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-10',
    codigo: 'NAC-FIN-04',
    categoria: 'Financiero',
    titulo: 'Contrato contadora',
    descripcion_normativa: 'Contrato de vinculación o prestación de servicios del Contador.',
    periodicidad: 'Anual',
    programacion_anual: 'Enero (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'karol.carvajal@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-11',
    codigo: 'NAC-FIN-05',
    categoria: 'Financiero',
    titulo: 'TP revisor fiscal',
    descripcion_normativa: 'Tarjeta Profesional vigente del Revisor Fiscal.',
    periodicidad: 'Unica vez',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 1825,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-12',
    codigo: 'NAC-FIN-06',
    categoria: 'Financiero',
    titulo: 'CC revisor fiscal',
    descripcion_normativa: 'Cédula de ciudadanía del Revisor Fiscal.',
    periodicidad: 'Unica vez',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 1825,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-13',
    codigo: 'NAC-FIN-07',
    categoria: 'Financiero',
    titulo: 'Antecedentes revisor fiscal',
    descripcion_normativa: 'Certificado de antecedentes disciplinarios JCC vigente del Revisor Fiscal.',
    periodicidad: 'Trimestral',
    programacion_anual: 'Enero, Abril, Julio, Octubre (4 ejecuciones al año)',
    dias_vigencia_default: 90,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-14',
    codigo: 'NAC-FIN-08',
    categoria: 'Financiero',
    titulo: 'Contrato revisora',
    descripcion_normativa: 'Contrato de vinculación o prestación de servicios de Revisoría Fiscal.',
    periodicidad: 'Anual',
    programacion_anual: 'Enero (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'karol.carvajal@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-15',
    codigo: 'NAC-FIN-09',
    categoria: 'Financiero',
    titulo: 'Certificacion bancaria',
    descripcion_normativa: 'Certificación de titularidad de cuentas bancarias institucionales.',
    periodicidad: 'Trimestral',
    programacion_anual: 'Febrero, Mayo, Agosto, Noviembre (4 ejecuciones al año)',
    dias_vigencia_default: 90,
    responsable_sugerido_correo: 'jenny.ariza@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-16',
    codigo: 'NAC-FIN-10',
    categoria: 'Financiero',
    titulo: 'Estados financieros',
    descripcion_normativa: 'Estados financieros certificados y dictaminados de cierre de vigencia.',
    periodicidad: 'Anual',
    programacion_anual: 'Abril (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-17',
    codigo: 'NAC-FIN-11',
    categoria: 'Financiero',
    titulo: 'Notas a los estados financieros',
    descripcion_normativa: 'Revelaciones y notas contables NIIF a los estados financieros.',
    periodicidad: 'Anual',
    programacion_anual: 'Abril (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-18',
    codigo: 'NAC-FIN-12',
    categoria: 'Financiero',
    titulo: 'Declaracion de renta',
    descripcion_normativa: 'Declaración anual de renta y complementarios presentada ante la DIAN.',
    periodicidad: 'Anual',
    programacion_anual: 'Abril (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-19',
    codigo: 'NAC-FIN-13',
    categoria: 'Financiero',
    titulo: 'Suficiencia patrimonial y financiera',
    descripcion_normativa: 'Certificación de cumplimiento de condiciones de suficiencia patrimonial y financiera Res. 3100.',
    periodicidad: 'Anual',
    programacion_anual: 'Abril (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-20',
    codigo: 'NAC-FIN-14',
    categoria: 'Financiero',
    titulo: 'Licencia del software contable',
    descripcion_normativa: 'Licencia o contrato vigente del software contable institucional.',
    periodicidad: 'Anual',
    programacion_anual: 'Enero (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'juliana.nieves@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },

  // ================= 4. HIGIENE Y SANIDAD (5 por Sede) =================
  {
    id: 'adm-cat-21',
    codigo: 'SED-HIG-01',
    categoria: 'Higiene y sanidad',
    titulo: 'Lavado de tanques',
    descripcion_normativa: 'Certificado semestral de lavado y desinfección de tanques de almacenamiento de agua potable de la sede.',
    periodicidad: 'Semestral',
    programacion_anual: 'Abril y Octubre (2 ejecuciones al año)',
    dias_vigencia_default: 180,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-22',
    codigo: 'SED-HIG-02',
    categoria: 'Higiene y sanidad',
    titulo: 'Analisis de agua',
    descripcion_normativa: 'Análisis fisicoquímico y microbiológico de calidad del agua potable de la sede.',
    periodicidad: 'Semestral',
    programacion_anual: 'Enero y Julio (2 ejecuciones al año)',
    dias_vigencia_default: 180,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-23',
    codigo: 'SED-HIG-03',
    categoria: 'Higiene y sanidad',
    titulo: 'Fumigacion',
    descripcion_normativa: 'Certificado de control integrado de plagas, fumigación y desratización por empresa autorizada.',
    periodicidad: 'Semestral',
    programacion_anual: 'Junio y Diciembre (2 ejecuciones al año)',
    dias_vigencia_default: 180,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-24',
    codigo: 'SED-HIG-04',
    categoria: 'Higiene y sanidad',
    titulo: 'Concepto higienico sanitario',
    descripcion_normativa: 'Acta de inspección, vigilancia y control higiénico-sanitario con concepto favorable para la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Abril (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'ambiental@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-25',
    codigo: 'SED-HIG-05',
    categoria: 'Higiene y sanidad',
    titulo: 'Contrato de residuos',
    descripcion_normativa: 'Contrato vigente con empresa gestora de recolección y disposición de residuos hospitalarios de la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Junio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'ambiental@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },

  // ================= 5. HISTORIA CLÍNICA (3 Nacionales) =================
  {
    id: 'adm-cat-26',
    codigo: 'NAC-HC-01',
    categoria: 'Historia clinica',
    titulo: 'Licencia del software HC',
    descripcion_normativa: 'Licencia o contrato vigente de uso del software de Historia Clínica Electrónica.',
    periodicidad: 'Anual',
    programacion_anual: 'Enero (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'calidad@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-27',
    codigo: 'NAC-HC-02',
    categoria: 'Historia clinica',
    titulo: 'Certificado - cumplimiento habilitacion',
    descripcion_normativa: 'Certificado de cumplimiento de estándares tecnológicos e interoperabilidad de historia clínica Res. 3100.',
    periodicidad: 'Anual',
    programacion_anual: 'Julio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'calidad@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },
  {
    id: 'adm-cat-28',
    codigo: 'NAC-HC-03',
    categoria: 'Historia clinica',
    titulo: 'Certificado telemedicina',
    descripcion_normativa: 'Certificación técnica y de seguridad de la plataforma para prestación en modalidad de Telemedicina.',
    periodicidad: 'Anual',
    programacion_anual: 'Julio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'calidad@mtd.net.co',
    aplica_nacional_sugerido: true, // Nacional
  },

  // ================= 6. INFRAESTRUCTURA (3 por Sede) =================
  {
    id: 'adm-cat-29',
    codigo: 'SED-INF-01',
    categoria: 'Infraestructura',
    titulo: 'Uso de suelos',
    descripcion_normativa: 'Concepto de uso del suelo compatible con servicios de salud para el predio de la sede.',
    periodicidad: 'Unica vez',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 1825,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-30',
    codigo: 'SED-INF-02',
    categoria: 'Infraestructura',
    titulo: 'Licencia de construccion',
    descripcion_normativa: 'Licencia de construcción o acto de reconocimiento de la edificación de la sede.',
    periodicidad: 'Unica vez',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 1825,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-31',
    codigo: 'SED-INF-03',
    categoria: 'Infraestructura',
    titulo: 'RETIE',
    descripcion_normativa: 'Certificación o dictamen de inspección de instalaciones eléctricas RETIE de la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Verificación anual',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },

  // ================= 7. INTERDEPENDENCIA (6 por Sede) =================
  {
    id: 'adm-cat-32',
    codigo: 'SED-INT-01',
    categoria: 'Interdependencia',
    titulo: 'Certificado farmacia',
    descripcion_normativa: 'Certificación o contrato de servicio farmacéutico habilitado para la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Julio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-33',
    codigo: 'SED-INT-02',
    categoria: 'Interdependencia',
    titulo: 'Contrato Suministro de equipos',
    descripcion_normativa: 'Contrato vigente de suministro y soporte biomédico de equipos para la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Julio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-34',
    codigo: 'SED-INT-03',
    categoria: 'Interdependencia',
    titulo: 'Contrato de hospitalizacion',
    descripcion_normativa: 'Convenio o acuerdo de referencia e interdependencia hospitalaria de la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Junio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-35',
    codigo: 'SED-INT-04',
    categoria: 'Interdependencia',
    titulo: 'Contrato de imagenes diagnosticas',
    descripcion_normativa: 'Contrato de interdependencia para apoyo diagnóstico en imágenes de la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Julio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-36',
    codigo: 'SED-INT-05',
    categoria: 'Interdependencia',
    titulo: 'Contrato de transporte asistencial',
    descripcion_normativa: 'Contrato o convenio de interdependencia para traslado asistencial básico y medicalizado de la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Julio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
  {
    id: 'adm-cat-37',
    codigo: 'SED-INT-06',
    categoria: 'Interdependencia',
    titulo: 'Contrato laboratorio clinico',
    descripcion_normativa: 'Contrato vigente de interdependencia para procesamiento de muestras de laboratorio clínico de la sede.',
    periodicidad: 'Anual',
    programacion_anual: 'Julio (1 ejecución al año)',
    dias_vigencia_default: 365,
    responsable_sugerido_correo: 'maria.solano@mtd.net.co',
    aplica_nacional_sugerido: false, // Sede
  },
]

export const CATALOGO_SERVICIOS_SALUD: {
  codigo: string
  nombre: string
  grupo: GrupoServicio3100
  complejidad_sugerida: ComplejidadServicio
  complejidades_permitidas: ComplejidadServicio[]
  modalidades_comunes: ModalidadServicio[]
  especificidades_permitidas: string[]
}[] = TABLA_PARAMETROS_SERVICIOS_3100.map((s) => {
  const mods: ModalidadServicio[] = []
  if (s.modalidades_permitidas.intramural) mods.push('Intramural')
  if (s.modalidades_permitidas.extramural) mods.push('Extramural')
  if (s.modalidades_permitidas.telemedicina) mods.push('Telemedicina')
  return {
    codigo: s.codigo,
    nombre: s.nombre,
    grupo: s.grupo as GrupoServicio3100,
    complejidad_sugerida: s.complejidades_permitidas[0] ?? 'Baja',
    complejidades_permitidas: s.complejidades_permitidas,
    modalidades_comunes: mods.length > 0 ? mods : ['Intramural'],
    especificidades_permitidas: s.especificidades_permitidas,
  }
})

// ============================================================================
// GENERADOR DE LISTA DE CHEQUEO VARIABLE — RESOLUCIÓN 3100 DE 2019
// Construye dinámicamente los criterios aplicables según:
// 1. Estándares de Todos los Servicios (Transversales a la Sede)
// 2. Grupo de Servicio, Tipo de Servicio, Modalidad (Intramural/Extramural/Telemedicina) y Complejidad
// ============================================================================
export const PLANTILLA_BASE_TODOS_LOS_SERVICIOS: Criterio3100Plantilla[] = [
  // 1. TALENTO HUMANO
  {
    id: 'ts-th-01',
    codigo: '11.1.1-TH1',
    estandar: 'talento_humano',
    estandar_nombre: '1. Talento Humano',
    aplica_todos_servicios: true,
    criterio_texto: 'El talento humano en salud cuenta con título de educación superior o certificado de aptitud ocupacional y se encuentra inscrito en el ReTHUS sin sanciones vigentes.',
    evidencia_requerida: 'Consulta individual ReTHUS vigente, diplomas, actas de grado y resoluciones de convalidación cuando aplique.',
  },
  {
    id: 'ts-th-02',
    codigo: '11.1.1-TH2',
    estandar: 'talento_humano',
    estandar_nombre: '1. Talento Humano',
    aplica_todos_servicios: true,
    criterio_texto: 'El prestador determina la capacidad instalada de talento humano de acuerdo con la oferta, demanda, oportunidad y tiempo de atención por servicio y modalidad.',
    evidencia_requerida: 'Estudio de suficiencia y capacidad instalada de talento humano actualizado vs. servicios prestados.',
  },
  {
    id: 'ts-th-03',
    codigo: '11.1.1-TH3',
    estandar: 'talento_humano',
    estandar_nombre: '1. Talento Humano',
    aplica_todos_servicios: true,
    criterio_texto: 'Constancia de formación continua en soporte vital básico/avanzado, atención a víctimas de violencia sexual, seguridad del paciente y manejo del duelo según perfil.',
    evidencia_requerida: 'Certificados de formación continua vigentes y cronograma de capacitación institucional ejecutado.',
  },
  // 2. INFRAESTRUCTURA
  {
    id: 'ts-inf-01',
    codigo: '11.1.2-IN1',
    estandar: 'infraestructura',
    estandar_nombre: '2. Infraestructura',
    aplica_todos_servicios: true,
    criterio_texto: 'Las áreas y ambientes de la sede cuentan con pisos, paredes y techos impermeables, sólidos, de fácil limpieza y desinfección, e iluminación y ventilación continuas.',
    evidencia_requerida: 'Inspección física de sede, programa de mantenimiento preventivo de infraestructura y soportes de ejecución.',
  },
  {
    id: 'ts-inf-02',
    codigo: '11.1.2-IN2',
    estandar: 'infraestructura',
    estandar_nombre: '2. Infraestructura',
    aplica_todos_servicios: true,
    criterio_texto: 'La edificación garantiza condiciones de accesibilidad para personas con movilidad reducida (rampas, unidades sanitarias adaptadas, señalización y rutas de evacuación).',
    evidencia_requerida: 'Planos arquitectónicos, rutas de evacuación y residuos publicadas, evaluación física de accesibilidad.',
  },
  {
    id: 'ts-inf-03',
    codigo: '11.1.2-IN3',
    estandar: 'infraestructura',
    estandar_nombre: '2. Infraestructura',
    aplica_todos_servicios: true,
    criterio_texto: 'Cuenta con cuarto o ambiente de almacenamiento central o temporal de residuos hospitalarios (PGIRASA) y ambiente de aseo exclusivo con poceta.',
    evidencia_requerida: 'Verificación de cuarto de residuos señalizado, ruta sanitaria y contrato de gestión externa de residuos.',
  },
  // 3. DOTACIÓN
  {
    id: 'ts-dot-01',
    codigo: '11.1.3-DO1',
    estandar: 'dotacion',
    estandar_nombre: '3. Dotación',
    aplica_todos_servicios: true,
    criterio_texto: 'Inventario actualizado de equipos biomédicos e industriales de uso hospitalario con hoja de vida, registro sanitario INVIMA y clasificación por riesgo.',
    evidencia_requerida: 'Listado maestro de dotación y equipos fijos por sede, hojas de vida y registros INVIMA vigentes.',
  },
  {
    id: 'ts-dot-02',
    codigo: '11.1.3-DO2',
    estandar: 'dotacion',
    estandar_nombre: '3. Dotación',
    aplica_todos_servicios: true,
    criterio_texto: 'Programa de mantenimiento preventivo y calibración metrológica ejecutado para el 100% de los equipos según recomendaciones del fabricante.',
    evidencia_requerida: 'Cronograma anual de mantenimiento ejecutado, reportes técnicos firmados y certificados de calibración.',
  },
  // 4. MEDICAMENTOS, DISPOSITIVOS MÉDICOS E INSUMOS
  {
    id: 'ts-med-01',
    codigo: '11.1.4-MD1',
    estandar: 'medicamentos_dispositivos',
    estandar_nombre: '4. Medicamentos, Dispositivos Médicos e Insumos',
    aplica_todos_servicios: true,
    criterio_texto: 'Todo medicamento, dispositivo médico y reactivo cuenta con registro sanitario INVIMA vigente, control de lote, fecha de vencimiento y condiciones de temperatura y humedad.',
    evidencia_requerida: 'Kardex de lotes/vencimientos, planillas diarias de cadena de frío/temperatura-humedad y alertas de semáforo.',
  },
  {
    id: 'ts-med-02',
    codigo: '11.1.4-MD2',
    estandar: 'medicamentos_dispositivos',
    estandar_nombre: '4. Medicamentos, Dispositivos Médicos e Insumos',
    aplica_todos_servicios: true,
    criterio_texto: 'Implementación activa de los programas de Farmacovigilancia, Tecnovigilancia y Reactivovigilancia con reporte periódico a entes territoriales e INVIMA.',
    evidencia_requerida: 'Actas mensuales de comités de Farmacovigilancia y Tecnovigilancia y soportes de reporte en plataforma FOREAM / Red Nacional.',
  },
  // 5. PROCESOS PRIORITARIOS
  {
    id: 'ts-pp-01',
    codigo: '11.1.5-PP1',
    estandar: 'procesos_prioritarios',
    estandar_nombre: '5. Procesos Prioritarios',
    aplica_todos_servicios: true,
    criterio_texto: 'Política y Programa de Seguridad del Paciente socializado, con gestión de eventos adversos, rondas de seguridad y análisis causal (Protocolo de Londres / 5 Porqués).',
    evidencia_requerida: 'Manual de Seguridad del Paciente vigente, actas del comité mensual y matriz de hallazgos y planes de acción.',
  },
  {
    id: 'ts-pp-02',
    codigo: '11.1.5-PP2',
    estandar: 'procesos_prioritarios',
    estandar_nombre: '5. Procesos Prioritarios',
    aplica_todos_servicios: true,
    criterio_texto: 'Adopción o adaptación de Guías de Práctica Clínica (GPC) basadas en evidencia y protocolos de limpieza, desinfección, esterilización y bioseguridad.',
    evidencia_requerida: 'Documentos vigentes en módulo de Información Documentada con versión controlada menor a 2 años.',
  },
  // 6. HISTORIA CLÍNICA Y REGISTROS
  {
    id: 'ts-hc-01',
    codigo: '11.1.6-HC1',
    estandar: 'historia_clinica',
    estandar_nombre: '6. Historia Clínica y Registros',
    aplica_todos_servicios: true,
    criterio_texto: 'La historia clínica electrónica cuenta con unicidad, secuencialidad, racionalidad científica, custodia, confidencialidad, firma electrónica y respaldo de seguridad.',
    evidencia_requerida: 'Certificación del software de Historia Clínica, actas del Comité de Historias Clínicas y auditorías de adherencia.',
  },
  {
    id: 'ts-hc-02',
    codigo: '11.1.6-HC2',
    estandar: 'historia_clinica',
    estandar_nombre: '6. Historia Clínica y Registros',
    aplica_todos_servicios: true,
    criterio_texto: 'Aplicación de Consentimiento Informado documentado para procedimientos, intervenciones o modalidades que lo requieren.',
    evidencia_requerida: 'Formatos controlados de consentimiento informado y verificación de diligenciamiento.',
  },
  // 7. INTERDEPENDENCIA
  {
    id: 'ts-int-01',
    codigo: '11.1.7-IT1',
    estandar: 'interdependencia',
    estandar_nombre: '7. Interdependencia',
    aplica_todos_servicios: true,
    criterio_texto: 'Cuando los servicios de apoyo (laboratorio, esterilización, servicio farmacéutico, lavado de ropa, transporte de pacientes) se contratan externamente, media contrato o convenio formal con prestador habilitado.',
    evidencia_requerida: 'Contratos o convenios de interdependencia vigentes y verificación REPS del proveedor aliado.',
  },
]

export function buildVariableChecklist3100(
  servicios: {
    codigo: string
    nombre: string
    grupo: GrupoServicio3100
    modalidad: ModalidadServicio
    complejidad: ComplejidadServicio
  }[],
): RespuestaCriterio3100[] {
  const result: RespuestaCriterio3100[] = []

  // 1. Agregar criterios transversales de Todos los Servicios
  for (const base of PLANTILLA_BASE_TODOS_LOS_SERVICIOS) {
    result.push({
      criterio_id: base.id,
      codigo: base.codigo,
      estandar: base.estandar,
      servicio_asociado: 'Todos los servicios (Estándar Transversal de Sede)',
      modalidad_asociada: 'Transversal',
      complejidad_asociada: 'General',
      criterio_texto: base.criterio_texto,
      evidencia_requerida: base.evidencia_requerida,
      calificacion: '',
      descripcion_cumplimiento: '',
    })
  }

  // 2. Generar criterios específicos variables por cada servicio, modalidad, grupo y complejidad
  servicios.forEach((srv, idx) => {
    const prefix = `SRV-${srv.codigo}-${idx + 1}`

    // Criterio de Talento Humano específico del servicio y complejidad
    result.push({
      criterio_id: `${prefix}-th`,
      codigo: `${srv.codigo}-TH-${srv.modalidad.slice(0, 3).toUpperCase()}`,
      estandar: 'talento_humano',
      servicio_asociado: srv.nombre,
      modalidad_asociada: srv.modalidad,
      complejidad_asociada: srv.complejidad,
      criterio_texto:
        srv.complejidad === 'Alta' || srv.complejidad === 'Media'
          ? `Para el servicio de ${srv.nombre} (${srv.grupo} · Complejidad ${srv.complejidad} · ${srv.modalidad}), cuenta con profesional especialista o perfil idóneo con disponibilidad permanente durante la prestación del servicio.`
          : `Para el servicio de ${srv.nombre} (${srv.grupo} · Complejidad ${srv.complejidad} · ${srv.modalidad}), cuenta con profesional titulado y programación de turnos acorde con la capacidad instalada declarada.`,
      evidencia_requerida: `Hoja de vida, ReTHUS del personal asignado a ${srv.nombre} (${srv.modalidad}) y cuadro de turnos / horas contratadas.`,
      calificacion: '',
      descripcion_cumplimiento: '',
    })

    // Criterio según Modalidad (Intramural vs Extramural vs Telemedicina)
    if (srv.modalidad === 'Intramural') {
      result.push({
        criterio_id: `${prefix}-inf-intra`,
        codigo: `${srv.codigo}-INF-INT`,
        estandar: 'infraestructura',
        servicio_asociado: srv.nombre,
        modalidad_asociada: 'Intramural',
        complejidad_asociada: srv.complejidad,
        criterio_texto: `El consultorio o ambiente intramural de ${srv.nombre} dispone de área de entrevista, área de examen físico con barrera visual, lavamanos manos libres y dimensiones acordes con Res. 3100.`,
        evidencia_requerida: `Verificación en plano arquitectónico y evaluación física del consultorio/ambiente de ${srv.nombre}.`,
        calificacion: '',
        descripcion_cumplimiento: '',
      })
    } else if (srv.modalidad === 'Extramural') {
      result.push({
        criterio_id: `${prefix}-inf-extra`,
        codigo: `${srv.codigo}-DOT-EXT`,
        estandar: 'dotacion',
        servicio_asociado: srv.nombre,
        modalidad_asociada: 'Extramural',
        complejidad_asociada: srv.complejidad,
        criterio_texto: `Para la atención Extramural (Domiciliaria / Jornada) de ${srv.nombre}, el personal cuenta con maletín de atención portátil con dotación básica calibrada, contenedores de biosanitarios/cortopunzantes y sistema de comunicación bidireccional con la sede.`,
        evidencia_requerida: `Acta de verificación de maletines extramurales, control de tiempos de desplazamiento y protocolo de atención domiciliaria.`,
        calificacion: '',
        descripcion_cumplimiento: '',
      })
    } else if (srv.modalidad === 'Telemedicina') {
      result.push({
        criterio_id: `${prefix}-hc-tele`,
        codigo: `${srv.codigo}-TM-TIC`,
        estandar: 'historia_clinica',
        servicio_asociada: srv.nombre,
      } as unknown as RespuestaCriterio3100)
      // Reemplazo limpio con todos los campos tipados para Telemedicina
      result.pop()
      result.push({
        criterio_id: `${prefix}-hc-tele`,
        codigo: `${srv.codigo}-TM-TIC`,
        estandar: 'historia_clinica',
        servicio_asociado: srv.nombre,
        modalidad_asociada: 'Telemedicina',
        complejidad_asociada: srv.complejidad,
        criterio_texto: `En la modalidad de Telemedicina para ${srv.nombre}, la plataforma tecnológica garantiza transmisión sincrónica/asincrónica segura, ancho de banda estable, consentimiento informado de telesalud y prescripción electrónica válida.`,
        evidencia_requerida: `Certificado de seguridad de plataforma de telemedicina, consentimiento informado de teleconsulta y prueba de conectividad en módulo.`,
        calificacion: '',
        descripcion_cumplimiento: '',
      })
    }

    // Criterio de Dotación y Medicamentos según Grupo de Servicio
    if (
      srv.grupo === 'Apoyo Diagnóstico y Complementación Terapéutica' ||
      srv.grupo === 'Atención Inmediata' ||
      srv.grupo === 'Internación' ||
      srv.grupo === 'Quirúrgicos'
    ) {
      result.push({
        criterio_id: `${prefix}-med-grp`,
        codigo: `${srv.codigo}-MED-CRIT`,
        estandar: 'medicamentos_dispositivos',
        servicio_asociado: srv.nombre,
        modalidad_asociada: srv.modalidad,
        complejidad_asociada: srv.complejidad,
        criterio_texto: `El servicio de ${srv.nombre} (${srv.grupo}) cuenta con carro de paro o kit de emergencias/reacciones adversas sellado, con control de apertura, semaforización de vencimientos y dispositivos médicos específicos del servicio.`,
        evidencia_requerida: `Lista de chequeo de carro de paro / botiquín de servicio y control de temperatura de insumos.`,
        calificacion: '',
        descripcion_cumplimiento: '',
      })
    }

    // Criterio de Procesos Prioritarios específico del servicio
    result.push({
      criterio_id: `${prefix}-pp-srv`,
      codigo: `${srv.codigo}-PP-${srv.complejidad.slice(0, 1).toUpperCase()}`,
      estandar: 'procesos_prioritarios',
      servicio_asociado: srv.nombre,
      modalidad_asociada: srv.modalidad,
      complejidad_asociada: srv.complejidad,
      criterio_texto: `Guías, protocolos de atención clínica y criterios de referencia/contrarreferencia documentados y socializados para las principales causas de atención en ${srv.nombre} (${srv.modalidad}).`,
      evidencia_requerida: `Protocolo específico de ${srv.nombre}, socialización con el personal y auditoría de adherencia a guías.`,
      calificacion: '',
      descripcion_cumplimiento: '',
    })

    // Si es complejidad Media o Alta, agregar criterio de Interdependencia específico
    if (srv.complejidad === 'Media' || srv.complejidad === 'Alta') {
      result.push({
        criterio_id: `${prefix}-int-comp`,
        codigo: `${srv.codigo}-INT-${srv.complejidad.toUpperCase()}`,
        estandar: 'interdependencia',
        servicio_asociado: srv.nombre,
        modalidad_asociada: srv.modalidad,
        complejidad_asociada: srv.complejidad,
        criterio_texto: `Por ser de complejidad ${srv.complejidad}, el servicio de ${srv.nombre} garantiza disponibilidad o acuerdo formal de interdependencia con Laboratorio Clínico, Servicio Farmacéutico y Transporte Asistencial.`,
        evidencia_requerida: `Acuerdo de servicio interno o contrato de interdependencia externo vigente para soporte de ${srv.nombre}.`,
        calificacion: '',
        descripcion_cumplimiento: '',
      })
    }
  })

  return result
}
