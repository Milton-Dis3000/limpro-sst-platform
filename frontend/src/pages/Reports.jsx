import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  Circle,
  RefreshCw,
  Save
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getAssessment,
  listAssessments,
  recalculateAssessment,
  updateAssessment,
  uploadAssessmentEvidence
} from "../api/assessments.api.js";
import { downloadExcelReport, downloadPdfReport, downloadWordReport } from "../api/reports.api.js";
import RiskBar from "../components/charts/RiskBar.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import RiskBadge from "../components/ui/RiskBadge.jsx";
import { buildDefaultReportText, mergeReportDefaults } from "../utils/reportDefaults.js";

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const asLines = (items = []) => items.join("\n");
const fromLines = (value = "") => value.split("\n").map((item) => item.trim()).filter(Boolean);
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const dominantRisk = (item = {}) => {
  const values = [
    ["alto", item.altoPct || 0],
    ["medio", item.medioPct || 0],
    ["bajo", item.bajoPct || 0]
  ];
  return values.sort((a, b) => b[1] - a[1])[0][0];
};

const goToSection = (sectionId) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const emptyTechnical = {
  objetivo: "",
  alcance: "",
  metodologia: "",
  conclusiones: "",
  recomendacionesText: "",
  incluirFirma: true
};

const emptyDossier = {
  estado: "borrador",
  listoParaInspeccion: false,
  observaciones: "",
  socializacion: {
    realizada: false,
    fecha: "",
    responsable: "",
    participantes: "",
    observaciones: ""
  }
};

const emptyEvidence = {
  tipo: "acta",
  nombre: "",
  descripcion: "",
  fecha: "",
  file: null
};

export default function Reports() {
  const fileInputRef = useRef(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [technical, setTechnical] = useState(emptyTechnical);
  const [dossier, setDossier] = useState(emptyDossier);
  const [evidence, setEvidence] = useState(emptyEvidence);
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selected = useMemo(
    () => assessments.find((assessment) => assessment._id === selectedId) || assessments[0],
    [assessments, selectedId]
  );

  useEffect(() => {
    listAssessments()
      .then(({ data }) => {
        setAssessments(data);
        setSelectedId(data[0]?._id || "");
      })
      .catch(() => toast.error("No se pudieron cargar las evaluaciones."));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getAssessment(selectedId)
      .then(({ data }) => hydrateDetail(data))
      .catch(() => toast.error("No se pudo cargar la vista previa."));
  }, [selectedId]);

  const hydrateDetail = (data, options = {}) => {
    setDetail(data);
    setHasUnsavedChanges(false);
    const report = data.informeTecnico || {};
    const defaults = options.refreshGenerated
      ? { ...mergeReportDefaults(data, report), conclusiones: buildDefaultReportText(data).conclusiones }
      : mergeReportDefaults(data, report);
    const automaticRecommendations = data.resultadosCalculados?.recomendaciones || [];
    const automaticPlan = data.resultadosCalculados?.planAccion || [];
    const expediente = data.expediente || {};
    setTechnical({
      objetivo: defaults.objetivo,
      alcance: defaults.alcance,
      metodologia: defaults.metodologia,
      conclusiones: defaults.conclusiones,
      recomendacionesText: asLines(options.refreshGenerated ? automaticRecommendations : report.recomendaciones?.length ? report.recomendaciones : automaticRecommendations),
      incluirFirma: report.incluirFirma !== false
    });
    setDossier({
      estado: expediente.estado || "borrador",
      listoParaInspeccion: Boolean(expediente.listoParaInspeccion),
      observaciones: expediente.observaciones || "",
      socializacion: {
        realizada: Boolean(expediente.socializacion?.realizada),
        fecha: toDateInput(expediente.socializacion?.fecha),
        responsable: expediente.socializacion?.responsable || "",
        participantes: expediente.socializacion?.participantes || "",
        observaciones: expediente.socializacion?.observaciones || ""
      }
    });
    setPlan(options.refreshGenerated ? automaticPlan : report.planAccion?.length ? report.planAccion : automaticPlan);
  };

  const filenameBase = selected
    ? `limpro-${selected.empresa?.nombreComercial || "evaluacion"}-${selected._id}`.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()
    : "limpro-reporte";

  const payload = () => ({
    informeTecnico: {
      objetivo: technical.objetivo,
      alcance: technical.alcance,
      metodologia: technical.metodologia,
      conclusiones: technical.conclusiones,
      recomendaciones: fromLines(technical.recomendacionesText),
      planAccion: plan,
      incluirFirma: technical.incluirFirma
    },
    expediente: {
      ...(detail?.expediente || {}),
      estado: dossier.estado,
      listoParaInspeccion: dossier.listoParaInspeccion || dossier.estado === "cerrado",
      observaciones: dossier.observaciones,
      socializacion: {
        realizada: dossier.socializacion.realizada,
        fecha: dossier.socializacion.fecha || undefined,
        responsable: dossier.socializacion.responsable,
        participantes: Number(dossier.socializacion.participantes) || 0,
        observaciones: dossier.socializacion.observaciones
      }
    }
  });

  const savePreview = async () => {
    if (!selected?._id) return;
    setLoading("save");
    try {
      const { data } = await updateAssessment(selected._id, payload());
      hydrateDetail(data);
      toast.success("Expediente guardado.");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo guardar.");
    } finally {
      setLoading("");
    }
  };

  const recalculate = async () => {
    if (!selected?._id) return;
    setLoading("recalculate");
    try {
      const { data } = await recalculateAssessment(selected._id);
      hydrateDetail(data, { refreshGenerated: true });
      toast.success("Resultados recalculados.");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo recalcular.");
    } finally {
      setLoading("");
    }
  };

  const uploadEvidence = async () => {
    if (!selected?._id || !evidence.file) {
      toast.error("Selecciona un archivo de evidencia.");
      return;
    }
    setLoading("evidence");
    try {
      const formData = new FormData();
      formData.append("file", evidence.file);
      formData.append("tipo", evidence.tipo);
      formData.append("nombre", evidence.nombre || evidence.file.name);
      formData.append("descripcion", evidence.descripcion);
      if (evidence.fecha) formData.append("fecha", evidence.fecha);
      const { data } = await uploadAssessmentEvidence(selected._id, formData);
      hydrateDetail(data);
      setEvidence(emptyEvidence);
      toast.success("Evidencia agregada.");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo subir la evidencia.");
    } finally {
      setLoading("");
    }
  };

  const download = async (type) => {
    if (!selected?._id) return;
    setLoading(type);
    try {
      await updateAssessment(selected._id, payload());
      const response = type === "pdf"
        ? await downloadPdfReport(selected._id, { firmaIncluida: technical.incluirFirma })
        : type === "word"
          ? await downloadWordReport(selected._id, { firmaIncluida: technical.incluirFirma })
          : await downloadExcelReport(selected._id);
      const extension = type === "pdf" ? "pdf" : type === "word" ? "docx" : "xlsx";
      saveBlob(response.data, `${filenameBase}.${extension}`);
      toast.success(`Reporte ${type.toUpperCase()} generado.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo generar el reporte.");
    } finally {
      setLoading("");
    }
  };

  const updatePlan = (index, field, value) => {
    setHasUnsavedChanges(true);
    setPlan((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const updateTechnical = (field, value) => {
    setHasUnsavedChanges(true);
    setTechnical((current) => ({ ...current, [field]: value }));
  };
  const updateDossier = (field, value) => {
    setHasUnsavedChanges(true);
    setDossier((current) => ({ ...current, [field]: value }));
  };
  const updateSocialization = (field, value) => {
    setHasUnsavedChanges(true);
    setDossier((current) => ({
      ...current,
      socializacion: { ...current.socializacion, [field]: value }
    }));
  };

  const global = detail?.resultadosCalculados?.global || {};
  const dimensions = detail?.resultadosCalculados?.dimensiones || [];
  const evidences = detail?.expediente?.evidencias || [];
  const checklist = [
    {
      label: "Resultados calculados",
      done: Boolean(detail?.resultadosCalculados?.updatedAt || dimensions.length),
      help: "Recalcula cuando ingresen nuevas encuestas.",
      sectionId: "report-control",
      action: "Ir a recalcular"
    },
    {
      label: "Informe tecnico completo",
      done: Boolean(technical.objetivo && technical.alcance && technical.metodologia && technical.conclusiones),
      help: "Completa objetivo, alcance, metodologia y conclusiones.",
      sectionId: "technical-text",
      action: "Ir al texto"
    },
    {
      label: "Plan de accion definido",
      done: plan.length > 0,
      help: "Revisa medidas, responsables, plazos y verificaciones.",
      sectionId: "action-plan",
      action: "Ir al plan"
    },
    {
      label: "Socializacion registrada",
      done: dossier.socializacion.realizada,
      help: "Marca la socializacion y registra fecha/responsable.",
      sectionId: "socialization",
      action: "Ir a socializacion"
    },
    {
      label: "Evidencias adjuntas",
      done: evidences.length > 0,
      help: "Adjunta actas, fotos, planes u otros respaldos.",
      sectionId: "evidences",
      action: "Ir a evidencias"
    },
    {
      label: "Firma habilitada",
      done: technical.incluirFirma,
      help: "Activa o desactiva el bloque de firma del informe.",
      sectionId: "report-control",
      action: "Ir a firma"
    },
    {
      label: "Listo para inspeccion",
      done: dossier.listoParaInspeccion || dossier.estado === "cerrado",
      help: "Marca listo para inspeccion cuando el expediente este completo.",
      sectionId: "report-control",
      action: "Ir a estado"
    }
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Reportes y expediente</h2>
          <p className="text-sm text-[#5A5A5A]">Vista previa editable, evidencias, socializacion y documentos de respaldo.</p>
        </div>
        <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-sm" value={selected?._id || ""} onChange={(event) => setSelectedId(event.target.value)}>
          {assessments.map((assessment) => (
            <option key={assessment._id} value={assessment._id}>
              {assessment.empresa?.nombreComercial || "Empresa"} - {assessment.tipo} - {assessment.totalParticipantes} participantes
            </option>
          ))}
        </select>
      </div>

      {!selected && <Card>No hay evaluaciones disponibles para generar reportes.</Card>}

      {selected && (
        <div className="grid gap-6">
          <div className="grid gap-4">
            <Card id="report-control" className="scroll-mt-24">
              <h3 className="text-lg font-black">Control del expediente</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={recalculate} disabled={loading === "recalculate"}><RefreshCw size={16} /> Recalcular resultados</Button>
                <Button variant="secondary" onClick={savePreview} disabled={loading === "save"}><Save size={16} /> Guardar expediente</Button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm font-semibold">
                  Estado
                  <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-sm" value={dossier.estado} onChange={(event) => updateDossier("estado", event.target.value)}>
                    <option value="borrador">Borrador</option>
                    <option value="revisado">Revisado</option>
                    <option value="firmado">Firmado</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={dossier.listoParaInspeccion} onChange={(event) => updateDossier("listoParaInspeccion", event.target.checked)} />
                  Listo para inspeccion
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={technical.incluirFirma} onChange={(event) => updateTechnical("incluirFirma", event.target.checked)} />
                  Incluir bloque de firma
                </label>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="text-[#C2410C]" size={20} />
                <h3 className="text-lg font-black">Checklist</h3>
              </div>
              <p className="mt-2 text-sm text-[#5A5A5A]">Usa cada boton para ir directamente a la seccion que completa ese punto.</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {checklist.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goToSection(item.sectionId)}
                    className={`grid gap-2 rounded-lg border px-4 py-3 text-left text-sm transition hover:border-[#F97316] hover:bg-orange-50 sm:grid-cols-[1fr_auto] sm:items-center ${item.done ? "border-green-100 bg-green-50/40" : "border-zinc-100 bg-white"}`}
                  >
                    <span className="flex items-start gap-3">
                      {item.done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" /> : <Circle size={18} className="mt-0.5 shrink-0 text-zinc-300" />}
                      <span>
                        <span className="block font-bold text-[#2E2E2E]">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-[#5A5A5A]">{item.help}</span>
                      </span>
                    </span>
                    <span className="inline-flex items-center justify-end gap-1 text-xs font-bold text-[#C2410C]">
                      {item.action} <ArrowRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Card id="socialization" className="scroll-mt-24">
              <h3 className="text-lg font-black">Socializacion</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={dossier.socializacion.realizada} onChange={(event) => updateSocialization("realizada", event.target.checked)} />
                  Resultados socializados
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Fecha
                  <input type="date" className="h-12 rounded-lg border border-zinc-200 px-4 text-sm" value={dossier.socializacion.fecha} onChange={(event) => updateSocialization("fecha", event.target.value)} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Responsable
                  <input className="h-12 rounded-lg border border-zinc-200 px-4 text-sm" value={dossier.socializacion.responsable} onChange={(event) => updateSocialization("responsable", event.target.value)} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Participantes socializados
                  <input type="number" min="0" className="h-12 rounded-lg border border-zinc-200 px-4 text-sm" value={dossier.socializacion.participantes} onChange={(event) => updateSocialization("participantes", event.target.value)} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Observaciones
                  <textarea className="min-h-20 rounded-lg border border-zinc-200 p-4 text-sm" value={dossier.socializacion.observaciones} onChange={(event) => updateSocialization("observaciones", event.target.value)} />
                </label>
              </div>
            </Card>

            <Card id="evidences" className="scroll-mt-24">
              <div className="flex items-center gap-2">
                <FileUp className="text-[#C2410C]" size={20} />
                <h3 className="text-lg font-black">Evidencias</h3>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-sm" value={evidence.tipo} onChange={(event) => setEvidence((current) => ({ ...current, tipo: event.target.value }))}>
                  <option value="acta">Acta</option>
                  <option value="capacitacion">Capacitacion</option>
                  <option value="foto">Foto</option>
                  <option value="comunicado">Comunicado</option>
                  <option value="plan">Plan de accion</option>
                  <option value="otro">Otro</option>
                </select>
                <input className="h-12 rounded-lg border border-zinc-200 px-4 text-sm" placeholder="Nombre de evidencia" value={evidence.nombre} onChange={(event) => setEvidence((current) => ({ ...current, nombre: event.target.value }))} />
                <input type="date" className="h-12 rounded-lg border border-zinc-200 px-4 text-sm" value={evidence.fecha} onChange={(event) => setEvidence((current) => ({ ...current, fecha: event.target.value }))} />
                <textarea className="min-h-20 rounded-lg border border-zinc-200 p-4 text-sm md:col-span-2" placeholder="Descripcion" value={evidence.descripcion} onChange={(event) => setEvidence((current) => ({ ...current, descripcion: event.target.value }))} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={(event) => setEvidence((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                />
                <div className="grid gap-2 rounded-lg border border-dashed border-zinc-300 p-4 md:col-span-2">
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <FileUp size={16} /> Elegir archivo
                  </Button>
                  <p className="text-xs text-[#5A5A5A]">
                    {evidence.file ? evidence.file.name : "Ningun archivo seleccionado. Acepta imagen, PDF, Word o Excel."}
                  </p>
                </div>
                <Button className="md:col-span-2" variant="secondary" onClick={uploadEvidence} disabled={loading === "evidence"}><FileUp size={16} /> Subir evidencia</Button>
              </div>
              <div className="mt-4 grid gap-2">
                {evidences.map((item) => (
                  <a key={item._id || item.archivo?.url} href={item.archivo?.url} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-100 px-3 py-2 text-sm hover:bg-zinc-50">
                    <span className="font-bold">{item.tipo}</span> - {item.nombre || item.archivo?.originalName}
                  </a>
                ))}
                {!evidences.length && <p className="text-sm text-[#5A5A5A]">Aun no hay evidencias adjuntas.</p>}
              </div>
            </Card>

            <Card>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-zinc-100 p-4">
                  <FileText className="text-[#C2410C]" />
                  <h3 className="mt-3 text-lg font-black">PDF visual</h3>
                  <p className="mt-1 text-xs text-[#5A5A5A]">Informe final con graficos y formato de entrega.</p>
                  <Button className="mt-4" disabled={!selected || loading === "pdf"} onClick={() => download("pdf")}><Download size={16} /> {loading === "pdf" ? "Generando..." : "Generar PDF"}</Button>
                </div>
                <div className="rounded-lg border border-zinc-100 p-4">
                  <FileText className="text-[#C2410C]" />
                  <h3 className="mt-3 text-lg font-black">Word editable</h3>
                  <p className="mt-1 text-xs text-[#5A5A5A]">Version segura sin imagenes incrustadas para editar texto.</p>
                  <Button className="mt-4" disabled={!selected || loading === "word"} onClick={() => download("word")}><Download size={16} /> {loading === "word" ? "Generando..." : "Generar Word"}</Button>
                </div>
                <div className="rounded-lg border border-zinc-100 p-4">
                  <FileSpreadsheet className="text-[#C2410C]" />
                  <h3 className="mt-3 text-lg font-black">Excel tecnico</h3>
                  <p className="mt-1 text-xs text-[#5A5A5A]">Respaldo con base de datos, tabulacion y grafico editable.</p>
                  <Button className="mt-4" disabled={!selected || loading === "excel"} onClick={() => download("excel")}><Download size={16} /> {loading === "excel" ? "Generando..." : "Generar Excel"}</Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card id="technical-text" className="scroll-mt-24">
              <p className="text-sm text-[#5A5A5A]">{detail?.empresa?.nombreComercial}</p>
              <h3 className="text-2xl font-black">Preview del informe</h3>
              <div className="mt-4 grid gap-3 text-sm">
                <p><span className="font-bold">{detail?.totalParticipantes || 0}</span> participantes</p>
                <p><span className="font-bold text-green-700">{global.bajoPct || 0}%</span> bajo</p>
                <p><span className="font-bold text-amber-700">{global.medioPct || 0}%</span> medio</p>
                <p><span className="font-bold text-red-700">{global.altoPct || 0}%</span> alto</p>
              </div>
              <div className="mt-4"><RiskBar bajo={global.bajoPct || 0} medio={global.medioPct || 0} alto={global.altoPct || 0} /></div>
              {global.dominantRisk && <div className="mt-4"><RiskBadge risk={dominantRisk(global)} /></div>}
            </Card>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">Texto tecnico</h3>
                  {hasUnsavedChanges && <p className="text-xs font-semibold text-amber-700">Hay cambios sin guardar.</p>}
                </div>
                <Button variant="secondary" onClick={savePreview} disabled={loading === "save"}>
                  <Save size={16} /> {loading === "save" ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
              <div className="mt-4 grid gap-3">
                {["objetivo", "alcance", "metodologia", "conclusiones"].map((field) => (
                  <label key={field} className="grid gap-1 text-sm font-semibold capitalize">
                    {field}
                    <textarea className="min-h-20 rounded-lg border border-zinc-200 p-4 text-sm" value={technical[field]} onChange={(event) => updateTechnical(field, event.target.value)} />
                  </label>
                ))}
                <label className="grid gap-1 text-sm font-semibold">
                  Recomendaciones
                  <textarea className="min-h-36 rounded-lg border border-zinc-200 p-4 text-sm" value={technical.recomendacionesText} onChange={(event) => updateTechnical("recomendacionesText", event.target.value)} />
                  <span className="text-xs font-normal text-[#5A5A5A]">Una recomendacion por linea.</span>
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Observaciones del expediente
                  <textarea className="min-h-20 rounded-lg border border-zinc-200 p-4 text-sm" value={dossier.observaciones} onChange={(event) => updateDossier("observaciones", event.target.value)} />
                </label>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-lg font-black">Resultados por dimension</h3>
              <div className="grid gap-3">
                {dimensions.map((dimension) => (
                  <div key={dimension.code} className="grid gap-1 border-b border-zinc-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{dimension.code}. {dimension.name}</p>
                      <RiskBadge risk={dimension.dominantRisk || dominantRisk(dimension)} />
                    </div>
                    <RiskBar bajo={dimension.bajoPct || 0} medio={dimension.medioPct || 0} alto={dimension.altoPct || 0} />
                    <p className="text-xs text-[#5A5A5A]">Bajo {dimension.bajoPct || 0}% - Medio {dimension.medioPct || 0}% - Alto {dimension.altoPct || 0}%</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="action-plan" className="scroll-mt-24 overflow-hidden p-0">
              <div className="bg-[#1F4E79] px-4 py-3 text-white">
                <h3 className="text-lg font-black">Plan de accion</h3>
                <p className="text-xs text-white/80">Riesgo alto: intervencion prioritaria. Riesgo medio: medidas preventivas. Riesgo bajo: monitoreo general.</p>
              </div>
              <div className="p-4">
                <div className="mb-4 rounded-md bg-zinc-50 p-3 text-sm text-[#3A3A3A]">
                  El plan se genera para dimensiones con riesgo medio o alto. Las dimensiones en riesgo bajo no requieren medida correctiva especifica, pero se conservan dentro del monitoreo periodico del informe.
                </div>
                {plan.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] table-fixed border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-100 text-left">
                          <th className="w-40 border border-zinc-200 px-3 py-2">Dimension</th>
                          <th className="w-24 border border-zinc-200 px-3 py-2">Riesgo</th>
                          <th className="w-64 border border-zinc-200 px-3 py-2">Hallazgo</th>
                          <th className="w-[420px] border border-zinc-200 px-3 py-2">Medida y verificacion</th>
                          <th className="w-44 border border-zinc-200 px-3 py-2">Responsable</th>
                          <th className="w-28 border border-zinc-200 px-3 py-2">Plazo</th>
                          <th className="w-32 border border-zinc-200 px-3 py-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.map((item, index) => (
                          <tr key={`${item.dimension}-${index}`} className="align-top">
                            <td className="border border-zinc-200 px-3 py-2 font-semibold">{item.dimension}</td>
                            <td className="border border-zinc-200 px-3 py-2"><RiskBadge risk={item.riesgo || "sin_clasificar"} /></td>
                            <td className="border border-zinc-200 px-3 py-2">{item.hallazgo || ""}</td>
                            <td className="border border-zinc-200 p-2">
                              <textarea className="min-h-32 w-full resize-y rounded border border-zinc-200 p-3 leading-relaxed" value={item.accion || ""} onChange={(event) => updatePlan(index, "accion", event.target.value)} />
                              <label className="mt-2 grid gap-1 text-xs font-semibold text-[#5A5A5A]">
                                Medio de verificacion
                                <textarea className="min-h-24 rounded border border-zinc-200 p-3 text-sm font-normal leading-relaxed text-[#2E2E2E]" value={item.verificacion || ""} onChange={(event) => updatePlan(index, "verificacion", event.target.value)} />
                              </label>
                            </td>
                            <td className="border border-zinc-200 p-2">
                              <input className="h-10 w-full rounded border border-zinc-200 px-2" value={item.responsable || ""} onChange={(event) => updatePlan(index, "responsable", event.target.value)} />
                            </td>
                            <td className="border border-zinc-200 p-2">
                              <input className="h-10 w-full rounded border border-zinc-200 px-2" value={item.plazo || ""} onChange={(event) => updatePlan(index, "plazo", event.target.value)} />
                            </td>
                            <td className="border border-zinc-200 p-2">
                              <select className="h-10 w-full rounded border border-zinc-200 bg-white px-2" value={item.estado || "Pendiente"} onChange={(event) => updatePlan(index, "estado", event.target.value)}>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En proceso">En proceso</option>
                                <option value="Completado">Completado</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-[#5A5A5A]">Recalcula para generar un plan de accion.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

