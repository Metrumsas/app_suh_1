import { useEffect, useState } from 'react'
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'
import './App.css'
import './Portal.css'
import './WorkPlan.css'
import './ComplaintCases.css'
import './RecordDialog.css'
import './AuditModule.css'
import './DashboardOverview.css'
import './DocumentModule.css'

import {
  getActiveUser,
  registerToastListener,
  ROLE_LABELS,
  setActiveUser,
  useSuhStore,
} from './lib/store'
import DashboardOverview from './modules/DashboardOverview'
import AdministracionModule from './modules/AdministracionModule'
import TalentoHumanoModule from './modules/TalentoHumanoModule'
import InfraestructuraModule from './modules/InfraestructuraModule'
import EquiposFijosModule from './modules/EquiposFijosModule'
import InformacionDocumentadaModule from './modules/InformacionDocumentadaModule'
import ComitesModule from './modules/ComitesModule'
import WorkPlanModule from './modules/WorkPlanModule'
import GestionCambioModule from './modules/GestionCambioModule'
import AuditoriaModule from './modules/AuditoriaModule'
import Cumplimiento3100Module from './modules/Cumplimiento3100Module'
import UserSedeAdminModule from './modules/UserSedeAdminModule'
import JarvisWorkspaceDrawer from './components/jarvis/JarvisWorkspaceDrawer'

const MODULES = [
  {
    id: 'dashboard',
    label: 'Resumen general SOGCS',
    subtitle: 'Tablero ejecutivo de habilitación Resolución 3100 de 2019 y estado de sedes.',
    icon: LayoutDashboard,
  },
  {
    id: 'administracion',
    label: 'Administración y Financiera',
    subtitle: 'Evaluación, soportes versionados y semáforo 30/60/+60 días por sede y NACIONAL.',
    icon: Building2,
  },
  {
    id: 'talento-humano',
    label: 'Talento Humano (Capacidad)',
    subtitle: 'Cálculo de capacidad instalada (Intramural, Extramural y Telemedicina) vs. servicios prestados.',
    icon: Activity,
  },
  {
    id: 'infraestructura',
    label: 'Infraestructura',
    subtitle: 'Cronograma de mantenimiento (1-4 fotos), planos/rutas de sede y evaluación de 14 condiciones físicas.',
    icon: Wrench,
  },
  {
    id: 'equipos',
    label: 'Equipos Fijos',
    subtitle: 'Inventario por sede y tecnología (AC, industrial hospitalario, cómputo) y mantenimiento anual.',
    icon: Cpu,
  },
  {
    id: 'documentos',
    label: 'Información Documentada',
    subtitle: 'Documentos maestros con vigencia bienal (2 años), versiones de PDF y actas por comité y año.',
    icon: FileText,
  },
  {
    id: 'comites',
    label: 'Comités y Reuniones',
    subtitle: 'Cronograma mensual de comités, regla crítica de 10 días hábiles, ficha técnica y compromisos.',
    icon: BookOpen,
  },
  {
    id: 'cronograma',
    label: 'Plan de Trabajo',
    subtitle: 'Modelo SARLAFT centralizador de todas las programaciones y acciones de mejora institucionales.',
    icon: CalendarDays,
  },
  {
    id: 'cambio',
    label: 'Gestión del Cambio (5 Porqués)',
    subtitle: 'Planes de acción, análisis causal 5 Porqués, ciclo de vida de acciones y efectividad cuantitativa.',
    icon: GitBranch,
  },
  {
    id: 'auditoria',
    label: 'Auditoría y Cumplimiento',
    subtitle: 'Programa de auditoría interna (NTC-ISO 19011) y auditorías externas (Entes de Control y EPS) de 0 a 100.',
    icon: ClipboardCheck,
  },
  {
    id: 'cumplimiento',
    label: 'Cumplimiento Res. 3100',
    subtitle: 'Lista de chequeo variable por sede, servicio, grupo, modalidad y complejidad en los 7 estándares.',
    icon: Award,
  },
  {
    id: 'jarvis',
    label: 'Jarvis IA · Google Workspace',
    subtitle: 'Copiloto operativo conectado con Google Docs, Drive, Sheets, Gmail, Calendar y Supabase (Human-in-the-Loop).',
    icon: Bot,
  },
  {
    id: 'usuarios',
    label: 'Usuarios y Sedes (Súper Usuario)',
    subtitle: 'Asignación de usuarios controlada por el único Súper Usuario y configuración de Sedes REPS.',
    icon: UsersRound,
  },
] as const

type ModuleId = (typeof MODULES)[number]['id']

export default function App() {
  const { db, resetDemoDatabase } = useSuhStore()
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [showUserPopover, setShowUserPopover] = useState(false)
  const [jarvisDrawerOpen, setJarvisDrawerOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setJarvisDrawerOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Login form state when logged out
  const [selectedLoginUserId, setSelectedLoginUserId] = useState(
    db.usuarios[0]?.id || 'usr-super-01',
  )
  const [loginPass, setLoginPass] = useState('••••••••')
  const [loginError, setLoginError] = useState('')

  const currentUser = getActiveUser()

  useEffect(() => {
    registerToastListener((msg) => {
      setToast(msg)
    })
    return () => registerToastListener(null)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  // Visor directo de documentos PDF desde enlaces interactivos de la Ficha Técnica PDF (?ver_plano_sede=ID o ?ver_distintivo_sede=ID&srv=SRV_ID)
  const urlParams = new URLSearchParams(window.location.search)
  const verPlanoSedeId = urlParams.get('ver_plano_sede')
  const verDistintivoSedeId = urlParams.get('ver_distintivo_sede')
  const verDistintivoSrvId = urlParams.get('srv')

  if (verPlanoSedeId || verDistintivoSedeId) {
    const targetSedeId = verPlanoSedeId || verDistintivoSedeId
    const targetSede = db.sedes.find(
      (s) => s.id === targetSedeId || s.codigo_reps === targetSedeId,
    )
    const targetSrv = verDistintivoSedeId
      ? targetSede?.servicios_habilitados?.find(
          (sv) =>
            sv.id === verDistintivoSrvId ||
            sv.codigo_servicio === verDistintivoSrvId ||
            sv.numero_distintivo === verDistintivoSrvId,
        )
      : undefined

    const rawPdfUrl = verPlanoSedeId
      ? targetSede?.url_planos_arquitectonicos
      : targetSrv?.distintivo_pdf_data

    const docTitle = verPlanoSedeId
      ? `Planos Arquitectónicos — ${targetSede?.nombre || verPlanoSedeId}`
      : `Distintivo de Habilitación ${targetSrv?.numero_distintivo || ''} — ${targetSrv?.codigo_servicio || ''} ${targetSrv?.nombre_servicio || ''}`

    let resolvedBlobUrl = rawPdfUrl || ''
    if (rawPdfUrl && rawPdfUrl.startsWith('data:')) {
      try {
        const [header, base64] = rawPdfUrl.split(',')
        const mimeMatch = header.match(/data:(.*?);/)
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf'
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: mime })
        resolvedBlobUrl = URL.createObjectURL(blob)
      } catch {
        resolvedBlobUrl = rawPdfUrl
      }
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          color: '#f8fafc',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} style={{ color: '#38bdf8' }} />
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>{docTitle}</strong>
              <small style={{ fontSize: 11.5, color: '#94a3b8' }}>
                HABILITACIÓN SUH · Visor Oficial de Soportes PDF
              </small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {resolvedBlobUrl && (
              <a
                href={resolvedBlobUrl}
                download={
                  verPlanoSedeId
                    ? `Planos_${targetSede?.nombre || 'Sede'}.pdf`
                    : targetSrv?.distintivo_pdf_nombre ||
                      `Distintivo_${targetSrv?.numero_distintivo || 'REPS'}.pdf`
                }
                className="button button-primary"
                style={{ textDecoration: 'none' }}
              >
                Descargar PDF
              </a>
            )}
            <a
              href={window.location.origin}
              className="button button-secondary"
              style={{ textDecoration: 'none' }}
            >
              Ir a la Plataforma SUH
            </a>
          </div>
        </header>
        {resolvedBlobUrl ? (
          <iframe
            src={resolvedBlobUrl}
            title={docTitle}
            style={{
              flex: 1,
              width: '100%',
              border: 'none',
              minHeight: 'calc(100vh - 64px)',
              background: '#fff',
            }}
          />
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#cbd5e1' }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>
              Sincronizando o cargando el documento PDF desde la sede...
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              Si acabas de abrir este enlace, espera unos segundos mientras se sincroniza la base de datos o verifica que el PDF esté cargado en la Ficha Técnica de la sede.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Si no hay sesión activa -> Mostrar Pantalla de Login Institucional (Estilo SARLAFT)
  if (!currentUser) {
    return (
      <div className="portal-shell">
        <header className="portal-header">
          <div className="portal-logo">
            <img className="portal-logo-mark" src="/metrum-logo-azul.png" alt="Metrum" />
            <span>
              HABILITACIÓN SUH · RES. 3100
              <small>Metrum · Sistema Obligatorio de Garantía de Calidad en Salud (SOGCS)</small>
            </span>
          </div>
        </header>

        <main className="auth-layout">
          <div className="auth-intro">
            <img className="auth-intro-logo" src="/metrum-logo-azul.png" alt="Metrum" />
            <span className="portal-eyebrow">RESOLUCIÓN 3100 DE 2019 · MINISTERIO DE SALUD</span>
            <h1>Plataforma Integral del Equipo de Calidad y Habilitación en Salud</h1>
            <p>
              Integra en una sola plataforma la Capacidad Técnico-Administrativa, Suficiencia Patrimonial, Capacidad Instalada de Talento Humano, Infraestructura, Equipos Fijos, Información Documentada, Comités, Plan de Trabajo, Gestión de Hallazgos (5 Porqués), Auditorías (ISO 19011 / Entes de Control / EPS) y la Autoevaluación con Lista de Chequeo Variable.
            </p>
            <div className="intake-note">
              <CheckCircle2 size={18} />
              <span>
                <strong>Control de Acceso por Súper Usuario:</strong> La asignación de usuarios y permisos de módulos es administrada exclusivamente por el único Súper Usuario de la institución.
              </span>
            </div>
          </div>

          <div className="auth-card">
            <small className="portal-eyebrow">INGRESO A LA PLATAFORMA SOGCS</small>
            <h2>Iniciar Sesión</h2>
            <p>
              Selecciona el usuario asignado por el Súper Usuario para ingresar con sus respectivos permisos:
            </p>

            {loginError && <div className="portal-error">{loginError}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const usr = db.usuarios.find((u) => u.id === selectedLoginUserId)
                if (!usr) {
                  setLoginError('Usuario no encontrado.')
                  return
                }
                if (usr.bloqueado || usr.estado === 'suspendido') {
                  setLoginError('Esta cuenta se encuentra suspendida por el Súper Usuario.')
                  return
                }
                setActiveUser(usr.id)
                setLoginError('')
              }}
            >
              <label className="form-field">
                <span>Cuenta de Usuario (Asignada por Súper Usuario)</span>
                <select
                  value={selectedLoginUserId}
                  onChange={(e) => setSelectedLoginUserId(e.target.value)}
                >
                  {db.usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_completo} — {ROLE_LABELS[u.rol]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Contraseña de acceso</span>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                />
              </label>

              <button type="submit" className="button button-primary auth-submit">
                Ingresar al Sistema de Habilitación
              </button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  // Filtrar módulos según permisos asignados al usuario
  const visibleModules = MODULES.filter(
    (m) =>
      currentUser.rol === 'superusuario' ||
      currentUser.modulos_permitidos.includes('*') ||
      currentUser.modulos_permitidos.includes(m.id) ||
      m.id === 'usuarios',
  )

  const currentModMeta =
    MODULES.find((m) => m.id === activeModule) || MODULES[0]

  const initials = currentUser.nombre_completo
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div className="app-shell">
      {/* BARRA LATERAL IDÉNTICA EN ESTILO A APP SARLAFT CON LOGO METRUM */}
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-top">
            <img className="brand-logo" src="/metrum-logo-blanco.png" alt="Metrum" />
            <span className="brand-title">HABILITACIÓN</span>
          </div>
          <small className="brand-subtitle">RES. 3100 DE 2019 · SOGCS</small>
        </div>

        <div className="workspace-switch" style={{ margin: '8px 4px 16px' }}>
          <div className="workspace-avatar">SUH</div>
          <div className="workspace-copy">
            <strong>Red Integral IPS Salud</strong>
            <span>{db.sedes.length - 1} Sedes + Sede NACIONAL</span>
          </div>
        </div>

        <div className="nav-label">MÓDULOS DEL SISTEMA DE CALIDAD</div>
        <nav className="sidebar-nav" style={{ overflowY: 'auto' }}>
          {visibleModules.map((mod) => {
            const Icon = mod.icon
            const isActive = activeModule === mod.id
            return (
              <button
                type="button"
                key={mod.id}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                onClick={() => setActiveModule(mod.id)}
              >
                <Icon size={16} />
                <span>{mod.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <div className="user-panel">
            <div className="user-avatar">{initials}</div>
            <div className="user-copy">
              <strong>{currentUser.nombre_completo}</strong>
              <span>{ROLE_LABELS[currentUser.rol]}</span>
            </div>
            <button
              type="button"
              className="icon-button user-more"
              title="Cerrar sesión / Cambiar usuario"
              onClick={() => setActiveUser(null)}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* PANEL PRINCIPAL */}
      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <strong>{currentModMeta.label}</strong>
          </div>

          <div className="topbar-actions">
            {/* Buscador transversal */}
            <div className="global-search-wrap">
              <label className="global-search">
                <Search size={14} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en el módulo..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="icon-button"
                    style={{ width: 20, height: 20 }}
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </label>
            </div>

            {/* Botón global para abrir el Panel Deslizable de Jarvis (Ctrl+K) */}
            <button
              type="button"
              className="button button-primary"
              onClick={() => setJarvisDrawerOpen(true)}
              title="Abrir Copiloto Operativo Jarvis (Ctrl+K)"
            >
              <Sparkles size={13} /> Jarvis IA
            </button>

            <div className="popover-wrap">
              <button
                type="button"
                className="icon-button"
                aria-label="Opciones y cuenta"
                title={`${currentUser.nombre_completo} (${currentUser.correo})`}
                onClick={() => setShowUserPopover((v) => !v)}
              >
                <Bell size={18} />
              </button>

              {showUserPopover && (
                <div className="popover profile-popover">
                  <strong>{currentUser.nombre_completo}</strong>
                  <span>{currentUser.correo}</span>
                  <span>{ROLE_LABELS[currentUser.rol]}</span>
                  <div className="popover-line" />
                  <small style={{ color: '#68778b', fontSize: 10, marginBottom: 4 }}>
                    Cambiar usuario:
                  </small>
                  {db.usuarios.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setActiveUser(u.id)
                        setShowUserPopover(false)
                      }}
                    >
                      <UsersRound size={12} /> {u.nombre_completo}
                    </button>
                  ))}
                  <div className="popover-line" />
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoDatabase()
                      setShowUserPopover(false)
                    }}
                  >
                    <RefreshCw size={13} /> Restaurar datos demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserPopover(false)
                      setActiveUser(null)
                    }}
                  >
                    <LogOut size={13} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          <div className="page-heading module-heading">
            <div>
              <h1>{currentModMeta.label}</h1>
              <p>{currentModMeta.subtitle}</p>
            </div>
          </div>

          {activeModule === 'dashboard' && (
            <DashboardOverview
              db={db}
              onNavigate={(modId) => setActiveModule(modId as ModuleId)}
            />
          )}
          {activeModule === 'administracion' && (
            <AdministracionModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'talento-humano' && (
            <TalentoHumanoModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'infraestructura' && (
            <InfraestructuraModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'equipos' && (
            <EquiposFijosModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'documentos' && (
            <InformacionDocumentadaModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'comites' && (
            <ComitesModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'cronograma' && (
            <WorkPlanModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'cambio' && (
            <GestionCambioModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'auditoria' && (
            <AuditoriaModule db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'cumplimiento' && (
            <Cumplimiento3100Module db={db} currentUser={currentUser} query={searchQuery} />
          )}
          {activeModule === 'jarvis' && (
            <JarvisWorkspaceDrawer
              db={db}
              currentUser={currentUser}
              activeModule={activeModule}
              isOpen={true}
              embeddedMode={true}
            />
          )}
          {activeModule === 'usuarios' && (
            <UserSedeAdminModule db={db} currentUser={currentUser} query={searchQuery} />
          )}

          <footer className="app-footer">
            <span>App HABILITACIÓN SUH · Resolución 3100 de 2019 · Sistema Obligatorio de Garantía de la Calidad (SOGCS)</span>
            <span>
              <ShieldCheck size={12} /> Conectado al Plan de Trabajo Institucional y Google Workspace (Jarvis)
            </span>
          </footer>
        </main>
      </div>

      <JarvisWorkspaceDrawer
        db={db}
        currentUser={currentUser}
        activeModule={currentModMeta.label}
        isOpen={jarvisDrawerOpen}
        onClose={() => setJarvisDrawerOpen(false)}
      />

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={15} />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
