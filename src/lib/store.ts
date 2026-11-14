import { useEffect, useState } from 'react'
import type { ActividadPlanTrabajo, AppUser, SuhDatabase } from './types'
import { createInitialSeedDatabase } from './seed-data'
import { todayISO } from './calculations'
import { fetchAllFromSupabase, isSupabaseConfigured, syncSnapshotToSupabase } from './supabase'

const STORAGE_KEY = 'suh_3100_sogcs_db_prod_clean_v1'
const SESSION_USER_KEY = 'suh_3100_active_user_id_prod_clean_v1'
let initialSupabaseSyncAttempted = false

let memoryDb: SuhDatabase | null = null
const listeners = new Set<() => void>()

function loadDb(): SuhDatabase {
  if (memoryDb) return memoryDb
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SuhDatabase
      if (parsed && Array.isArray(parsed.sedes) && Array.isArray(parsed.usuarios)) {
        memoryDb = parsed
        return memoryDb
      }
    }
  } catch {
    // fallback to seed
  }
  memoryDb = createInitialSeedDatabase()
  saveDb(memoryDb)
  return memoryDb
}

function saveDb(next: SuhDatabase) {
  memoryDb = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore storage quota errors
  }
  listeners.forEach((fn) => fn())
}

export function getDb(): SuhDatabase {
  return loadDb()
}

export function updateDb(updater: (prev: SuhDatabase) => SuhDatabase, toastMsg?: string) {
  const current = loadDb()
  const next = updater(structuredClone(current))
  saveDb(next)
  if (isSupabaseConfigured()) {
    void syncSnapshotToSupabase(next)
  }
  if (toastMsg && toastListener) {
    toastListener(toastMsg)
  }
}

export async function manualSyncWithSupabase(): Promise<void> {
  const current = loadDb()
  const res = await syncSnapshotToSupabase(current)
  if (toastListener) {
    if (res.ok) {
      toastListener(`Sincronización exitosa con Supabase (${res.syncedTables} tablas actualizadas).`)
    } else {
      toastListener(`Aviso Supabase: ${res.error}`)
    }
  }
}

export function resetDemoDatabase() {
  const fresh = createInitialSeedDatabase()
  saveDb(fresh)
  if (toastListener) {
    toastListener('Datos de demostración restaurados correctamente.')
  }
}

let toastListener: ((msg: string) => void) | null = null
export function registerToastListener(fn: ((msg: string) => void) | null) {
  toastListener = fn
}

export function notifyToast(msg: string) {
  if (toastListener) toastListener(msg)
}

export function useSuhStore() {
  const [db, setDb] = useState<SuhDatabase>(() => loadDb())
  useEffect(() => {
    const onChange = () => setDb(loadDb())
    listeners.add(onChange)
    if (!initialSupabaseSyncAttempted && isSupabaseConfigured()) {
      initialSupabaseSyncAttempted = true
      void fetchAllFromSupabase().then((remote) => {
        if (remote) {
          const merged = { ...loadDb(), ...remote } as SuhDatabase
          saveDb(merged)
        }
      })
    }
    return () => {
      listeners.delete(onChange)
    }
  }, [])
  return { db, updateDb, resetDemoDatabase, manualSyncWithSupabase }
}

// ============================================================================
// HELPER CENTRAL: ENVIAR O VINCULAR CUALQUIER PROGRAMACIÓN O ACCIÓN DE MEJORA
// AL PLAN DE TRABAJO ANUAL
// ============================================================================
export function pushToWorkPlan(
  draft: SuhDatabase,
  params: {
    titulo: string
    descripcion: string
    sede_id: string
    modulo_origen: ActividadPlanTrabajo['modulo_origen']
    referencia_origen_id?: string
    responsable: string
    responsable_correo?: string
    fecha_limite: string
    presupuesto?: number
    usuario_creador?: string
  },
): string {
  const existing = params.referencia_origen_id
    ? draft.plan_trabajo.find((p) => p.referencia_origen_id === params.referencia_origen_id)
    : undefined

  if (existing) {
    existing.titulo = params.titulo
    existing.descripcion = params.descripcion
    existing.sede_id = params.sede_id
    existing.responsable = params.responsable
    existing.fecha_limite = params.fecha_limite
    existing.eventos.push({
      id: `ev-${Date.now()}`,
      fecha: todayISO(),
      tipo: 'edicion',
      descripcion: `Sincronizado automáticamente desde ${params.modulo_origen}.`,
      usuario: params.usuario_creador || params.responsable,
    })
    return existing.id
  }

  const nextNum = draft.plan_trabajo.length + 1
  const id = `pt-${Date.now()}-${nextNum}`
  const newActivity: ActividadPlanTrabajo = {
    id,
    codigo: `PT-2026-${String(nextNum).padStart(3, '0')}`,
    titulo: params.titulo,
    descripcion: params.descripcion,
    sede_id: params.sede_id,
    modulo_origen: params.modulo_origen,
    referencia_origen_id: params.referencia_origen_id,
    responsable: params.responsable,
    responsable_correo: params.responsable_correo || 'calidad@calidadips.co',
    fecha_original: params.fecha_limite,
    fecha_limite: params.fecha_limite,
    estado: 'programada',
    reprogramaciones: 0,
    presupuesto: params.presupuesto ?? 0,
    ejecutado: 0,
    observaciones: `Vinculado automáticamente desde el módulo ${params.modulo_origen}.`,
    eventos: [
      {
        id: `ev-${Date.now()}`,
        fecha: todayISO(),
        tipo: 'creacion',
        descripcion: `Creado y vinculado automáticamente desde ${params.modulo_origen}.`,
        usuario: params.usuario_creador || params.responsable,
      },
    ],
  }
  draft.plan_trabajo.unshift(newActivity)
  return id
}

// ============================================================================
// SESIÓN DE USUARIO ACTIVA Y ROLES
// ============================================================================
export function getActiveUser(): AppUser | null {
  const db = loadDb()
  const savedId = localStorage.getItem(SESSION_USER_KEY)
  if (!savedId) {
    // Por defecto ingresa como Súper Usuario para uso inmediato, pero puede cerrar sesión y probar Login
    const superU = db.usuarios.find((u) => u.rol === 'superusuario') || db.usuarios[0]
    if (superU) {
      localStorage.setItem(SESSION_USER_KEY, superU.id)
      return superU
    }
    return null
  }
  if (savedId === '__LOGGED_OUT__') return null
  return db.usuarios.find((u) => u.id === savedId && !u.bloqueado) || null
}

export function setActiveUser(userId: string | null) {
  if (!userId) {
    localStorage.setItem(SESSION_USER_KEY, '__LOGGED_OUT__')
  } else {
    localStorage.setItem(SESSION_USER_KEY, userId)
  }
  listeners.forEach((fn) => fn())
}

export const ROLE_LABELS: Record<AppUser['rol'], string> = {
  superusuario: 'Súper Usuario (Control Total)',
  lider_calidad: 'Líder de Calidad y Habilitación',
  auditor: 'Auditor Interno / Médico',
  lider_infraestructura: 'Líder de Infraestructura y Dotación',
  lider_talento_humano: 'Líder de Talento Humano',
  consulta: 'Consulta Institucional',
}
