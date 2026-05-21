import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, uploadFileMock } = vi.hoisted(() => ({
  prismaMock: {
    document: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    service: { findUnique: vi.fn() },
    proposal: { findFirst: vi.fn() },
  },
  uploadFileMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/storage/supabase", () => ({ uploadFile: uploadFileMock }));

import { uploadDocument } from "@/features/documents/actions";

describe("uploadDocument", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("uploads file and creates document with storage metadata", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    uploadFileMock.mockResolvedValue("tenant-1/svc-1/doc-1-file.pdf");
    prismaMock.document.create.mockResolvedValue({
      id: "doc-1", tenantId: "tenant-1", serviceId: "svc-1",
      title: "Memorial", url: "/api/documents/PENDING/download",
      visibility: "INTERNAL", mimeType: "application/pdf",
    });
    prismaMock.document.update.mockResolvedValue({
      id: "doc-1", tenantId: "tenant-1", serviceId: "svc-1",
      title: "Memorial", url: "/api/documents/doc-1/download",
      visibility: "INTERNAL", storagePath: "tenant-1/svc-1/doc-1-file.pdf",
      fileName: "file.pdf", fileSize: 1000, mimeType: "application/pdf",
    });

    const file = new File(["content"], "file.pdf", { type: "application/pdf" });
    const result = await uploadDocument("tenant-1", {
      serviceId: "svc-1", title: "Memorial", visibility: "INTERNAL", file,
    });

    expect(result.storagePath).toBe("tenant-1/svc-1/doc-1-file.pdf");
    expect(uploadFileMock).toHaveBeenCalled();
  });

  it("rejects when service does not belong to tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);
    const file = new File(["content"], "file.pdf", { type: "application/pdf" });
    await expect(
      uploadDocument("tenant-1", { serviceId: "svc-x", title: "Doc", visibility: "INTERNAL", file }),
    ).rejects.toThrow("does not belong to tenant");
  });

  it("rejects file over 10MB", async () => {
    const bigFile = new File(["x".repeat(11_000_000)], "big.pdf", { type: "application/pdf" });
    await expect(
      uploadDocument("tenant-1", { serviceId: "svc-1", title: "Doc", visibility: "INTERNAL", file: bigFile }),
    ).rejects.toThrow("10MB");
  });

  it("rejects unsupported file type", async () => {
    const exeFile = new File(["content"], "script.exe", { type: "application/x-msdownload" });
    await expect(
      uploadDocument("tenant-1", { serviceId: "svc-1", title: "Doc", visibility: "INTERNAL", file: exeFile }),
    ).rejects.toThrow("não suportado");
  });

  it("cleans up document if upload fails", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.document.create.mockResolvedValue({ id: "doc-1", tenantId: "tenant-1" });
    uploadFileMock.mockRejectedValue(new Error("Storage error"));

    const file = new File(["content"], "file.pdf", { type: "application/pdf" });
    await expect(
      uploadDocument("tenant-1", { serviceId: "svc-1", title: "Doc", visibility: "INTERNAL", file }),
    ).rejects.toThrow("Upload failed");

    expect(prismaMock.document.delete).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "tenant-1", id: "doc-1" } },
    });
  });

  it("validates proposal belongs to service when proposalId provided", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.proposal.findFirst.mockResolvedValue(null);
    const file = new File(["content"], "file.pdf", { type: "application/pdf" });
    await expect(
      uploadDocument("tenant-1", { serviceId: "svc-1", proposalId: "prop-x", title: "Doc", visibility: "INTERNAL", file }),
    ).rejects.toThrow("does not belong to service");
  });
});
