import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { bootstrapAdminRequest } from "../api/auth.api.js";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { setAuth } from "../store/auth.store.js";
import limproLogo from "../assets/logo-white.webp";

export default function BootstrapAdmin() {
  const [form, setForm] = useState({ email: "", password: "", setupKey: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await bootstrapAdminRequest(form);
      setAuth(data);
      toast.success("Administrador maestro activado.");
      navigate("/administracion", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo activar el administrador maestro.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#F3F4F6] p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-lg sm:p-7">
        <img src={limproLogo} alt="ESLIMPRO S.A." className="mx-auto h-24 w-full max-w-sm object-contain" />
        <div className="mt-5 flex items-center gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#C2410C]"><ShieldCheck /></div><div><h1 className="text-xl font-black">Activar admin maestro</h1><p className="text-xs text-zinc-600">Solo se puede realizar una vez.</p></div></div>
        <div className="mt-5 grid gap-4">
          <Input label="Correo de tu cuenta existente" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <Input label="Contraseña de la cuenta" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <Input label="Clave temporal de activación" type="password" value={form.setupKey} onChange={(event) => setForm({ ...form, setupKey: event.target.value })} required />
          <Button disabled={saving}>{saving ? "Activando..." : "Activar cuenta maestra"}</Button>
        </div>
        <p className="mt-4 text-center text-sm"><Link to="/login" className="font-bold text-[#C2410C]">Volver al inicio de sesión</Link></p>
      </form>
    </main>
  );
}
