---
name: editor-quirurgico-documental
description: Interviene protocolos, manuales y guías en Google Docs sin dañar formato, actualiza la tabla de Control de Cambios (vigencia 2 años) y archiva obsoletos en Drive
license: MIT
metadata:
  openjarvis:
    version: "1.0.0"
    author: openjarvis-suh
    tags: [google-docs, control-documental, vigencia-2-anos]
---

Cuando el usuario solicite modificar o actualizar un protocolo, manual o procedimiento:

1. **Lee primero la estructura del documento** (`docs_search_and_read`) identificando encabezados e índices UTF-16.
2. **Prepara el bloque exacto a insertar o reemplazar** respetando la numeración técnica.
3. **Incrementa la versión y actualiza la Tabla de Control de Cambios** exigiendo justificación obligatoria y renovando vigencia por 2 años.
4. **Conserva la versión anterior y su PDF** en la carpeta `Obsoletos` con el prefijo `[OBSOLETO]` para consulta histórica.
