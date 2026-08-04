export const USER_ROLES = {
  ADMIN: "admin",
  CONSULTOR: "consultor",
  EMPRESA: "empresa"
};

export const ASSESSMENT_STATUS = {
  DRAFT: "borrador",
  IN_PROGRESS: "en_proceso",
  FINISHED: "finalizada"
};

export const DOSSIER_STATUS = {
  DRAFT: "borrador",
  REVIEWED: "revisado",
  SIGNED: "firmado",
  CLOSED: "cerrado"
};

export const RISK_LEVELS = {
  LOW: "bajo",
  MEDIUM: "medio",
  HIGH: "alto"
};

export const RESPONSE_OPTIONS = [
  { label: "Completamente de Acuerdo", value: 4 },
  { label: "Parcialmente de Acuerdo", value: 3 },
  { label: "Poco de acuerdo", value: 2 },
  { label: "En desacuerdo", value: 1 }
];
