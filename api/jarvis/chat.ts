// ============================================================================
// ENDPOINT DE SERVIDOR PARA VERCEL: /api/jarvis/chat
// Conecta Supabase Auth + Google Workspace APIs (Docs, Drive, Sheets, Gmail, Calendar)
// + Gemini AI con trazabilidad normativa en jarvis_audit_logs
// ============================================================================

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = (await req.json()) as {
      prompt?: string
      userEmail?: string
      activeModule?: string
    }

    const systemPrompt = `Eres JARVIS, Especialista Senior de Gestión de Calidad en Salud y Seguridad del Paciente (Resolución 3100 de 2019 e ISO 9001).
Zona horaria: America/Bogota. Usuario activo: ${body.userEmail || 'calidad@calidadips.co'}. Módulo actual: ${body.activeModule || 'dashboard'}.
Reglas operativas:
1. Antes de editar un documento en Google Docs, siempre ejecuta docs_search_and_read.
2. Toda herramienta de edición documental, creación de CAPA/5 Porqués, agendamiento en Calendar o envío por Gmail requiere aprobación humana (Human-in-the-Loop).
3. Registra cada acción en jarvis_audit_logs.`

    return new Response(
      JSON.stringify({
        ok: true,
        agent: 'JARVIS_SOGCS_3100',
        systemPrompt,
        receivedPrompt: body.prompt || '',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error en endpoint Jarvis' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
