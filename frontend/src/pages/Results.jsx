import { BarChart3, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { listAssessments, recalculateAssessment } from "../api/assessments.api.js";
import RiskBar from "../components/charts/RiskBar.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import RiskBadge from "../components/ui/RiskBadge.jsx";

const dominantRisk = (item = {}) => {
  const values = [
    ["alto", item.altoPct || 0],
    ["medio", item.medioPct || 0],
    ["bajo", item.bajoPct || 0]
  ];
  return values.sort((a, b) => b[1] - a[1])[0][0];
};

export default function Results() {
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const selected = useMemo(
    () => assessments.find((assessment) => assessment._id === selectedId) || assessments[0],
    [assessments, selectedId]
  );

  const load = async () => {
    try {
      const { data } = await listAssessments();
      setAssessments(data);
      setSelectedId((current) => current || data[0]?._id || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudieron cargar los resultados.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const recalculate = async () => {
    if (!selected?._id) return;
    const { data } = await recalculateAssessment(selected._id);
    setAssessments((current) => current.map((assessment) => (assessment._id === data._id ? data : assessment)));
    toast.success("Resultados actualizados.");
  };

  const global = selected?.resultadosCalculados?.global;
  const dimensions = selected?.resultadosCalculados?.dimensiones || [];
  const recommendations = selected?.resultadosCalculados?.recomendaciones || [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Resultados</h2>
          <p className="mt-1 text-sm text-[#5A5A5A]">Lectura ejecutiva, tabulacion y recomendaciones de la evaluacion psicosocial.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-sm" value={selected?._id || ""} onChange={(event) => setSelectedId(event.target.value)}>
            {assessments.map((assessment) => (
              <option key={assessment._id} value={assessment._id}>
                {assessment.empresa?.nombreComercial || "Empresa"} - {assessment.tipo}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={recalculate}><RefreshCw /> Actualizar</Button>
        </div>
      </div>

      {!selected && <Card>No hay evaluaciones creadas todavia.</Card>}

      {selected && (
        <section className="grid gap-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#5A5A5A]">{selected.empresa?.nombreComercial}</p>
                <h3 className="text-2xl font-black">Resultado global</h3>
              </div>
              <RiskBadge risk={global ? dominantRisk(global) : "sin_clasificar"} />
            </div>
            <div className="mt-6">
              <RiskBar bajo={global?.bajoPct || 0} medio={global?.medioPct || 0} alto={global?.altoPct || 0} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <p className="rounded-lg bg-zinc-50 p-3"><span className="block text-xl font-black">{selected.totalParticipantes}</span>participantes</p>
              <p className="rounded-lg bg-green-50 p-3"><span className="block text-xl font-black text-green-700">{global?.bajoPct || 0}%</span>bajo</p>
              <p className="rounded-lg bg-amber-50 p-3"><span className="block text-xl font-black text-amber-700">{global?.medioPct || 0}%</span>medio</p>
              <p className="rounded-lg bg-red-50 p-3"><span className="block text-xl font-black text-red-700">{global?.altoPct || 0}%</span>alto</p>
            </div>
            {global?.interpretation && (
              <p className="mt-5 rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-[#3A3A3A]">{global.interpretation}</p>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <BarChart3 className="text-[#C2410C]" size={30} />
              <h3 className="text-lg font-black">Resultados por dimension</h3>
            </div>
            <div className="grid max-h-[520px] gap-4 overflow-y-auto pr-1">
              {dimensions.map((dimension) => (
                <div key={dimension.code} className="grid gap-2 rounded-lg border border-zinc-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{dimension.code}. {dimension.name}</p>
                    <RiskBadge risk={dimension.dominantRisk || dominantRisk(dimension)} />
                  </div>
                  <RiskBar bajo={dimension.bajoPct || 0} medio={dimension.medioPct || 0} alto={dimension.altoPct || 0} />
                  <p className="text-xs text-[#5A5A5A]">Bajo {dimension.bajoPct || 0}% - Medio {dimension.medioPct || 0}% - Alto {dimension.altoPct || 0}%</p>
                </div>
              ))}
              {selected && !dimensions.length && <p className="text-sm text-[#5A5A5A]">Aun no hay respuestas suficientes para mostrar resultados.</p>}
            </div>
          </Card>
        </section>
      )}

      <Card className="overflow-hidden p-0">
        <div className="bg-[#1F4E79] px-5 py-4 text-white">
          <h3 className="text-lg font-black">Matriz de tabulacion</h3>
          <p className="text-xs text-white/80">Porcentajes por dimension segun la herramienta del Ministerio.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="border border-zinc-200 px-3 py-2">Dimension</th>
                <th className="border border-zinc-200 px-3 py-2 text-center">Riesgo bajo</th>
                <th className="border border-zinc-200 px-3 py-2 text-center">Riesgo medio</th>
                <th className="border border-zinc-200 px-3 py-2 text-center">Riesgo alto</th>
                <th className="border border-zinc-200 px-3 py-2 text-center">Predominante</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dimension) => (
                <tr key={`matrix-${dimension.code}`} className="hover:bg-zinc-50">
                  <td className="border border-zinc-200 px-3 py-2 font-semibold">{dimension.code}. {dimension.name}</td>
                  <td className="border border-zinc-200 px-3 py-2 text-center text-green-700">{dimension.bajoPct || 0}%</td>
                  <td className="border border-zinc-200 px-3 py-2 text-center text-amber-700">{dimension.medioPct || 0}%</td>
                  <td className="border border-zinc-200 px-3 py-2 text-center text-red-700">{dimension.altoPct || 0}%</td>
                  <td className="border border-zinc-200 px-3 py-2 text-center"><RiskBadge risk={dimension.dominantRisk || dominantRisk(dimension)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-black">Recomendaciones tecnicas para la empresa</h3>
        {recommendations.length ? (
          <div className="grid gap-2 text-sm text-[#3A3A3A]">
            {recommendations.map((recommendation) => (
              <p key={recommendation} className="rounded-lg bg-zinc-50 p-4 leading-relaxed">{recommendation}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5A5A5A]">Actualiza los resultados para generar recomendaciones.</p>
        )}
      </Card>
    </div>
  );
}
