import { ClipboardList, Copy, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createAssessment, deleteAssessment, listAssessments } from "../api/assessments.api.js";
import { listCompanies } from "../api/companies.api.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import RiskBadge from "../components/ui/RiskBadge.jsx";
import { COUNTRIES } from "../utils/countries.js";

const assessmentTypeLabels = {
  psicosocial: "Psicosocial",
  ruido: "Ruido",
  iluminacion: "Iluminacion",
  ergonomia: "Ergonomia",
  prevencion_alcohol_drogas: "Prevencion del uso y consumo de alcohol y drogas"
};

const resolveGlobalRisk = (assessment) => {
  const global = assessment.resultadosCalculados?.global;
  if (!assessment.totalParticipantes || !global) return "sin_clasificar";

  const levels = [
    ["alto", global.altoPct || 0],
    ["medio", global.medioPct || 0],
    ["bajo", global.bajoPct || 0]
  ];

  return levels.sort((a, b) => b[1] - a[1])[0][0];
};

export default function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState({ empresa: "", tipo: "psicosocial", pais: "Ecuador" });

  const load = async () => {
    const [assessmentResponse, companyResponse] = await Promise.allSettled([listAssessments(), listCompanies()]);
    if (assessmentResponse.status === "fulfilled") setAssessments(assessmentResponse.value.data);
    if (companyResponse.status === "fulfilled") {
      setCompanies(companyResponse.value.data);
      setForm((current) => ({ ...current, empresa: current.empresa || companyResponse.value.data[0]?._id || "" }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createAssessment(form);
      toast.success("Evaluacion creada.");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo crear la evaluacion.");
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/q/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado.");
  };

  const removeAssessment = async (assessment) => {
    const companyName = assessment.empresa?.nombreComercial || "Sin empresa";
    const firstConfirmation = window.confirm(
      `¿Eliminar la evaluacion ${assessmentTypeLabels[assessment.tipo] || assessment.tipo} de "${companyName}"?`
    );
    if (!firstConfirmation) return;

    setDeletingId(assessment._id);
    try {
      await deleteAssessment(assessment._id);
    } catch (error) {
      const data = error.response?.data;
      if (error.response?.status !== 409 || !data?.requiresConfirmation) {
        toast.error(data?.message || "No se pudo eliminar la evaluacion.");
        return;
      }

      const affected = data.affected || {};
      const secondConfirmation = window.confirm(
        `ADVERTENCIA FINAL: se eliminaran permanentemente la evaluacion, ${affected.responses || 0} respuesta(s) y ${affected.reports || 0} reporte(s). Esta accion no se puede deshacer. ¿Deseas continuar?`
      );
      if (!secondConfirmation) return;

      try {
        await deleteAssessment(assessment._id, { cascade: true });
        setAssessments((current) => current.filter((item) => item._id !== assessment._id));
        toast.success("Evaluacion y registros asociados eliminados.");
      } catch (cascadeError) {
        toast.error(cascadeError.response?.data?.message || "No se pudo completar la eliminacion.");
      }
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Evaluaciones</h2>
          <p className="mt-1 text-sm text-[#5A5A5A]">Control de evaluaciones psicosociales y modulos SST futuros.</p>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-[#C2410C]" size={30} />
              <h3 className="text-lg font-black">Evaluaciones registradas</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-[#5A5A5A]">
                <tr>
                  <th className="px-5 py-3">Empresa</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Participantes</th>
                  <th>Riesgo global</th>
                  <th className="px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {assessments.map((assessment) => (
                  <tr key={assessment._id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4 font-bold">{assessment.empresa?.nombreComercial || "Sin empresa"}</td>
                    <td>{assessmentTypeLabels[assessment.tipo] || assessment.tipo}</td>
                    <td>{assessment.estado}</td>
                    <td>{assessment.totalParticipantes}</td>
                    <td><RiskBadge risk={resolveGlobalRisk(assessment)} /></td>
                    <td className="px-5">
                      <div className="flex justify-center gap-2">
                        <button title="Copiar enlace" onClick={() => copyLink(assessment.publicToken)} className="grid h-11 w-11 place-items-center rounded-lg border border-zinc-200 text-[#5A5A5A] hover:border-[#F97316] hover:bg-orange-50 hover:text-[#C2410C]">
                          <Copy size={22} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar evaluacion"
                          aria-label={`Eliminar evaluacion de ${assessment.empresa?.nombreComercial || "empresa"}`}
                          disabled={deletingId === assessment._id}
                          onClick={() => removeAssessment(assessment)}
                          className="grid h-11 w-11 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!assessments.length && (
                  <tr><td colSpan="6" className="py-10 text-center text-[#5A5A5A]">Aun no hay evaluaciones.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Card className="h-fit">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-orange-50 text-[#C2410C]">
              <Plus size={30} />
            </div>
            <div>
              <h3 className="text-xl font-black">Crear evaluacion</h3>
              <p className="text-sm text-[#5A5A5A]">{companies.length} empresa(s) disponible(s)</p>
            </div>
          </div>
          <button type="button" title="Actualizar empresas" onClick={load} className="grid h-11 w-11 place-items-center rounded-lg border border-zinc-200 text-[#5A5A5A] hover:border-[#F97316] hover:bg-orange-50 hover:text-[#C2410C]">
            <RefreshCw size={22} />
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-bold">
            Empresa
            <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} required>
              <option value="">Seleccionar</option>
              {companies.map((company) => <option key={company._id} value={company._id}>{company.nombreComercial}</option>)}
            </select>
            {!companies.length && <span className="text-xs font-normal text-[#C2410C]">Primero registra una empresa o actualiza esta lista.</span>}
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Pais
            <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} required>
              {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Tipo
            <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="psicosocial">Psicosocial</option>
              <option value="ruido">Ruido</option>
              <option value="iluminacion">Iluminacion</option>
              <option value="ergonomia">Ergonomia</option>
              <option value="prevencion_alcohol_drogas">Prevencion del uso y consumo de alcohol y drogas</option>
            </select>
          </label>
          <Button className="md:col-span-3"><Plus /> Crear evaluacion</Button>
        </form>
      </Card>
    </div>
  );
}
