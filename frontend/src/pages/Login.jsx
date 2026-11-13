import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminBootstrapStatusRequest, loginRequest } from "../api/auth.api.js";
import limproLogo from "../assets/limpro-logo.png";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { setAuth } from "../store/auth.store.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);

  useEffect(() => {
    adminBootstrapStatusRequest().then(({ data }) => setBootstrapAvailable(data.available)).catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginRequest({ ...form, email: form.email.trim().toLowerCase() });
      setAuth(data);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full min-w-0 items-center justify-center bg-[#F3F4F6] p-4">
      <form onSubmit={submit} className="w-full min-w-0 max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-200/70 sm:p-8">
        <div className="mb-5 grid min-w-0 gap-3 sm:mb-8 sm:gap-4">
          <img src={limproLogo} alt="LIMPRO" className="mx-auto h-8 max-w-full object-contain sm:h-10" />
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#C2410C] sm:size-12">
              <ShieldCheck size={28} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black leading-tight text-[#2E2E2E] sm:text-2xl">Ingreso a plataforma</h1>
              <p className="text-sm leading-snug text-[#5A5A5A]">Evaluaciones SST y reportes tecnicos</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Contrasena" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Button disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesion"}</Button>
        </div>
        <p className="mt-6 text-center text-sm text-[#5A5A5A]">
          No tienes cuenta? <Link className="font-bold text-[#C2410C]" to="/registro">Registrate</Link>
        </p>
        {bootstrapAvailable && <p className="mt-2 text-center text-xs text-zinc-500"><Link className="hover:text-[#C2410C]" to="/activar-admin">Activar primer administrador maestro</Link></p>}
      </form>
    </main>
  );
}
