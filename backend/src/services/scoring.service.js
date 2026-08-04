const resolveRisk = (score, ranges = {}) => {
  const match = Object.entries(ranges).find(([, value]) => score >= value.min && score <= value.max);
  return match?.[0] || "sin_clasificar";
};

const RISK_LABELS = {
  bajo: "RIESGO BAJO",
  medio: "RIESGO MEDIO",
  alto: "RIESGO ALTO",
  sin_clasificar: "SIN CLASIFICAR"
};

const RISK_INTERPRETATIONS = {
  bajo:
    "El riesgo es de impacto potencial mínimo sobre la seguridad y salud, no genera a corto plazo efectos nocivos. Estos efectos pueden ser evitados a través de un monitoreo periódico de la frecuencia y probabilidad de que ocurra y se presente una enfermedad ocupacional, las acciones irán enfocadas a garantizar que el nivel se mantenga.",
  medio:
    "El riesgo es de impacto potencial moderado sobre la seguridad y salud puede comprometer las mismas en el mediano plazo, causando efectos nocivos para la salud, afectaciones a la integridad física y enfermedades ocupacionales. En caso de que no se aplicaren las medidas de seguridad y prevención correspondientes de manera continua y conforme a la necesidad específica identificada, los impactos pueden generarse con mayor probabilidad y frecuencia.",
  alto:
    "El riesgo es de impacto potencial alto sobre la seguridad y la salud de las personas, los niveles de peligro son intolerables y pueden generar efectos nocivos para la salud e integridad física de las personas de manera inmediata. Se deben aplicar las medidas de seguridad y prevención de manera continua y conforme a la necesidad específica identificada para evitar el incremento a la probabilidad y frecuencia.",
  sin_clasificar: "No existe información suficiente para clasificar el riesgo."
};

const normalizeAnswers = (answers = []) =>
  new Map(answers.map((answer) => [Number(answer.item), Number(answer.value)]));

const percentage = (count, total) => (total > 0 ? Math.round((count / total) * 100) : 0);

const dominantRisk = (item = {}) => {
  const ordered = [
    ["alto", item.altoPct || 0],
    ["medio", item.medioPct || 0],
    ["bajo", item.bajoPct || 0]
  ];
  return ordered.sort((a, b) => b[1] - a[1])[0][0];
};

export const scoreResponse = (questionnaire, answers) => {
  const answerMap = normalizeAnswers(answers);

  const dimensiones = questionnaire.dimensiones.map((dimension) => {
    const score = dimension.items.reduce((sum, item) => sum + (answerMap.get(item) || 0), 0);
    return {
      code: dimension.code,
      name: dimension.name,
      parent: dimension.parent,
      score,
      risk: resolveRisk(score, dimension.ranges),
      maxScore: dimension.items.length * 4
    };
  });

  const globalScore = questionnaire.reglasPuntuacion.global.items.reduce(
    (sum, item) => sum + (answerMap.get(item) || 0),
    0
  );

  return {
    total: globalScore,
    dimensiones,
    global: {
      score: globalScore,
      risk: resolveRisk(globalScore, questionnaire.reglasPuntuacion.global.ranges),
      maxScore: questionnaire.reglasPuntuacion.global.items.length * 4
    }
  };
};

export const tabulateResponses = (questionnaire, responses = []) =>
  responses.map((response, index) => {
    const scoring = response.resultadoGlobal ? {
      total: response.resultadoGlobal.score,
      dimensiones: response.resultadoPorDimension || [],
      global: response.resultadoGlobal
    } : scoreResponse(questionnaire, response.respuestas);

    const answerMap = normalizeAnswers(response.respuestas);
    const metadata = response.participante?.metadata || {};

    return {
      index: index + 1,
      questionnaireLabel: `CUESTIONARIO ${index + 1}`,
      participante: {
        fecha: metadata.fecha || "",
        provincia: metadata.provincia || "",
        ciudad: metadata.ciudad || "",
        areaTrabajo: metadata.areaTrabajo || response.participante?.area || "",
        nivelInstruccion: metadata.nivelInstruccion || "",
        antiguedad: metadata.antiguedad || "",
        edad: metadata.edad || "",
        autoIdentificacionEtnica: metadata.autoIdentificacionEtnica || "",
        sexo: metadata.sexo || "",
        observaciones: metadata.observaciones || ""
      },
      respuestas: questionnaire.reglasPuntuacion.global.items.map((item) => ({
        item,
        value: answerMap.get(item) || 0
      })),
      dimensiones: scoring.dimensiones.map((dimension) => ({
        ...dimension,
        riskLabel: RISK_LABELS[dimension.risk] || RISK_LABELS.sin_clasificar
      })),
      global: {
        ...scoring.global,
        riskLabel: RISK_LABELS[scoring.global?.risk] || RISK_LABELS.sin_clasificar
      }
    };
  });

export const aggregateResults = (questionnaire, responses) => {
  const counters = {
    global: { bajo: 0, medio: 0, alto: 0, sin_clasificar: 0 },
    dimensiones: questionnaire.dimensiones.map((dimension) => ({
      code: dimension.code,
      name: dimension.name,
      parent: dimension.parent,
      bajo: 0,
      medio: 0,
      alto: 0,
      sin_clasificar: 0
    }))
  };

  for (const response of responses) {
    const result = response.resultadoGlobal ? response : scoreResponse(questionnaire, response.respuestas);
    const globalRisk = result.resultadoGlobal?.risk || result.global?.risk || "sin_clasificar";
    counters.global[globalRisk] += 1;

    const dimensionResults = result.resultadoPorDimension || result.dimensiones || [];
    for (const dimensionResult of dimensionResults) {
      const counter = counters.dimensiones.find((item) => item.code === dimensionResult.code);
      if (counter) counter[dimensionResult.risk || "sin_clasificar"] += 1;
    }
  }

  const total = responses.length || 1;
  const asPercentages = (counter) => ({
    ...counter,
    bajoPct: percentage(counter.bajo, total),
    medioPct: percentage(counter.medio, total),
    altoPct: percentage(counter.alto, total)
  });

  const global = asPercentages(counters.global);
  const dimensiones = counters.dimensiones.map((dimension) => ({
    ...asPercentages(dimension),
    dominantRisk: dominantRisk(asPercentages(dimension))
  }));
  const globalDominantRisk = dominantRisk(global);
  const prioritized = dimensiones
    .filter((dimension) => !dimension.parent || dimension.code === "D8" || dimension.altoPct > 0)
    .sort((a, b) => (b.altoPct - a.altoPct) || (b.medioPct - a.medioPct))
    .slice(0, 5);

  return {
    totalParticipantes: responses.length,
    global: {
      ...global,
      dominantRisk: globalDominantRisk,
      dominantRiskLabel: RISK_LABELS[globalDominantRisk],
      interpretation: RISK_INTERPRETATIONS[globalDominantRisk]
    },
    dimensiones,
    interpretaciones: RISK_INTERPRETATIONS,
    recomendaciones: buildRecommendations({ globalRisk: globalDominantRisk, prioritized }),
    planAccion: buildActionPlan(prioritized)
  };
};

export const buildRecommendations = ({ globalRisk, prioritized = [] }) => {
  const recommendations = [];

  if (globalRisk === "alto") {
    recommendations.push("Diseñar y ejecutar un plan de intervención inmediato, priorizando las dimensiones con mayor porcentaje de riesgo alto.");
    recommendations.push("Definir responsables, plazos, recursos y evidencias de cumplimiento para cada acción preventiva y correctiva.");
  } else if (globalRisk === "medio") {
    recommendations.push("Implementar medidas preventivas en el corto y mediano plazo para evitar que el riesgo psicosocial aumente.");
    recommendations.push("Realizar seguimiento periódico y reforzar la comunicación con los trabajadores sobre las acciones adoptadas.");
  } else {
    recommendations.push("Mantener controles existentes y realizar monitoreo periódico para conservar el nivel de riesgo bajo.");
  }

  for (const dimension of prioritized) {
    if ((dimension.altoPct || 0) > 0) {
      recommendations.push(`Priorizar intervención en ${dimension.name}, que presenta ${dimension.altoPct}% de riesgo alto.`);
    } else if ((dimension.medioPct || 0) > 0) {
      recommendations.push(`Mantener vigilancia preventiva en ${dimension.name}, que presenta ${dimension.medioPct}% de riesgo medio.`);
    }
  }

  recommendations.push("Socializar los resultados con los participantes y documentar el plan de acción correspondiente.");
  return [...new Set(recommendations)];
};

export const buildActionPlan = (prioritized = []) =>
  prioritized
    .filter((dimension) => (dimension.altoPct || 0) > 0 || (dimension.medioPct || 0) > 0)
    .map((dimension) => {
      const hasHighRisk = (dimension.altoPct || 0) > 0;
      return {
        dimension: dimension.name,
        riesgo: hasHighRisk ? "alto" : "medio",
        hallazgo: hasHighRisk
          ? `${dimension.altoPct}% de participantes se ubican en riesgo alto y ${dimension.medioPct || 0}% en riesgo medio.`
          : `${dimension.medioPct}% de participantes se ubican en riesgo medio.`,
        accion: hasHighRisk
          ? `Implementar intervención prioritaria sobre ${dimension.name}, con medidas preventivas y correctivas documentadas.`
          : `Realizar seguimiento preventivo sobre ${dimension.name} y reforzar controles existentes.`,
        responsable: "Responsable SST / Talento Humano",
        plazo: hasHighRisk ? "30 días" : "60 días",
        verificacion: "Plan de acción, actas de socialización, evidencias de ejecución y seguimiento.",
        estado: "Pendiente"
      };
    });

export const riskLabels = RISK_LABELS;
export const riskInterpretations = RISK_INTERPRETATIONS;
