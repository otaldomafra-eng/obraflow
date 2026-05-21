const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/acad": [".dwg"],
  "application/dwg": [".dwg"],
  "application/autocad_dwg": [".dwg"],
  "image/vnd.dwg": [".dwg"],
};

export function validateFile(file: { name: string; size: number; type: string }): { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Arquivo muito grande (máx. 10MB)" };
  }

  const allowedExtensions = ALLOWED_TYPES[file.type];
  if (!allowedExtensions) {
    return { ok: false, error: "Tipo de arquivo não suportado" };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { ok: false, error: "Tipo de arquivo inválido" };
  }

  return { ok: true };
}

export function sanitizeFileName(name: string): string {
  const parts = name.split(".");
  const ext = parts.pop()?.toLowerCase() ?? "";
  const base = parts.join(".");

  const sanitized = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${sanitized}.${ext}`;
}

export function buildStoragePath(tenantId: string, serviceId: string, documentId: string, fileName: string): string {
  return `${tenantId}/${serviceId}/${documentId}-${fileName}`;
}
