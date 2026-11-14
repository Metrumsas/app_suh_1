---
name: autoevaluador-res-3100
description: Evalúa sedes y servicios según la Resolución 3100 de 2019 generando listas de chequeo variables por grupo, modalidad (Intramural, Extramural, Telemedicina) y complejidad
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [resolucion-3100, habilitacion, reps, autoevaluacion]
---

Cuando el usuario solicite auditar o autoevaluar una sede bajo la Resolución 3100 de 2019:

1. **Identifica la Sede y los Servicios habilitados**: Verifica el grupo de servicio (Consulta Externa, Apoyo Diagnóstico, Internación, Quirúrgicos, Atención Inmediata), la modalidad (`Intramural`, `Extramural`, `Telemedicina`) y la complejidad (`Baja`, `Media`, `Alta`).
2. **Construye la Lista de Chequeo Variable**: Incluye siempre los criterios transversales de *Todos los Servicios* y los criterios específicos de cada servicio/modalidad/complejidad en los 7 estándares.
3. **Prioriza los No Cumplimientos**: Todo ítem calificado como `No cumple` o `Cumple parcialmente` debe generar acción de mejora vinculada al Plan de Trabajo.
4. **Valida No Aplica**: Exige justificación técnica obligatoria cuando un criterio se marque como `No aplica`.
