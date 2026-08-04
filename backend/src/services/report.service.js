import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import zlib from "node:zlib";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import { aggregateResults, riskInterpretations, tabulateResponses } from "./scoring.service.js";

const BLUE = "1F4E79";
const GREEN = "22C55E";
const AMBER = "F59E0B";
const RED = "EF4444";

const riskOrder = ["bajo", "medio", "alto"];
const riskLabel = { bajo: "RIESGO BAJO", medio: "RIESGO MEDIO", alto: "RIESGO ALTO", sin_clasificar: "SIN CLASIFICAR" };

const asPlain = (value) => (value?.toObject ? value.toObject() : value);
const answerMap = (response) => new Map((response.respuestas || []).map((answer) => [Number(answer.item), Number(answer.value)]));
const rangeText = (range) => (range ? `${range.min} a ${range.max}` : "");
const xmlEscape = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const cleanExcelText = (value = "") =>
  String(value)
    .replaceAll("Ã¡", "a")
    .replaceAll("Ã©", "e")
    .replaceAll("Ã­", "i")
    .replaceAll("Ã³", "o")
    .replaceAll("Ãº", "u")
    .replaceAll("Ã", "A")
    .replaceAll("Ã‰", "E")
    .replaceAll("Ã", "I")
    .replaceAll("Ã“", "O")
    .replaceAll("Ãš", "U")
    .replaceAll("Ã±", "n")
    .replaceAll("Ã‘", "N")
    .replaceAll("Ã¼", "u")
    .replaceAll("Ãœ", "U")
    .replaceAll("Ã¡", "a")
    .replaceAll("â€“", "-")
    .replaceAll("â€”", "-")
    .replaceAll("â€œ", '"')
    .replaceAll("â€", '"')
    .replaceAll("â€˜", "'")
    .replaceAll("â€™", "'")
    .replaceAll("Â", "")
    .replaceAll("ci??n", "cion")
    .replaceAll("ci?n", "cion")
    .replaceAll("t??cnica", "tecnica")
    .replaceAll("t?cnica", "tecnica")
    .replaceAll("peri??dico", "periodico")
    .replaceAll("peri?dico", "periodico")
    .replaceAll("f??sica", "fisica")
    .replaceAll("f?sica", "fisica")
    .replaceAll("d??as", "dias")
    .replaceAll("d?as", "dias")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
const cleanPdfText = (value = "") => cleanExcelText(value);

const thinBorder = () => ({
  top: { style: "thin", color: { argb: "FFBDBDBD" } },
  left: { style: "thin", color: { argb: "FFBDBDBD" } },
  bottom: { style: "thin", color: { argb: "FFBDBDBD" } },
  right: { style: "thin", color: { argb: "FFBDBDBD" } }
});

const styleHeader = (row) => {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BLUE}` } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder();
  });
};

const applyBorders = (worksheet) => {
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = thinBorder();
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });
};

const cleanWorkbookText = (workbook) => {
  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === "string") cell.value = cleanExcelText(cell.value);
        if (cell.value?.richText) {
          cell.value = {
            richText: cell.value.richText.map((item) => ({
              ...item,
              text: cleanExcelText(item.text)
            }))
          };
        }
      });
    });
  });
};

const addTitle = (worksheet, title, width) => {
  worksheet.mergeCells(1, 1, 1, width);
  const cell = worksheet.getCell(1, 1);
  cell.value = title;
  cell.font = { bold: true, size: 14 };
  cell.alignment = { horizontal: "center" };
};

const buildCurrentResults = ({ questionnaire, assessment, responses }) => {
  const existing = asPlain(assessment.resultadosCalculados) || {};
  const calculated = aggregateResults(questionnaire, responses);
  const technical = assessment.informeTecnico || {};
  const customRecommendations = technical.recomendaciones || [];
  return {
    ...existing,
    ...calculated,
    recomendaciones: customRecommendations.length ? customRecommendations : calculated.recomendaciones,
    planAccion: technical.planAccion?.length ? technical.planAccion : calculated.planAccion,
    tabulacion: tabulateResponses(questionnaire, responses)
  };
};

const buildDefaultReportText = (assessment, results) => {
  const company = assessment.empresa?.nombreComercial || assessment.empresa?.razonSocial || "la empresa";
  const participants = results.totalParticipantes || assessment.totalParticipantes || 0;
  const highRiskDimensions = (results.dimensiones || []).filter((dimension) => (dimension.altoPct || 0) > 0);
  const mediumRiskDimensions = (results.dimensiones || []).filter((dimension) => (dimension.medioPct || 0) > 0);
  const priorityNames = highRiskDimensions.length
    ? highRiskDimensions.map((dimension) => dimension.name).join(", ")
    : mediumRiskDimensions.slice(0, 5).map((dimension) => dimension.name).join(", ");

  return {
    objetivo:
      `Evaluar los factores de riesgo psicosocial presentes en ${company}, mediante la aplicacion del Cuestionario de Evaluacion Psicosocial en Espacios Laborales, con el fin de identificar niveles de exposicion, establecer prioridades de intervencion y orientar acciones preventivas y correctivas.`,
    alcance:
      `La evaluacion comprende a ${participants} participante(s) de ${company}. La informacion recolectada se procesa de forma confidencial y anonima, considerando los resultados globales, por dimension y por subdimension establecidos en la herramienta tecnica.`,
    metodologia:
      "Se aplico el Cuestionario de Evaluacion Psicosocial en Espacios Laborales. Cada item se puntua de 1 a 4 segun la opcion seleccionada. Los puntajes se agrupan por dimensiones y subdimensiones, y se clasifican en riesgo bajo, medio o alto conforme a los rangos definidos en la herramienta de tabulacion.",
    conclusiones:
      `Con base en los resultados obtenidos, el resultado global presenta ${results.global?.bajoPct || 0}% de riesgo bajo, ${results.global?.medioPct || 0}% de riesgo medio y ${results.global?.altoPct || 0}% de riesgo alto. ${priorityNames ? `Las dimensiones que requieren mayor seguimiento o intervencion son: ${priorityNames}.` : "No se identifican dimensiones prioritarias con riesgo alto o medio significativo."} Se recomienda mantener el monitoreo periodico y ejecutar el plan de accion documentado.`
  };
};

const docxText = (value = "") => cleanPdfText(value);
const docxPercent = (value = 0) => `${Number(value || 0)}%`;
const docxRiskColor = { bajo: GREEN, medio: AMBER, alto: RED, sin_clasificar: "9CA3AF" };

const docxParagraph = (text, options = {}) =>
  new Paragraph({
    heading: options.heading,
    alignment: options.alignment,
    spacing: { before: options.before || 0, after: options.after ?? 160 },
    children: [
      new TextRun({
        text: docxText(text),
        bold: options.bold,
        size: options.size || 20,
        color: options.color || "111827"
      })
    ]
  });

const docxBullet = (text) =>
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: `- ${docxText(text)}`, size: 20 })]
  });

const docxCell = (text, options = {}) =>
  new TableCell({
    width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options.fill ? { fill: options.fill } : undefined,
    margins: { top: 90, bottom: 90, left: 90, right: 90 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" }
    },
    children: [
      new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text: docxText(text),
            bold: options.bold,
            size: options.size || 18,
            color: options.color || "111827"
          })
        ]
      })
    ]
  });

const docxHeaderRow = (cells) =>
  new TableRow({
    tableHeader: true,
    children: cells.map((cell) =>
      docxCell(cell, {
        fill: BLUE,
        color: "FFFFFF",
        bold: true,
        align: AlignmentType.CENTER
      })
    )
  });

const docxTable = (rows, widths = []) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map((cell, cellIndex) => {
            if (rowIndex === 0) {
              return docxCell(cell, {
                width: widths[cellIndex],
                fill: BLUE,
                color: "FFFFFF",
                bold: true,
                align: AlignmentType.CENTER
              });
            }
            return docxCell(cell, { width: widths[cellIndex] });
          })
        })
    )
  });

const docxInfoTable = (rows) =>
  docxTable(
    [["Campo", "Detalle"], ...rows.map(([label, value]) => [label, value || ""])],
    [30, 70]
  );

const docxResultsTable = (dimensions = []) =>
  docxTable(
    [
      ["Dimension", "Riesgo bajo", "Riesgo medio", "Riesgo alto", "Predominante"],
      ...dimensions.map((dimension) => [
        `${dimension.code}. ${dimension.name}`,
        docxPercent(dimension.bajoPct),
        docxPercent(dimension.medioPct),
        docxPercent(dimension.altoPct),
        riskLabel[dimension.dominantRisk] || riskLabel.sin_clasificar
      ])
    ],
    [42, 14, 14, 14, 16]
  );

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data = Buffer.alloc(0)) => {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
};

const hexRgb = (hex) => ({
  r: Number.parseInt(hex.slice(0, 2), 16),
  g: Number.parseInt(hex.slice(2, 4), 16),
  b: Number.parseInt(hex.slice(4, 6), 16)
});

const drawRect = (canvas, width, height, x, y, rectWidth, rectHeight, color) => {
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const right = Math.min(width, Math.ceil(x + rectWidth));
  const bottom = Math.min(height, Math.ceil(y + rectHeight));
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const offset = (py * width + px) * 4;
      canvas[offset] = color.r;
      canvas[offset + 1] = color.g;
      canvas[offset + 2] = color.b;
      canvas[offset + 3] = 255;
    }
  }
};

const encodePng = (width, height, rgba) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(scanlines)),
    pngChunk("IEND")
  ]);
};

const buildGroupedRiskChartPng = (dimensions = []) => {
  const width = 980;
  const height = 560;
  const margin = { top: 66, right: 68, bottom: 82, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const items = dimensions.length ? dimensions : [{ bajoPct: 0, medioPct: 0, altoPct: 0 }];
  const groupWidth = plotWidth / items.length;
  const barWidth = Math.max(7, Math.min(18, groupWidth / 5));
  const gap = Math.max(4, barWidth * 0.35);
  const colors = {
    bajo: hexRgb(GREEN),
    medio: hexRgb(AMBER),
    alto: hexRgb(RED),
    grid: hexRgb("D1D5DB"),
    axis: hexRgb("111827"),
    tick: hexRgb("6B7280"),
    soft: hexRgb("F3F4F6"),
    white: hexRgb("FFFFFF")
  };
  const yFor = (value) => margin.top + plotHeight - (Math.max(0, Math.min(100, Number(value || 0))) / 100) * plotHeight;
  const canvas = Buffer.alloc(width * height * 4);

  drawRect(canvas, width, height, 0, 0, width, height, colors.white);
  drawRect(canvas, width, height, 0, 0, width, 48, colors.soft);
  drawRect(canvas, width, height, margin.left, margin.top, 2, plotHeight, colors.axis);
  drawRect(canvas, width, height, margin.left, margin.top + plotHeight, plotWidth, 2, colors.axis);

  for (let value = 0; value <= 100; value += 10) {
    const y = yFor(value);
    drawRect(canvas, width, height, margin.left, y, plotWidth, 1, colors.grid);
    if (value % 20 === 0) drawRect(canvas, width, height, margin.left - 10, y, 10, 2, colors.tick);
  }

  items.forEach((dimension, index) => {
    const center = margin.left + index * groupWidth + groupWidth / 2;
    const start = center - (barWidth * 3 + gap * 2) / 2;
    [
      ["bajo", "bajoPct"],
      ["medio", "medioPct"],
      ["alto", "altoPct"]
    ].forEach(([risk, field], seriesIndex) => {
      const value = Number(dimension[field] || 0);
      const y = yFor(value);
      const barHeight = margin.top + plotHeight - y;
      drawRect(canvas, width, height, start + seriesIndex * (barWidth + gap), y, barWidth, Math.max(1, barHeight), colors[risk]);
    });
    drawRect(canvas, width, height, center - 1, margin.top + plotHeight + 10, 2, 12, colors.tick);
  });

  drawRect(canvas, width, height, margin.left, 22, 34, 14, colors.bajo);
  drawRect(canvas, width, height, margin.left + 170, 22, 34, 14, colors.medio);
  drawRect(canvas, width, height, margin.left + 340, 22, 34, 14, colors.alto);

  return encodePng(width, height, canvas);
};

const truncateLabel = (value = "", max = 30) => {
  const text = cleanPdfText(value);
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};

const buildGroupedRiskChartSvg = (dimensions = []) => {
  const width = 980;
  const height = 560;
  const margin = { top: 58, right: 150, bottom: 150, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const items = dimensions.length ? dimensions : [{ code: "", name: "Sin datos", bajoPct: 0, medioPct: 0, altoPct: 0 }];
  const groupWidth = plotWidth / items.length;
  const barWidth = Math.max(5, Math.min(14, groupWidth / 5));
  const gap = Math.max(3, barWidth * 0.35);
  const colors = { bajo: `#${GREEN}`, medio: `#${AMBER}`, alto: `#${RED}` };
  const series = [
    ["bajo", "RIESGO BAJO", "bajoPct"],
    ["medio", "RIESGO MEDIO", "medioPct"],
    ["alto", "RIESGO ALTO", "altoPct"]
  ];
  const yFor = (value) => margin.top + plotHeight - (Math.max(0, Math.min(100, Number(value || 0))) / 100) * plotHeight;
  const esc = (value = "") => xmlEscape(cleanPdfText(value));

  const grid = Array.from({ length: 11 }, (_, index) => {
    const value = index * 10;
    const y = yFor(value);
    return `
      <line x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}" stroke="#D1D5DB" stroke-width="1"/>
      <text x="${margin.left - 12}" y="${y + 4}" font-family="Arial" font-size="12" text-anchor="end" fill="#111827">${value}%</text>
    `;
  }).join("");

  const bars = items.map((dimension, index) => {
    const center = margin.left + index * groupWidth + groupWidth / 2;
    const start = center - (barWidth * 3 + gap * 2) / 2;
    const rects = series.map(([key, , field], seriesIndex) => {
      const value = Number(dimension[field] || 0);
      const y = yFor(value);
      const barHeight = margin.top + plotHeight - y;
      return `<rect x="${start + seriesIndex * (barWidth + gap)}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors[key]}"/>`;
    }).join("");
    const label = `${dimension.code ? `${dimension.code}. ` : ""}${dimension.name || ""}`;
    return `
      ${rects}
      <text x="${center}" y="${margin.top + plotHeight + 18}" font-family="Arial" font-size="10" text-anchor="end" fill="#111827" transform="rotate(-70 ${center} ${margin.top + plotHeight + 18})">${esc(truncateLabel(label, 34))}</text>
    `;
  }).join("");

  const legend = series.map(([key, label], index) => {
    const y = margin.top + 18 + index * 22;
    const x = width - margin.right + 28;
    return `
      <rect x="${x}" y="${y - 10}" width="10" height="10" fill="${colors[key]}"/>
      <text x="${x + 16}" y="${y}" font-family="Arial" font-size="11" fill="#111827">${label}</text>
    `;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      <text x="${width / 2}" y="28" font-family="Arial" font-size="20" font-weight="700" text-anchor="middle" fill="#111827">Evaluacion de riesgo psicosocial por dimension</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-width="1.2"/>
      ${bars}
      ${legend}
    </svg>
  `.trim();
};

const docxRiskChartImage = (dimensions = []) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 180 },
    children: [
      new ImageRun({
        type: "png",
        data: buildGroupedRiskChartPng(dimensions),
        transformation: {
          width: 640,
          height: 366
        },
        altText: {
          title: "Grafico general por dimension",
          description: "Grafico de barras agrupadas con porcentajes de riesgo bajo, medio y alto por dimension."
        }
      })
    ]
  });

const docxActionPlanTable = (plan = []) =>
  docxTable(
    [
      ["Dimension", "Riesgo", "Accion", "Responsable", "Plazo", "Verificacion"],
      ...plan.map((item) => [
        item.dimension || "",
        item.riesgo || "",
        item.accion || "",
        item.responsable || "",
        item.plazo || "",
        item.verificacion || ""
      ])
    ],
    [16, 10, 28, 16, 10, 20]
  );

const docxEvidenceTable = (evidences = []) =>
  docxTable(
    [
      ["Tipo", "Nombre", "Fecha", "Descripcion / archivo"],
      ...evidences.map((evidence) => [
        evidence.tipo || "otro",
        evidence.nombre || evidence.archivo?.originalName || "",
        evidence.fecha ? new Date(evidence.fecha).toLocaleDateString("es-EC") : "",
        evidence.descripcion || evidence.archivo?.url || ""
      ])
    ],
    [18, 24, 16, 42]
  );

const sanitizeWordBuffer = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const contentTypes = zip.file("[Content_Types].xml");
  if (contentTypes) {
    const xml = await contentTypes.async("string");
    zip.file(
      "[Content_Types].xml",
      xml
        .replace(/<Default\s+ContentType="image\/svg\+xml"\s+Extension="svg"\/>/g, "")
        .replace(/<Default\s+ContentType="image\/png"\s+Extension="png"\/>/g, "")
        .replace(/<Default\s+ContentType="image\/jpeg"\s+Extension="jpeg"\/>/g, "")
        .replace(/<Default\s+ContentType="image\/jpeg"\s+Extension="jpg"\/>/g, "")
        .replace(/<Default\s+ContentType="image\/bmp"\s+Extension="bmp"\/>/g, "")
        .replace(/<Default\s+ContentType="image\/gif"\s+Extension="gif"\/>/g, "")
    );
  }

  Object.keys(zip.files)
    .filter((name) => /\.(svg|png|jpg|jpeg|gif|bmp)$/i.test(name))
    .forEach((name) => zip.remove(name));

  const cleanZip = new JSZip();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    cleanZip.file(name, await entry.async("nodebuffer"), {
      date: entry.date,
      compression: "DEFLATE",
      createFolders: false
    });
  }

  return cleanZip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
};

export const buildAssessmentWord = async ({ assessment, responses, questionnaire, evaluatorProfile, includeSignature = true }) => {
  const results = buildCurrentResults({ questionnaire, assessment, responses });
  const defaults = buildDefaultReportText(assessment, results);
  const companyName = assessment.empresa?.nombreComercial || assessment.empresa?.razonSocial || "Sin empresa";
  const technical = assessment.informeTecnico || {};
  const dossier = assessment.expediente || {};
  const socialization = dossier.socializacion || {};
  const evidences = dossier.evidencias || [];
  const recommendations = results.recomendaciones || [];
  const plan = results.planAccion || [];
  const evaluatorName = evaluatorProfile?.nombreProfesional || assessment.evaluador?.nombre || assessment.evaluador?.email || "No especificado";

  const children = [
    docxParagraph("Informe de evaluacion psicosocial", {
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      size: 32,
      bold: true,
      after: 80
    }),
    docxParagraph("Cuestionario de evaluacion psicosocial en espacios laborales", {
      alignment: AlignmentType.CENTER,
      color: "4B5563",
      after: 240
    }),
    docxInfoTable([
      ["Empresa", companyName],
      ["Pais", assessment.pais || "Ecuador"],
      ["Evaluador", evaluatorName],
      ["Participantes", String(responses.length)],
      ["Fecha de generacion", new Date().toLocaleDateString("es-EC")]
    ]),
    docxParagraph("Objetivo, alcance y metodologia", { heading: HeadingLevel.HEADING_1, before: 280, bold: true, size: 26 }),
    docxParagraph("Objetivo", { bold: true }),
    docxParagraph(technical.objetivo || defaults.objetivo),
    docxParagraph("Alcance", { bold: true }),
    docxParagraph(technical.alcance || defaults.alcance),
    docxParagraph("Metodologia", { bold: true }),
    docxParagraph(technical.metodologia || defaults.metodologia),
    docxParagraph("Resultado global de la evaluacion de riesgo psicosocial", { heading: HeadingLevel.HEADING_1, before: 280, bold: true, size: 26 }),
    docxTable(
      [
        ["Resultado global", "Riesgo bajo", "Riesgo medio", "Riesgo alto"],
        [
          riskLabel[results.global?.dominantRisk] || riskLabel[results.global?.riesgo] || riskLabel.sin_clasificar,
          docxPercent(results.global?.bajoPct),
          docxPercent(results.global?.medioPct),
          docxPercent(results.global?.altoPct)
        ]
      ],
      [40, 20, 20, 20]
    ),
    docxParagraph(results.global?.interpretation || riskInterpretations.sin_clasificar, { before: 160 }),
    docxParagraph("Resumen consolidado por dimension", { heading: HeadingLevel.HEADING_2, before: 260, bold: true, size: 22 }),
    docxParagraph(
      "Este archivo Word se genera en modo editable y seguro, sin imagenes incrustadas, para evitar bloqueos en Microsoft Word. Los graficos visuales se generan en el PDF y el grafico editable se conserva en Excel.",
      { color: "4B5563" }
    ),
    docxParagraph("Resultado por dimension", { heading: HeadingLevel.HEADING_2, before: 260, bold: true, size: 22 }),
    docxResultsTable(results.dimensiones || []),
    docxParagraph("Interpretacion de resultados", { heading: HeadingLevel.HEADING_1, before: 280, bold: true, size: 26 }),
    ...riskOrder.flatMap((risk) => [
      docxParagraph(riskLabel[risk], { bold: true, before: 80 }),
      docxParagraph(riskInterpretations[risk])
    ]),
    docxParagraph("Conclusiones", { heading: HeadingLevel.HEADING_1, before: 280, bold: true, size: 26 }),
    docxParagraph(technical.conclusiones || defaults.conclusiones),
    docxParagraph("Recomendaciones", { heading: HeadingLevel.HEADING_1, before: 280, bold: true, size: 26 }),
    ...(recommendations.length ? recommendations.map(docxBullet) : [docxParagraph("No se registran recomendaciones generadas.")]),
    docxParagraph("Plan de accion", { heading: HeadingLevel.HEADING_1, before: 280, bold: true, size: 26 }),
    plan.length ? docxActionPlanTable(plan) : docxParagraph("No se registra plan de accion."),
    docxParagraph("Expediente tecnico", { heading: HeadingLevel.HEADING_1, before: 280, bold: true, size: 26 }),
    docxInfoTable([
      ["Estado del expediente", dossier.estado || "borrador"],
      ["Listo para inspeccion", dossier.listoParaInspeccion ? "Si" : "No"],
      ["Observaciones", dossier.observaciones || ""],
      ["Socializacion realizada", socialization.realizada ? "Si" : "No"],
      ["Fecha de socializacion", socialization.fecha ? new Date(socialization.fecha).toLocaleDateString("es-EC") : ""],
      ["Responsable", socialization.responsable || ""],
      ["Participantes socializados", String(socialization.participantes || "")]
    ]),
    docxParagraph("Evidencias registradas", { heading: HeadingLevel.HEADING_2, before: 260, bold: true, size: 22 }),
    evidences.length ? docxEvidenceTable(evidences) : docxParagraph("Aun no hay evidencias adjuntas."),
    docxParagraph(
      "Este informe se genera con base en la metodologia y rangos de interpretacion del Cuestionario de Evaluacion Psicosocial en Espacios Laborales. El archivo Excel generado conserva el respaldo de Base de datos, Tabulacion, Resultados, Grafico, Definicion Dimensiones, Items y Datos.",
      { before: 260, color: "6B7280" }
    )
  ];

  if (includeSignature && assessment.informeTecnico?.incluirFirma !== false) {
    children.push(
      docxParagraph(""),
      docxParagraph("________________________________________", { alignment: AlignmentType.CENTER, before: 360 }),
      docxParagraph(evaluatorName, { alignment: AlignmentType.CENTER, bold: true }),
      docxParagraph(evaluatorProfile?.cargo || "Evaluador", { alignment: AlignmentType.CENTER }),
      docxParagraph(`Registro: ${evaluatorProfile?.registroProfesional || "No especificado"}`, { alignment: AlignmentType.CENTER }),
      evaluatorProfile?.contacto?.email ? docxParagraph(`Contacto: ${evaluatorProfile.contacto.email}`, { alignment: AlignmentType.CENTER }) : docxParagraph("")
    );
  }

  const document = new Document({
    creator: "LIMPRO",
    description: "Informe de evaluacion psicosocial",
    title: `Informe psicosocial - ${companyName}`,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, right: 720, bottom: 900, left: 720 }
          }
        },
        children
      }
    ]
  });

  const buffer = await Packer.toBuffer(document);
  return sanitizeWordBuffer(buffer);
};

const ensurePdfSpace = (doc, height = 80) => {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
};

const drawPdfSectionTitle = (doc, title) => {
  ensurePdfSpace(doc, 44);
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#111827").text(title, x, doc.y, { width });
  doc.moveDown(0.35);
};

const pdfContentBox = (doc) => ({
  x: doc.page.margins.left,
  width: doc.page.width - doc.page.margins.left - doc.page.margins.right
});

const drawPdfText = (doc, text, options = {}) => {
  const box = pdfContentBox(doc);
  doc.text(cleanPdfText(text ?? ""), box.x, doc.y, { width: box.width, align: options.align || "left", ...options });
};

const drawPdfCell = (doc, text, x, y, width, height, options = {}) => {
  doc.rect(x, y, width, height).fillAndStroke(options.fill || "#FFFFFF", options.stroke || "#D1D5DB");
  doc.fillColor(options.color || "#111827")
    .font(options.bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(options.fontSize || 8)
    .text(cleanPdfText(text ?? ""), x + 4, y + 5, {
      width: width - 8,
      height: height - 8,
      align: options.align || "left"
    });
};

const pdfCellHeight = (doc, text, width, options = {}) => {
  doc.font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(options.fontSize || 8);
  const textHeight = doc.heightOfString(cleanPdfText(text ?? ""), {
    width: width - 8,
    align: options.align || "left"
  });
  return Math.max(options.minHeight || 24, textHeight + 12);
};

const drawPdfSummaryTable = (doc, results) => {
  const x = doc.page.margins.left;
  const y = doc.y;
  const widths = [190, 90, 90, 90];
  const rowHeight = 28;
  const headers = ["RESULTADO GLOBAL", "RIESGO BAJO", "RIESGO MEDIO", "RIESGO ALTO"];
  const values = [
    results.global?.dominantRiskLabel || "SIN CLASIFICAR",
    `${results.global?.bajoPct || 0}%`,
    `${results.global?.medioPct || 0}%`,
    `${results.global?.altoPct || 0}%`
  ];

  let cursorX = x;
  headers.forEach((header, index) => {
    drawPdfCell(doc, header, cursorX, y, widths[index], rowHeight, {
      fill: index === 0 ? "#1F4E79" : ["#22C55E", "#F59E0B", "#EF4444"][index - 1],
      color: "#FFFFFF",
      bold: true,
      align: "center"
    });
    cursorX += widths[index];
  });

  cursorX = x;
  values.forEach((value, index) => {
    drawPdfCell(doc, value, cursorX, y + rowHeight, widths[index], rowHeight, {
      fill: index === 0 ? "#F3F4F6" : "#FFFFFF",
      bold: index === 0,
      align: "center"
    });
    cursorX += widths[index];
  });
  doc.y = y + rowHeight * 2 + 12;
};

const drawPdfDimensionChart = (doc, dimensions = [], options = {}) => {
  if (!dimensions.length) return;
  if (options.ensureSpace !== false) ensurePdfSpace(doc, 430);
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const chartHeight = 190;
  const labelHeight = 86;
  const axisWidth = 28;
  const legendWidth = 78;
  const plotX = x + axisWidth;
  const plotY = doc.y + 38;
  const plotWidth = width - axisWidth - legendWidth - 8;
  const plotBottom = plotY + chartHeight;
  const groupWidth = plotWidth / dimensions.length;
  const barWidth = Math.max(3, Math.min(7, groupWidth / 4));
  const colors = { bajo: "#22C55E", medio: "#F59E0B", alto: "#EF4444" };
  let y = doc.y;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Evaluacion de riesgo psicosocial por dimension", x, y, {
    width,
    align: "center"
  });
  y += 20;

  doc.font("Helvetica").fontSize(6.5).fillColor("#111827");
  for (let tick = 0; tick <= 100; tick += 10) {
    const tickY = plotBottom - (chartHeight * tick) / 100;
    doc.moveTo(plotX, tickY).lineTo(plotX + plotWidth, tickY).strokeColor(tick % 50 === 0 ? "#9CA3AF" : "#D1D5DB").stroke();
    doc.fillColor("#111827").text(`${tick}%`, x, tickY - 4, { width: axisWidth - 4, align: "right" });
  }
  doc.moveTo(plotX, plotY).lineTo(plotX, plotBottom).lineTo(plotX + plotWidth, plotBottom).strokeColor("#111827").stroke();

  dimensions.forEach((dimension, index) => {
    const centerX = plotX + index * groupWidth + groupWidth / 2;
    const values = [
      { value: dimension.bajoPct || 0, color: colors.bajo, offset: -barWidth - 1 },
      { value: dimension.medioPct || 0, color: colors.medio, offset: 0 },
      { value: dimension.altoPct || 0, color: colors.alto, offset: barWidth + 1 }
    ];

    values.forEach((item) => {
      const pct = Math.max(0, Math.min(100, Number(item.value)));
      const barHeight = (chartHeight * pct) / 100;
      doc.rect(centerX + item.offset, plotBottom - barHeight, barWidth, barHeight).fill(item.color);
    });

    const label = `${dimension.code}. ${dimension.name}`;
    doc.save();
    doc.rotate(-90, { origin: [centerX - 2, plotBottom + labelHeight - 4] });
    doc.font("Helvetica").fontSize(5.1).fillColor("#111827").text(cleanPdfText(label), centerX - 2, plotBottom + labelHeight - 4, {
      width: labelHeight,
      height: groupWidth,
      ellipsis: true
    });
    doc.restore();
  });

  const legendX = plotX + plotWidth + 12;
  const legendY = plotY + chartHeight / 2 - 18;
  [
    ["RIESGO BAJO", colors.bajo],
    ["RIESGO MEDIO", colors.medio],
    ["RIESGO ALTO", colors.alto]
  ].forEach(([label, color], index) => {
    const itemY = legendY + index * 14;
    doc.rect(legendX, itemY + 2, 7, 7).fill(color);
    doc.font("Helvetica").fontSize(6.2).fillColor("#111827").text(label, legendX + 10, itemY, { width: legendWidth - 10 });
  });

  doc.y = plotBottom + labelHeight + 18;
};

const drawPdfDimensionTable = (doc, dimensions = []) => {
  const x = doc.page.margins.left;
  const widths = [216, 70, 70, 70, 70];
  const rowHeight = 24;
  const headers = ["DIMENSIONES DEL CUESTIONARIO", "BAJO", "MEDIO", "ALTO", "PREDOM."];

  let y = doc.y;
  let cursorX = x;
  headers.forEach((header, index) => {
    drawPdfCell(doc, header, cursorX, y, widths[index], rowHeight, {
      fill: "#1F4E79",
      color: "#FFFFFF",
      bold: true,
      align: "center"
    });
    cursorX += widths[index];
  });
  y += rowHeight;

  dimensions.forEach((dimension) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y;
      cursorX = x;
      headers.forEach((header, index) => {
        drawPdfCell(doc, header, cursorX, y, widths[index], rowHeight, {
          fill: "#1F4E79",
          color: "#FFFFFF",
          bold: true,
          align: "center"
        });
        cursorX += widths[index];
      });
      y += rowHeight;
    }

    cursorX = x;
    const values = [
      `${dimension.code}. ${dimension.name}`,
      `${dimension.bajoPct || 0}%`,
      `${dimension.medioPct || 0}%`,
      `${dimension.altoPct || 0}%`,
      riskLabel[dimension.dominantRisk] || "SIN CLASIF."
    ];
    values.forEach((value, index) => {
      drawPdfCell(doc, value, cursorX, y, widths[index], rowHeight, {
        fill: index === 0 ? "#F9FAFB" : "#FFFFFF",
        align: index === 0 ? "left" : "center",
        fontSize: 7.5
      });
      cursorX += widths[index];
    });
    y += rowHeight;
  });
  doc.y = y + 10;
};

const drawPdfActionPlan = (doc, plan = []) => {
  drawPdfSectionTitle(doc, "Plan de accion");
  const x = doc.page.margins.left;
  const widths = [88, 45, 132, 82, 46, 103];
  const headers = ["Dimension", "Riesgo", "Accion", "Responsable", "Plazo", "Verificacion"];
  let y = doc.y;

  const drawHeader = () => {
    let cursorX = x;
    headers.forEach((header, index) => {
      drawPdfCell(doc, header, cursorX, y, widths[index], 24, {
        fill: "#1F4E79",
        color: "#FFFFFF",
        bold: true,
        align: "center",
        fontSize: 7
      });
      cursorX += widths[index];
    });
  };

  drawHeader();
  y += 24;

  plan.forEach((item) => {
    const rowValues = [item.dimension, item.riesgo, item.accion, item.responsable, item.plazo, item.verificacion];
    const rowHeight = Math.max(
      40,
      ...rowValues.map((value, index) => pdfCellHeight(doc, value, widths[index], {
        fontSize: 6.8,
        align: index === 1 || index === 4 ? "center" : "left",
        minHeight: 40
      }))
    );
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y;
      drawHeader();
      y += 24;
    }
    let cursorX = x;
    rowValues.forEach((value, index) => {
      drawPdfCell(doc, value, cursorX, y, widths[index], rowHeight, {
        fill: index === 1 && item.riesgo === "alto" ? "#FEE2E2" : "#FFFFFF",
        align: index === 1 || index === 4 ? "center" : "left",
        fontSize: 6.8
      });
      cursorX += widths[index];
    });
    y += rowHeight;
  });
  doc.y = y + 10;
};

const drawPdfKeyValueTable = (doc, rows = []) => {
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const labelWidth = 155;
  const rowHeight = 24;
  let y = doc.y;

  rows.forEach(([label, value]) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y;
    }
    drawPdfCell(doc, label, x, y, labelWidth, rowHeight, { fill: "#F3F4F6", bold: true, fontSize: 8 });
    drawPdfCell(doc, value || "", x + labelWidth, y, width - labelWidth, rowHeight, { fontSize: 8 });
    y += rowHeight;
  });

  doc.y = y + 12;
};

const drawPdfDossier = (doc, assessment) => {
  const dossier = assessment.expediente || {};
  const socialization = dossier.socializacion || {};
  const evidences = dossier.evidencias || [];

  doc.addPage();
  drawPdfSectionTitle(doc, "Expediente de cumplimiento");
  drawPdfKeyValueTable(doc, [
    ["Estado del expediente", dossier.estado || "borrador"],
    ["Listo para inspeccion", dossier.listoParaInspeccion ? "Si" : "No"],
    ["Fecha de revision", dossier.fechaRevision ? new Date(dossier.fechaRevision).toLocaleDateString("es-EC") : ""],
    ["Fecha de firma", dossier.fechaFirma ? new Date(dossier.fechaFirma).toLocaleDateString("es-EC") : ""],
    ["Fecha de cierre", dossier.fechaCierre ? new Date(dossier.fechaCierre).toLocaleDateString("es-EC") : ""],
    ["Observaciones", dossier.observaciones || ""]
  ]);

  drawPdfSectionTitle(doc, "Socializacion de resultados");
  drawPdfKeyValueTable(doc, [
    ["Realizada", socialization.realizada ? "Si" : "No"],
    ["Fecha", socialization.fecha ? new Date(socialization.fecha).toLocaleDateString("es-EC") : ""],
    ["Responsable", socialization.responsable || ""],
    ["Participantes socializados", socialization.participantes || ""],
    ["Detalle", socialization.observaciones || ""]
  ]);

  drawPdfSectionTitle(doc, "Evidencias registradas");
  if (!evidences.length) {
    doc.font("Helvetica-Oblique").fillColor("#6B7280").text("No se registran evidencias adjuntas en el expediente.");
    doc.fillColor("#111827");
    return;
  }

  const x = doc.page.margins.left;
  const widths = [60, 120, 64, 172, 80];
  const headers = ["Tipo", "Nombre", "Fecha", "Descripcion", "Verificacion"];
  let y = doc.y + 5;
  let cursorX = x;
  headers.forEach((header, index) => {
    drawPdfCell(doc, header, cursorX, y, widths[index], 24, {
      fill: "#1F4E79",
      color: "#FFFFFF",
      bold: true,
      align: "center",
      fontSize: 7
    });
    cursorX += widths[index];
  });
  y += 24;

  evidences.forEach((evidence) => {
    const evidenceUrl = evidence.archivo?.url || "";
    const description = evidence.descripcion || evidence.archivo?.originalName || "";
    const rowHeight = Math.max(36, Math.ceil(String(description).length / 56) * 12 + 18);
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y;
    }
    cursorX = x;
    [
      evidence.tipo || "otro",
      evidence.nombre || evidence.archivo?.originalName || "",
      evidence.fecha ? new Date(evidence.fecha).toLocaleDateString("es-EC") : "",
      description,
      evidenceUrl ? "Abrir evidencia" : "Sin enlace"
    ].forEach((value, index) => {
      drawPdfCell(doc, value, cursorX, y, widths[index], rowHeight, {
        fontSize: 6.8,
        color: index === 4 && evidenceUrl ? "#1D4ED8" : "#111827",
        align: index === 4 ? "center" : "left"
      });
      if (index === 4 && evidenceUrl) {
        doc.link(cursorX + 4, y + 5, widths[index] - 8, rowHeight - 10, evidenceUrl);
      }
      cursorX += widths[index];
    });
    y += rowHeight;
  });
  doc.y = y + 10;
};

const drawSignatureBlock = (doc, assessment, evaluatorProfile, includeSignature) => {
  if (!includeSignature || assessment.informeTecnico?.incluirFirma === false) return;
  ensurePdfSpace(doc, 150);
  doc.moveDown(1);
  const name = evaluatorProfile?.nombreProfesional || assessment.evaluador?.nombre || "Profesional evaluador";
  const role = evaluatorProfile?.cargo || "Responsable de la evaluacion";
  const registry = evaluatorProfile?.registroProfesional || "Registro profesional no especificado";
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const lineWidth = 240;
  const lineX = x + (width - lineWidth) / 2;

  doc.moveDown(1.5);
  const signatureY = doc.y + 28;
  doc.moveTo(lineX, signatureY).lineTo(lineX + lineWidth, signatureY).stroke("#111827");
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(name, x, signatureY + 10, { width, align: "center" });
  doc.font("Helvetica").fontSize(9).text(role, { width, align: "center" });
  doc.text(`Registro: ${registry}`, { width, align: "center" });
  if (evaluatorProfile?.contacto?.email) doc.text(`Contacto: ${evaluatorProfile.contacto.email}`, { width, align: "center" });
};

export const buildAssessmentPdf = async ({ assessment, responses, questionnaire, evaluatorProfile, includeSignature = true }) =>
  new Promise((resolve) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const results = buildCurrentResults({ questionnaire, assessment, responses });
    const defaults = buildDefaultReportText(assessment, results);
    const companyName = assessment.empresa?.nombreComercial || assessment.empresa?.razonSocial || "Sin empresa";

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111827").text("Informe de evaluacion psicosocial", { align: "center" });
    doc.font("Helvetica").fontSize(11).fillColor("#4B5563").text("Cuestionario de evaluacion psicosocial en espacios laborales", { align: "center" });
    doc.moveDown();

    doc.fontSize(10).fillColor("#111827").text(`Empresa: ${companyName}`);
    doc.text(`Pais: ${assessment.pais || "Ecuador"}`);
    doc.text(`Evaluador: ${evaluatorProfile?.nombreProfesional || assessment.evaluador?.nombre || assessment.evaluador?.email || "No especificado"}`);
    doc.text(`Participantes: ${responses.length}`);
    doc.text(`Fecha de generacion: ${new Date().toLocaleDateString("es-EC")}`);
    doc.moveDown();

    drawPdfSectionTitle(doc, "Objetivo, alcance y metodologia");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
    drawPdfText(doc, "Objetivo");
    doc.font("Helvetica").fontSize(9);
    drawPdfText(doc, assessment.informeTecnico?.objetivo || defaults.objetivo, { align: "justify" });
    doc.font("Helvetica-Bold").fontSize(9);
    drawPdfText(doc, "Alcance");
    doc.font("Helvetica").fontSize(9);
    drawPdfText(doc, assessment.informeTecnico?.alcance || defaults.alcance, { align: "justify" });
    doc.font("Helvetica-Bold").fontSize(9);
    drawPdfText(doc, "Metodologia");
    doc.font("Helvetica").fontSize(9);
    drawPdfText(doc, assessment.informeTecnico?.metodologia || defaults.metodologia, { align: "justify" });

    drawPdfSectionTitle(doc, "Resultado global de la evaluacion de riesgo psicosocial");
    drawPdfSummaryTable(doc, results);
    doc.font("Helvetica").fontSize(9).fillColor("#111827");
    drawPdfText(doc, results.global?.interpretation || riskInterpretations.sin_clasificar, { align: "justify" });

    ensurePdfSpace(doc, 430);
    drawPdfSectionTitle(doc, "Resultado por dimension de la evaluacion de riesgo psicosocial");
    drawPdfDimensionChart(doc, results.dimensiones || [], { ensureSpace: false });
    drawPdfDimensionTable(doc, results.dimensiones || []);

    doc.addPage();
    drawPdfSectionTitle(doc, "Interpretacion de resultados");
    for (const risk of riskOrder) {
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#111827");
      drawPdfText(doc, riskLabel[risk]);
      doc.font("Helvetica").fontSize(9);
      drawPdfText(doc, riskInterpretations[risk], { align: "justify" });
    }

    drawPdfSectionTitle(doc, "Conclusiones");
    doc.font("Helvetica").fontSize(10);
    drawPdfText(doc, assessment.informeTecnico?.conclusiones || defaults.conclusiones, { align: "justify" });

    drawPdfSectionTitle(doc, "Recomendaciones");
    doc.font("Helvetica").fontSize(10);
    for (const recommendation of results.recomendaciones || []) {
      ensurePdfSpace(doc, 32);
      drawPdfText(doc, `- ${recommendation}`, { paragraphGap: 5 });
    }

    drawPdfActionPlan(doc, results.planAccion || []);
    drawPdfDossier(doc, assessment);

    doc.moveDown();
    doc.fontSize(9).fillColor("#6B7280").text(
      "Este informe se genera con base en la metodologia y rangos de interpretacion del Cuestionario de Evaluacion Psicosocial en Espacios Laborales. El archivo Excel generado conserva el respaldo de Base de datos, Tabulacion, Resultados, Grafico, Definicion Dimensiones, Items y Datos.",
      doc.page.margins.left,
      doc.y,
      { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "justify" }
    );
    drawSignatureBlock(doc, assessment, evaluatorProfile, includeSignature);
    doc.end();
  });

const addQuestionnaireSheet = (workbook, questionnaire) => {
  const ws = workbook.addWorksheet("Cuestionario");
  ws.columns = [{ width: 8 }, { width: 84 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 18 }];
  addTitle(ws, "CUESTIONARIO DE EVALUACION PSICOSOCIAL EN ESPACIOS LABORALES", 6);
  ws.getRow(1).height = 24;
  ws.addRow([]);
  const introRow = ws.addRow(["Instrucciones para completar el cuestionario:"]);
  ws.mergeCells(introRow.number, 1, introRow.number, 6);
  introRow.getCell(1).font = { bold: true };
  questionnaire.instrucciones?.forEach((instruction, index) => {
    const row = ws.addRow([`${index + 1}. ${instruction}`]);
    ws.mergeCells(row.number, 1, row.number, 6);
    row.height = 28;
  });
  const thanksRow = ws.addRow(["Muchas gracias por su colaboracion"]);
  ws.mergeCells(thanksRow.number, 1, thanksRow.number, 6);
  thanksRow.getCell(1).font = { bold: true };
  ws.addRow([]);
  ws.addRow(["NR", "Item", ...questionnaire.opcionesRespuesta.map((option) => `${option.label} (${option.value})`)]);
  styleHeader(ws.lastRow);
  questionnaire.preguntas.filter((question) => question.order <= 58).forEach((question) => {
    const row = ws.addRow([question.order, question.text, "", "", "", ""]);
    row.height = 34;
  });
  applyBorders(ws);
};

const addDatabaseSheet = (workbook, questionnaire, responses) => {
  const ws = workbook.addWorksheet("Base de datos");
  const questions = questionnaire.preguntas.filter((question) => question.order <= 58);
  const headers = [
    "No de Cuestionario",
    "A. Fecha",
    "B. Provincia",
    "C. Ciudad",
    "D. Area en el que trabaja",
    "E. Nivel mas alto de instruccion",
    "F. Antiguedad, anos de experiencia dentro de la empresa o institucion",
    "G. Edad del trabajador o servidor",
    "H. Auto-identificacion etnica",
    "I. Sexo del trabajador o servidor",
    ...questions.map((question) => `ITEM ${question.order}. ${question.text}`),
    "Observaciones y comentarios"
  ];
  ws.addRow(['BASE DE DATOS "CUESTIONARIO DE EVALUACION PSICOSOCIAL EN ESPACIOS LABORALES"']);
  ws.mergeCells(1, 1, 1, 10);
  ws.getRow(1).height = 24;
  ws.addRow([`Numero total de cuestionarios aplicados: ${responses.length}`]);
  ws.mergeCells(2, 1, 2, 10);
  ws.addRow(headers);
  ws.getRow(3).height = 92;
  styleHeader(ws.getRow(3));

  responses.forEach((response, index) => {
    const metadata = response.participante?.metadata || {};
    const answers = answerMap(response);
    ws.addRow([
      `CUESTIONARIO ${index + 1}`,
      metadata.fecha || "",
      metadata.provincia || "",
      metadata.ciudad || "",
      metadata.areaTrabajo || response.participante?.area || "",
      metadata.nivelInstruccion || "",
      metadata.antiguedad || "",
      metadata.edad || "",
      metadata.autoIdentificacionEtnica || "",
      metadata.sexo || "",
      ...questions.map((question) => answers.get(question.order) || ""),
      metadata.observaciones || ""
    ]);
  });
  ws.columns = headers.map((_, index) => ({ width: index < 10 ? 24 : 18 }));
  applyBorders(ws);
};

const addTabulationSheet = (workbook, questionnaire, tabulation) => {
  const ws = workbook.addWorksheet("Tabulacion");
  const dimensions = questionnaire.dimensiones;
  const headers = ["N. CUESTIONARIO", ...dimensions.flatMap((dimension) => [`${dimension.code}. ${dimension.name}`, "Resultado"]), "Resultado global", "Resultado global"];
  ws.addRow(['TABULACION "CUESTIONARIO DE EVALUACION DE RIESGO PSICOSOCIAL"']);
  ws.mergeCells(1, 1, 1, 10);
  ws.addRow(headers);
  ws.getRow(2).height = 44;
  styleHeader(ws.getRow(2));
  tabulation.forEach((row) => {
    ws.addRow([
      row.questionnaireLabel,
      ...dimensions.flatMap((dimension) => {
        const result = row.dimensiones.find((item) => item.code === dimension.code);
        return [result?.score || 0, result?.riskLabel || ""];
      }),
      row.global?.score || 0,
      row.global?.riskLabel || ""
    ]);
  });
  ws.columns = headers.map((_, index) => ({ width: index === 0 ? 22 : 20 }));
  applyBorders(ws);
};

const addResultsSheet = (workbook, results) => {
  const ws = workbook.addWorksheet("Resultados");
  ws.columns = [{ width: 62 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 4 }, { width: 70 }, { width: 16 }, { width: 16 }, { width: 16 }];
  ws.addRow([]);
  ws.addRow(["RESULTADO POR DIMENSION DE LA EVALUACION DE RIESGO PSICOSOCIAL", "", "", "", "", "RESULTADO GLOBAL DE LA EVALUACION DE RIESGO PSICOSOCIAL", "RIESGO BAJO", "RIESGO MEDIO", "RIESGO ALTO"]);
  ws.addRow(["DIMENSIONES DEL CUESTIONARIO", "RIESGO BAJO", "RIESGO MEDIO", "RIESGO ALTO", "", "", (results.global?.bajoPct || 0) / 100, (results.global?.medioPct || 0) / 100, (results.global?.altoPct || 0) / 100]);
  styleHeader(ws.getRow(2));
  styleHeader(ws.getRow(3));
  for (const dimension of results.dimensiones || []) {
    ws.addRow([dimension.name, (dimension.bajoPct || 0) / 100, (dimension.medioPct || 0) / 100, (dimension.altoPct || 0) / 100]);
  }
  ["B", "C", "D", "G", "H", "I"].forEach((column) => {
    ws.getColumn(column).numFmt = "0%";
  });
  ws.addRow([]);
  ws.addRow(["INTERPRETACION DE RESULTADOS"]);
  for (const risk of riskOrder) ws.addRow([riskLabel[risk], riskInterpretations[risk]]);
  ws.addRow([]);
  ws.addRow(["RECOMENDACIONES"]);
  (results.recomendaciones || []).forEach((recommendation) => ws.addRow([recommendation]));
  applyBorders(ws);
};

const addChartSheet = (workbook, results) => {
  const ws = workbook.addWorksheet("Grafico");
  ws.columns = [{ width: 42 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 18 }];
  ws.addRow(["Evaluacion de riesgo psicosocial por dimension"]);
  ws.mergeCells(1, 1, 1, 5);
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A1").alignment = { horizontal: "center" };
  ws.addRow(["El grafico superior se alimenta de la hoja Resultados. La tabla inferior conserva los porcentajes para auditoria."]);
  ws.mergeCells(2, 1, 2, 5);
  ws.getCell("A2").font = { italic: true, color: { argb: "FF5A5A5A" } };
  for (let row = 3; row <= 34; row += 1) ws.addRow([]);
  ws.addRow(["Dimension", "Riesgo Bajo", "Riesgo Medio", "Riesgo Alto", "Predominante"]);
  styleHeader(ws.getRow(35));
  (results.dimensiones || []).forEach((dimension) => {
    ws.addRow([
      dimension.name,
      (dimension.bajoPct || 0) / 100,
      (dimension.medioPct || 0) / 100,
      (dimension.altoPct || 0) / 100,
      riskLabel[dimension.dominantRisk] || "SIN CLASIFICAR"
    ]);
  });
  ["B", "C", "D"].forEach((column) => {
    ws.getColumn(column).numFmt = "0%";
  });
  applyBorders(ws);
};

const addDefinitionsSheet = (workbook, questionnaire) => {
  const ws = workbook.addWorksheet("Definicion Dimensiones");
  ws.columns = [{ width: 42 }, { width: 80 }, { width: 16 }, { width: 24 }, { width: 16 }, { width: 16 }, { width: 16 }];
  ws.addRow(["Dimensiones", "Definiciones", "Cantidad de Items", "Numero de los Items", "Riesgo Bajo", "Riesgo Medio", "Riesgo Alto"]);
  styleHeader(ws.getRow(1));
  questionnaire.dimensiones.forEach((dimension) => {
    ws.addRow([
      dimension.name,
      dimension.description || "",
      dimension.items.length,
      dimension.items.join(", "),
      rangeText(dimension.ranges?.bajo),
      rangeText(dimension.ranges?.medio),
      rangeText(dimension.ranges?.alto)
    ]);
  });
  ws.addRow(["Resultado Global", "", 58, "1 al 58", rangeText(questionnaire.reglasPuntuacion.global.ranges.bajo), rangeText(questionnaire.reglasPuntuacion.global.ranges.medio), rangeText(questionnaire.reglasPuntuacion.global.ranges.alto)]);
  applyBorders(ws);
};

const addItemsSheet = (workbook, questionnaire) => {
  const ws = workbook.addWorksheet("Items");
  ws.columns = [{ width: 10 }, { width: 44 }, { width: 90 }];
  ws.addRow(["ID", "DATOS", "DEFINICION"]);
  styleHeader(ws.getRow(1));
  ws.addRows([
    ["A", "Fecha", "n/a"],
    ["B", "Nombre Empresa / institucion", "n/a"],
    ["C", "Area / Departamento", "n/a"],
    [],
    ["NR", "DIMENSION", "ITEM"]
  ]);
  styleHeader(ws.getRow(6));
  questionnaire.preguntas.forEach((question) => ws.addRow([question.order, question.dimension, question.text]));
  applyBorders(ws);
};

const addDataSheet = (workbook, questionnaire) => {
  const ws = workbook.addWorksheet("Datos");
  ws.columns = [{ width: 34 }, { width: 8 }, { width: 8 }];
  ws.addRow(["OPCIONES DE RESPUESTA CUESTIONARIO", "", ""]);
  styleHeader(ws.getRow(1));
  questionnaire.opcionesRespuesta.forEach((option) => ws.addRow([option.label, "X", option.value]));
  applyBorders(ws);
};

const chartSeriesXml = ({ index, titleCell, color, valueRange }) => `
        <c:ser>
          <c:idx val="${index}"/>
          <c:order val="${index}"/>
          <c:tx><c:strRef><c:f>Resultados!$${titleCell}</c:f></c:strRef></c:tx>
          <c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></c:spPr>
          <c:cat><c:strRef><c:f>Resultados!$A$4:$A$19</c:f></c:strRef></c:cat>
          <c:val><c:numRef><c:f>Resultados!$${valueRange}</c:f></c:numRef></c:val>
        </c:ser>`;

const buildPsychosocialChartXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:lang val="es-EC"/>
  <c:roundedCorners val="0"/>
  <c:chart>
    <c:title>
      <c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-EC" sz="1400" b="1"/><a:t>Evaluación de riesgo psicosocial por dimensión</a:t></a:r></a:p></c:rich></c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:plotArea>
      <c:layout/>
      <c:barChart>
        <c:barDir val="col"/>
        <c:grouping val="clustered"/>
${chartSeriesXml({ index: 0, titleCell: "B$3", color: GREEN, valueRange: "B$4:$B$19" })}
${chartSeriesXml({ index: 1, titleCell: "C$3", color: AMBER, valueRange: "C$4:$C$19" })}
${chartSeriesXml({ index: 2, titleCell: "D$3", color: RED, valueRange: "D$4:$D$19" })}
        <c:axId val="123456"/>
        <c:axId val="123457"/>
      </c:barChart>
      <c:catAx>
        <c:axId val="123456"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="b"/>
        <c:numFmt formatCode="General" sourceLinked="1"/>
        <c:tickLblPos val="nextTo"/>
        <c:txPr><a:bodyPr rot="-5400000"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="700"/></a:pPr></a:p></c:txPr>
        <c:crossAx val="123457"/>
        <c:crosses val="autoZero"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="123457"/>
        <c:scaling><c:orientation val="minMax"/><c:max val="1"/><c:min val="0"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="l"/>
        <c:majorGridlines/>
        <c:numFmt formatCode="0%" sourceLinked="0"/>
        <c:majorUnit val="0.1"/>
        <c:tickLblPos val="nextTo"/>
        <c:crossAx val="123456"/>
        <c:crosses val="autoZero"/>
      </c:valAx>
    </c:plotArea>
    <c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend>
    <c:plotVisOnly val="1"/>
    <c:dispBlanksAs val="gap"/>
  </c:chart>
</c:chartSpace>`;

const buildChartDrawingXml = (relationshipId) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <xdr:twoCellAnchor>
    <xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>14</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>34</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Grafico de riesgo psicosocial"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
      <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${relationshipId}"/></a:graphicData></a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>`;

const nextPartNumber = (zip, prefix, suffix) => {
  const numbers = Object.keys(zip.files)
    .filter((name) => name.startsWith(prefix) && name.endsWith(suffix))
    .map((name) => Number(name.slice(prefix.length, -suffix.length)))
    .filter(Number.isFinite);
  return numbers.length ? Math.max(...numbers) + 1 : 1;
};

const nextRelationshipId = (relsXml = "") => {
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((match) => Number(match[1])).filter(Number.isFinite);
  return `rId${ids.length ? Math.max(...ids) + 1 : 1}`;
};

const ensureContentTypeOverride = (contentTypesXml, partName, contentType) => {
  if (contentTypesXml.includes(`PartName="${partName}"`)) return contentTypesXml;
  return contentTypesXml.replace(
    "</Types>",
    `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`
  );
};

const findWorksheetPath = async (zip, sheetName) => {
  const workbookXml = await zip.file("xl/workbook.xml").async("string");
  const workbookRelsXml = await zip.file("xl/_rels/workbook.xml.rels").async("string");
  const escapedName = xmlEscape(sheetName);
  const sheetMatch = workbookXml.match(new RegExp(`<sheet[^>]+name="${escapedName}"[^>]+r:id="([^"]+)"[^>]*/>`));
  if (!sheetMatch) return null;
  const relMatch = workbookRelsXml.match(new RegExp(`<Relationship[^>]+Id="${sheetMatch[1]}"[^>]+Target="([^"]+)"[^>]*/>`));
  if (!relMatch) return null;
  return `xl/${relMatch[1].replace(/^\/?xl\//, "")}`;
};

const embedPsychosocialChart = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const worksheetPath = await findWorksheetPath(zip, "Grafico");
  if (!worksheetPath || !zip.file(worksheetPath)) return buffer;

  const chartNumber = nextPartNumber(zip, "xl/charts/chart", ".xml");
  const drawingNumber = nextPartNumber(zip, "xl/drawings/drawing", ".xml");
  const chartPath = `xl/charts/chart${chartNumber}.xml`;
  const drawingPath = `xl/drawings/drawing${drawingNumber}.xml`;
  const drawingRelsPath = `xl/drawings/_rels/drawing${drawingNumber}.xml.rels`;
  const worksheetRelsPath = worksheetPath.replace("xl/worksheets/", "xl/worksheets/_rels/") + ".rels";

  zip.file(chartPath, buildPsychosocialChartXml());
  zip.file(drawingPath, buildChartDrawingXml("rId1"));
  zip.file(
    drawingRelsPath,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${chartNumber}.xml"/></Relationships>`
  );

  const currentRelsXml = zip.file(worksheetRelsPath)
    ? await zip.file(worksheetRelsPath).async("string")
    : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;
  const drawingRelId = nextRelationshipId(currentRelsXml);
  const updatedRelsXml = currentRelsXml.replace(
    "</Relationships>",
    `<Relationship Id="${drawingRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingNumber}.xml"/></Relationships>`
  );
  zip.file(worksheetRelsPath, updatedRelsXml);

  let worksheetXml = await zip.file(worksheetPath).async("string");
  if (!worksheetXml.includes("xmlns:r=")) {
    worksheetXml = worksheetXml.replace(
      "<worksheet ",
      '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    );
  }
  if (!worksheetXml.includes("<drawing ")) {
    worksheetXml = worksheetXml.replace("</worksheet>", `<drawing r:id="${drawingRelId}"/></worksheet>`);
  }
  zip.file(worksheetPath, worksheetXml);

  let contentTypesXml = await zip.file("[Content_Types].xml").async("string");
  contentTypesXml = ensureContentTypeOverride(
    contentTypesXml,
    `/xl/charts/chart${chartNumber}.xml`,
    "application/vnd.openxmlformats-officedocument.drawingml.chart+xml"
  );
  contentTypesXml = ensureContentTypeOverride(
    contentTypesXml,
    `/xl/drawings/drawing${drawingNumber}.xml`,
    "application/vnd.openxmlformats-officedocument.drawing+xml"
  );
  zip.file("[Content_Types].xml", contentTypesXml);

  return zip.generateAsync({ type: "nodebuffer" });
};

const addActionPlanSheet = (workbook, results, assessment, evaluatorProfile) => {
  const ws = workbook.addWorksheet("Plan de accion");
  ws.columns = [
    { width: 36 },
    { width: 12 },
    { width: 46 },
    { width: 32 },
    { width: 16 },
    { width: 44 },
    { width: 16 }
  ];
  ws.addRow(["PLAN DE ACCION PARA FACTORES DE RIESGO PSICOSOCIAL"]);
  ws.mergeCells(1, 1, 1, 7);
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.addRow(["Empresa", assessment.empresa?.nombreComercial || assessment.empresa?.razonSocial || ""]);
  ws.addRow(["Evaluador", evaluatorProfile?.nombreProfesional || assessment.evaluador?.nombre || ""]);
  ws.addRow(["Registro profesional", evaluatorProfile?.registroProfesional || ""]);
  ws.addRow([]);
  ws.addRow(["Dimension", "Riesgo", "Hallazgo", "Accion", "Responsable", "Medio de verificacion", "Estado"]);
  styleHeader(ws.getRow(6));
  (results.planAccion || []).forEach((item) => {
    ws.addRow([item.dimension, item.riesgo, item.hallazgo, item.accion, item.responsable, item.verificacion, item.estado]);
  });
  applyBorders(ws);
};

const addDossierSheet = (workbook, assessment) => {
  const ws = workbook.addWorksheet("Expediente");
  const dossier = assessment.expediente || {};
  const socialization = dossier.socializacion || {};
  ws.columns = [{ width: 34 }, { width: 70 }, { width: 28 }, { width: 44 }, { width: 44 }];
  ws.addRow(["EXPEDIENTE TECNICO DE CUMPLIMIENTO"]);
  ws.mergeCells(1, 1, 1, 5);
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A1").alignment = { horizontal: "center" };
  ws.addRow(["Empresa", assessment.empresa?.nombreComercial || assessment.empresa?.razonSocial || ""]);
  ws.addRow(["Estado del expediente", dossier.estado || "borrador"]);
  ws.addRow(["Listo para inspeccion", dossier.listoParaInspeccion ? "Si" : "No"]);
  ws.addRow(["Fecha de revision", dossier.fechaRevision ? new Date(dossier.fechaRevision).toLocaleDateString("es-EC") : ""]);
  ws.addRow(["Fecha de firma", dossier.fechaFirma ? new Date(dossier.fechaFirma).toLocaleDateString("es-EC") : ""]);
  ws.addRow(["Fecha de cierre", dossier.fechaCierre ? new Date(dossier.fechaCierre).toLocaleDateString("es-EC") : ""]);
  ws.addRow(["Observaciones", dossier.observaciones || ""]);
  ws.addRow([]);
  ws.addRow(["SOCIALIZACION DE RESULTADOS"]);
  ws.getRow(10).font = { bold: true };
  ws.addRow(["Realizada", socialization.realizada ? "Si" : "No"]);
  ws.addRow(["Fecha", socialization.fecha ? new Date(socialization.fecha).toLocaleDateString("es-EC") : ""]);
  ws.addRow(["Responsable", socialization.responsable || ""]);
  ws.addRow(["Participantes socializados", socialization.participantes || ""]);
  ws.addRow(["Observaciones", socialization.observaciones || ""]);
  ws.addRow([]);
  ws.addRow(["EVIDENCIAS"]);
  ws.getRow(17).font = { bold: true };
  ws.addRow(["Tipo", "Nombre", "Fecha", "Descripcion", "Archivo"]);
  styleHeader(ws.getRow(18));
  (dossier.evidencias || []).forEach((evidence) => {
    ws.addRow([
      evidence.tipo || "otro",
      evidence.nombre || evidence.archivo?.originalName || "",
      evidence.fecha ? new Date(evidence.fecha).toLocaleDateString("es-EC") : "",
      evidence.descripcion || "",
      evidence.archivo?.url || ""
    ]);
  });
  applyBorders(ws);
};

export const buildAssessmentExcel = async ({ assessment, responses, questionnaire, evaluatorProfile }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LIMPRO";
  workbook.created = new Date();
  const results = buildCurrentResults({ questionnaire, assessment, responses });
  const tabulation = results.tabulacion?.length ? results.tabulacion : tabulateResponses(questionnaire, responses);

  addQuestionnaireSheet(workbook, questionnaire);
  addDatabaseSheet(workbook, questionnaire, responses);
  addTabulationSheet(workbook, questionnaire, tabulation);
  addResultsSheet(workbook, results);
  addChartSheet(workbook, results);
  addActionPlanSheet(workbook, results, assessment, evaluatorProfile);
  addDossierSheet(workbook, assessment);
  addDefinitionsSheet(workbook, questionnaire);
  addItemsSheet(workbook, questionnaire);
  addDataSheet(workbook, questionnaire);

  workbook.eachSheet((worksheet) => {
    if (worksheet.name === "Base de datos") {
      worksheet.views = [{ state: "frozen", ySplit: 3 }];
    } else if (worksheet.rowCount > 1) {
      worksheet.views = [{ state: "frozen", ySplit: 1 }];
    }
  });

  cleanWorkbookText(workbook);
  const buffer = await workbook.xlsx.writeBuffer();
  return embedPsychosocialChart(buffer);
};
