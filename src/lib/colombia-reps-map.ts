// ============================================================================
// CARTOGRAFÍA OFICIAL DE DEPARTAMENTOS Y DISTRITOS DE HABILITACIÓN EN SALUD (REPS)
// + CAPACIDAD INSTALADA OFICIAL RESOLUCIÓN 3100 DE 2019 (MINISTERIO DE SALUD)
// ============================================================================

export interface TerritorioSaludColombia {
  codigo_divipola: string
  nombre: string
  tipo_entidad: 'Departamento' | 'Distrito Especial / Salud'
  ente_territorial_salud: string
  capital_o_cabecera: string
  region: 'Andina' | 'Caribe' | 'Pacífica' | 'Orinoquía' | 'Amazonía' | 'Insular'
  // Polígono SVG en un lienzo de 420 x 520 que representa exactamente la posición y límites del territorio en el mapa de Colombia
  svgPath: string
  labelX: number
  labelY: number
}

// Los 32 Departamentos + los Distritos con Ente Territorial de Habilitación REPS en Colombia
export const TERRITORIOS_SALUD_COLOMBIA: TerritorioSaludColombia[] = [
  // REGIÓN CARIBE E INSULAR
  {
    codigo_divipola: '44',
    nombre: 'La Guajira',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de La Guajira',
    capital_o_cabecera: 'Riohacha',
    region: 'Caribe',
    svgPath: 'M 218,22 L 258,12 L 266,34 L 236,64 L 210,56 Z',
    labelX: 238,
    labelY: 38,
  },
  {
    codigo_divipola: '47',
    nombre: 'Magdalena',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Magdalena',
    capital_o_cabecera: 'Santa Marta',
    region: 'Caribe',
    svgPath: 'M 184,48 L 210,56 L 214,108 L 186,112 L 178,72 Z',
    labelX: 196,
    labelY: 84,
  },
  {
    codigo_divipola: '47001',
    nombre: 'Santa Marta D.T.C.H.',
    tipo_entidad: 'Distrito Especial / Salud',
    ente_territorial_salud: 'Secretaría Distrital de Salud de Santa Marta',
    capital_o_cabecera: 'Santa Marta',
    region: 'Caribe',
    svgPath: 'M 186,44 L 206,46 L 204,64 L 184,62 Z',
    labelX: 195,
    labelY: 54,
  },
  {
    codigo_divipola: '08',
    nombre: 'Atlántico',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Atlántico',
    capital_o_cabecera: 'Barranquilla',
    region: 'Caribe',
    svgPath: 'M 164,56 L 184,54 L 182,82 L 162,78 Z',
    labelX: 173,
    labelY: 68,
  },
  {
    codigo_divipola: '08001',
    nombre: 'Barranquilla D.E.I.P.',
    tipo_entidad: 'Distrito Especial / Salud',
    ente_territorial_salud: 'Secretaría Distrital de Salud de Barranquilla',
    capital_o_cabecera: 'Barranquilla',
    region: 'Caribe',
    svgPath: 'M 168,52 L 184,52 L 182,66 L 166,64 Z',
    labelX: 175,
    labelY: 58,
  },
  {
    codigo_divipola: '20',
    nombre: 'Cesar',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Cesar',
    capital_o_cabecera: 'Valledupar',
    region: 'Caribe',
    svgPath: 'M 210,56 L 236,64 L 234,142 L 212,144 L 214,108 Z',
    labelX: 223,
    labelY: 105,
  },
  {
    codigo_divipola: '13',
    nombre: 'Bolívar',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de Bolívar',
    capital_o_cabecera: 'Cartagena de Indias',
    region: 'Caribe',
    svgPath: 'M 156,78 L 182,82 L 212,144 L 194,168 L 168,142 Z',
    labelX: 184,
    labelY: 128,
  },
  {
    codigo_divipola: '13001',
    nombre: 'Cartagena D.T. y C.',
    tipo_entidad: 'Distrito Especial / Salud',
    ente_territorial_salud: 'DADIS · Departamento Administrativo Distrital de Salud de Cartagena',
    capital_o_cabecera: 'Cartagena de Indias',
    region: 'Caribe',
    svgPath: 'M 148,72 L 166,74 L 164,92 L 146,90 Z',
    labelX: 156,
    labelY: 82,
  },
  {
    codigo_divipola: '70',
    nombre: 'Sucre',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de Sucre',
    capital_o_cabecera: 'Sincelejo',
    region: 'Caribe',
    svgPath: 'M 142,96 L 166,94 L 172,134 L 148,136 Z',
    labelX: 157,
    labelY: 116,
  },
  {
    codigo_divipola: '23',
    nombre: 'Córdoba',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de Córdoba',
    capital_o_cabecera: 'Montería',
    region: 'Caribe',
    svgPath: 'M 118,112 L 148,110 L 154,158 L 120,156 Z',
    labelX: 135,
    labelY: 136,
  },
  {
    codigo_divipola: '88',
    nombre: 'San Andrés, Providencia y Santa Catalina',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud de San Andrés y Providencia',
    capital_o_cabecera: 'San Andrés',
    region: 'Insular',
    svgPath: 'M 38,32 L 68,32 L 68,58 L 38,58 Z',
    labelX: 53,
    labelY: 45,
  },

  // REGIÓN ANDINA
  {
    codigo_divipola: '05',
    nombre: 'Antioquia',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Seccional de Salud y Protección Social de Antioquia',
    capital_o_cabecera: 'Medellín',
    region: 'Andina',
    svgPath: 'M 102,148 L 154,154 L 188,168 L 182,218 L 124,218 L 98,186 Z',
    labelX: 144,
    labelY: 188,
  },
  {
    codigo_divipola: '05001',
    nombre: 'Medellín D.E.C.T.I.',
    tipo_entidad: 'Distrito Especial / Salud',
    ente_territorial_salud: 'Secretaría Distrital de Salud de Medellín',
    capital_o_cabecera: 'Medellín',
    region: 'Andina',
    svgPath: 'M 134,182 L 156,182 L 156,202 L 134,202 Z',
    labelX: 145,
    labelY: 192,
  },
  {
    codigo_divipola: '54',
    nombre: 'Norte de Santander',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Instituto Departamental de Salud de Norte de Santander (IDS)',
    capital_o_cabecera: 'Cúcuta',
    region: 'Andina',
    svgPath: 'M 228,128 L 262,134 L 266,186 L 232,184 Z',
    labelX: 247,
    labelY: 158,
  },
  {
    codigo_divipola: '68',
    nombre: 'Santander',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de Santander',
    capital_o_cabecera: 'Bucaramanga',
    region: 'Andina',
    svgPath: 'M 192,166 L 234,168 L 238,224 L 188,222 Z',
    labelX: 213,
    labelY: 196,
  },
  {
    codigo_divipola: '15',
    nombre: 'Boyacá',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de Boyacá',
    capital_o_cabecera: 'Tunja',
    region: 'Andina',
    svgPath: 'M 188,222 L 254,218 L 258,256 L 192,258 Z',
    labelX: 224,
    labelY: 238,
  },
  {
    codigo_divipola: '17',
    nombre: 'Caldas',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Dirección Territorial de Salud de Caldas',
    capital_o_cabecera: 'Manizales',
    region: 'Andina',
    svgPath: 'M 134,218 L 176,218 L 174,242 L 132,242 Z',
    labelX: 154,
    labelY: 230,
  },
  {
    codigo_divipola: '66',
    nombre: 'Risaralda',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de Risaralda',
    capital_o_cabecera: 'Pereira',
    region: 'Andina',
    svgPath: 'M 112,232 L 138,232 L 138,254 L 112,254 Z',
    labelX: 125,
    labelY: 243,
  },
  {
    codigo_divipola: '63',
    nombre: 'Quindío',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Quindío',
    capital_o_cabecera: 'Armenia',
    region: 'Andina',
    svgPath: 'M 126,252 L 148,252 L 148,272 L 126,272 Z',
    labelX: 137,
    labelY: 262,
  },
  {
    codigo_divipola: '25',
    nombre: 'Cundinamarca',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud de Cundinamarca',
    capital_o_cabecera: 'Bogotá D.C. / Municipios Cundinamarca',
    region: 'Andina',
    svgPath: 'M 174,242 L 222,244 L 220,294 L 172,292 Z',
    labelX: 196,
    labelY: 268,
  },
  {
    codigo_divipola: '11',
    nombre: 'Bogotá D.C.',
    tipo_entidad: 'Distrito Especial / Salud',
    ente_territorial_salud: 'Secretaría Distrital de Salud de Bogotá D.C.',
    capital_o_cabecera: 'Bogotá D.C.',
    region: 'Andina',
    svgPath: 'M 188,262 L 210,262 L 210,284 L 188,284 Z',
    labelX: 199,
    labelY: 273,
  },
  {
    codigo_divipola: '73',
    nombre: 'Tolima',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud del Tolima',
    capital_o_cabecera: 'Ibagué',
    region: 'Andina',
    svgPath: 'M 142,258 L 174,258 L 172,312 L 138,310 Z',
    labelX: 156,
    labelY: 285,
  },
  {
    codigo_divipola: '41',
    nombre: 'Huila',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud Departamental del Huila',
    capital_o_cabecera: 'Neiva',
    region: 'Andina',
    svgPath: 'M 134,310 L 172,312 L 158,364 L 126,356 Z',
    labelX: 148,
    labelY: 336,
  },

  // REGIÓN PACÍFICA
  {
    codigo_divipola: '27',
    nombre: 'Chocó',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Chocó',
    capital_o_cabecera: 'Quibdó',
    region: 'Pacífica',
    svgPath: 'M 68,144 L 102,148 L 112,248 L 76,248 Z',
    labelX: 90,
    labelY: 196,
  },
  {
    codigo_divipola: '76',
    nombre: 'Valle del Cauca',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Valle del Cauca',
    capital_o_cabecera: 'Santiago de Cali',
    region: 'Pacífica',
    svgPath: 'M 82,252 L 134,254 L 132,304 L 80,302 Z',
    labelX: 108,
    labelY: 278,
  },
  {
    codigo_divipola: '76001',
    nombre: 'Santiago de Cali D.E.',
    tipo_entidad: 'Distrito Especial / Salud',
    ente_territorial_salud: 'Secretaría Distrital de Salud Pública de Santiago de Cali',
    capital_o_cabecera: 'Santiago de Cali',
    region: 'Pacífica',
    svgPath: 'M 102,276 L 124,276 L 124,296 L 102,296 Z',
    labelX: 113,
    labelY: 286,
  },
  {
    codigo_divipola: '76109',
    nombre: 'Buenaventura D.E.',
    tipo_entidad: 'Distrito Especial / Salud',
    ente_territorial_salud: 'Secretaría Distrital de Salud de Buenaventura',
    capital_o_cabecera: 'Buenaventura',
    region: 'Pacífica',
    svgPath: 'M 78,272 L 98,272 L 98,292 L 78,292 Z',
    labelX: 88,
    labelY: 282,
  },
  {
    codigo_divipola: '19',
    nombre: 'Cauca',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Cauca',
    capital_o_cabecera: 'Popayán',
    region: 'Pacífica',
    svgPath: 'M 74,302 L 132,304 L 126,356 L 70,352 Z',
    labelX: 100,
    labelY: 328,
  },
  {
    codigo_divipola: '52',
    nombre: 'Nariño',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Instituto Departamental de Salud de Nariño (IDSN)',
    capital_o_cabecera: 'Pasto',
    region: 'Pacífica',
    svgPath: 'M 52,352 L 118,354 L 112,404 L 48,398 Z',
    labelX: 84,
    labelY: 376,
  },

  // REGIÓN ORINOQUÍA
  {
    codigo_divipola: '81',
    nombre: 'Arauca',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Unidad Administrativa Especial de Salud de Arauca',
    capital_o_cabecera: 'Arauca',
    region: 'Orinoquía',
    svgPath: 'M 258,188 L 336,192 L 334,224 L 256,220 Z',
    labelX: 296,
    labelY: 206,
  },
  {
    codigo_divipola: '85',
    nombre: 'Casanare',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud de Casanare',
    capital_o_cabecera: 'Yopal',
    region: 'Orinoquía',
    svgPath: 'M 254,220 L 332,224 L 326,266 L 248,262 Z',
    labelX: 290,
    labelY: 243,
  },
  {
    codigo_divipola: '50',
    nombre: 'Meta',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Meta',
    capital_o_cabecera: 'Villavicencio',
    region: 'Orinoquía',
    svgPath: 'M 218,262 L 304,266 L 298,328 L 204,322 Z',
    labelX: 256,
    labelY: 295,
  },
  {
    codigo_divipola: '99',
    nombre: 'Vichada',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Vichada',
    capital_o_cabecera: 'Puerto Carreño',
    region: 'Orinoquía',
    svgPath: 'M 304,224 L 398,228 L 388,308 L 298,304 Z',
    labelX: 348,
    labelY: 266,
  },

  // REGIÓN AMAZONÍA
  {
    codigo_divipola: '94',
    nombre: 'Guainía',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud Departamental del Guainía',
    capital_o_cabecera: 'Inírida',
    region: 'Amazonía',
    svgPath: 'M 298,304 L 388,308 L 382,368 L 294,362 Z',
    labelX: 340,
    labelY: 336,
  },
  {
    codigo_divipola: '95',
    nombre: 'Guaviare',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Guaviare',
    capital_o_cabecera: 'San José del Guaviare',
    region: 'Amazonía',
    svgPath: 'M 214,322 L 298,328 L 292,372 L 210,368 Z',
    labelX: 254,
    labelY: 348,
  },
  {
    codigo_divipola: '18',
    nombre: 'Caquetá',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud Departamental del Caquetá',
    capital_o_cabecera: 'Florencia',
    region: 'Amazonía',
    svgPath: 'M 152,344 L 228,348 L 224,408 L 146,402 Z',
    labelX: 188,
    labelY: 376,
  },
  {
    codigo_divipola: '86',
    nombre: 'Putumayo',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud Departamental del Putumayo',
    capital_o_cabecera: 'Mocoa',
    region: 'Amazonía',
    svgPath: 'M 106,386 L 176,392 L 172,426 L 102,420 Z',
    labelX: 138,
    labelY: 408,
  },
  {
    codigo_divipola: '97',
    nombre: 'Vaupés',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría Departamental de Salud del Vaupés',
    capital_o_cabecera: 'Mitú',
    region: 'Amazonía',
    svgPath: 'M 254,368 L 342,372 L 336,424 L 248,418 Z',
    labelX: 294,
    labelY: 396,
  },
  {
    codigo_divipola: '91',
    nombre: 'Amazonas',
    tipo_entidad: 'Departamento',
    ente_territorial_salud: 'Secretaría de Salud Departamental del Amazonas',
    capital_o_cabecera: 'Leticia',
    region: 'Amazonía',
    svgPath: 'M 184,406 L 288,414 L 272,498 L 218,496 L 176,438 Z',
    labelX: 236,
    labelY: 454,
  },
]

export function findTerritorioByName(name?: string): TerritorioSaludColombia {
  if (!name) return TERRITORIOS_SALUD_COLOMBIA.find((t) => t.nombre === 'Bogotá D.C.')!
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return (
    TERRITORIOS_SALUD_COLOMBIA.find((t) => {
      const tn = t.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return tn.includes(n) || n.includes(tn.split(' ')[0])
    }) || TERRITORIOS_SALUD_COLOMBIA.find((t) => t.nombre === 'Bogotá D.C.')!
  )
}

// ============================================================================
// CAPACIDAD INSTALADA OFICIAL EN EL REPS — RESOLUCIÓN 3100 DE 2019
// (https://prestadores.minsalud.gov.co/habilitacion/)
// Organizada exactamente en los 6 grupos oficiales del formulario REPS:
// 1. Camas | 2. Camillas | 3. Consultorios | 4. Salas | 5. Sillas | 6. Unidad Móvil / Ambulancias
// ============================================================================
export type GrupoCapacidadInstaladaREPS =
  | 'Consultorios'
  | 'Salas'
  | 'Sillas'
  | 'Camas'
  | 'Camillas'
  | 'Farmacia'
  | 'Telemedicina'
  | 'Unidades Móviles y Ambulancias'

export interface ConceptoCapacidadInstaladaREPS {
  id: string
  grupo: GrupoCapacidadInstaladaREPS
  concepto: string
  grupo_servicio_asociado: string
  unidad_medida: string
}

export const CATALOGO_CAPACIDAD_INSTALADA_REPS_3100: ConceptoCapacidadInstaladaREPS[] = [
  // 1. CONSULTORIOS
  {
    id: 'reps-cap-cons-ext',
    grupo: 'Consultorios',
    concepto: 'Consultorios en Consulta Externa (Medicina General, Especializada, Enfermería, Nutrición, Psicología)',
    grupo_servicio_asociado: 'Consulta Externa',
    unidad_medida: 'Consultorios',
  },
  {
    id: 'reps-cap-cons-urg',
    grupo: 'Consultorios',
    concepto: 'Consultorios en el Servicio de Urgencias (Triage y Consulta de Urgencias)',
    grupo_servicio_asociado: 'Atención Inmediata',
    unidad_medida: 'Consultorios',
  },

  // 2. SALAS (Procedimientos, Quirófanos, Partos)
  {
    id: 'reps-cap-sala-proc',
    grupo: 'Salas',
    concepto: 'Salas de Procedimientos (Procedimientos menores, endoscopia, curaciones, toma de muestras)',
    grupo_servicio_asociado: 'Consulta Externa / Apoyo Diagnóstico',
    unidad_medida: 'Salas de procedimientos',
  },
  {
    id: 'reps-cap-sala-quir',
    grupo: 'Salas',
    concepto: 'Salas de Cirugía / Quirófanos',
    grupo_servicio_asociado: 'Quirúrgicos',
    unidad_medida: 'Quirófanos',
  },
  {
    id: 'reps-cap-sala-partos',
    grupo: 'Salas',
    concepto: 'Salas de Partos / TPR (Trabajo de Parto, Parto y Recuperación)',
    grupo_servicio_asociado: 'Atención Inmediata',
    unidad_medida: 'Salas de partos',
  },

  // 3. SILLAS (Odontología, Hemodiálisis, Quimioterapia, Salud Mental)
  {
    id: 'reps-cap-silla-odon',
    grupo: 'Sillas',
    concepto: 'Unidades / Sillas de Odontología General y Especializada',
    grupo_servicio_asociado: 'Consulta Externa',
    unidad_medida: 'Sillas odontológicas',
  },
  {
    id: 'reps-cap-silla-hemo',
    grupo: 'Sillas',
    concepto: 'Sillas de Hemodiálisis',
    grupo_servicio_asociado: 'Apoyo Diagnóstico y Complementación Terapéutica',
    unidad_medida: 'Sillas de hemodiálisis',
  },
  {
    id: 'reps-cap-silla-quimio',
    grupo: 'Sillas',
    concepto: 'Sillas de Quimioterapia / Administración de Medicamentos Oncológicos y No Oncológicos',
    grupo_servicio_asociado: 'Apoyo Diagnóstico y Complementación Terapéutica',
    unidad_medida: 'Sillas de infusión/quimioterapia',
  },
  {
    id: 'reps-cap-silla-sm',
    grupo: 'Sillas',
    concepto: 'Sillas de Internación Parcial / Hospital Día Salud Mental o SPA',
    grupo_servicio_asociado: 'Internación',
    unidad_medida: 'Sillas hospital día',
  },

  // 4. CAMAS (Hospitalización, UCI, Intermedios, Neonatal, Salud Mental)
  {
    id: 'reps-cap-cama-adulto',
    grupo: 'Camas',
    concepto: 'Camas de Hospitalización Adultos',
    grupo_servicio_asociado: 'Internación',
    unidad_medida: 'Camas',
  },
  {
    id: 'reps-cap-cama-ped',
    grupo: 'Camas',
    concepto: 'Camas de Hospitalización Pediátrica',
    grupo_servicio_asociado: 'Internación',
    unidad_medida: 'Camas',
  },
  {
    id: 'reps-cap-cama-obst',
    grupo: 'Camas',
    concepto: 'Camas de Hospitalización Obstétrica',
    grupo_servicio_asociado: 'Internación',
    unidad_medida: 'Camas',
  },
  {
    id: 'reps-cap-cama-uci',
    grupo: 'Camas',
    concepto: 'Camas de Cuidado Intensivo (UCI Adulto / Pediátrico / Neonatal)',
    grupo_servicio_asociado: 'Internación',
    unidad_medida: 'Camas UCI',
  },
  {
    id: 'reps-cap-cama-ucin',
    grupo: 'Camas',
    concepto: 'Camas de Cuidado Intermedio (Adulto / Pediátrico / Neonatal) e Incubadoras',
    grupo_servicio_asociado: 'Internación',
    unidad_medida: 'Camas / Incubadoras',
  },

  // 5. CAMILLAS (Observación Urgencias, Recuperación Post-Quirúrgica)
  {
    id: 'reps-cap-camilla-obs',
    grupo: 'Camillas',
    concepto: 'Camillas de Observación Urgencias (Adultos, Pediátricas y Salud Mental)',
    grupo_servicio_asociado: 'Atención Inmediata',
    unidad_medida: 'Camillas de observación',
  },
  {
    id: 'reps-cap-camilla-rec',
    grupo: 'Camillas',
    concepto: 'Camillas de Recuperación Post-Anestésica / Cirugía Ambulatoria',
    grupo_servicio_asociado: 'Quirúrgicos',
    unidad_medida: 'Camillas de recuperación',
  },
  {
    id: 'reps-cap-camilla-otras',
    grupo: 'Camillas',
    concepto: 'Camillas de Procedimientos / Terapia Física y Rehabilitación / SPA',
    grupo_servicio_asociado: 'Apoyo Diagnóstico y Complementación Terapéutica',
    unidad_medida: 'Camillas / Cubículos',
  },

  // 6. UNIDADES MÓVILES Y AMBULANCIAS
  {
    id: 'reps-cap-amb-tab',
    grupo: 'Unidades Móviles y Ambulancias',
    concepto: 'Ambulancias de Transporte Asistencial Básico (TAB)',
    grupo_servicio_asociado: 'Atención Inmediata',
    unidad_medida: 'Ambulancias TAB',
  },
  {
    id: 'reps-cap-amb-tam',
    grupo: 'Unidades Móviles y Ambulancias',
    concepto: 'Ambulancias de Transporte Asistencial Medicalizado (TAM)',
    grupo_servicio_asociado: 'Atención Inmediata',
    unidad_medida: 'Ambulancias TAM',
  },
  {
    id: 'reps-cap-umovil',
    grupo: 'Unidades Móviles y Ambulancias',
    concepto: 'Unidades Móviles Terrestres / Fluviales / Marítimas (Modalidad Extramural)',
    grupo_servicio_asociado: 'Consulta Externa / Extramural',
    unidad_medida: 'Unidades móviles',
  },

  // 7. FARMACIA (Ventanillas de Dispensación)
  {
    id: 'reps-cap-farm-ventanillas',
    grupo: 'Farmacia',
    concepto: 'Ventanillas de dispensación disponibles en el Servicio Farmacéutico',
    grupo_servicio_asociado: 'Apoyo Diagnóstico y Complementación Terapéutica',
    unidad_medida: 'Ventanillas de dispensación',
  },

  // 8. TELEMEDICINA (Módulos de Telemedicina)
  {
    id: 'reps-cap-tele-modulos',
    grupo: 'Telemedicina',
    concepto: 'Módulos de Telemedicina disponibles para atención sincrónica / asincrónica',
    grupo_servicio_asociado: 'Modalidad Telemedicina / Telesalud',
    unidad_medida: 'Módulos de telemedicina',
  },
]
