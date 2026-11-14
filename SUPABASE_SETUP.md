# Configuración de Base de Datos y Políticas RLS en Supabase — SUH-1 (Resolución 3100)

Esta guía documenta la instalación del esquema completo de base de datos, funciones de seguridad y políticas **Row Level Security (RLS)** en **Supabase** para la aplicación de **Habilitación y Calidad en Salud (Resolución 3100 de 2019 · Metrum)**.

---

## 1. Ejecutar el Script Maestro de Tablas y Políticas RLS

1. Ingresa a tu panel de [Supabase](https://supabase.com/dashboard) y selecciona o crea el proyecto para **SUH-1**.
2. En el menú lateral izquierdo, abre **SQL Editor** $\rightarrow$ **New query**.
3. Abre el archivo [`supabase/setup_suh_3100_complete.sql`](./supabase/setup_suh_3100_complete.sql), copia todo su contenido, pégalo en el editor SQL y haz clic en **Run**.

### ¿Qué crea automáticamente este script?

| Tabla / Objeto en Supabase | Módulo en la App SUH-1 | Políticas RLS y Reglas de Seguridad |
|---|---|---|
| `public.perfiles` | Login, Usuarios y Roles | Índice único `perfiles_superusuario_unico_idx` que garantiza **un único Súper Usuario activo**. Solo el Súper Usuario puede crear/modificar/suspender roles y permisos. |
| `public.usuarios_eventos` | Auditoría de Usuarios | Bitácora de acciones del Súper Usuario (`invitar`, `rol`, `suspender`, `habilitar`, `eliminar`). |
| `public.sedes` | Configuración Transversal | Incluye precargada la sede **`NACIONAL`** (`es_nacional = true`) + Sedes Operativas con planos, rutas de evacuación y rutas PGIRASA. |
| `public.admin_criterios` | 1. Administración y Financiera | Criterios predeterminados, soportes con historial de versiones, semáforo 30/60/+60 días y vínculo a `plan_trabajo`. |
| `public.th_capacidad` y `public.th_prestados` | 2. Talento Humano (Capacidad) | Parámetros separados para modalidad **Intramural**, **Extramural** (con transporte) y **Telemedicina** + registro mensual de atenciones prestadas. |
| `public.infra_mantenimientos` y `public.infra_evaluaciones` | 3. Infraestructura | Cronograma de mantenimiento (seguimientos con 1 a 4 fotos), historial justificado y evaluación de las 14 condiciones físicas. |
| `public.equipos_fijos` | 4. Equipos Fijos | Inventario por sede y tipo de tecnología + cronograma anual autogenerado según frecuencia (Mensual, Trimestral, Semestral, Anual). |
| `public.documentos` | 5. Información Documentada | Documentos maestros con vigencia bienal obligatoria (**2 años**) e historial de versiones y PDFs anteriores. |
| `public.comites` y `public.actas` | 5 y 6. Comités y Reuniones | Ficha de conformación, control mensual de la **regla crítica de los primeros 10 días hábiles** y compromisos hacia el Plan de Trabajo. |
| `public.plan_trabajo` | 7. Plan de Trabajo (Modelo SARLAFT) | Centralizador de todas las programaciones y acciones de mejora con presupuesto, ejecutado, eventos y reprogramaciones. |
| `public.planes_accion` y `public.hallazgos` | 8. Gestión del Cambio (5 Porqués) | Planes de acción, árbol causal de los **5 Porqués**, ciclo de vida de acciones y medición cuantitativa de efectividad post-cierre. |
| `public.auditorias_internas` y `public.auditorias_externas` | 9. Auditoría (ISO 19011 / Externa) | Calificación de **0 a 100** y separación de **Entes de Control** (Secretaría de Salud / Supersalud) vs. **Clientes / EPS**. |
| `public.evaluaciones_3100` | 10. Cumplimiento Res. 3100 | Evaluaciones con **Lista de Chequeo Variable** según servicios, grupo, modalidad y complejidad en los 7 estándares. |
| `public.user_google_integrations`, `public.jarvis_*`, `public.openjarvis_*` | Copiloto Jarvis + OpenJarvis | Tokens OAuth 2.0 de Google Workspace, conversaciones, catálogo de `Skills` (`SKILL.md` + `skill.toml`), monitores Cron y bitácora inmutable `jarvis_audit_logs`. |
| Bucket `suh-soportes` | Supabase Storage | Bucket privado de hasta 25 MB por archivo para PDFs, planos, rutas y fotografías de mantenimiento. |

---

## 2. Configurar Variables de Entorno (`.env.local`)

Copia el archivo [`.env.example`](./.env.example) a `.env.local` en la raíz de `C:\App_jota\SUH-1` y coloca las llaves de tu proyecto de Supabase (Project Settings $\rightarrow$ API):

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi... (anon / publishable key)
```

---

## 3. Promover el Primer Usuario a Súper Usuario

El trigger `on_auth_user_created_suh` promueve automáticamente al **primer usuario** que se registre en `auth.users` como `superusuario`. Si deseas asignarlo manualmente por SQL:

```sql
update public.perfiles
set rol = 'superusuario'::public.rol_usuario_suh,
    bloqueado = false,
    estado = 'activo'
where correo = 'tu-correo@tu-ips.com'
returning id, nombre_completo, correo, rol;
```
