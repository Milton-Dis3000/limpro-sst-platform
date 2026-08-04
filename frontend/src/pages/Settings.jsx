import { BadgeCheck, Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getEvaluatorProfile, saveEvaluatorProfile, uploadEvaluatorAsset } from "../api/evaluator.api.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";

const emptyProfile = {
  nombreProfesional: "",
  cargo: "",
  registroProfesional: "",
  contacto: {
    email: "",
    telefono: "",
    direccion: "",
    sitioWeb: ""
  }
};

export default function Settings() {
  const [profile, setProfile] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getEvaluatorProfile()
      .then(({ data }) => {
        if (data) setProfile({ ...emptyProfile, ...data, contacto: { ...emptyProfile.contacto, ...(data.contacto || {}) } });
      })
      .catch(() => toast.error("No se pudo cargar el perfil."));
  }, []);

  const update = (field, value) => {
    if (field.startsWith("contacto.")) {
      const key = field.split(".")[1];
      setProfile((current) => ({ ...current, contacto: { ...current.contacto, [key]: value } }));
      return;
    }
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await saveEvaluatorProfile(profile);
      setProfile({ ...emptyProfile, ...data, contacto: { ...emptyProfile.contacto, ...(data.contacto || {}) } });
      toast.success("Perfil guardado.");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (type, file) => {
    if (!file) return;
    try {
      const { data } = await uploadEvaluatorAsset(type, file);
      setProfile({ ...emptyProfile, ...data, contacto: { ...emptyProfile.contacto, ...(data.contacto || {}) } });
      toast.success(type === "firma" ? "Firma cargada." : "Logo cargado.");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo subir el archivo.");
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-orange-50 text-[#C2410C]">
            <BadgeCheck size={30} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Perfil del evaluador</h2>
            <p className="text-sm text-[#5A5A5A]">Datos profesionales usados en informes, plan de accion y firma.</p>
          </div>
        </div>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre profesional" value={profile.nombreProfesional} onChange={(event) => update("nombreProfesional", event.target.value)} required />
          <Input label="Cargo" value={profile.cargo || ""} onChange={(event) => update("cargo", event.target.value)} />
          <Input label="Registro profesional" value={profile.registroProfesional || ""} onChange={(event) => update("registroProfesional", event.target.value)} />
          <Input label="Email de contacto" value={profile.contacto.email || ""} onChange={(event) => update("contacto.email", event.target.value)} />
          <Input label="Telefono" value={profile.contacto.telefono || ""} onChange={(event) => update("contacto.telefono", event.target.value)} />
          <Input label="Sitio web" value={profile.contacto.sitioWeb || ""} onChange={(event) => update("contacto.sitioWeb", event.target.value)} />
          <div className="md:col-span-2">
            <Input label="Direccion" value={profile.contacto.direccion || ""} onChange={(event) => update("contacto.direccion", event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button disabled={saving}><Save /> {saving ? "Guardando..." : "Guardar perfil"}</Button>
          </div>
        </form>
      </Card>

      <Card className="h-fit">
        <h3 className="text-xl font-black">Marca y firma</h3>
        <p className="mt-1 text-sm text-[#5A5A5A]">Archivos que aparecen en los informes generados.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">
            Logo de consultora
            <input className="rounded-lg border border-zinc-200 bg-white p-3 text-sm" type="file" accept="image/*" onChange={(event) => upload("logo", event.target.files?.[0])} />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Firma
            <input className="rounded-lg border border-zinc-200 bg-white p-3 text-sm" type="file" accept="image/*" onChange={(event) => upload("firma", event.target.files?.[0])} />
          </label>
          <Button className="md:col-span-2" variant="secondary" type="button"><Upload /> Archivos para informes</Button>
        </div>
        {profile.firmaDigital?.url && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">Firma cargada correctamente.</p>}
        {profile.logoConsultora?.url && <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">Logo cargado correctamente.</p>}
      </Card>
    </div>
  );
}
