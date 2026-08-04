import { Link, useNavigate } from "react-router-dom";
import { UserRoundCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { registerRequest } from "../api/auth.api.js";
import limproLogo from "../assets/limpro-logo.png";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { setAuth } from "../store/auth.store.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "consultor" });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await registerRequest(form);
      setAuth(data);
      navigate("/configuracion", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo crear la cuenta.");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#F3F4F6] p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-200/70">
        <img src={limproLogo} alt="LIMPRO" className="mx-auto h-10 w-auto" />
        <div className="mt-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-[#C2410C]">
            <UserRoundCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#2E2E2E]">Crear cuenta</h1>
            <p className="text-sm text-[#5A5A5A]">Acceso para consultores y empresas.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Contrasena" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <label className="grid gap-1.5 text-sm font-bold">
            Rol
            <select className="h-12 rounded-lg border border-zinc-200 bg-white px-4" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option value="consultor">Consultor</option>
              <option value="empresa">Empresa</option>
            </select>
          </label>
          <Button>Crear cuenta</Button>
        </div>
        <p className="mt-6 text-center text-sm text-[#5A5A5A]">
          Ya tienes cuenta? <Link className="font-bold text-[#C2410C]" to="/login">Inicia sesion</Link>
        </p>
      </form>
    </main>
  );
}
