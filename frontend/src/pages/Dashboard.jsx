import { ClipboardCheck, FileText, Send, TrendingUp } from "lucide-react";
import RiskBar from "../components/charts/RiskBar.jsx";
import Card from "../components/ui/Card.jsx";
import LottieAnimation from "../components/ui/LottieAnimation.jsx";

const stats = [
  { label: "Empresas activas", value: "12", icon: ClipboardCheck, tone: "bg-orange-50 text-[#C2410C]" },
  { label: "Evaluaciones abiertas", value: "8", icon: Send, tone: "bg-blue-50 text-blue-700" },
  { label: "Respuestas recolectadas", value: "486", icon: TrendingUp, tone: "bg-green-50 text-green-700" },
  { label: "Informes emitidos", value: "21", icon: FileText, tone: "bg-zinc-100 text-zinc-700" }
];

export default function Dashboard() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Dashboard principal</h2>
        <p className="mt-1 text-sm text-[#5A5A5A]">Vista ejecutiva para seguimiento de evaluaciones SST.</p>
      </div>

      <section className="grid gap-4">
        <Card className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#C2410C]">Control operativo</p>
              <h3 className="mt-2 text-2xl font-black">Seguimiento de evaluaciones psicosociales</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5A5A5A]">
                Consolida empresas, respuestas, resultados, expedientes e informes en un solo flujo para que el evaluador pueda cerrar evidencias con orden.
              </p>
            </div>
            <div className="hidden md:block">
              <LottieAnimation animationPath="https://assets10.lottiefiles.com/packages/lf20_a2chheio.json" style={{ width: "100%", minHeight: 220 }} />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-black">Riesgo global consolidado</h3>
          <p className="mt-1 text-sm text-[#5A5A5A]">Distribucion de respuestas en evaluaciones recientes.</p>
          <div className="mt-6">
            <RiskBar bajo={54} medio={31} alto={15} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
            <p className="rounded-lg bg-green-50 p-3"><span className="block text-xl font-black text-green-700">54%</span>bajo</p>
            <p className="rounded-lg bg-amber-50 p-3"><span className="block text-xl font-black text-amber-700">31%</span>medio</p>
            <p className="rounded-lg bg-red-50 p-3"><span className="block text-xl font-black text-red-700">15%</span>alto</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#5A5A5A]">{stat.label}</p>
                  <p className="mt-2 text-4xl font-black">{stat.value}</p>
                </div>
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${stat.tone}`}>
                  <Icon size={30} strokeWidth={2.2} />
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
