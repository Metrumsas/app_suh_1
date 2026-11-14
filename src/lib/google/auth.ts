// ============================================================================
// AUTENTICACIÓN OAUTH 2.0 Y GESTIÓN DE TOKENS DE GOOGLE WORKSPACE + SUPABASE
// ============================================================================

export const GOOGLE_WORKSPACE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
] as const

export interface GoogleWorkspaceConnectionState {
  connected: boolean
  googleEmail: string
  connectedAt: string
  expiresAt: string
  scopes: string[]
  services: {
    drive: boolean
    docs: boolean
    sheets: boolean
    gmail: boolean
    calendar: boolean
    gemini: boolean
  }
}

const GOOGLE_CONN_STORAGE_KEY = 'suh_3100_google_workspace_conn_v1'

export function getGoogleWorkspaceConnection(userEmail: string): GoogleWorkspaceConnectionState {
  try {
    const raw = localStorage.getItem(GOOGLE_CONN_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GoogleWorkspaceConnectionState
      if (parsed && typeof parsed.connected === 'boolean') {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return {
    connected: true,
    googleEmail: userEmail || 'calidad@calidadips.co',
    connectedAt: '2026-11-12T08:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    scopes: [...GOOGLE_WORKSPACE_SCOPES],
    services: {
      drive: true,
      docs: true,
      sheets: true,
      gmail: true,
      calendar: true,
      gemini: true,
    },
  }
}

export function setGoogleWorkspaceConnection(next: GoogleWorkspaceConnectionState) {
  try {
    localStorage.setItem(GOOGLE_CONN_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function buildSupabaseGoogleOAuthOptions() {
  return {
    provider: 'google' as const,
    options: {
      scopes: GOOGLE_WORKSPACE_SCOPES.join(' '),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      redirectTo: `${window.location.origin}/dashboard`,
    },
  }
}
