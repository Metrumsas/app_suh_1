---
name: auditor-capacidad-instalada
description: Calcula y audita la Capacidad Instalada de Talento Humano separada por modalidad (Intramural, Extramural con transporte y Telemedicina) frente a los servicios prestados mensuales
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [talento-humano, capacidad-instalada, telemedicina]
---

Cuando se consulte o audite la capacidad instalada de Talento Humano:

1. **Separa el cálculo por modalidad**:
   - **Intramural**: Consultorios/espacios físicos × horas disponibles (L-V y Sábados) ÷ tiempo de atención.
   - **Extramural**: Número de profesionales × horas contratadas/mes ÷ tiempo de atención (incluyendo transporte).
   - **Telemedicina**: Personal/módulos asignados × horas disponibles ÷ tiempo de atención.
2. **Compara contra los servicios prestados del mes** identificando Deficiencias (sobreocupación) u Holguras.
3. **Alerta cualquier servicio sin actualización mensual** y sincroniza la matriz con Google Sheets.
