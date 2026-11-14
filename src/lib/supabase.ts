import { createClient } from '@supabase/supabase-js'
import type { SuhDatabase } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    : null

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase)
}

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local.',
    )
  }
  return supabase
}

const SUH_TABLES: (keyof Omit<SuhDatabase, 'usuarios'>)[] = [
  'sedes',
  'admin_criterios',
  'th_capacidad',
  'th_prestados',
  'infra_mantenimientos',
  'infra_evaluaciones',
  'equipos_fijos',
  'documentos',
  'actas',
  'comites',
  'plan_trabajo',
  'planes_accion',
  'hallazgos',
  'auditorias_internas',
  'auditorias_externas',
  'evaluaciones_3100',
]

export async function fetchAllFromSupabase(): Promise<Partial<SuhDatabase> | null> {
  if (!supabase) return null
  try {
    const results = await Promise.all(
      SUH_TABLES.map(async (table) => {
        const { data, error } = await supabase!.from(table).select('*')
        if (error) return [table, null] as const
        return [table, data] as const
      }),
    )

    const partial: Record<string, unknown> = {}
    let hasData = false
    for (const [table, rows] of results) {
      if (Array.isArray(rows) && rows.length > 0) {
        partial[table] = rows
        hasData = true
      }
    }

    const { data: perfiles } = await supabase.from('perfiles').select('*')
    if (Array.isArray(perfiles) && perfiles.length > 0) {
      partial.usuarios = perfiles
      hasData = true
    }

    return hasData ? (partial as Partial<SuhDatabase>) : null
  } catch {
    return null
  }
}

export async function syncSnapshotToSupabase(db: SuhDatabase): Promise<{
  ok: boolean
  syncedTables: number
  error?: string
}> {
  if (!supabase) {
    return {
      ok: false,
      syncedTables: 0,
      error: 'Variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY no configuradas aún en .env.local.',
    }
  }

  try {
    let synced = 0
    for (const table of SUH_TABLES) {
      const rows = db[table]
      if (Array.isArray(rows) && rows.length > 0) {
        const { error } = await supabase.from(table).upsert(rows as unknown as Record<string, unknown>[])
        if (error) {
          return { ok: false, syncedTables: synced, error: `${table}: ${error.message}` }
        }
        synced++
      }
    }
    return { ok: true, syncedTables: synced }
  } catch (err) {
    return {
      ok: false,
      syncedTables: 0,
      error: err instanceof Error ? err.message : 'Error de conexión con Supabase',
    }
  }
}
