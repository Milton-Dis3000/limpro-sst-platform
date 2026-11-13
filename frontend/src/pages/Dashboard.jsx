import { ClipboardCheck, FileText, Send, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { listAssessments } from "../api/assessments.api.js";
import { listCompanies } from "../api/companies.api.js";
import { listReports } from "../api/reports.api.js";
import Card from "../components/ui/Card.jsx";
import LottieAnimation from "../components/ui/LottieAnimation.jsx";

export default function Dashboard() {
  const [data, setData] = useState({ companies: 0, assessments: [], reports: 0 });

  useEffect(() => {
    Promise.allSettled([listCompanies(), listAssessments(), listReports()]).then(([companies, assessments, reports]) => {
      setData({
        companies: companies.status === "fulfilled" ? companies.value.data.length : 0,
        assessments: assessments.status === "fulfilled" ? assessments.value.data : [],
        reports: reports.status === "fulfilled" ? reports.value.data.length : 0
      });
    });
  }, []);

  const openAssessments = data.assessments.filter((item) => item.estado !== "finalizada").length;
  const responseTotal = data.assessments.reduce((total, item) => total + (item.totalParticipantes || 0), 0);
  const statusCounts = [
    { label: "Borrador", value: data.assessments.filter((item) => item.estado === "borrador").length, tone: "bg-zinc-400" },
    { label: "En proceso", value: data.assessments.filter((item) => item.estado === "en_proceso").length, tone: "bg-amber-500" },
    { label: "Finalizadas", value: data.assessments.filter((item) => item.estado === "finalizada").length, tone: "bg-green-600" }
  ];
  const statusTotal = data.assessments.length || 1;
  const stats = [
    { label: "Empresas registradas", value: data.companies, icon: ClipboardCheck, tone: "bg-orange-50 text-[#C2410C]" },
    { label: "Evaluaciones abiertas", value: openAssessments, icon: Send, tone: "bg-blue-50 text-blue-700" },
    { label: "Respuestas recolectadas", value: responseTotal, icon: TrendingUp, tone: "bg-green-50 text-green-700" },
    { label: "Informes generados", value: data.reports, icon: FileText, tone: "bg-zinc-100 text-zinc-700" }
  ];

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
          <h3 className="text-lg font-black">Estado de las evaluaciones</h3>
          <p className="mt-1 text-sm text-[#5A5A5A]">Resumen de las evaluaciones de tu cuenta.</p>
          <div className="mt-6">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
              {statusCounts.map((item) => <div key={item.label} className={item.tone} style={{ width: `${(item.value / statusTotal) * 100}%` }} />)}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
            {statusCounts.map((item) => <p key={item.label} className="rounded-lg bg-zinc-50 p-3"><span className="block text-xl font-black">{item.value}</span>{item.label}</p>)}
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
                  <p className="mt-2 text-4xl font-black tabular-nums">{stat.value}</p>
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
