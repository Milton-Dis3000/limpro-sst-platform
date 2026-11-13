import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Building2, ClipboardList, FileText, LayoutDashboard, LogOut, Settings, ShieldCheck, UserRoundCheck } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa6";
import limproLogoWhite from "../../assets/limpro-logo-white..png";
import { clearAuth, getAuth } from "../../store/auth.store.js";

const baseNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/evaluaciones", label: "Evaluaciones", icon: ClipboardList },
  { to: "/resultados", label: "Resultados", icon: BarChart3 },
  { to: "/reportes", label: "Reportes", icon: FileText },
  { to: "/configuracion", label: "Ajustes", icon: Settings }
];

const socials = [
  { label: "Facebook", icon: FaFacebookF },
  { label: "Instagram", icon: FaInstagram },
  { label: "YouTube", icon: FaYoutube },
  { label: "TikTok", icon: FaTiktok }
];

export default function AppLayout() {
  const navigate = useNavigate();
  const user = getAuth()?.user;
  const nav = user?.rol === "admin" ? [...baseNav, { to: "/administracion", label: "Admin", icon: ShieldCheck }] : baseNav;

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#232323]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/10 bg-[#202124] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-4">
          <img src={limproLogoWhite} alt="LIMPRO" className="h-7 w-auto" />
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Plataforma SST</p>
        </div>

        <nav className="grid gap-2 px-4 py-6">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-bold transition ${
                    isActive ? "bg-white text-[#202124] shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={24} strokeWidth={2.2} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-5">
          <div className="grid grid-cols-4 gap-2">
            {socials.map((item) => {
              const Icon = item.icon;
              return (
              <a
                key={item.label}
                href="#"
                title={item.label}
                aria-label={item.label}
                className="grid h-9 place-items-center rounded-md bg-white/10 text-white/85 transition hover:bg-[#F97316] hover:text-white"
              >
                <Icon size={16} />
              </a>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="min-w-0 pb-20 lg:pb-0 lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-2 border-b border-zinc-200/80 bg-white/95 px-3 backdrop-blur sm:min-h-20 lg:px-8">
          <div>
            <p className="text-sm text-[#5A5A5A]">Espacio de trabajo</p>
            <h1 className="text-xl font-black">Evaluaciones SST</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-lg bg-[#F4F4F4] px-4 py-3 text-sm font-semibold sm:flex">
              <UserRoundCheck size={22} className="text-[#C2410C]" />
              {user?.nombre || "Usuario"} · {user?.rol === "admin" ? "Admin maestro" : user?.rol === "consultor" ? "Evaluador" : "Empresa"}
            </div>
            <button title="Cerrar sesion" onClick={logout} className="grid h-12 w-12 place-items-center rounded-lg border border-zinc-200 bg-white text-[#5A5A5A] hover:text-[#C2410C]">
              <LogOut size={22} />
            </button>
          </div>
        </header>

        <div className="workspace-content mx-auto w-full min-w-0 max-w-[1280px] p-3 sm:p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
      <nav aria-label="Navegacion principal" className={`fixed inset-x-0 bottom-0 z-20 grid ${user?.rol === "admin" ? "grid-cols-7" : "grid-cols-6"} border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden`}>
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold leading-tight ${isActive ? "text-[#C2410C]" : "text-zinc-500"}`
              }
            >
              <Icon size={20} strokeWidth={2.2} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
