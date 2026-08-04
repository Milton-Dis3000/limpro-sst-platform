export const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" }).format(new Date(value)) : "Sin fecha";

export const percent = (value = 0) => `${Math.round(value)}%`;
