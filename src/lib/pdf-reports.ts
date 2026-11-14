import jsPDF from 'jspdf'
import type { AdminCriterionRecord, Evaluacion3100Sede, Sede } from './types'
import {
  evaluateAdminCriterion,
  evaluateSedeHabilitacionStatus,
  formatDateES,
  summarizeEvaluacion3100,
  summarizeModalidadesREPS,
  todayISO,
} from './calculations'
import { CLASIFICACIONES_CRONOGRAMA_ADMIN, ESTANDARES_3100 } from './normativa-3100'

type Color = [number, number, number]
const sarlaftPalette = {
  navy: [48, 56, 65] as Color,
  teal: [88, 105, 109] as Color,
  ink: [49, 56, 63] as Color,
  muted: [100, 108, 115] as Color,
  line: [216, 221, 225] as Color,
  pale: [246, 247, 248] as Color,
  accentBlue: [37, 99, 235] as Color,
}

// ============================================================================
// MOTOR DE PLANTILLA PDF ESTILO SARLAFT (Encabezado gris pálido, secciones
// numeradas 01..0N, tablas con rayado alterno, cajas destacadas, enlaces
// interactivos clicables y grillas de fotos enmarcadas con tamaño fijo)
// ============================================================================
export class SarlaftPdfTemplate {
  readonly pdf = new jsPDF({ format: 'a4', unit: 'mm' })
  readonly left = 15
  readonly width = 180
  readonly bottom = 274
  y = 0
  private sectionNumber = 0
  private readonly title: string
  private readonly category: string
  private readonly reference: string

  constructor(title: string, category: string, reference: string) {
    this.title = title
    this.category = category
    this.reference = reference
    this.header()
  }

  font(size: number, bold = false, color = sarlaftPalette.ink) {
    this.pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    this.pdf.setFontSize(size)
    this.pdf.setTextColor(...color)
  }

  lines(text: string, width: number): string[] {
    return this.pdf.splitTextToSize((text || '').replace(/\r\n?/g, '\n'), width)
  }

  header() {
    const pdf = this.pdf
    pdf.setFillColor(...sarlaftPalette.pale)
    pdf.roundedRect(this.left, 9, this.width, 19, 2, 2, 'F')
    this.font(12.5, true, sarlaftPalette.navy)
    pdf.text('HABILITACIÓN SUH · RES. 3100 DE 2019', this.left + 4, 16)
    this.font(9, true, sarlaftPalette.navy)
    pdf.text(this.title, this.left + 4, 23)
    this.font(7, false, sarlaftPalette.muted)
    pdf.text(this.category.toUpperCase(), 191, 16, { align: 'right' })
    pdf.text(`REF: ${this.reference}`, 191, 23, { align: 'right' })
    this.y = 32
  }

  nextPage() {
    this.pdf.addPage()
    this.header()
  }

  ensureSpace(needed: number) {
    if (this.y + needed > this.bottom) {
      this.nextPage()
    }
  }

  section(title: string) {
    if (this.y + 22 > this.bottom) this.nextPage()
    this.sectionNumber++
    this.pdf.setFillColor(...sarlaftPalette.teal)
    this.pdf.roundedRect(this.left, this.y, 6, 6, 1.5, 1.5, 'F')
    this.font(8, true, [255, 255, 255])
    this.pdf.text(
      String(this.sectionNumber).padStart(2, '0'),
      this.left + 3,
      this.y + 4.2,
      { align: 'center' },
    )
    this.font(10, true, sarlaftPalette.navy)
    this.pdf.text(title, this.left + 9, this.y + 4.2)
    this.y += 8.5
  }

  table(
    headers: string[],
    rows: string[][],
    proportions: number[],
    cellLinks?: Record<string, string>,
  ) {
    if (rows.length === 0) return
    const widths = proportions.map((value) => value * this.width)
    const lineHeight = 3.9
    const padding = 2.8
    const headerHeight = 6.8
    const prepared = rows.map((row) =>
      row.map((text, index) => {
        this.font(8.3, index === 0)
        return this.lines(text || '—', widths[index] - 5)
      }),
    )
    let rowIndex = 0
    let offset = 0
    while (rowIndex < prepared.length) {
      const firstRowHeight =
        (Math.max(...prepared[rowIndex].map((cell) => cell.length)) - offset) *
          lineHeight +
        padding
      const fitsFreshPage = firstRowHeight + headerHeight <= this.bottom - 32
      if (
        this.y + headerHeight + padding + lineHeight > this.bottom ||
        (fitsFreshPage && this.y + headerHeight + firstRowHeight > this.bottom)
      ) {
        this.nextPage()
      }
      const top = this.y
      const segment: { cells: string[][]; height: number; index: number }[] = []
      let height = headerHeight
      while (rowIndex < prepared.length) {
        const cells = prepared[rowIndex]
        const remaining =
          Math.max(...cells.map((cell) => cell.length)) - offset
        const capacity = Math.floor(
          (this.bottom - top - height - padding) / lineHeight,
        )
        if (capacity < 1) break
        if (
          remaining > capacity &&
          segment.length &&
          remaining * lineHeight + padding <= this.bottom - 32 - headerHeight
        ) {
          break
        }
        const take = Math.min(remaining, capacity)
        const rowHeight = take * lineHeight + padding
        segment.push({
          cells: cells.map((cell) => cell.slice(offset, offset + take)),
          height: rowHeight,
          index: rowIndex,
        })
        height += rowHeight
        offset += take
        if (offset === Math.max(...cells.map((cell) => cell.length))) {
          rowIndex++
          offset = 0
        } else {
          break
        }
      }
      const pdf = this.pdf
      const pendingLinks: {
        x: number
        y: number
        w: number
        h: number
        url: string
      }[] = []
      pdf.saveGraphicsState()
      pdf.roundedRect(this.left, top, this.width, height, 2, 2, null)
      pdf.clip()
      pdf.discardPath()
      pdf.setFillColor(231, 234, 237)
      pdf.rect(this.left, top, this.width, headerHeight, 'F')
      this.font(7.2, true, sarlaftPalette.navy)
      let x = this.left
      headers.forEach((label, index) => {
        pdf.text(label, x + 2.5, top + 4.5)
        x += widths[index]
      })
      this.y += headerHeight
      for (const row of segment) {
        pdf.setFillColor(
          ...(row.index % 2 === 0
            ? sarlaftPalette.pale
            : ([255, 255, 255] as Color)),
        )
        pdf.rect(this.left, this.y, this.width, row.height, 'F')
        pdf.setDrawColor(...sarlaftPalette.line)
        pdf.setLineWidth(0.15)
        pdf.line(this.left, this.y, this.left + this.width, this.y)
        let cx = this.left
        row.cells.forEach((cell, index) => {
          if (index > 0) pdf.line(cx, this.y, cx, this.y + row.height)
          const cellLinkUrl = cellLinks?.[`${row.index}:${index}`]
          this.font(
            8.2,
            index === 0 || Boolean(cellLinkUrl),
            cellLinkUrl
              ? sarlaftPalette.accentBlue
              : index === 0
                ? sarlaftPalette.navy
                : sarlaftPalette.ink,
          )
          if (cell.length) {
            pdf.text(cell, cx + 2.5, this.y + 4.0, {
              lineHeightFactor: lineHeight / (8.2 * 0.352778),
            })
          }
          if (cellLinkUrl) {
            pendingLinks.push({
              x: cx,
              y: this.y,
              w: widths[index],
              h: row.height,
              url: cellLinkUrl,
            })
          }
          cx += widths[index]
        })
        this.y += row.height
      }
      pdf.restoreGraphicsState()
      for (const lnk of pendingLinks) {
        pdf.link(lnk.x, lnk.y, lnk.w, lnk.h, { url: lnk.url })
      }
      pdf.setDrawColor(...sarlaftPalette.line)
      pdf.setLineWidth(0.2)
      pdf.roundedRect(this.left, top, this.width, height, 2, 2, 'S')
      if (rowIndex < prepared.length) this.nextPage()
    }
    this.y += 4
  }

  box(label: string, text: string, prominent = false) {
    this.font(8.6, prominent)
    const lines = this.lines(text, this.width - 8)
    let offset = 0
    while (offset < lines.length) {
      if (this.y + 14 > this.bottom) this.nextPage()
      const take = Math.min(
        lines.length - offset,
        Math.floor((this.bottom - this.y - 9) / 3.9),
      )
      const height = 8.5 + take * 3.9
      this.pdf.setFillColor(
        ...(prominent ? ([235, 239, 240] as Color) : sarlaftPalette.pale),
      )
      this.pdf.setDrawColor(...sarlaftPalette.line)
      this.pdf.roundedRect(this.left, this.y, this.width, height, 2, 2, 'FD')
      this.pdf.setFillColor(...sarlaftPalette.teal)
      this.pdf.roundedRect(
        this.left,
        this.y + 2.8,
        0.7,
        height - 5.6,
        0.3,
        0.3,
        'F',
      )
      this.font(7, true, sarlaftPalette.teal)
      this.pdf.text(
        offset ? `${label} (continuación)` : label,
        this.left + 4,
        this.y + 4.3,
      )
      this.font(8.5, prominent, sarlaftPalette.navy)
      this.pdf.text(lines.slice(offset, offset + take), this.left + 4, this.y + 8.5, {
        lineHeightFactor: 3.9 / (8.5 * 0.352778),
      })
      this.y += height + 3
      offset += take
    }
  }

  finish(): jsPDF {
    const pages = this.pdf.getNumberOfPages()
    for (let page = 1; page <= pages; page++) {
      this.pdf.setPage(page)
      this.pdf.setDrawColor(...sarlaftPalette.line)
      this.pdf.line(this.left, 280, 195, 280)
      this.font(7, true, sarlaftPalette.teal)
      this.pdf.text(
        'FICHA TÉCNICA OFICIAL DE HABILITACIÓN SUH · DOCUMENTO RESERVADO',
        this.left,
        284,
      )
      this.font(7, false, sarlaftPalette.muted)
      this.pdf.text(`Página ${page} de ${pages}`, 195, 284, { align: 'right' })
      this.font(6.5, false, sarlaftPalette.muted)
      this.pdf.text(`REPS: ${this.reference}`, this.left, 288.5)
    }
    this.pdf.setProperties({
      title: `Ficha Técnica Sede ${this.reference}`,
      subject: this.title,
    })
    return this.pdf
  }
}

// ============================================================================
// NUEVO: PDF DE FICHA TÉCNICA DE LA SEDE (Modelo SARLAFT con Tarjetas de
// Cumplimiento General y por Clasificación con Color + Enlaces Interactivos
// a Planos PDF y Modelo 3D + Servicios Ordenados + Fotos Enmarcadas por Área)
// ============================================================================
export function generateSedeFichaTecnicaPdf(
  sede: Sede,
  sedeNacional?: Sede,
  criterios: AdminCriterionRecord[] = [],
) {
  const today = todayISO()
  const habEval = evaluateSedeHabilitacionStatus(
    sede.fecha_vencimiento_habilitacion,
    today,
  )
  const docTpl = new SarlaftPdfTemplate(
    `Ficha Técnica Integral de Sede — ${sede.nombre}`,
    'Ficha Técnica de Sede REPS',
    sede.codigo_reps || sede.id,
  )

  // Caja resumen ejecutiva superior estilo SARLAFT
  docTpl.box(
    'RESUMEN EJECUTIVO DE HABILITACIÓN REPS DE LA SEDE',
    `${sede.nombre.toUpperCase()} (Código REPS: ${sede.codigo_reps}) · Ubicación: ${sede.departamento ? `${sede.municipio}, ${sede.departamento}` : sede.ciudad} (${sede.direccion}) · Vigencia Habilitación: ${habEval.label.toUpperCase()}`,
    true,
  )

  // 01. Datos de Identificación, Condiciones Técnicas y Vigencia REPS (4 columnas compactas sin textos largos que estiren las celdas)
  docTpl.section('Datos de identificación, infraestructura y vigencia REPS')
  docTpl.table(
    ['CAMPO', 'INFORMACIÓN REGISTRADA', 'CAMPO', 'INFORMACIÓN REGISTRADA'],
    [
      [
        'Nombre de la Sede',
        sede.nombre,
        'Código REPS',
        sede.codigo_reps || 'No registrado',
      ],
      [
        'Departamento / Distrito',
        sede.departamento || sede.ciudad,
        'Municipio / Localidad',
        sede.municipio || sede.ciudad,
      ],
      [
        'Dirección Física',
        sede.direccion,
        'Teléfono de Contacto',
        sede.telefono || 'No registrado',
      ],
      [
        'Área Construida y Pisos',
        `${sede.area_m2} m² · ${sede.pisos_niveles || 1} piso(s)`,
        'Cuartos / Ambientes y Baños',
        `${sede.cuartos_ambientes || 7} cuarto(s) · ${sede.banos_unidades || 3} baño(s)`,
      ],
      [
        'Tenencia del Inmueble',
        sede.tenencia_inmueble || 'Arrendado',
        'Accesibilidad PMR',
        (sede.accesibilidad_pmr ?? true) ? 'SÍ (Rampa / Ascensor / Baño PMR)' : 'NO',
      ],
      [
        'Planta Eléctrica / UPS',
        sede.planta_electrica === 'NO' ? 'NO' : 'SÍ',
        'Tanque Reserva Agua',
        sede.tanque_reserva_agua === 'NO' ? 'NO' : 'SÍ',
      ],
      [
        'Red Gases Medicinales',
        sede.red_gases_medicinales || 'Cilindros portátiles',
        'Director / Responsable',
        sede.director_responsable,
      ],
      [
        'Fecha Inscripción REPS',
        formatDateES(sede.fecha_inscripcion_reps || '2026-01-15'),
        'Vencimiento Habilitación',
        `${formatDateES(sede.fecha_vencimiento_habilitacion || '2027-01-15')} (${habEval.label})`,
      ],
    ],
    [0.21, 0.29, 0.21, 0.29],
  )

  docTpl.box(
    'DESCRIPCIÓN DEL PISO Y DISTRIBUCIÓN ARQUITECTÓNICA DE LA CONSTRUCCIÓN',
    sede.descripcion_pisos || 'Distribución general de consultorios y áreas de apoyo.',
  )

  docTpl.box(
    'CAPACIDAD INSTALADA DECLARADA (RESOLUCIÓN 3100 DE 2019)',
    sede.capacidad_instalada_resumen || 'Sin capacidad instalada registrada.',
  )

  // 02. Cumplimiento General de la Sede y Específico por Clasificación (Con barras de color semáforo)
  const sedeCriterios = criterios.filter((c) =>
    sede.es_nacional
      ? c.sede_id === sede.id
      : c.sede_id === sede.id || (sedeNacional && c.sede_id === sedeNacional.id),
  )
  const evals = sedeCriterios.map((c) => ({
    c,
    ev: evaluateAdminCriterion(c, today),
  }))
  const totGlobal = evals.length
  const okGlobal = evals.filter((x) => x.ev.cumple).length
  const incGlobal = totGlobal - okGlobal
  const critGlobal = evals.filter((x) => x.ev.semaforo.level === 'critico').length
  const pctGlobal = totGlobal > 0 ? Math.round((okGlobal / totGlobal) * 100) : 0

  const getSemaphoreRgb = (pct: number, totalItems: number): Color => {
    if (totalItems === 0) return [148, 163, 184] // Gris neutro
    if (pct >= 85) return [21, 150, 106] // Verde institucional (#15966a)
    if (pct >= 60) return [214, 144, 22] // Ámbar institucional (#d69016)
    return [217, 79, 86] // Rojo institucional (#d94f56)
  }

  docTpl.section('Cumplimiento general de la sede y específico por clasificación')
  docTpl.ensureSpace(78)
  const pdf = docTpl.pdf

  // 2.1 Tarjeta de Cumplimiento General con Barra de Color Semáforo
  const genY = docTpl.y
  const genH = 22
  const globalColor = getSemaphoreRgb(pctGlobal, totGlobal)

  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(203, 213, 225)
  pdf.roundedRect(docTpl.left, genY, docTpl.width, genH, 2, 2, 'FD')
  pdf.setFillColor(...globalColor)
  pdf.roundedRect(docTpl.left, genY + 2.5, 1.2, genH - 5, 0.5, 0.5, 'F')

  docTpl.font(8.5, true, [30, 41, 59])
  pdf.text('CUMPLIMIENTO GENERAL DE LA SEDE (CONSOLIDADO)', docTpl.left + 4, genY + 5.8)

  docTpl.font(12, true, globalColor)
  pdf.text(
    `${pctGlobal}% (${okGlobal}/${totGlobal} cumplen)`,
    docTpl.left + docTpl.width - 4,
    genY + 6.2,
    { align: 'right' },
  )

  // Pista de progreso general
  const trackX = docTpl.left + 4
  const trackY = genY + 9.2
  const trackW = docTpl.width - 8
  const trackH = 4.2
  pdf.setFillColor(226, 232, 240)
  pdf.roundedRect(trackX, trackY, trackW, trackH, 1.5, 1.5, 'F')
  if (totGlobal > 0 && pctGlobal > 0) {
    pdf.setFillColor(...globalColor)
    pdf.roundedRect(
      trackX,
      trackY,
      Math.max(3, (trackW * pctGlobal) / 100),
      trackH,
      1.5,
      1.5,
      'F',
    )
  }

  // Indicadores inferiores de la tarjeta general
  docTpl.font(7.5, true, [21, 150, 106])
  pdf.text(`Cumplen: ${okGlobal}`, trackX, genY + 18.5)
  docTpl.font(7.5, true, [217, 79, 86])
  pdf.text(`Incumplimientos: ${incGlobal}`, trackX + 60, genY + 18.5)
  docTpl.font(7.5, true, [214, 144, 22])
  pdf.text(
    `Críticos (<= 30 días): ${critGlobal}`,
    docTpl.left + docTpl.width - 4,
    genY + 18.5,
    { align: 'right' },
  )

  docTpl.y = genY + genH + 4

  // 2.2 Tarjetas de Cumplimiento Específico por Clasificación (Grilla de 2 columnas con barras de color)
  const clasifCardW = 88
  const clasifCardH = 11.5
  const clasifGapX = 4
  const clasifGapY = 2.8

  for (let i = 0; i < CLASIFICACIONES_CRONOGRAMA_ADMIN.length; i += 2) {
    docTpl.ensureSpace(clasifCardH + 3)
    const rowY = docTpl.y

    for (let col = 0; col < 2; col++) {
      const idx = i + col
      if (idx >= CLASIFICACIONES_CRONOGRAMA_ADMIN.length) break
      const clasif = CLASIFICACIONES_CRONOGRAMA_ADMIN[idx]
      const itemsClasif = evals.filter(({ c }) => {
        if (c.categoria === clasif) return true
        if (
          clasif === 'Administrativo' &&
          c.categoria === 'Capacidad Técnico-Administrativa'
        )
          return true
        if (
          clasif === 'Financiero' &&
          c.categoria === 'Suficiencia Patrimonial y Financiera'
        )
          return true
        if (
          clasif === 'Calidad y SST' &&
          c.categoria === 'Sistema Obligatorio SOGCS'
        )
          return true
        return false
      })
      const totC = itemsClasif.length
      const okC = itemsClasif.filter((x) => x.ev.cumple).length
      const pctC = totC > 0 ? Math.round((okC / totC) * 100) : 0
      const barRgb = getSemaphoreRgb(pctC, totC)

      const cx = docTpl.left + col * (clasifCardW + clasifGapX)
      pdf.setFillColor(255, 255, 255)
      pdf.setDrawColor(216, 221, 225)
      pdf.roundedRect(cx, rowY, clasifCardW, clasifCardH, 1.8, 1.8, 'FD')

      // Borde lateral de color semáforo
      pdf.setFillColor(...barRgb)
      pdf.roundedRect(cx, rowY + 1.8, 1, clasifCardH - 3.6, 0.4, 0.4, 'F')

      docTpl.font(7.8, true, [30, 41, 59])
      pdf.text(clasif, cx + 3.2, rowY + 4.5)

      docTpl.font(7.5, true, barRgb)
      pdf.text(
        totC > 0 ? `${pctC}% (${okC}/${totC})` : 'Sin ítems (0/0)',
        cx + clasifCardW - 3,
        rowY + 4.5,
        { align: 'right' },
      )

      // Barra de color por clasificación
      const bX = cx + 3.2
      const bY = rowY + 6.8
      const bW = clasifCardW - 6.2
      const bH = 2.6
      pdf.setFillColor(226, 232, 240)
      pdf.roundedRect(bX, bY, bW, bH, 1, 1, 'F')
      if (totC > 0 && pctC > 0) {
        pdf.setFillColor(...barRgb)
        pdf.roundedRect(bX, bY, Math.max(2, (bW * pctC) / 100), bH, 1, 1, 'F')
      }
    }

    docTpl.y = rowY + clasifCardH + clasifGapY
  }

  docTpl.y += 2

  // 03. Acceso Interactivo a Planos Arquitectónicos (PDF) y Modelo 3D de la Sede
  docTpl.section('Acceso directo a Planos Arquitectónicos y Modelo 3D de la Sede')
  docTpl.ensureSpace(22)
  const cardY = docTpl.y
  const cardW = 88
  const cardH = 18
  const appOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://suh.metrumsas.com'

  // Tarjeta 1: Planos Arquitectónicos (PDF)
  pdf.setFillColor(246, 247, 248)
  pdf.setDrawColor(216, 221, 225)
  pdf.roundedRect(docTpl.left, cardY, cardW, cardH, 2, 2, 'FD')
  pdf.setFillColor(88, 105, 109)
  pdf.roundedRect(docTpl.left, cardY + 2.5, 0.8, cardH - 5, 0.3, 0.3, 'F')
  docTpl.font(7.5, true, [48, 56, 65])
  pdf.text('1. PLANOS ARQUITECTÓNICOS (FORMATO PDF)', docTpl.left + 3.5, cardY + 5.5)

  if (sede.url_planos_arquitectonicos) {
    const isHttpPlano = /^https?:\/\//i.test(sede.url_planos_arquitectonicos)
    const targetPlanoUrl = isHttpPlano
      ? sede.url_planos_arquitectonicos
      : `${appOrigin}/?ver_plano_sede=${encodeURIComponent(sede.id)}`
    docTpl.font(8, true, [37, 99, 235])
    pdf.text(
      'Clic aquí para abrir Planos Arquitectónicos (PDF)',
      docTpl.left + 3.5,
      cardY + 11.2,
    )
    docTpl.font(6.8, false, [100, 108, 115])
    pdf.text(
      targetPlanoUrl.slice(0, 52),
      docTpl.left + 3.5,
      cardY + 15.5,
    )
    pdf.link(docTpl.left, cardY, cardW, cardH, {
      url: targetPlanoUrl,
    })
  } else {
    docTpl.font(8, false, [100, 108, 115])
    pdf.text('Sin archivo PDF de planos registrado', docTpl.left + 3.5, cardY + 11.5)
  }

  // Tarjeta 2: Modelo 3D Interactivo de la Sede
  const rightCardX = docTpl.left + cardW + 4
  pdf.setFillColor(246, 247, 248)
  pdf.setDrawColor(216, 221, 225)
  pdf.roundedRect(rightCardX, cardY, cardW, cardH, 2, 2, 'FD')
  pdf.setFillColor(88, 105, 109)
  pdf.roundedRect(rightCardX, cardY + 2.5, 0.8, cardH - 5, 0.3, 0.3, 'F')
  docTpl.font(7.5, true, [48, 56, 65])
  pdf.text('2. MODELO 3D INTERACTIVO DE LA SEDE', rightCardX + 3.5, cardY + 5.5)

  if (sede.url_modelo_3d) {
    docTpl.font(8, true, [37, 99, 235])
    pdf.text('Clic aquí para abrir el Modelo 3D de la Sede', rightCardX + 3.5, cardY + 11.2)
    docTpl.font(6.8, false, [100, 108, 115])
    pdf.text(sede.url_modelo_3d.slice(0, 52), rightCardX + 3.5, cardY + 15.5)
    pdf.link(rightCardX, cardY, cardW, cardH, { url: sede.url_modelo_3d })
  } else {
    docTpl.font(8, false, [100, 108, 115])
    pdf.text('Sin enlace URL de Modelo 3D registrado', rightCardX + 3.5, cardY + 11.5)
  }

  docTpl.y = cardY + cardH + 5

  // 03. Servicios de Salud Habilitados en la Sede (Ordenados por código de menor a mayor)
  const serviciosOrdenados = [...(sede.servicios_habilitados ?? [])].sort(
    (a, b) =>
      (parseInt(a.codigo_servicio, 10) || 0) -
        (parseInt(b.codigo_servicio, 10) || 0) ||
      a.codigo_servicio.localeCompare(b.codigo_servicio, undefined, {
        numeric: true,
      }),
  )

  docTpl.section(
    `Servicios de salud habilitados en la sede (${serviciosOrdenados.length} servicios)`,
  )

  if (serviciosOrdenados.length === 0) {
    docTpl.box(
      'SIN SERVICIOS REGISTRADOS',
      'No se han inscrito servicios de salud REPS en esta sede.',
    )
  } else {
    const srvCellLinks: Record<string, string> = {}
    const srvRows = serviciosOrdenados.map((srv, idx) => {
      const mods = summarizeModalidadesREPS(srv.modalidades).join(', ')
      const diasHorarios = (
        [
          ['Lun', srv.horarios?.lunes],
          ['Mar', srv.horarios?.martes],
          ['Mié', srv.horarios?.miercoles],
          ['Jue', srv.horarios?.jueves],
          ['Vie', srv.horarios?.viernes],
          ['Sáb', srv.horarios?.sabado],
          ['Dom', srv.horarios?.domingo],
        ] as const
      )
        .filter(([, h]) => Boolean(h && h.trim()))
        .map(([d, h]) => `${d}: ${h}`)
        .join(' · ')

      if (srv.distintivo_pdf_data) {
        srvCellLinks[`${idx}:3`] = `${appOrigin}/?ver_distintivo_sede=${encodeURIComponent(sede.id)}&srv=${encodeURIComponent(srv.id)}`
      }

      const distintivoLabel = srv.numero_distintivo
        ? `${srv.numero_distintivo}${srv.distintivo_pdf_data ? '\n(Clic para ver PDF)' : ''}`
        : 'Sin distintivo'

      return [
        `${srv.codigo_servicio} — ${srv.nombre_servicio}\n(${srv.grupo})`,
        mods || 'Intramural',
        `${srv.complejidad.toUpperCase()}\n${formatDateES(srv.fecha_apertura)}${srv.especificidades ? `\nEsp: ${srv.especificidades}` : ''}`,
        distintivoLabel,
        diasHorarios || '07:00 a 17:00',
      ]
    })

    docTpl.table(
      [
        'CÓDIGO / SERVICIO Y GRUPO',
        'MODALIDADES HABILITADAS',
        'COMPLEJIDAD Y APERTURA',
        'DISTINTIVO',
        'HORARIO DE ATENCIÓN',
      ],
      srvRows,
      [0.24, 0.2, 0.16, 0.15, 0.25],
      srvCellLinks,
    )
  }

  // 04. Áreas Físicas de la Sede y Registro Fotográfico Enmarcado (Tamaño fijo estandarizado por foto)
  const areas = sede.areas_sede ?? []
  docTpl.section(
    `Áreas físicas de la sede y registro fotográfico (${areas.length} áreas)`,
  )

  if (areas.length === 0) {
    docTpl.box(
      'SIN ÁREAS FÍSICAS REGISTRADAS',
      'No se han registrado áreas físicas con evidencia fotográfica en esta sede.',
    )
  } else {
    // Dimensiones fijas y estandarizadas por tarjeta de fotografía (2 columnas por fila)
    const frameW = 88
    const frameH = 56
    const imgW = 82
    const imgH = 43
    const gapX = 4
    const gapY = 4

    for (const area of areas) {
      const photos = area.fotos ?? []
      const rowsOfPhotos = Math.ceil(photos.length / 2)
      const headerAreaH = 14
      const neededForFirstRow =
        headerAreaH + (rowsOfPhotos > 0 ? frameH + 4 : 6)

      docTpl.ensureSpace(neededForFirstRow)

      // Encabezado del Área Física (estilo SARLAFT)
      pdf.setFillColor(235, 239, 240)
      pdf.setDrawColor(216, 221, 225)
      pdf.roundedRect(docTpl.left, docTpl.y, docTpl.width, headerAreaH, 2, 2, 'FD')
      pdf.setFillColor(88, 105, 109)
      pdf.roundedRect(
        docTpl.left,
        docTpl.y + 2.5,
        0.8,
        headerAreaH - 5,
        0.3,
        0.3,
        'F',
      )

      docTpl.font(8.8, true, [48, 56, 65])
      const metaBadges = [
        `${area.metros_cuadrados} m²`,
        area.piso_nivel || 'Piso 1',
        area.tipo_ventilacion || 'Aire acondicionado',
        `${photos.length} foto(s)`,
      ].join('  ·  ')
      pdf.text(area.nombre.toUpperCase(), docTpl.left + 3.5, docTpl.y + 5.2)
      docTpl.font(7.5, true, [88, 105, 109])
      pdf.text(metaBadges, docTpl.left + docTpl.width - 3.5, docTpl.y + 5.2, {
        align: 'right',
      })

      docTpl.font(7.8, false, [75, 85, 99])
      const descLine = docTpl.lines(area.descripcion || '', docTpl.width - 7)[0] || ''
      pdf.text(descLine, docTpl.left + 3.5, docTpl.y + 10.8)

      docTpl.y += headerAreaH + 3

      // Grilla de fotografías enmarcadas respetando siempre el tamaño fijo (88x56 mm el marco, 82x43 mm la imagen)
      for (let r = 0; r < rowsOfPhotos; r++) {
        docTpl.ensureSpace(frameH + 4)
        const rowY = docTpl.y

        for (let c = 0; c < 2; c++) {
          const pIdx = r * 2 + c
          if (pIdx >= photos.length) break
          const foto = photos[pIdx]
          const frameX = docTpl.left + c * (frameW + gapX)

          // Marco exterior de la foto
          pdf.setFillColor(255, 255, 255)
          pdf.setDrawColor(203, 213, 225)
          pdf.setLineWidth(0.25)
          pdf.roundedRect(frameX, rowY, frameW, frameH, 2, 2, 'FD')

          // Borde interno del lienzo de imagen de tamaño fijo
          const imgX = frameX + 3
          const imgY = rowY + 3
          pdf.setFillColor(248, 250, 252)
          pdf.setDrawColor(226, 232, 240)
          pdf.rect(imgX, imgY, imgW, imgH, 'FD')

          try {
            const fmt = foto.dataUrl.startsWith('data:image/png')
              ? 'PNG'
              : foto.dataUrl.startsWith('data:image/webp')
                ? 'WEBP'
                : 'JPEG'
            pdf.addImage(foto.dataUrl, fmt, imgX + 0.4, imgY + 0.4, imgW - 0.8, imgH - 0.8)
          } catch {
            docTpl.font(7.5, false, [148, 163, 184])
            pdf.text(
              'Vista previa de imagen registrada en sede',
              imgX + imgW / 2,
              imgY + imgH / 2,
              { align: 'center' },
            )
          }

          // Pie de foto dentro del marco
          docTpl.font(7.2, true, [48, 56, 65])
          const caption = `${pIdx + 1}. ${(foto.titulo || `Fotografía #${pIdx + 1}`).slice(0, 48)}`
          pdf.text(caption, frameX + 3.5, rowY + frameH - 3.5)
        }

        docTpl.y += frameH + gapY
      }

      docTpl.y += 2
    }
  }

  const finalPdf = docTpl.finish()
  finalPdf.save(`Ficha_Tecnica_Sede_${sede.nombre.replace(/\s+/g, '_')}.pdf`)
}

// ============================================================================
// 1. PDF DE ADMINISTRACIÓN POR SEDE (Incluye SIEMPRE los criterios NACIONALES)
// Bajo los lineamientos institucionales SARLAFT (Encabezado gris pálido,
// secciones numeradas 01..0N, pie de página con confidencialidad y páginas,
// conservando el uso de colores semáforo para resaltar vencidos y cumplidos)
// ============================================================================
export function generateAdminSedePdf(
  sedeSeleccionada: Sede,
  sedeNacional: Sede | undefined,
  criterios: AdminCriterionRecord[],
) {
  const today = todayISO()
  const docTpl = new SarlaftPdfTemplate(
    `Informe de Cumplimiento Administrativo y Financiero — ${sedeSeleccionada.nombre}`,
    'Cumplimiento Administrativo',
    sedeSeleccionada.codigo_reps || sedeSeleccionada.id,
  )
  const pdf = docTpl.pdf

  // Filtrar criterios de la sede seleccionada + SIEMPRE los nacionales
  const relevantes = criterios.filter((c) =>
    sedeSeleccionada.es_nacional
      ? c.sede_id === sedeSeleccionada.id
      : c.sede_id === sedeSeleccionada.id ||
        (sedeNacional && c.sede_id === sedeNacional.id),
  )

  const evaluados = relevantes.map((c) => ({
    criterio: c,
    eval: evaluateAdminCriterion(c, today),
    esNacional: sedeNacional ? c.sede_id === sedeNacional.id : Boolean(sedeSeleccionada.es_nacional),
  }))

  const total = evaluados.length
  const cumplen = evaluados.filter((e) => e.eval.cumple).length
  const noCumplen = total - cumplen
  const criticos = evaluados.filter((e) => e.eval.semaforo.level === 'critico').length
  const prioritarios = evaluados.filter((e) => e.eval.semaforo.level === 'prioridad').length
  const pct = total > 0 ? Math.round((cumplen / total) * 1000) / 10 : 0

  const getSemaphoreRgb = (p: number, tot: number): Color => {
    if (tot === 0) return [148, 163, 184]
    if (p >= 85) return [21, 150, 106] // Verde institucional
    if (p >= 60) return [214, 144, 22] // Ámbar institucional
    return [217, 79, 86] // Rojo institucional
  }

  // Caja Resumen Ejecutiva Superior (Estilo Institucional SARLAFT)
  docTpl.box(
    'RESUMEN EJECUTIVO DE CUMPLIMIENTO ADMINISTRATIVO Y FINANCIERO',
    `${sedeSeleccionada.nombre.toUpperCase()} (Código REPS: ${sedeSeleccionada.codigo_reps || 'N/A'}) · Incluye Criterios de Sede + Criterios NACIONALES · Responsable: ${sedeSeleccionada.director_responsable} · Fecha de corte: ${formatDateES(today)}`,
    true,
  )

  // 01. Indicadores (KPIs) Consolidados y Cumplimiento por Clasificación con Color Semáforo
  docTpl.section('Indicadores (KPIs) consolidados y cumplimiento por clasificación')
  docTpl.ensureSpace(78)

  // Tarjeta principal de Cumplimiento Global con barra de color semáforo
  const genY = docTpl.y
  const genH = 23
  const globalColor = getSemaphoreRgb(pct, total)

  pdf.setFillColor(246, 247, 248)
  pdf.setDrawColor(216, 221, 225)
  pdf.roundedRect(docTpl.left, genY, docTpl.width, genH, 2, 2, 'FD')
  pdf.setFillColor(...globalColor)
  pdf.roundedRect(docTpl.left, genY + 2.5, 1.2, genH - 5, 0.5, 0.5, 'F')

  docTpl.font(8.5, true, [48, 56, 65])
  pdf.text(
    'INDICADORES (KPIs) DE LA SEDE CONSOLIDADA CON CRITERIOS NACIONALES',
    docTpl.left + 4,
    genY + 5.8,
  )

  docTpl.font(11.5, true, globalColor)
  pdf.text(
    `${pct}% (${cumplen}/${total} cumplen)`,
    docTpl.left + docTpl.width - 4,
    genY + 6.2,
    { align: 'right' },
  )

  const trackX = docTpl.left + 4
  const trackY = genY + 9.2
  const trackW = docTpl.width - 8
  const trackH = 4.2
  pdf.setFillColor(226, 232, 240)
  pdf.roundedRect(trackX, trackY, trackW, trackH, 1.5, 1.5, 'F')
  if (total > 0 && pct > 0) {
    pdf.setFillColor(...globalColor)
    pdf.roundedRect(
      trackX,
      trackY,
      Math.max(3, (trackW * pct) / 100),
      trackH,
      1.5,
      1.5,
      'F',
    )
  }

  docTpl.font(7.5, true, [21, 150, 106])
  pdf.text(`Cumplen Vigentes: ${cumplen}`, trackX, genY + 18.8)
  docTpl.font(7.5, true, [217, 79, 86])
  pdf.text(`No Cumplen / Vencidos: ${noCumplen}`, trackX + 46, genY + 18.8)
  docTpl.font(7.5, true, [180, 35, 24])
  pdf.text(`Semáforo Crítico (<=30d): ${criticos}`, trackX + 102, genY + 18.8)
  docTpl.font(7.5, true, [214, 144, 22])
  pdf.text(
    `Prioridad (31-60d): ${prioritarios}`,
    docTpl.left + docTpl.width - 4,
    genY + 18.8,
    { align: 'right' },
  )

  docTpl.y = genY + genH + 4

  // Grilla de 2 columnas con las 7 Clasificaciones y sus barras de color
  const clasifCardW = 88
  const clasifCardH = 11.5
  const clasifGapX = 4
  const clasifGapY = 2.8

  for (let i = 0; i < CLASIFICACIONES_CRONOGRAMA_ADMIN.length; i += 2) {
    docTpl.ensureSpace(clasifCardH + 3)
    const rowY = docTpl.y

    for (let col = 0; col < 2; col++) {
      const idx = i + col
      if (idx >= CLASIFICACIONES_CRONOGRAMA_ADMIN.length) break
      const clasif = CLASIFICACIONES_CRONOGRAMA_ADMIN[idx]
      const itemsClasif = evaluados.filter(({ criterio: c }) => {
        if (c.categoria === clasif) return true
        if (
          clasif === 'Administrativo' &&
          c.categoria === 'Capacidad Técnico-Administrativa'
        )
          return true
        if (
          clasif === 'Financiero' &&
          c.categoria === 'Suficiencia Patrimonial y Financiera'
        )
          return true
        if (
          clasif === 'Calidad y SST' &&
          c.categoria === 'Sistema Obligatorio SOGCS'
        )
          return true
        return false
      })
      const totC = itemsClasif.length
      const okC = itemsClasif.filter((x) => x.eval.cumple).length
      const pctC = totC > 0 ? Math.round((okC / totC) * 100) : 0
      const barRgb = getSemaphoreRgb(pctC, totC)

      const cx = docTpl.left + col * (clasifCardW + clasifGapX)
      pdf.setFillColor(255, 255, 255)
      pdf.setDrawColor(216, 221, 225)
      pdf.roundedRect(cx, rowY, clasifCardW, clasifCardH, 1.8, 1.8, 'FD')

      pdf.setFillColor(...barRgb)
      pdf.roundedRect(cx, rowY + 1.8, 1, clasifCardH - 3.6, 0.4, 0.4, 'F')

      docTpl.font(7.8, true, [48, 56, 65])
      pdf.text(clasif, cx + 3.2, rowY + 4.5)

      docTpl.font(7.5, true, barRgb)
      pdf.text(
        totC > 0 ? `${pctC}% (${okC}/${totC})` : 'Sin ítems (0/0)',
        cx + clasifCardW - 3,
        rowY + 4.5,
        { align: 'right' },
      )

      const bX = cx + 3.2
      const bY = rowY + 6.8
      const bW = clasifCardW - 6.2
      const bH = 2.6
      pdf.setFillColor(226, 232, 240)
      pdf.roundedRect(bX, bY, bW, bH, 1, 1, 'F')
      if (totC > 0 && pctC > 0) {
        pdf.setFillColor(...barRgb)
        pdf.roundedRect(bX, bY, Math.max(2, (bW * pctC) / 100), bH, 1, 1, 'F')
      }
    }

    docTpl.y = rowY + clasifCardH + clasifGapY
  }

  docTpl.y += 2

  // 02. Detalle de Criterios (Nacionales y Específicos de la Sede) con Tarjetas Coloreadas por Cumplimiento
  docTpl.section('Detalle de criterios (Nacionales y específicos de la Sede)')

  const ordenados = [...evaluados].sort(
    (a, b) =>
      Number(b.esNacional) - Number(a.esNacional) ||
      a.criterio.codigo.localeCompare(b.criterio.codigo, undefined, {
        numeric: true,
      }),
  )

  for (const item of ordenados) {
    const { criterio, eval: ev, esNacional } = item
    const cardH = 24.5
    docTpl.ensureSpace(cardH + 3.5)
    const y = docTpl.y

    const borderColor: Color = ev.cumple ? [187, 247, 208] : [254, 202, 202]
    const fillColor: Color = ev.cumple ? [246, 253, 249] : [255, 246, 246]
    const accentColor: Color = ev.cumple ? [21, 150, 106] : [217, 79, 86]

    pdf.setDrawColor(...borderColor)
    pdf.setFillColor(...fillColor)
    pdf.roundedRect(docTpl.left, y, docTpl.width, cardH, 2, 2, 'FD')

    // Barra lateral institucional de estado (Verde si cumple, Rojo si está vencido / no cumple)
    pdf.setFillColor(...accentColor)
    pdf.roundedRect(docTpl.left, y + 2.2, 1.1, cardH - 4.4, 0.4, 0.4, 'F')

    const tagSede = esNacional ? '[NACIONAL]' : `[${sedeSeleccionada.nombre}]`
    docTpl.font(8.6, true, [48, 56, 65])
    pdf.text(
      `${criterio.codigo} ${tagSede} — ${criterio.titulo}`.slice(0, 82),
      docTpl.left + 3.8,
      y + 5.8,
    )

    // Píldora derecha de estado (CUMPLE / NO CUMPLE - VENCIDO)
    docTpl.font(8, true, accentColor)
    pdf.text(
      `ESTADO: ${ev.estadoLabel.toUpperCase()}`,
      docTpl.left + docTpl.width - 3.8,
      y + 5.8,
      { align: 'right' },
    )

    docTpl.font(7.6, false, [75, 85, 99])
    pdf.text(
      `Clasificación: ${criterio.categoria}  ·  Frecuencia: ${criterio.periodicidad || 'Anual'}  ·  Responsable: ${criterio.responsable || 'Por asignar'}  ·  Vencimiento: ${formatDateES(ev.fechaEfectivaVencimiento)}`,
      docTpl.left + 3.8,
      y + 11.4,
    )

    const semColor: Color =
      ev.semaforo.level === 'critico'
        ? [217, 79, 86]
        : ev.semaforo.level === 'prioridad'
          ? [214, 144, 22]
          : [21, 150, 106]
    docTpl.font(7.6, true, semColor)
    pdf.text(`Semáforo: ${ev.semaforo.label}`, docTpl.left + 3.8, y + 16.6)

    docTpl.font(7.6, false, [75, 85, 99])
    const soporteTxt = ev.ultimoSoporte
      ? `Soporte vigente: ${ev.ultimoSoporte.titulo} (${ev.ultimoSoporte.archivo_nombre})`
      : 'Soporte vigente: SIN SOPORTE CARGADO'
    pdf.text(soporteTxt.slice(0, 82), docTpl.left + 64, y + 16.6)

    docTpl.font(7.4, false, [100, 108, 115])
    const obsTxt = `Observación / Estado: ${(criterio.observaciones || ev.motivo || '').replace(/\s+/g, ' ')}`
    pdf.text(obsTxt.slice(0, 112), docTpl.left + 3.8, y + 21.6)

    docTpl.y = y + cardH + 2.8
  }

  const finalPdf = docTpl.finish()
  finalPdf.save(
    `Cumplimiento_Administrativo_${sedeSeleccionada.nombre.replace(/\s+/g, '_')}.pdf`,
  )
}

// ============================================================================
// 2. PDF DE EVALUACIONES RESOLUCIÓN 3100 (Individual o General Consolidado)
// Bajo los lineamientos institucionales SARLAFT y conservando el uso de colores
// para resaltar los NO CUMPLIMIENTOS y cumplimientos vigentes
// ============================================================================
export function generateCumplimiento3100Pdf(
  evaluaciones: Evaluacion3100Sede[],
  sedes: Sede[],
  tituloReporte: string = 'Reporte General de Autoevaluación y Cumplimiento Resolución 3100',
) {
  const today = todayISO()
  const docTpl = new SarlaftPdfTemplate(
    tituloReporte,
    'Autoevaluación Res. 3100',
    today,
  )
  const pdf = docTpl.pdf

  docTpl.box(
    'RESUMEN EJECUTIVO DE AUTOEVALUACIÓN RESOLUCIÓN 3100 DE 2019',
    `Priorización de Hallazgos y No Cumplimientos por Sede y Estándar · Sedes evaluadas: ${evaluaciones.length} · Generado: ${formatDateES(today)}`,
    true,
  )

  for (const ev of evaluaciones) {
    const sede = sedes.find((s) => s.id === ev.sede_id)
    const sum = summarizeEvaluacion3100(ev)

    docTpl.section(
      `${sede?.nombre ?? ev.sede_id} — Cumplimiento General: ${sum.porcentajeGeneral}%`,
    )
    docTpl.ensureSpace(32)
    const y = docTpl.y

    const barRgb: Color =
      sum.porcentajeGeneral >= 85
        ? [21, 150, 106]
        : sum.porcentajeGeneral >= 60
          ? [214, 144, 22]
          : [217, 79, 86]

    pdf.setFillColor(246, 247, 248)
    pdf.setDrawColor(216, 221, 225)
    pdf.roundedRect(docTpl.left, y, docTpl.width, 26, 2, 2, 'FD')
    pdf.setFillColor(...barRgb)
    pdf.roundedRect(docTpl.left, y + 2.5, 1.2, 21, 0.4, 0.4, 'F')

    docTpl.font(8.5, true, [48, 56, 65])
    pdf.text(
      `Código: ${ev.codigo} · Fecha: ${formatDateES(ev.fecha_evaluacion)} · Evaluador: ${ev.evaluador} · Servicios: ${ev.servicios_evaluados.length}`,
      docTpl.left + 4,
      y + 6,
    )
    docTpl.font(8, true, barRgb)
    pdf.text(
      ev.estado === 'cerrada_vigente' ? 'EVALUACIÓN VIGENTE' : 'BORRADOR',
      docTpl.left + docTpl.width - 4,
      y + 6,
      { align: 'right' },
    )

    const line1 = ESTANDARES_3100.slice(0, 4)
      .map((e) => `${e.corto}: ${sum.porEstandar[e.key].porcentaje}%`)
      .join('  |  ')
    const line2 = ESTANDARES_3100.slice(4)
      .map((e) => `${e.corto}: ${sum.porEstandar[e.key].porcentaje}%`)
      .join('  |  ')

    docTpl.font(7.8, true, [88, 105, 109])
    pdf.text(line1, docTpl.left + 4, y + 13)
    pdf.text(line2, docTpl.left + 4, y + 19.5)

    docTpl.y = y + 30

    const incumplimientos = ev.respuestas
      .filter((r) => r.calificacion === 'no_cumple' || r.calificacion === 'parcial')
      .sort(
        (a, b) =>
          (a.calificacion === 'no_cumple' ? -1 : 1) -
          (b.calificacion === 'no_cumple' ? -1 : 1),
      )

    if (incumplimientos.length === 0) {
      docTpl.box(
        'SIN INCUMPLIMIENTOS IDENTIFICADOS',
        'No se registran incumplimientos ni cumplimientos parciales en esta evaluación.',
      )
    } else {
      for (const inc of incumplimientos) {
        const esNoCumple = inc.calificacion === 'no_cumple'
        const cardH = 22
        docTpl.ensureSpace(cardH + 3)
        const cy = docTpl.y

        pdf.setFillColor(
          esNoCumple ? 255 : 255,
          esNoCumple ? 245 : 250,
          esNoCumple ? 245 : 238,
        )
        pdf.setDrawColor(
          esNoCumple ? 254 : 253,
          esNoCumple ? 202 : 224,
          esNoCumple ? 202 : 171,
        )
        pdf.roundedRect(docTpl.left, cy, docTpl.width, cardH, 2, 2, 'FD')
        pdf.setFillColor(
          ...(esNoCumple
            ? ([217, 79, 86] as Color)
            : ([214, 144, 22] as Color)),
        )
        pdf.roundedRect(docTpl.left, cy + 2, 1.1, cardH - 4, 0.4, 0.4, 'F')

        docTpl.font(
          8.2,
          true,
          esNoCumple ? [180, 35, 24] : [145, 85, 10],
        )
        pdf.text(
          `[${esNoCumple ? 'NO CUMPLE' : 'CUMPLE PARCIALMENTE'}] ${inc.codigo} · ${inc.servicio_asociado} (${inc.modalidad_asociada})`,
          docTpl.left + 3.8,
          cy + 5.5,
        )

        docTpl.font(7.6, false, [48, 56, 65])
        pdf.text(
          `Criterio: ${inc.criterio_texto.slice(0, 105)}`,
          docTpl.left + 3.8,
          cy + 10.5,
        )
        pdf.text(
          `Hallazgo: ${(inc.descripcion_cumplimiento || 'Sin descripción').slice(0, 105)}`,
          docTpl.left + 3.8,
          cy + 15,
        )
        pdf.text(
          `Acción de Mejora: ${inc.accion_mejora_titulo || 'Pendiente'} | Resp: ${inc.accion_mejora_responsable || 'N/A'} | Plazo: ${formatDateES(inc.accion_mejora_fecha)}`,
          docTpl.left + 3.8,
          cy + 19.5,
        )
        docTpl.y = cy + cardH + 2.8
      }
    }
  }

  const finalPdf = docTpl.finish()
  finalPdf.save(`Reporte_Cumplimiento_Res3100_${today}.pdf`)
}
