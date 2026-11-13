import { Activity, Building2, ClipboardList, FileText, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAdminOverview, listUsers, updateUserAccess } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";

const roleLabel = (role) => role === "admin" ? "Admin maestro" : role === "consultor" ? "Evaluador" : "Empresa";
const dateLabel = (date) => new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(date));

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResponse, usersResponse] = await Promise.all([getAdminOverview(), listUsers()]);
      setOverview(overviewResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cargar la consola administrativa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeAccess = async (user, payload) => {
    setUpdatingId(user._id);
    try {
      const { data } = await updateUserAccess(user._id, payload);
      setUsers((current) => current.map((item) => item._id === data._id ? data : item));
      toast.success("Acceso actualizado.");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo actualizar el acceso.");
    } finally {
      setUpdatingId("");
    }
  };

  const metrics = [
    { label: "Evaluaciones", value: overview?.assessments, icon: ClipboardList },
    { label: "Respuestas recibidas", value: overview?.responses, icon: Activity },
    { label: "Evaluadores activos", value: overview?.activeEvaluators, icon: ShieldCheck },
    { label: "Empresas", value: overview?.companies, icon: Building2 },
    { label: "Usuarios registrados", value: overview?.users, icon: Users },
    { label: "Informes generados", value: overview?.reports, icon: FileText }
  ];

  return (
    <div className="grid min-w-0 gap-5">
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-[#C2410C]"><ShieldCheck size={18} /> Control de plataforma</div>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">Administración maestra</h2>
          <p className="mt-1 text-sm text-zinc-600">Conteo global y permisos de acceso.</p>
        </div>
        <Button variant="secondary" className="shrink-0 px-3" onClick={load} disabled={loading} title="Actualizar datos"><RefreshCw size={18} /><span className="hidden sm:inline">Actualizar</span></Button>
      </header>

      <section aria-label="Resumen global" className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="min-w-0 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 sm:text-sm"><Icon size={17} className="shrink-0 text-[#C2410C]" /> <span>{label}</span></div>
            <p className="mt-2 text-2xl font-black tabular-nums">{loading ? "..." : value ?? 0}</p>
          </Card>
        ))}
      </section>

      <section aria-label="Estados de evaluaciones" className="grid grid-cols-3 gap-2 sm:gap-3">
        {[{ key: "borrador", label: "Borrador" }, { key: "en_proceso", label: "En proceso" }, { key: "finalizada", label: "Finalizadas" }].map(({ key, label }) => (
          <Card key={key} className="p-3 sm:p-4"><p className="text-xs font-semibold text-zinc-600 sm:text-sm">{label}</p><p className="mt-1 text-xl font-black tabular-nums">{loading ? "..." : overview?.assessmentsByStatus?.[key] || 0}</p></Card>
        ))}
      </section>

      <Card className="min-w-0 overflow-hidden p-0">
        <div className="border-b border-zinc-200 px-4 py-4 sm:px-5">
          <h3 className="font-black">Usuarios y roles</h3>
          <p className="mt-1 text-xs text-zinc-600">Asigna el rol Evaluador a quien realizará evaluaciones. La cuenta maestra no se puede modificar aquí.</p>
        </div>
        <div className="grid gap-2 p-3 md:hidden">
          {users.map((user) => (
            <article key={user._id} className="grid min-w-0 gap-2 rounded-lg border border-zinc-200 p-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0"><p className="break-words text-sm font-bold">{user.nombre}</p><p className="break-all text-xs text-zinc-600">{user.email}</p></div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${user.estado === "activo" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{user.estado}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2">
                <span className="text-xs font-semibold text-zinc-600">{roleLabel(user.rol)}{user.rol === "consultor" ? ` · ${user.evaluacionesAsignadas || 0} eval.` : ""}</span>
                {user.rol !== "admin" && <div className="flex gap-2">
                  <select aria-label={`Rol de ${user.nombre}`} className="h-9 max-w-36 rounded-md border border-zinc-200 bg-white px-2 text-xs" value={user.rol} disabled={updatingId === user._id} onChange={(event) => changeAccess(user, { rol: event.target.value })}>
                    <option value="empresa">Empresa</option><option value="consultor">Evaluador</option>
                  </select>
                  <button className="min-h-9 rounded-md border border-zinc-200 px-2 text-xs font-bold disabled:opacity-50" disabled={updatingId === user._id} onClick={() => changeAccess(user, { estado: user.estado === "activo" ? "suspendido" : "activo" })}>{user.estado === "activo" ? "Suspender" : "Activar"}</button>
                </div>}
              </div>
            </article>
          ))}
          {!loading && !users.length && <p className="py-8 text-center text-sm text-zinc-500">No hay usuarios registrados.</p>}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-600"><tr><th className="px-5 py-3">Usuario</th><th>Rol</th><th>Evaluaciones</th><th>Estado</th><th>Registro</th><th className="px-5">Acceso</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => <tr key={user._id}>
                <td className="px-5 py-3"><p className="font-bold">{user.nombre}</p><p className="text-xs text-zinc-600">{user.email}</p></td>
                <td>{roleLabel(user.rol)}</td><td>{user.evaluacionesAsignadas || 0}</td><td>{user.estado}</td><td>{dateLabel(user.createdAt)}</td>
                <td className="px-5">{user.rol === "admin" ? <span className="text-xs font-semibold text-zinc-500">Protegido</span> : <div className="flex items-center gap-2">
                  <select aria-label={`Rol de ${user.nombre}`} className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs" value={user.rol} disabled={updatingId === user._id} onChange={(event) => changeAccess(user, { rol: event.target.value })}><option value="empresa">Empresa</option><option value="consultor">Evaluador</option></select>
                  <button className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-bold disabled:opacity-50" disabled={updatingId === user._id} onClick={() => changeAccess(user, { estado: user.estado === "activo" ? "suspendido" : "activo" })}>{user.estado === "activo" ? "Suspender" : "Activar"}</button>
                </div>}</td>
              </tr>)}
              {!loading && !users.length && <tr><td colSpan="6" className="py-8 text-center text-zinc-500">No hay usuarios registrados.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
