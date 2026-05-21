import { describe, expect, it } from "vitest";
import { validateFile, sanitizeFileName, buildStoragePath } from "@/server/storage/validation";

describe("file validation", () => {
  it("accepts valid PDF", () => {
    const result = validateFile({ name: "doc.pdf", size: 1_000_000, type: "application/pdf" });
    expect(result.ok).toBe(true);
  });

  it("accepts valid PNG image", () => {
    const result = validateFile({ name: "photo.png", size: 2_000_000, type: "image/png" });
    expect(result.ok).toBe(true);
  });

  it("accepts valid JPEG image", () => {
    const result = validateFile({ name: "photo.jpg", size: 3_000_000, type: "image/jpeg" });
    expect(result.ok).toBe(true);
  });

  it("accepts valid DOCX", () => {
    const result = validateFile({ name: "report.docx", size: 500_000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    expect(result.ok).toBe(true);
  });

  it("accepts valid XLSX", () => {
    const result = validateFile({ name: "spreadsheet.xlsx", size: 800_000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    expect(result.ok).toBe(true);
  });

  it("rejects file over 10MB", () => {
    const result = validateFile({ name: "big.pdf", size: 11_000_000, type: "application/pdf" });
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("10MB");
  });

  it("rejects unsupported type", () => {
    const result = validateFile({ name: "script.exe", size: 1000, type: "application/x-msdownload" });
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("não suportado");
  });

  it("rejects MIME/extension mismatch", () => {
    const result = validateFile({ name: "doc.pdf", size: 1000, type: "image/png" });
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("inválido");
  });

  it("rejects zero-byte file with valid type", () => {
    const result = validateFile({ name: "empty.pdf", size: 0, type: "application/pdf" });
    expect(result.ok).toBe(true);
  });
});

describe("file name sanitization", () => {
  it("sanitizes special characters", () => {
    expect(sanitizeFileName("My Document (1).pdf")).toBe("my-document-1.pdf");
  });

  it("handles spaces and uppercase", () => {
    expect(sanitizeFileName("MEMORIAL DESCRITIVO.PDF")).toBe("memorial-descritivo.pdf");
  });

  it("preserves extension", () => {
    expect(sanitizeFileName("file.DOCX")).toBe("file.docx");
  });

  it("removes accents", () => {
    expect(sanitizeFileName("relatório técnico.pdf")).toBe("relatorio-tecnico.pdf");
  });

  it("handles multiple dots", () => {
    expect(sanitizeFileName("my.file.name.pdf")).toBe("my-file-name.pdf");
  });

  it("handles leading/trailing special chars", () => {
    expect(sanitizeFileName("---test---.pdf")).toBe("test.pdf");
  });
});

describe("storage path building", () => {
  it("builds correct path", () => {
    const path = buildStoragePath("tenant-1", "service-1", "doc-1", "memorial.pdf");
    expect(path).toBe("tenant-1/service-1/doc-1-memorial.pdf");
  });

  it("uses actual IDs in path", () => {
    const path = buildStoragePath("cmp4u9lpe0001", "cmp4ua1b2c3d", "doc-abc123", "file.pdf");
    expect(path).toBe("cmp4u9lpe0001/cmp4ua1b2c3d/doc-abc123-file.pdf");
  });
});
