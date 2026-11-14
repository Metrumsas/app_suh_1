import { useState } from 'react'
import {
  Building2,
  Clock3,
  Mail,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserRoundX,
  UsersRound,
  X,
} from 'lucide-react'
import type { AppUser, Sede, SuhDatabase, UserRole } from '../lib/types'
import { ROLE_LABELS, updateDb } from '../lib/store'
import { evaluateSedeHabilitacionStatus, formatDateES, todayISO } from '../lib/calculations'
import SedeGeoModal from './SedeGeoModal'

const STATUS_LABELS: Record<AppUser['estado'], string> = {
  activo: 'Activo',
  pendiente: 'Invitación pendiente',
  suspendido: 'Suspendido',
}

const STATUS_TONES: Record<AppUser['estado'], string> = {
  activo: 'plan-complete',
  pendiente: 'plan-month',
  suspendido: 'plan-overdue',
}

const ASSIGNABLE_ROLES: UserRole[] = [
  'lider_calidad',
  'auditor',
  'lider_infraestructura',
  'lider_talento_humano',
  'consulta',
]

const MODULE_OPTIONS = [
  { id: 'dashboard', label: 'Resumen general SOGCS' },
  { id: 'administracion', label: 'Administración y Financiera' },
  { id: 'talento-humano', label: 'Talento Humano (Capacidad)' },
  { id: 'infraestructura', label: 'Infraestructura' },
  { id: 'equipos', label: 'Equipos Fijos' },
  { id: 'documentos', label: 'Información Documentada' },
  { id: 'comites', label: 'Comités y Reuniones' },
  { id: 'cronograma', label: 'Plan de Trabajo' },
  { id: 'cambio', label: 'Gestión del Cambio (5 Porqués)' },
  { id: 'auditoria', label: 'Auditoría Interna y Externa' },
  { id: 'cumplimiento', label: 'Cumplimiento Res. 3100' },
]

export default function UserSedeAdminModule({
  db,
  currentUser,
  query,
}: {
  db: SuhDatabase
  currentUser: AppUser
  query: string
}) {
  const [tab, setTab] = useState<'usuarios' | 'sedes'>('usuarios')
  const [statusFilter, setStatusFilter] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSedeModal, setShowSedeModal] = useState(false)
  const [editingPermUser, setEditingPermUser] = useState<AppUser | null>(null)

  // Nuevo usuario form
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserCargo, setNewUserCargo] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('lider_calidad')
  const [newUserSede, setNewUserSede] = useState('TODAS')

  // Nueva sede form
  const [sedeNombre, setSedeNombre] = useState('')
  const [sedeReps, setSedeReps] = useState('')
  const [sedeCiudad, setSedeCiudad] = useState('')
  const [sedeDireccion, setSedeDireccion] = useState('')
  const [sedeTelefono, setSedeTelefono] = useState('')
  const [sedeDirector, setSedeDirector] = useState('')
  const [sedeArea, setSedeArea] = useState('400')
  const [sedeConsultorios, setSedeConsultorios] = useState('4')

  const isSuperUser = currentUser.rol === 'superusuario'

  const q = query.trim().toLowerCase()
  const filteredUsers = db.usuarios.filter(
    (u) =>
      (!statusFilter || u.estado === statusFilter) &&
      (!q ||
        `${u.nombre_completo} ${u.correo} ${u.cargo} ${ROLE_LABELS[u.rol]}`
          .toLowerCase()
          .includes(q)),
  )

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperUser) return
    if (!newUserName.trim() || !newUserEmail.trim()) return

    updateDb((draft) => {
      draft.usuarios.push({
        id: `usr-${Date.now()}`,
        nombre_completo: newUserName.trim(),
        correo: newUserEmail.trim().toLowerCase(),
        cargo: newUserCargo.trim() || 'Integrante Equipo de Calidad',
        rol: newUserRole,
        sede_asignada: newUserSede,
        estado: 'activo',
        bloqueado: false,
        invitado_en: new Date().toISOString(),
        ultimo_acceso: null,
        modulos_permitidos: ['*'],
      })
      return draft
    }, `Usuario ${newUserName.trim()} asignado exitosamente por el Súper Usuario.`)

    setNewUserName('')
    setNewUserEmail('')
    setNewUserCargo('')
    setShowInviteModal(false)
  }

  const handleCreateSede = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sedeNombre.trim() || !sedeCiudad.trim()) return

    updateDb((draft) => {
      const nueva: Sede = {
        id: `sede-${sedeCiudad.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-3)}`,
        codigo_reps: sedeReps.trim() || `REPS-${Date.now().toString().slice(-6)}`,
        nombre: sedeNombre.trim(),
        ciudad: sedeCiudad.trim(),
        direccion: sedeDireccion.trim() || 'Dirección principal registrada',
        telefono: sedeTelefono.trim() || '(601) 000 0000',
        director_responsable: sedeDirector.trim() || currentUser.nombre_completo,
        es_nacional: false,
        activa: true,
        descripcion_infraestructura: 'Sede habilitada e integrada al Sistema Obligatorio de Garantía de Calidad en Salud (Res. 3100 de 2019).',
        capacidad_instalada_resumen: `${sedeConsultorios} consultorios habilitados.`,
        area_m2: Number(sedeArea) || 400,
        pisos_niveles: 1,
        consultorios_totales: Number(sedeConsultorios) || 4,
        salas_procedimientos: 1,
        camas_camillas: 2,
        planos_archivos: [],
        fotos_sede: [],
      }
      draft.sedes.push(nueva)
      return draft
    }, `Sede "${sedeNombre.trim()}" creada y habilitada en todos los módulos.`)

    setSedeNombre('')
    setSedeReps('')
    setSedeCiudad('')
    setSedeDireccion('')
    setSedeTelefono('')
    setSedeDirector('')
    setShowSedeModal(false)
  }

  return (
    <div className="work-plan user-admin">
      <div className="plan-kpis">
        <article className="panel complaint-kpi">
          <div className="complaint-kpi-heading">
            <h2>Usuarios del Equipo de Calidad</h2>
            <span className="complaint-kpi-icon">
              <UsersRound size={19} />
            </span>
          </div>
          <strong>{db.usuarios.length}</strong>
          <p>
            1 Súper Usuario exclusivo · {db.usuarios.length - 1} integrantes asignados
          </p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-green">
          <div className="complaint-kpi-heading">
            <h2>Cuentas Activas</h2>
            <span className="complaint-kpi-icon">
              <UserCheck size={19} />
            </span>
          </div>
          <strong>{db.usuarios.filter((u) => u.estado === 'activo').length}</strong>
          <p>Usuarios con acceso habilitado a la plataforma SOGCS.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-amber">
          <div className="complaint-kpi-heading">
            <h2>Invitaciones Pendientes</h2>
            <span className="complaint-kpi-icon">
              <Clock3 size={19} />
            </span>
          </div>
          <strong>{db.usuarios.filter((u) => u.estado === 'pendiente').length}</strong>
          <p>Pendientes de primer ingreso o activación.</p>
        </article>

        <article className="panel complaint-kpi complaint-kpi-blue">
          <div className="complaint-kpi-heading">
            <h2>Sedes Configuradas</h2>
            <span className="complaint-kpi-icon">
              <Building2 size={19} />
            </span>
          </div>
          <strong>{db.sedes.length}</strong>
          <p>
            {db.sedes.filter((s) => !s.es_nacional).length} sedes operativas + 1 Sede NACIONAL transversal
          </p>
        </article>
      </div>

      <div className="plan-controls">
        <div className="view-toggle">
          <button
            type="button"
            className={tab === 'usuarios' ? 'view-selected' : ''}
            onClick={() => setTab('usuarios')}
          >
            Control de Usuarios (Exclusivo Súper Usuario)
          </button>
          <button
            type="button"
            className={tab === 'sedes' ? 'view-selected' : ''}
            onClick={() => setTab('sedes')}
          >
            Configuración de Sedes y Sede NACIONAL ({db.sedes.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'usuarios' ? (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrar estado de usuario"
              >
                <option value="">Todos los estados</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button button-primary"
                disabled={!isSuperUser}
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus size={15} /> Asignar nuevo usuario
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setShowSedeModal(true)}
            >
              <Plus size={15} /> Crear nueva Sede
            </button>
          )}
        </div>
      </div>

      {!isSuperUser && tab === 'usuarios' && (
        <div className="portal-error" role="alert">
          Solo el <strong>Súper Usuario</strong> tiene permisos para crear, modificar o suspender asignaciones de usuarios. Actualmente estás en modo de solo consulta en esta vista.
        </div>
      )}

      {tab === 'usuarios' ? (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <h2>Asignación y Control de Usuarios del Sistema de Garantía de Calidad</h2>
          </div>
          <p>
            La asignación de usuarios, roles, sedes y permisos de módulos está controlada exclusivamente por el único <strong>Súper Usuario</strong> institucional.
          </p>

          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Integrante / Correo</th>
                  <th>Rol en el SOGCS</th>
                  <th>Sede Asignada</th>
                  <th>Módulos Autorizados</th>
                  <th>Estado</th>
                  <th>Acciones (Súper Usuario)</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const locked = user.rol === 'superusuario'
                  const sedeObj = db.sedes.find((s) => s.id === user.sede_asignada)
                  return (
                    <tr key={user.id}>
                      <td data-label="Integrante">
                        <strong>{user.nombre_completo}</strong>
                        <br />
                        <span>{user.correo}</span>
                        <br />
                        <small style={{ color: '#68778b' }}>{user.cargo}</small>
                      </td>
                      <td data-label="Rol">
                        {locked ? (
                          <span className="plan-badge plan-future">
                            <ShieldCheck size={12} /> {ROLE_LABELS[user.rol]}
                          </span>
                        ) : (
                          <select
                            disabled={!isSuperUser}
                            value={user.rol}
                            onChange={(e) => {
                              const nextRole = e.target.value as UserRole
                              updateDb((draft) => {
                                const target = draft.usuarios.find((x) => x.id === user.id)
                                if (target) target.rol = nextRole
                                return draft
                              }, `Rol de ${user.nombre_completo} actualizado.`)
                            }}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td data-label="Sede Asignada">
                        {locked ? (
                          <strong>Todas las sedes + NACIONAL</strong>
                        ) : (
                          <select
                            disabled={!isSuperUser}
                            value={user.sede_asignada}
                            onChange={(e) => {
                              const nextSede = e.target.value
                              updateDb((draft) => {
                                const target = draft.usuarios.find((x) => x.id === user.id)
                                if (target) target.sede_asignada = nextSede
                                return draft
                              }, `Sede asignada actualizada para ${user.nombre_completo}.`)
                            }}
                          >
                            <option value="TODAS">Todas las sedes</option>
                            {db.sedes.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                        {sedeObj && <small style={{ display: 'block', color: '#68778b' }}>{sedeObj.ciudad}</small>}
                      </td>
                      <td data-label="Módulos">
                        {user.modulos_permitidos.includes('*') ? (
                          <span className="plan-badge plan-complete">Acceso Total (10 Módulos)</span>
                        ) : (
                          <span className="plan-badge plan-month">
                            {user.modulos_permitidos.length} módulos asignados
                          </span>
                        )}
                        {!locked && isSuperUser && (
                          <div style={{ marginTop: 6 }}>
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() => setEditingPermUser(user)}
                            >
                              Configurar módulos
                            </button>
                          </div>
                        )}
                      </td>
                      <td data-label="Estado">
                        <span className={`plan-badge ${STATUS_TONES[user.estado]}`}>
                          {STATUS_LABELS[user.estado]}
                        </span>
                      </td>
                      <td data-label="Acciones">
                        {locked ? (
                          <small>Cuenta Maestra Protegida</small>
                        ) : (
                          <div className="user-actions">
                            {user.estado === 'pendiente' && (
                              <button
                                type="button"
                                className="button button-secondary"
                                disabled={!isSuperUser}
                                onClick={() =>
                                  updateDb((draft) => {
                                    const t = draft.usuarios.find((x) => x.id === user.id)
                                    if (t) t.estado = 'activo'
                                    return draft
                                  }, `Usuario ${user.correo} activado.`)
                                }
                              >
                                <Mail size={13} /> Activar
                              </button>
                            )}
                            <button
                              type="button"
                              className="button button-secondary"
                              disabled={!isSuperUser}
                              onClick={() =>
                                updateDb((draft) => {
                                  const t = draft.usuarios.find((x) => x.id === user.id)
                                  if (t) {
                                    t.bloqueado = !t.bloqueado
                                    t.estado = t.bloqueado ? 'suspendido' : 'activo'
                                  }
                                  return draft
                                }, user.bloqueado ? 'Acceso reactivado.' : 'Usuario suspendido.')
                              }
                            >
                              {user.bloqueado ? (
                                <>
                                  <UserCheck size={13} /> Habilitar
                                </>
                              ) : (
                                <>
                                  <UserRoundX size={13} /> Suspender
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="button button-secondary button-danger"
                              disabled={!isSuperUser}
                              onClick={() =>
                                updateDb((draft) => {
                                  draft.usuarios = draft.usuarios.filter((x) => x.id !== user.id)
                                  return draft
                                }, `Usuario ${user.correo} eliminado.`)
                              }
                            >
                              <Trash2 size={13} /> Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="panel plan-table-panel">
          <div className="plan-controls">
            <h2>Sedes Habilitadas de la Institución (Pre-requisito Transversal Res. 3100)</h2>
          </div>
          <p>
            Las sedes creadas aquí habilitan la operación en Administración, Talento Humano, Infraestructura, Equipos Fijos, Auditorías y Cumplimiento. La sede <strong>NACIONAL</strong> aplica automáticamente a todas las sedes.
          </p>
          <div className="plan-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sede / Código REPS</th>
                  <th>Departamento, Municipio y Dirección</th>
                  <th>Inscripción / Vencimiento y Semáforo Habilitación</th>
                  <th>Área Construida</th>
                  <th>Capacidad Física Instalada</th>
                  <th>Director / Responsable</th>
                </tr>
              </thead>
              <tbody>
                {db.sedes.map((s) => {
                  const habStatus = evaluateSedeHabilitacionStatus(
                    s.fecha_vencimiento_habilitacion,
                    todayISO(),
                  )
                  return (
                  <tr key={s.id}>
                    <td data-label="Sede">
                      <strong>{s.nombre}</strong>
                      <br />
                      <small>REPS: {s.codigo_reps}</small>
                    </td>
                    <td data-label="Ubicación">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} />{' '}
                        {s.departamento ? `${s.municipio || s.ciudad}, ${s.departamento}` : s.ciudad}
                      </span>
                      <br />
                      <small>{s.direccion}</small>
                    </td>
                    <td data-label="Semáforo Habilitación">
                      {s.es_nacional ? (
                        <span className="plan-badge plan-future">Sede NACIONAL (Transversal)</span>
                      ) : (
                        <>
                          <span className={`plan-badge ${habStatus.badgeClass}`}>
                            {habStatus.label}
                          </span>
                          <br />
                          <small>
                            Inscripción: {formatDateES(s.fecha_inscripcion_reps || '2026-01-15')} · Vence:{' '}
                            <strong>{formatDateES(s.fecha_vencimiento_habilitacion)}</strong>
                          </small>
                        </>
                      )}
                    </td>
                    <td data-label="Área Construida">
                      <strong>{s.area_m2} m²</strong>
                    </td>
                    <td data-label="Capacidad">
                      {s.es_nacional ? (
                        'Criterios aplicables a todas las sedes'
                      ) : (
                        <>
                          {s.capacidad_instalada_resumen || `${s.consultorios_totales} consultorios · ${s.salas_procedimientos} salas`}
                        </>
                      )}
                    </td>
                    <td data-label="Responsable">
                      <strong>{s.director_responsable}</strong>
                      <br />
                      <small>{s.telefono}</small>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal para asignar nuevo usuario */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-icon">
                  <UserPlus size={18} />
                </span>
                <div>
                  <small>CONTROL EXCLUSIVO SÚPER USUARIO</small>
                  <h2>Asignar Usuario al Equipo de Calidad</h2>
                </div>
              </div>
              <button className="icon-button" onClick={() => setShowInviteModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <label className="form-field">
                <span>
                  Nombre completo <b>*</b>
                </span>
                <input
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Dra. Marcela Gómez"
                />
              </label>
              <label className="form-field">
                <span>
                  Correo institucional <b>*</b>
                </span>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="marcela.gomez@calidadips.co"
                />
              </label>
              <label className="form-field">
                <span>Cargo en la IPS</span>
                <input
                  value={newUserCargo}
                  onChange={(e) => setNewUserCargo(e.target.value)}
                  placeholder="Ej. Referente de Seguridad del Paciente"
                />
              </label>
              <label className="form-field">
                <span>Rol asignado</span>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)}>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Sede asignada</span>
                <select value={newUserSede} onChange={(e) => setNewUserSede(e.target.value)}>
                  <option value="TODAS">Todas las sedes</option>
                  {db.sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-footer">
                <button type="button" className="button button-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button button-primary">
                  Guardar y habilitar usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para configurar permisos por módulo */}
      {editingPermUser && (
        <div className="modal-backdrop" onClick={() => setEditingPermUser(null)}>
          <div className="create-modal" style={{ width: 'min(540px, 100%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-icon">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <small>PERMISOS POR MÓDULO</small>
                  <h2>{editingPermUser.nombre_completo}</h2>
                </div>
              </div>
              <button className="icon-button" onClick={() => setEditingPermUser(null)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#52617a', marginBottom: 12 }}>
              Selecciona los módulos a los que tendrá acceso este integrante:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label className="case-check" style={{ gridColumn: '1 / -1', padding: 8, background: '#eef4ff', borderRadius: 6 }}>
                <input
                  type="checkbox"
                  checked={editingPermUser.modulos_permitidos.includes('*')}
                  onChange={(e) => {
                    const all = e.target.checked
                    setEditingPermUser({
                      ...editingPermUser,
                      modulos_permitidos: all ? ['*'] : MODULE_OPTIONS.map((m) => m.id),
                    })
                  }}
                />
                <strong>Acceso Total a Todos los Módulos (*)</strong>
              </label>
              {!editingPermUser.modulos_permitidos.includes('*') &&
                MODULE_OPTIONS.map((m) => (
                  <label key={m.id} className="case-check" style={{ padding: 6, border: '1px solid #e2e8f0', borderRadius: 6 }}>
                    <input
                      type="checkbox"
                      checked={editingPermUser.modulos_permitidos.includes(m.id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...editingPermUser.modulos_permitidos, m.id]
                          : editingPermUser.modulos_permitidos.filter((x) => x !== m.id)
                        setEditingPermUser({ ...editingPermUser, modulos_permitidos: next })
                      }}
                    />
                    <span style={{ fontSize: 11.5 }}>{m.label}</span>
                  </label>
                ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="button button-secondary" onClick={() => setEditingPermUser(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  updateDb((draft) => {
                    const target = draft.usuarios.find((u) => u.id === editingPermUser.id)
                    if (target) target.modulos_permitidos = editingPermUser.modulos_permitidos
                    return draft
                  }, `Permisos actualizados para ${editingPermUser.nombre_completo}.`)
                  setEditingPermUser(null)
                }}
              >
                Guardar permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva Sede con Georreferenciación GPS y Mapa */}
      <SedeGeoModal
        db={db}
        currentUser={currentUser}
        isOpen={showSedeModal}
        onClose={() => setShowSedeModal(false)}
      />
    </div>
  )
}
