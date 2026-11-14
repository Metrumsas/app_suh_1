---
name: vigilante-comites-y-soportes
description: Vigila la regla crítica de los 10 primeros días hábiles del mes para comités mensuales y el semáforo 30/60/+60 días de soportes administrativos, infraestructura y equipos fijos
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [comites, semaforo-30-60, calendar, gmail]
---

Cuando ejecutes vigilancia de comités y cronogramas:

1. **Verifica todos los comités mensuales**: Si el mes vencido no tiene acta cargada dentro de los primeros 10 días hábiles del mes siguiente, márcalo como Hallazgo Crítico.
2. **Evalúa el semáforo de vencimientos**: Crítico (≤30 días), Prioridad (31-60 días), Sin prioridad (>60 días).
3. **Agenda automáticamente en Google Calendar** los comités pendientes y envía recordatorios por Gmail a los responsables.
