import type { SuhDatabase } from './types'
import { CATALOGO_CRITERIOS_ADMIN } from './normativa-3100'
import {
  calculateExpirationByPeriodicidad,
  generateAnnualScheduleDates,
  todayISO,
} from './calculations'

// ============================================================================
// BASE DE DATOS INICIAL EN LIMPIO PARA PRODUCCI?N REAL (SIN DATOS DEMO)
// Conserva ?nicamente:
// 1. El S?per Usuario Administrador para acceso inicial.
// 2. La sede transversal NACIONAL (obligatoria para criterios corporativos).
// 3. El Cat?logo Maestro de los 37 criterios oficiales (Nacional vs Sede) y los
//    19 criterios Nacionales en estado inicial limpio (sin soportes de prueba).
// Todas las sedes operativas, mantenimientos, equipos, documentos, comit?s,
// hallazgos y planes de trabajo inician en limpio ([]).
// ============================================================================
export function createInitialSeedDatabase(): SuhDatabase {
  const today = todayISO()

  const adminCatalog = CATALOGO_CRITERIOS_ADMIN.map((c) => ({
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

  const criteriosNacionalesIniciales = CATALOGO_CRITERIOS_ADMIN.filter(
    (c) => c.aplica_nacional_sugerido,
  ).map((cat, idx) => {
    const fechasAnio = generateAnnualScheduleDates(today, cat.periodicidad)
    const venc =
      fechasAnio[0]?.fecha_programada ||
      calculateExpirationByPeriodicidad(today, cat.periodicidad)
    return {
      id: `adm-rec-nac-${cat.codigo}-${idx + 1}`,
      criterio_catalogo_id: cat.id,
      codigo: cat.codigo,
      categoria: cat.categoria,
      titulo: cat.titulo,
      descripcion_normativa: cat.descripcion_normativa,
      periodicidad: cat.periodicidad,
      programacion_anual: cat.programacion_anual,
      fechas_programadas_anual: fechasAnio,
      version_programacion: 1,
      version_criterio: 1,
      sede_id: 'sede-nacional',
      fecha_programada_inicial: today,
      fecha_vencimiento: venc,
      responsable: 'Administrador General SUH',
      responsable_correo: 'jonathan@metrumsas.com',
      observaciones: `Criterio NACIONAL (${cat.periodicidad}) listo para programación y ejecución.`,
      soportes: [],
      historial: [],
    }
  })

  return {
    usuarios: [
      {
        id: 'usr-super-01',
        nombre_completo: 'Administrador General SUH (Súper Usuario)',
        correo: 'jonathan@metrumsas.com',
        cargo: 'Director Nacional de Calidad y Habilitación SOGCS',
        rol: 'superusuario',
        sede_asignada: 'TODAS',
        estado: 'activo',
        bloqueado: false,
        invitado_en: `${today}T08:00:00Z`,
        ultimo_acceso: `${today}T08:00:00Z`,
        modulos_permitidos: ['*'],
      },
    ],
    sedes: [
      {
        id: 'sede-nacional',
        codigo_reps: 'NAC-00000000',
        nombre: 'NACIONAL (Transversal Todas las Sedes)',
        departamento: 'Bogotá D.C.',
        municipio: 'Bogotá D.C.',
        ciudad: 'Nacional (Corporativo)',
        direccion: 'Dirección Corporativa Nacional · Aplica a todas las sedes',
        telefono: '',
        director_responsable: 'Administrador General SUH',
        es_nacional: true,
        activa: true,
        descripcion_infraestructura:
          'Sede transversal que concentra los criterios legales, financieros e historia clínica aplicables a todas las sedes operativas.',
        capacidad_instalada_resumen: 'Transversal a toda la institución',
        area_m2: 0,
        pisos_niveles: 1,
        consultorios_totales: 0,
        salas_procedimientos: 0,
        camas_camillas: 0,
        planos_archivos: [],
        fotos_sede: [],
      },
    ],
    admin_catalogo: adminCatalog,
    admin_notificaciones: [],
    admin_criterios: criteriosNacionalesIniciales,
    th_capacidad: [],
    th_prestados: [],
    infra_mantenimientos: [],
    infra_evaluaciones: [],
    equipos_fijos: [],
    documentos: [],
    actas: [],
    comites: [],
    plan_trabajo: [],
    planes_accion: [],
    hallazgos: [],
    auditorias_internas: [],
    auditorias_externas: [],
    evaluaciones_3100: [],
  }
}
