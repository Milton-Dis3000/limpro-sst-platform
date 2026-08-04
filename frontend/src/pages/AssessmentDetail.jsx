import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import RiskBar from "../components/charts/RiskBar.jsx";
import { getAssessment, recalculateAssessment, updateAssessment } from "../api/assessments.api.js";
import { mergeReportDefaults } from "../utils/reportDefaults.js";

const asLines = (items = []) => items.join("\n");
const fromLines = (value = "") => value.split("\n").map((item) => item.trim()).filter(Boolean);

export default function AssessmentDetail() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [technical, setTechnical] = useState({
    objetivo: "",
    alcance: "",
    metodologia: "",
    conclusiones: "",
    recomendacionesText: "",
    incluirFirma: true
  });

  const load = async () => {
    const { data } = await getAssessment(id);
    setAssessment(data);
    const informe = data.informeTecnico || {};
    const defaults = mergeReportDefaults(data, informe);
    setTechnical({
      objetivo: defaults.objetivo,
      alcance: defaults.alcance,
      metodologia: defaults.metodologia,
      conclusiones: defaults.conclusiones,
      recomendacionesText: asLines(informe.recomendaciones || data.resultadosCalculados?.recomendaciones || []),
      incluirFirma: informe.incluirFirma !== false
    });
  };

  useEffect(() => {
    load().catch(() => toast.error("No se pudo cargar la evaluación."));
  }, [id]);

  const recalculate = async () => {
    const { data } = await recalculateAssessment(id);
    setAssessment(data);
    setTechnical((current) => ({
      ...current,
      recomendacionesText: current.recomendacionesText || asLines(data.resultadosCalculados?.recomendaciones || [])
    }));
    toast.success("Resultados recalculados.");
  };

  const planPreview = useMemo(
    () => assessment?.informeTecnico?.planAccion?.length
      ? assessment.informeTecnico.planAccion
      : assessment?.resultadosCalculados?.planAccion || [],
    [assessment]
  );

  const saveTechnical = async () => {
    const payload = {
      informeTecnico: {
        objetivo: technical.objetivo,
        alcance: technical.alcance,
        metodologia: technical.metodologia,
        conclusiones: technical.conclusiones,
        recomendaciones: fromLines(technical.recomendacionesText),
        planAccion: planPreview,
        incluirFirma: technical.incluirFirma
      }
    };
    const { data } = await updateAssessment(id, payload);
    setAssessment(data);
    toast.success("Informe técnico guardado.");
  };

  const update = (field, value) => setTechnical((current) => ({ ...current, [field]: value }));

  if (!assessment) return <Card>Cargando evaluación...</Card>;
  const global = assessment.resultadosCalculados?.global || {};

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">{assessment.empresa?.nombreComercial}</h2>
          <p className="text-sm text-[#5A5A5A]">Evaluación {assessment.tipo} - {assessment.estado}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={recalculate}>Recalcular</Button>
          <Button onClick={saveTechnical}>Guardar informe técnico</Button>
        </div>
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-black">Resultado global</h3>
        <RiskBar bajo={global.bajoPct || 0} medio={global.medioPct || 0} alto={global.altoPct || 0} />
        <p className="mt-3 text-sm text-[#5A5A5A]">Bajo {global.bajoPct || 0}% - Medio {global.medioPct || 0}% - Alto {global.altoPct || 0}%</p>
      </Card>

      <Card>
        <h3 className="text-lg font-black">Informe técnico</h3>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1.5 text-sm font-semibold">
            Objetivo
            <textarea className="min-h-20 rounded-md border border-zinc-200 p-3 text-sm" value={technical.objetivo} onChange={(event) => update("objetivo", event.target.value)} placeholder="Evaluar los factores de riesgo psicosocial..." />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Alcance
            <textarea className="min-h-20 rounded-md border border-zinc-200 p-3 text-sm" value={technical.alcance} onChange={(event) => update("alcance", event.target.value)} placeholder="Áreas, población evaluada, periodo..." />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Metodología
            <textarea className="min-h-20 rounded-md border border-zinc-200 p-3 text-sm" value={technical.metodologia} onChange={(event) => update("metodologia", event.target.value)} placeholder="Aplicación del cuestionario del Ministerio..." />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Conclusiones
            <textarea className="min-h-24 rounded-md border border-zinc-200 p-3 text-sm" value={technical.conclusiones} onChange={(event) => update("conclusiones", event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Recomendaciones del técnico
            <textarea className="min-h-32 rounded-md border border-zinc-200 p-3 text-sm" value={technical.recomendacionesText} onChange={(event) => update("recomendacionesText", event.target.value)} />
            <span className="text-xs font-normal text-[#5A5A5A]">Escribe una recomendación por línea. Si las dejas vacías se usan las automáticas.</span>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={technical.incluirFirma} onChange={(event) => update("incluirFirma", event.target.checked)} />
            Incluir bloque de firma del evaluador en el informe
          </label>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="bg-[#1F4E79] px-4 py-3 text-white">
          <h3 className="text-lg font-black">Plan de acción sugerido</h3>
          <p className="text-xs text-white/80">Se genera según las dimensiones con riesgo medio o alto.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="border border-zinc-200 px-3 py-2">Dimensión</th>
                <th className="border border-zinc-200 px-3 py-2">Riesgo</th>
                <th className="border border-zinc-200 px-3 py-2">Acción</th>
                <th className="border border-zinc-200 px-3 py-2">Responsable</th>
                <th className="border border-zinc-200 px-3 py-2">Plazo</th>
                <th className="border border-zinc-200 px-3 py-2">Verificación</th>
              </tr>
            </thead>
            <tbody>
              {planPreview.map((item, index) => (
                <tr key={`${item.dimension}-${index}`}>
                  <td className="border border-zinc-200 px-3 py-2 font-semibold">{item.dimension}</td>
                  <td className="border border-zinc-200 px-3 py-2">{item.riesgo}</td>
                  <td className="border border-zinc-200 px-3 py-2">{item.accion}</td>
                  <td className="border border-zinc-200 px-3 py-2">{item.responsable}</td>
                  <td className="border border-zinc-200 px-3 py-2">{item.plazo}</td>
                  <td className="border border-zinc-200 px-3 py-2">{item.verificacion}</td>
                </tr>
              ))}
              {!planPreview.length && (
                <tr><td className="border border-zinc-200 px-3 py-3 text-[#5A5A5A]" colSpan={6}>Recalcula la evaluación para generar el plan de acción.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
