// ============================================================================
// CATÁLOGO OFICIAL COMPLETO DE LOS 157 SERVICIOS DE SALUD — RESOLUCIÓN 3100 DE 2019
// Extraído íntegramente de tabla_parametros_servicios_310011.xlsx
// Incluye: Grupos, Modalidades permitidas, Reglas de Complejidad, Especificidades y Capacidad Asociada
// ============================================================================

export interface ParametroServicio3100 {
  codigo: string
  nombre: string
  grupo: string
  modalidades_permitidas: {
    intramural: boolean
    extramural: boolean
    extramural_unidad_movil: boolean
    extramural_domiciliario: boolean
    extramural_jornada_salud: boolean
    telemedicina: boolean
    telemedicina_ref_interactiva: boolean
    telemedicina_ref_no_interactiva: boolean
    telemedicina_ref_telexperticia: boolean
    telemedicina_ref_telemonitoreo: boolean
    telemedicina_rem_telexperticia: boolean
    telemedicina_rem_telemonitoreo: boolean
  }
  complejidades_permitidas: ('Sin complejidad' | 'Baja' | 'Media' | 'Alta')[]
  especificidades_permitidas: string[]
  interdependencia: boolean
  capacidad_instalada_asociada: {
    codigo_ci: string
    grupo_capacidad: string
    nombre_capacidad: string
    obligatoria: boolean
  }[]
}

export const GRUPOS_SERVICIOS_3100_OFICIAL = [
  "Apoyo Diagnóstico y Complementación Terapéutica",
  "Atención Inmediata",
  "Consulta Externa",
  "Internación",
  "Quirúrgicos"
] as const;

export const TABLA_PARAMETROS_SERVICIOS_3100: ParametroServicio3100[] = [
  {
    "codigo": "105",
    "nombre": "CUIDADO INTERMEDIO NEONATAL",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "47",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Incubadora Intermedia Neonatal",
        "obligatoria": true
      },
      {
        "codigo_ci": "54",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Cuna Intermedia Neonatal",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "106",
    "nombre": "CUIDADO INTERMEDIO PEDIÁTRICO",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "55",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Cuna Intermedia Pediátrica",
        "obligatoria": false
      },
      {
        "codigo_ci": "48",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Intermedia Pediátrica",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "107",
    "nombre": "CUIDADO INTERMEDIO ADULTOS",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "49",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Intermedia Adultos",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "108",
    "nombre": "CUIDADO INTENSIVO NEONATAL",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "50",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Incubadora Intensiva Neonatal",
        "obligatoria": true
      },
      {
        "codigo_ci": "56",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Cuna Intensiva Neonatal",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "109",
    "nombre": "CUIDADO INTENSIVO PEDIÁTRICO",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [
      "Atención al Paciente Quemado"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "57",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Cuna Intensiva Pediátrica",
        "obligatoria": false
      },
      {
        "codigo_ci": "51",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Intensiva Pediátrica",
        "obligatoria": true
      },
      {
        "codigo_ci": "60",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Intensiva Quemado pediátrica",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "110",
    "nombre": "CUIDADO INTENSIVO ADULTOS",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [
      "Atención al Paciente Quemado"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "52",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Intensiva Adultos",
        "obligatoria": true
      },
      {
        "codigo_ci": "58",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Intensiva Quemado Adulto",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "120",
    "nombre": "CUIDADO BÁSICO NEONATAL",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "59",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Cuna Básico Neonatal",
        "obligatoria": false
      },
      {
        "codigo_ci": "53",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Incubadora Básico Neonatal",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "129",
    "nombre": "HOSPITALIZACIÓN ADULTOS",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": true
    },
    "complejidades_permitidas": [
      "Baja",
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante de Células Progenitoras Hematopoyéticas"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "2",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Adultos",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "130",
    "nombre": "HOSPITALIZACIÓN PEDIÁTRICA",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": true
    },
    "complejidades_permitidas": [
      "Baja",
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante de Células Progenitoras Hematopoyéticas"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "1",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Pediátrica",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "131",
    "nombre": "HOSPITALIZACIÓN EN SALUD MENTAL",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "32",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Salud Mental Adulto",
        "obligatoria": true
      },
      {
        "codigo_ci": "33",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Salud Mental Pediátrico",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "132",
    "nombre": "HOSPITALIZACIÓN PARCIAL",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Salud Mental",
      "SPA (Sustancias Psicoactivas)",
      "Otras Patologías",
      "Trastornos por Sustancias Psicoactivas"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "34",
        "grupo_capacidad": "CAMILLAS",
        "nombre_capacidad": "Salud Mental",
        "obligatoria": false
      },
      {
        "codigo_ci": "35",
        "grupo_capacidad": "CAMILLAS",
        "nombre_capacidad": "SPA",
        "obligatoria": false
      },
      {
        "codigo_ci": "36",
        "grupo_capacidad": "CAMILLAS",
        "nombre_capacidad": "Otras patologías",
        "obligatoria": false
      },
      {
        "codigo_ci": "37",
        "grupo_capacidad": "SILLAS",
        "nombre_capacidad": "Salud Mental",
        "obligatoria": false
      },
      {
        "codigo_ci": "38",
        "grupo_capacidad": "SILLAS",
        "nombre_capacidad": "SPA",
        "obligatoria": false
      },
      {
        "codigo_ci": "39",
        "grupo_capacidad": "SILLAS",
        "nombre_capacidad": "Otras patologías",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "133",
    "nombre": "HOSPITALIZACIÓN PACIENTE CRÓNICO CON VENTILADOR",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": true
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "40",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Paciente crónico con ventilador",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "134",
    "nombre": "HOSPITALIZACIÓN PACIENTE CRÓNICO SIN VENTILADOR",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": true
    },
    "complejidades_permitidas": [
      "Baja",
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "41",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "Paciente crónico sin ventilador",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "135",
    "nombre": "HOSPITALIZACIÓN EN  CONSUMO DE SUSTANCIAS PSICOACTIVAS",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "42",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "SPA Adultos",
        "obligatoria": true
      },
      {
        "codigo_ci": "43",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "SPA Pediátricas",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "138",
    "nombre": "CUIDADO BÁSICO DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS",
    "grupo": "Internación",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "44",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "SPA Básico Adultos",
        "obligatoria": true
      },
      {
        "codigo_ci": "45",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "SPA Básico Pediátricos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "201",
    "nombre": "CIRUGÍA DE CABEZA Y CUELLO",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Oncológico",
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "202",
    "nombre": "CIRUGÍA CARDIOVASCULAR",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Cardiovascular",
      "Procedimientos Quirúrgicos Ambulatorios",
      "Trasplante Órgano Corazón",
      "Trasplante Órgano Pulmón"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "203",
    "nombre": "CIRUGÍA GENERAL",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "204",
    "nombre": "CIRUGÍA GINECOLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Oncológico",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "205",
    "nombre": "CIRUGÍA MAXILOFACIAL",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "207",
    "nombre": "CIRUGÍA ORTOPÉDICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "208",
    "nombre": "CIRUGÍA OFTALMOLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Tejido Ocular",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "209",
    "nombre": "CIRUGÍA OTORRINOLARINGOLOGÍA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "210",
    "nombre": "CIRUGÍA ONCOLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "211",
    "nombre": "CIRUGÍA ORAL",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "212",
    "nombre": "CIRUGÍA PEDIÁTRICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "213",
    "nombre": "CIRUGÍA PLÁSTICA Y ESTÉTICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "214",
    "nombre": "CIRUGÍA VASCULAR Y ANGIOLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "215",
    "nombre": "CIRUGÍA UROLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Procedimientos Quirúrgicos Ambulatorios",
      "Trasplante Órgano Riñón",
      "Trasplante Órgano Páncreas",
      "Trasplante Renal"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "217",
    "nombre": "OTRAS CIRUGÍAS",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Oncológico",
      "Procedimientos Quirúrgicos Ambulatorios",
      "Trasplante Órgano Intestino",
      "Trasplante Multivisceral",
      "Trasplante Renal"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "218",
    "nombre": "CIRUGÍA ENDOVASCULAR NEUROLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "227",
    "nombre": "CIRUGÍA ONCOLÓGICA PEDIÁTRICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "231",
    "nombre": "CIRUGÍA DE LA MANO",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "232",
    "nombre": "CIRUGÍA DE MAMA Y TUMORES TEJIDOS BLANDOS",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Oncológico",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "233",
    "nombre": "CIRUGÍA DERMATOLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "234",
    "nombre": "CIRUGÍA DE TÓRAX",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Procedimientos Quirúrgicos Ambulatorios",
      "Trasplante Órgano Corazón",
      "Trasplante Órgano Pulmón"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "235",
    "nombre": "CIRUGÍA GASTROINTESTINAL",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "237",
    "nombre": "CIRUGÍA PLÁSTICA ONCOLÓGICA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel",
      "Procedimientos Quirúrgicos Ambulatorios"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "46",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Cirugía",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "245",
    "nombre": "NEUROCIRUGÍA",
    "grupo": "Quirúrgicos",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "301",
    "nombre": "ANESTESIA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "302",
    "nombre": "CARDIOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "303",
    "nombre": "CIRUGÍA CARDIOVASCULAR",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "304",
    "nombre": "CIRUGÍA GENERAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "306",
    "nombre": "CIRUGÍA PEDIÁTRICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "308",
    "nombre": "DERMATOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "309",
    "nombre": "DOLOR Y CUIDADOS PALIATIVOS",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "310",
    "nombre": "ENDOCRINOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "311",
    "nombre": "ENDODONCIA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "312",
    "nombre": "ENFERMERÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "313",
    "nombre": "ESTOMATOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "316",
    "nombre": "GASTROENTEROLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "317",
    "nombre": "GENÉTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "318",
    "nombre": "GERIATRÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "320",
    "nombre": "GINECOBSTETRICIA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "321",
    "nombre": "HEMATOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "323",
    "nombre": "INFECTOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "324",
    "nombre": "INMUNOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "325",
    "nombre": "MEDICINA FAMILIAR",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "326",
    "nombre": "MEDICINA FÍSICA Y DEL DEPORTE",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "327",
    "nombre": "MEDICINA FÍSICA Y REHABILITACIÓN",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "328",
    "nombre": "MEDICINA GENERAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "329",
    "nombre": "MEDICINA INTERNA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "330",
    "nombre": "NEFROLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "331",
    "nombre": "NEUMOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "332",
    "nombre": "NEUROLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "333",
    "nombre": "NUTRICIÓN Y DIETÉTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "334",
    "nombre": "ODONTOLOGÍA GENERAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular"
    ],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "335",
    "nombre": "OFTALMOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "336",
    "nombre": "ONCOLOGÍA CLÍNICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "337",
    "nombre": "OPTOMETRÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "338",
    "nombre": "ORTODONCIA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "339",
    "nombre": "ORTOPEDIA Y/O TRAUMATOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "340",
    "nombre": "OTORRINOLARINGOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "342",
    "nombre": "PEDIATRÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "343",
    "nombre": "PERIODONCIA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "344",
    "nombre": "PSICOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "345",
    "nombre": "PSIQUIATRÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "346",
    "nombre": "REHABILITACIÓN ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "347",
    "nombre": "REHABILITACIÓN ORAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "348",
    "nombre": "REUMATOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "354",
    "nombre": "TOXICOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "355",
    "nombre": "UROLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "356",
    "nombre": "OTRAS CONSULTAS DE ESPECIALIDAD",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "361",
    "nombre": "CARDIOLOGÍA PEDIÁTRICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "362",
    "nombre": "CIRUGÍA DE CABEZA Y CUELLO",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "363",
    "nombre": "CIRUGÍA DE MANO",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "364",
    "nombre": "CIRUGÍA DE MAMA Y TUMORES TEJIDOS BLANDOS",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "365",
    "nombre": "CIRUGÍA DERMATOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "366",
    "nombre": "CIRUGÍA DE TÓRAX",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "367",
    "nombre": "CIRUGÍA GASTROINTESTINAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "368",
    "nombre": "CIRUGÍA GINECOLÓGICA LAPAROSCÓPICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "369",
    "nombre": "CIRUGÍA PLÁSTICA Y ESTÉTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "370",
    "nombre": "CIRUGÍA PLÁSTICA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "371",
    "nombre": "OTRAS CONSULTAS GENERALES",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "372",
    "nombre": "CIRUGÍA VASCULAR",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "373",
    "nombre": "CIRUGÍA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "374",
    "nombre": "CIRUGÍA ONCOLÓGICA PEDIÁTRICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "375",
    "nombre": "DERMATOLOGÍA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "377",
    "nombre": "COLOPROCTOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "379",
    "nombre": "GINECOLOGÍA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "383",
    "nombre": "MEDICINA NUCLEAR",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "384",
    "nombre": "NEFROLOGÍA PEDIÁTRICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "385",
    "nombre": "NEONATOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "386",
    "nombre": "NEUMOLOGÍA PEDIÁTRICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "387",
    "nombre": "NEUROCIRUGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "388",
    "nombre": "NEUROPEDIATRÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "390",
    "nombre": "OFTALMOLOGÍA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "391",
    "nombre": "ONCOLOGÍA Y HEMATOLOGÍA PEDIÁTRICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "393",
    "nombre": "ORTOPEDIA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "395",
    "nombre": "UROLOGÍA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "396",
    "nombre": "ODONTOPEDIATRÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "397",
    "nombre": "MEDICINA ESTÉTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "406",
    "nombre": "HEMATOLOGÍA ONCOLÓGICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "407",
    "nombre": "MEDICINA DEL TRABAJO Y MEDICINA LABORAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "408",
    "nombre": "RADIOTERAPIA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "409",
    "nombre": "ORTOPEDIA PEDIÁTRICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "410",
    "nombre": "CIRUGÍA ORAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "411",
    "nombre": "CIRUGÍA MAXILOFACIAL",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Trasplante Osteomuscular",
      "Trasplante de Piel"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "412",
    "nombre": "MEDICINA ALTERNATIVA Y COMPLEMENTARIA - HOMEOPÁTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "413",
    "nombre": "MEDICINA ALTERNATIVA Y COMPLEMENTARIA - AYURVÉDICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "414",
    "nombre": "MEDICINA ALTERNATIVA Y COMPLEMENTARIA - TRADICIONAL CHINA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "415",
    "nombre": "MEDICINA ALTERNATIVA Y COMPLEMENTARIA - NATUROPÁTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "416",
    "nombre": "MEDICINA ALTERNATIVA Y COMPLEMENTARIA - NEURALTERAPÉUTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "417",
    "nombre": "TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - BIOENERGÉTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "418",
    "nombre": "TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - TERAPIA  CON FILTROS",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "419",
    "nombre": "TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - TERAPIAS  MANUALES",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "420",
    "nombre": "VACUNACIÓN",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": false,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": false,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": false,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "421",
    "nombre": "PATOLOGÍA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "422",
    "nombre": "MEDICINA ALTERNATIVA Y COMPLEMENTARIA - OSTEOPÁTICA",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "423",
    "nombre": "SEGURIDAD Y SALUD EN EL TRABAJO",
    "grupo": "Consulta Externa",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "706",
    "nombre": "LABORATORIO CLÍNICO",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "709",
    "nombre": "QUIMIOTERAPIA",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "23",
        "grupo_capacidad": "SILLAS",
        "nombre_capacidad": "Sillas de Quimioterapia",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "711",
    "nombre": "RADIOTERAPIA",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "63",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Sala de Radioterapia",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "712",
    "nombre": "TOMA DE MUESTRAS DE LABORATORIO CLÍNICO",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": false,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": false,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": false,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "714",
    "nombre": "SERVICIO FARMACÉUTICO",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja",
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "715",
    "nombre": "MEDICINA NUCLEAR",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [
      "Oncológico"
    ],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "717",
    "nombre": "LABORATORIO CITOLOGÍAS CERVICO-UTERINAS",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "728",
    "nombre": "TERAPIA OCUPACIONAL",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "729",
    "nombre": "TERAPIA RESPIRATORIA",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": false
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "731",
    "nombre": "LABORATORIO DE HISTOTECNOLOGÍA",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": false,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": false,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": false,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "733",
    "nombre": "HEMODIÁLISIS",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "24",
        "grupo_capacidad": "SILLAS",
        "nombre_capacidad": "Sillas de Hemodiálisis",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "734",
    "nombre": "DIÁLISIS PERITONEAL",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "739",
    "nombre": "FISIOTERAPIA",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      },
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "740",
    "nombre": "FONOAUDIOLOGÍA Y/O TERAPIA DEL LENGUAJE",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": true,
      "telemedicina_ref_no_interactiva": true,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": true,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "25",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Procedimientos",
        "obligatoria": true
      },
      {
        "codigo_ci": "31",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Consulta Externa",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "742",
    "nombre": "DIAGNÓSTICO VASCULAR",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "743",
    "nombre": "HEMODINAMIA E INTERVENCIONISMO",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "744",
    "nombre": "IMÁGENES DIAGNOSTICAS- IONIZANTES",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja",
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "745",
    "nombre": "IMÁGENES DIAGNOSTICAS - NO IONIZANTES",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": true,
      "extramural_jornada_salud": true,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "746",
    "nombre": "GESTION PRE-TRANSFUSIONAL",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": false,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": false,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": false,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "747",
    "nombre": "PATOLOGÍA",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "748",
    "nombre": "RADIOLOGÍA ODONTOLÓGICA",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "749",
    "nombre": "TOMA DE MUESTRAS DE CUELLO UTERINO Y GINECOLÓGICAS",
    "grupo": "Apoyo Diagnóstico y Complementación Terapéutica",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": true,
      "extramural_unidad_movil": true,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": true,
      "telemedicina": false,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": false,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": false,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Sin complejidad"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": []
  },
  {
    "codigo": "1101",
    "nombre": "ATENCIÓN DEL PARTO",
    "grupo": "Atención Inmediata",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja",
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "30",
        "grupo_capacidad": "CAMAS",
        "nombre_capacidad": "TPR",
        "obligatoria": false
      },
      {
        "codigo_ci": "14",
        "grupo_capacidad": "SALAS",
        "nombre_capacidad": "Partos",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "1102",
    "nombre": "URGENCIAS",
    "grupo": "Atención Inmediata",
    "modalidades_permitidas": {
      "intramural": true,
      "extramural": false,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja",
      "Media",
      "Alta"
    ],
    "especificidades_permitidas": [],
    "interdependencia": true,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "61",
        "grupo_capacidad": "CAMILLAS",
        "nombre_capacidad": "Observación Adultos Hombres",
        "obligatoria": true
      },
      {
        "codigo_ci": "62",
        "grupo_capacidad": "CAMILLAS",
        "nombre_capacidad": "Observación Adultos Mujeres",
        "obligatoria": true
      },
      {
        "codigo_ci": "28",
        "grupo_capacidad": "CAMILLAS",
        "nombre_capacidad": "Observación Pediátrica",
        "obligatoria": true
      },
      {
        "codigo_ci": "29",
        "grupo_capacidad": "CONSULTORIOS",
        "nombre_capacidad": "Urgencias",
        "obligatoria": false
      }
    ]
  },
  {
    "codigo": "1103",
    "nombre": "TRANSPORTE ASISTENCIAL BASICO",
    "grupo": "Atención Inmediata",
    "modalidades_permitidas": {
      "intramural": false,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "15",
        "grupo_capacidad": "AMBULANCIAS",
        "nombre_capacidad": "Básica",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "1104",
    "nombre": "TRANSPORTE ASISTENCIAL MEDICALIZADO",
    "grupo": "Atención Inmediata",
    "modalidades_permitidas": {
      "intramural": false,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Media"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": [
      {
        "codigo_ci": "16",
        "grupo_capacidad": "AMBULANCIAS",
        "nombre_capacidad": "Medicalizada",
        "obligatoria": true
      }
    ]
  },
  {
    "codigo": "1105",
    "nombre": "ATENCIÓN PREHOSPITALARIA",
    "grupo": "Atención Inmediata",
    "modalidades_permitidas": {
      "intramural": false,
      "extramural": true,
      "extramural_unidad_movil": false,
      "extramural_domiciliario": false,
      "extramural_jornada_salud": false,
      "telemedicina": true,
      "telemedicina_ref_interactiva": false,
      "telemedicina_ref_no_interactiva": false,
      "telemedicina_ref_telexperticia": true,
      "telemedicina_ref_telemonitoreo": false,
      "telemedicina_rem_telexperticia": true,
      "telemedicina_rem_telemonitoreo": false
    },
    "complejidades_permitidas": [
      "Baja"
    ],
    "especificidades_permitidas": [],
    "interdependencia": false,
    "capacidad_instalada_asociada": []
  }
];
