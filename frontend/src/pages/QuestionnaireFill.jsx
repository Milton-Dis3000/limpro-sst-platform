import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import { getPublicAssessment, submitPublicResponse } from "../api/assessments.api.js";

const DEFAULT_INSTRUCTIONS = [
  "El cuestionario es anonimo es decir no se solicita informacion personal sobre el participante.",
  "La informacion obtenida es confidencial es decir que se ha de guardar, mantener y emplear con estricta cautela la informacion obtenida.",
  "Completar todo el cuestionario requiere entre 15 a 20 minutos.",
  "Antes de responder, leer detenidamente cada pregunta y opcion de respuesta. En este punto es necesario identificar y valorar todos aquellos factores del ambito psicosocial que pueden representar un riesgo para la salud y el bienestar laboral.",
  "Utilizar lapiz o esfero para marcar con una X la respuesta que considere que describe mejor su situacion. Es obligatorio contestar todos los items del cuestionario, en caso de error en la respuesta encerrar en un circulo la misma y seleccionar nuevamente la respuesta.",
  "No existen respuestas correctas o incorrectas.",
  "Evitar distracciones mientras completa el cuestionario, en caso de inquietud, solicitar asistencia al facilitador.",
  "El cuestionario tiene una seccion denominada observaciones y comentarios, que puede ser utilizada por los participantes en caso de sugerencias u opiniones.",
  "Los resultados finales de la evaluacion seran socializados oportunamente a los participantes."
];

const DEFAULT_GENERAL_FIELDS = [
  { id: "fecha", label: "Fecha:", type: "date" },
  { id: "provincia", label: "Provincia:", type: "text" },
  { id: "ciudad", label: "Ciudad:", type: "text" },
  { id: "areaTrabajo", label: "Area de trabajo:", type: "choice", options: ["Administrativa", "Operativa"] },
  {
    id: "nivelInstruccion",
    label: "Nivel mas alto de instruccion (Marque una sola opcion):",
    type: "choice",
    options: ["Ninguno", "Tecnico / Tecnologico", "Educacion basica", "Tercer nivel", "Educacion media", "Cuarto nivel", "Bachillerato", "Otro"]
  },
  {
    id: "antiguedad",
    label: "Antiguedad, anos de experiencia dentro de la empresa o institucion:",
    type: "choice",
    options: ["0-2 anos", "3-10 anos", "11-20 anos", "Igual o superior a 21 anos"]
  },
  {
    id: "edad",
    label: "Edad del trabajador o servidor:",
    type: "choice",
    options: ["16-24 anos", "25-34 anos", "35-43 anos", "44-52 anos", "Igual o superior a 53 anos"]
  },
  {
    id: "autoIdentificacionEtnica",
    label: "Auto-identificacion etnica:",
    type: "choice",
    options: ["Indigena", "Afro-ecuatoriano/a", "Mestizo/a", "Blanco/a", "Montubio/a", "Otro"]
  },
  { id: "sexo", label: "Sexo del trabajador o servidor:", type: "choice", options: ["Mujer", "Hombre"] }
];

const generalFieldClass = (field) =>
  field.type === "choice"
    ? "grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:col-span-2 xl:col-span-3"
    : "grid gap-3 rounded-lg border border-zinc-200 bg-white p-4";

export default function QuestionnaireFill() {
  const { token } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [generalData, setGeneralData] = useState({});
  const [observations, setObservations] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getPublicAssessment(token)
      .then(({ data }) => setAssessment(data))
      .catch(() => toast.error("El enlace del cuestionario no esta disponible."));
  }, [token]);

  const grouped = useMemo(() => {
    const questions = assessment?.questionnaire?.preguntas?.filter((item) => item.order <= 58) || [];
    return questions.reduce((acc, question) => {
      acc[question.dimension] ||= [];
      acc[question.dimension].push(question);
      return acc;
    }, {});
  }, [assessment]);

  const groupedEntries = useMemo(() => Object.entries(grouped), [grouped]);
  const instructions = assessment?.questionnaire?.instrucciones?.length
    ? assessment.questionnaire.instrucciones
    : DEFAULT_INSTRUCTIONS;
  const generalFields = assessment?.questionnaire?.datosGenerales?.length
    ? assessment.questionnaire.datosGenerales
    : DEFAULT_GENERAL_FIELDS;
  const answerOptions = assessment?.questionnaire?.opcionesRespuesta || [];
  const dimensionTotals = useMemo(
    () =>
      groupedEntries.reduce((acc, [dimension, questions]) => {
        acc[dimension] = questions.reduce((sum, question) => sum + Number(answers[question.order] || 0), 0);
        return acc;
      }, {}),
    [answers, groupedEntries]
  );

  const handleGeneralChange = (fieldId, value) => {
    setGeneralData((current) => ({ ...current, [fieldId]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const respuestas = Object.entries(answers).map(([item, value]) => ({ item: Number(item), value: Number(value) }));
    const missingGeneralData = generalFields.some((field) => !generalData[field.id]);
    if (missingGeneralData) {
      toast.error("Completa los datos generales.");
      return;
    }
    if (respuestas.length < 58) {
      toast.error("Completa todas las preguntas obligatorias.");
      return;
    }
    await submitPublicResponse(token, {
      participante: {
        anonimo: true,
        area: generalData.areaTrabajo,
        metadata: { ...generalData, observaciones: observations }
      },
      respuestas
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F4F4F4] p-4">
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl font-black">Cuestionario completado</h1>
          <p className="mt-2 text-sm text-[#5A5A5A]">Tus respuestas fueron registradas correctamente.</p>
        </Card>
      </main>
    );
  }

  if (!assessment) return <main className="p-6">Cargando cuestionario...</main>;

  return (
    <main className="min-h-screen bg-[#EDEDED] p-3 text-[#111827] lg:p-8">
      <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-5">
        <section className="overflow-hidden rounded-md border-2 border-[#1F4E79] bg-white">
          <div className="grid items-center gap-4 border-b border-zinc-300 p-5 text-center sm:grid-cols-[1fr_auto_1fr]">
            <div className="text-2xl font-black leading-tight text-[#2B2E63]">Ministerio<br />del Trabajo</div>
            <div className="mx-auto grid size-20 place-items-center rounded-full border-4 border-[#D9A441] text-xs font-black text-[#1F4E79]">EC</div>
            <div className="text-2xl font-light leading-tight text-zinc-500">Republica<br />del Ecuador</div>
          </div>
          <div className="border-b border-zinc-300 px-4 py-3 text-center">
            <p className="text-lg font-black uppercase">Cuestionario de evaluacion psicosocial en espacios laborales</p>
            {assessment.empresa?.nombreComercial && <p className="mt-1 text-sm text-zinc-600">{assessment.empresa.nombreComercial}</p>}
          </div>
          <div className="px-4 py-3 text-sm leading-relaxed">
            <p className="font-black">Instrucciones para completar el cuestionario:</p>
            <ol className="grid list-decimal gap-1 pl-5">
              {instructions.map((instruction, index) => (
                <li key={`${index}-${instruction}`}>{instruction}</li>
              ))}
            </ol>
            <p className="mt-4 font-black">Muchas gracias por su colaboracion</p>
          </div>
        </section>

        <Card className="overflow-hidden p-0">
          <div className="bg-[#1F4E79] px-4 py-3 text-sm font-black uppercase text-white">Datos generales</div>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {generalFields.map((field) => (
              <div key={field.id} className={generalFieldClass(field)}>
                <label htmlFor={field.id} className="text-sm font-semibold">{field.label}</label>
                {field.type === "choice" ? (
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {field.options.map((option) => (
                      <label key={option} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold leading-snug hover:border-[#1F4E79] hover:bg-blue-50/40">
                        <input
                          required
                          type="radio"
                          name={field.id}
                          value={option}
                          checked={generalData[field.id] === option}
                          onChange={(event) => handleGeneralChange(field.id, event.target.value)}
                          className="size-5 shrink-0 accent-[#1F4E79]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    required
                    id={field.id}
                    type={field.type}
                    value={generalData[field.id] || ""}
                    onChange={(event) => handleGeneralChange(field.id, event.target.value)}
                    className="h-12 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {groupedEntries.map(([dimension, questions]) => (
          <Card key={dimension} className="overflow-hidden p-0">
            <div className="bg-white">
              <div className="border-b border-zinc-200 px-4 py-3 text-center text-base font-black uppercase">{dimension}</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#1F4E79] text-white">
                      <th className="w-14 border border-[#153A5B] px-2 py-2 text-left">NR</th>
                      <th className="border border-[#153A5B] px-3 py-2 text-left">Item</th>
                      {answerOptions.map((option) => (
                        <th key={option.value} className="w-32 border border-[#153A5B] px-2 py-2 text-center">
                          {option.label} ({option.value})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => (
                      <tr key={question.order} className="align-top">
                        <td className="border border-zinc-300 bg-[#EAF2F8] px-2 py-2 font-semibold">{question.order}</td>
                        <td className="border border-zinc-300 px-3 py-2">{question.text}</td>
                        {answerOptions.map((option) => (
                          <td key={option.value} className="border border-zinc-300 px-2 py-2 text-center">
                            <input
                              required
                              type="radio"
                              name={`q-${question.order}`}
                              value={option.value}
                              checked={answers[question.order] === String(option.value)}
                              onChange={(event) => setAnswers({ ...answers, [question.order]: event.target.value })}
                              aria-label={`${question.order}. ${option.label}`}
                              className="size-6 accent-[#1F4E79]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-[#1F4E79] font-black text-white">
                      <td colSpan={2} className="border border-[#153A5B] px-3 py-2 text-center">Suma de puntos de la dimension</td>
                      <td colSpan={Math.max(answerOptions.length - 1, 1)} className="border border-[#153A5B] px-3 py-2 text-right">
                        {dimensionTotals[dimension] || 0}
                      </td>
                      <td className="border border-[#153A5B] px-3 py-2 text-center">Puntos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ))}

        <Card>
          <label htmlFor="observaciones" className="text-sm font-black uppercase">Observaciones y comentarios</label>
          <textarea
            id="observaciones"
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-md border border-zinc-300 p-3 text-sm outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"
          />
        </Card>

        <Button className="justify-self-end">Enviar respuestas</Button>
      </form>
    </main>
  );
}
