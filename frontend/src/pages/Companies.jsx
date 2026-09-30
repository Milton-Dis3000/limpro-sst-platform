import { Building2, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createCompany, deleteCompany, listCompanies } from "../api/companies.api.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState({ nombreComercial: "", razonSocial: "", identificacionFiscal: "", pais: "Ecuador", ciudad: "", sector: "" });

  const load = async () => {
    try {
      const { data } = await listCompanies();
      setCompanies(data);
    } catch {
      setCompanies([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createCompany(form);
      toast.success("Empresa registrada.");
      setForm({ nombreComercial: "", razonSocial: "", identificacionFiscal: "", pais: "Ecuador", ciudad: "", sector: "" });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo registrar la empresa.");
    }
  };

  const removeCompany = async (company) => {
    const confirmed = window.confirm(
      `¿Eliminar permanentemente la empresa "${company.nombreComercial}"? Esta accion no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(company._id);
    try {
      await deleteCompany(company._id);
      setCompanies((current) => current.filter((item) => item._id !== company._id));
      toast.success("Empresa eliminada.");
    } catch (error) {
      const data = error.response?.data;
      if (error.response?.status === 409 && data?.requiresConfirmation) {
        const affected = data.affected || {};
        const cascadeConfirmed = window.confirm(
          `ADVERTENCIA: tambien se eliminaran permanentemente ${affected.assessments || 0} evaluacion(es), ${affected.responses || 0} respuesta(s) y ${affected.reports || 0} reporte(s) de "${company.nombreComercial}". ¿Deseas continuar?`
        );
        if (!cascadeConfirmed) return;

        try {
          await deleteCompany(company._id, { cascade: true });
          setCompanies((current) => current.filter((item) => item._id !== company._id));
          toast.success("Empresa y registros asociados eliminados.");
        } catch (cascadeError) {
          toast.error(cascadeError.response?.data?.message || "No se pudo completar la eliminacion.");
        }
      } else {
        toast.error(data?.message || "No se pudo eliminar la empresa.");
      }
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Empresas</h2>
            <p className="mt-1 text-sm text-[#5A5A5A]">Clientes registrados para evaluaciones SST.</p>
          </div>
          <div className="flex h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-[#5A5A5A] shadow-sm">
            <Search size={22} />
            Buscar
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <Building2 className="text-[#C2410C]" size={28} />
              <h3 className="text-lg font-black">Directorio de empresas</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-[#5A5A5A]">
                <tr>
                  <th className="px-5 py-3">Nombre comercial</th>
                  <th>Razon social</th>
                  <th>RUC/NIT</th>
                  <th>Ciudad</th>
                  <th>Sector</th>
                  <th className="px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4 font-bold">{company.nombreComercial}</td>
                    <td>{company.razonSocial}</td>
                    <td>{company.identificacionFiscal}</td>
                    <td>{company.ciudad}</td>
                    <td>{company.sector}</td>
                    <td className="px-5 text-center">
                      <button
                        type="button"
                        title="Eliminar empresa"
                        aria-label={`Eliminar ${company.nombreComercial}`}
                        disabled={deletingId === company._id}
                        onClick={() => removeCompany(company)}
                        className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!companies.length && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-[#5A5A5A]">Aun no hay empresas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Card className="h-fit">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-orange-50 text-[#C2410C]">
            <Plus size={30} />
          </div>
          <div>
            <h3 className="text-xl font-black">Crear empresa</h3>
            <p className="text-sm text-[#5A5A5A]">Datos base del cliente.</p>
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre comercial" value={form.nombreComercial} onChange={(e) => setForm({ ...form, nombreComercial: e.target.value })} required />
          <Input label="Razon social" value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} required />
          <Input label="RUC/NIT" value={form.identificacionFiscal} onChange={(e) => setForm({ ...form, identificacionFiscal: e.target.value })} required />
          <Input label="Pais" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} required />
          <Input label="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} required />
          <Input label="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
          <Button className="md:col-span-2"><Plus /> Guardar empresa</Button>
        </form>
      </Card>
    </div>
  );
}
