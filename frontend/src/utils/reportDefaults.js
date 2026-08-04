export const buildDefaultReportText = (assessment = {}) => {
  const company = assessment.empresa?.nombreComercial || assessment.empresa?.razonSocial || "la empresa";
  const participants = assessment.resultadosCalculados?.totalParticipantes || assessment.totalParticipantes || 0;
  const global = assessment.resultadosCalculados?.global || {};
  const dimensions = assessment.resultadosCalculados?.dimensiones || [];
  const highRiskDimensions = dimensions.filter((dimension) => (dimension.altoPct || 0) > 0);
  const mediumRiskDimensions = dimensions.filter((dimension) => (dimension.medioPct || 0) > 0);
  const priorityNames = highRiskDimensions.length
    ? highRiskDimensions.map((dimension) => dimension.name).join(", ")
    : mediumRiskDimensions.slice(0, 5).map((dimension) => dimension.name).join(", ");

  return {
    objetivo:
      `Evaluar los factores de riesgo psicosocial presentes en ${company}, mediante la aplicacion del Cuestionario de Evaluacion Psicosocial en Espacios Laborales, con el fin de identificar niveles de exposicion, establecer prioridades de intervencion y orientar acciones preventivas y correctivas.`,
    alcance:
      `La evaluacion comprende a ${participants} participante(s) de ${company}. La informacion recolectada se procesa de forma confidencial y anonima, considerando los resultados globales, por dimension y por subdimension establecidos en la herramienta tecnica.`,
    metodologia:
      "Se aplico el Cuestionario de Evaluacion Psicosocial en Espacios Laborales. Cada item se puntua de 1 a 4 segun la opcion seleccionada. Los puntajes se agrupan por dimensiones y subdimensiones, y se clasifican en riesgo bajo, medio o alto conforme a los rangos definidos en la herramienta de tabulacion.",
    conclusiones:
      `Con base en los resultados obtenidos, el resultado global presenta ${global.bajoPct || 0}% de riesgo bajo, ${global.medioPct || 0}% de riesgo medio y ${global.altoPct || 0}% de riesgo alto. ${priorityNames ? `Las dimensiones que requieren mayor seguimiento o intervencion son: ${priorityNames}.` : "No se identifican dimensiones prioritarias con riesgo alto o medio significativo."} Se recomienda mantener el monitoreo periodico y ejecutar el plan de accion documentado.`
  };
};

export const mergeReportDefaults = (assessment = {}, report = {}) => {
  const defaults = buildDefaultReportText(assessment);
  return {
    objetivo: report.objetivo || defaults.objetivo,
    alcance: report.alcance || defaults.alcance,
    metodologia: report.metodologia || defaults.metodologia,
    conclusiones: report.conclusiones || defaults.conclusiones
  };
};
