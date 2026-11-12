import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { loginRequest } from "../api/auth.api.js";
import limproLogo from "../assets/limpro-logo.png";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { setAuth } from "../store/auth.store.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

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
    <main className="grid min-h-screen w-full min-w-0 place-items-center bg-[#F3F4F6] p-3 sm:p-4">
      <form onSubmit={submit} className="w-full min-w-0 max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/70 sm:p-8">
        <div className="mb-6 grid min-w-0 gap-4 sm:mb-8">
          <img src={limproLogo} alt="LIMPRO" className="mx-auto h-9 max-w-full object-contain sm:h-10" />
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
      </form>
    </main>
  );
}
