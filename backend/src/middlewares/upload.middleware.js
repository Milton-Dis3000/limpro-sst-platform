import multer from "multer";

const storage = multer.memoryStorage();

const allowedDocumentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype.startsWith("image/") || allowedDocumentTypes.has(file.mimetype);
    if (!allowed) return cb(new Error("Solo se permiten imagenes, PDF, Word o Excel."));
    return cb(null, true);
  }
});
