import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    contract: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    service: { findUnique: vi.fn() },
    proposal: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import {
  createContract,
  generateContractNumber,
  getContract,
  listContracts,
  updateContract,
} from "@/features/contracts/actions";

describe("contract actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("generates the next number from the max existing CT suffix", async () => {
    prismaMock.contract.findMany.mockResolvedValue([
      { number: "CT-00001" },
      { number: "CT-00009" },
      { number: "LEGACY-7" },
    ]);

    await expect(generateContractNumber("t-1")).resolves.toBe("CT-00010");
  });

  it("generates CT-00001 when no CT- contracts exist", async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    await expect(generateContractNumber("t-1")).resolves.toBe("CT-00001");
  });

  it("creates a contract with generated number", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.contract.findMany.mockResolvedValue([]);
    prismaMock.contract.create.mockResolvedValue({
      id: "ct-1",
      tenantId: "t-1",
      serviceId: "svc-1",
      proposalId: null,
      number: "CT-00001",
      status: "DRAFT",
      signedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createContract("t-1", { serviceId: "svc-1" });

    expect(result.number).toBe("CT-00001");
    expect(prismaMock.contract.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: "t-1",
        serviceId: "svc-1",
        proposalId: null,
        number: "CT-00001",
        status: "DRAFT",
      }),
    });
  });

  it("rejects create when service is outside tenant", async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(createContract("t-1", { serviceId: "svc-x" })).rejects.toThrow(
      "does not belong to tenant",
    );
    expect(prismaMock.contract.create).not.toHaveBeenCalled();
  });

  it("validates proposal belongs to the selected service", async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.proposal.findFirst.mockResolvedValue(null);

    await expect(
      createContract("t-1", { serviceId: "svc-1", proposalId: "prop-x" }),
    ).rejects.toThrow("does not belong to service");
  });

  it("sets signedAt when status becomes SIGNED", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({ id: "ct-1", signedAt: null });
    prismaMock.contract.update.mockResolvedValue({ id: "ct-1", status: "SIGNED" });

    await updateContract("t-1", "ct-1", { status: "SIGNED" });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "t-1", id: "ct-1" } },
      data: { status: "SIGNED", signedAt: expect.any(Date) },
    });
  });

  it("clears signedAt when status leaves SIGNED", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: "ct-1",
      signedAt: new Date("2026-01-01"),
    });
    prismaMock.contract.update.mockResolvedValue({ id: "ct-1", status: "ISSUED" });

    await updateContract("t-1", "ct-1", { status: "ISSUED" });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "t-1", id: "ct-1" } },
      data: { status: "ISSUED", signedAt: null },
    });
  });

  it("does not change signedAt when status does not involve SIGNED transition", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: "ct-1",
      signedAt: null,
    });
    prismaMock.contract.update.mockResolvedValue({ id: "ct-1", status: "ISSUED" });

    await updateContract("t-1", "ct-1", { status: "ISSUED" });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: "t-1", id: "ct-1" } },
      data: { status: "ISSUED" },
    });
    // signedAt should not be in the data object
    const callData = prismaMock.contract.update.mock.calls[0][0].data;
    expect(callData).not.toHaveProperty("signedAt");
  });

  it("lists contracts with filters", async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    await listContracts("t-1", { serviceId: "svc-1", status: "SIGNED", search: "00010" });

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "t-1",
          serviceId: "svc-1",
          status: "SIGNED",
          number: { contains: "00010", mode: "insensitive" },
        },
      }),
    );
  });

  it("lists contracts filtering by proposalId", async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    await listContracts("t-1", { proposalId: "prop-1" });

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ proposalId: "prop-1" }),
      }),
    );
  });

  it("gets a contract by tenant and id", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({ id: "ct-1", number: "CT-00001" });

    const result = await getContract("t-1", "ct-1");

    expect(result).toEqual({ id: "ct-1", number: "CT-00001" });
    expect(prismaMock.contract.findFirst).toHaveBeenCalledWith({
      where: { tenantId: "t-1", id: "ct-1" },
      include: expect.any(Object),
    });
  });

  it("retries on P2002 collision", async () => {
    const p2002 = new PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "5.0.0" },
    );

    prismaMock.service.findUnique.mockResolvedValue({ id: "svc-1" });
    prismaMock.contract.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ number: "CT-00001" }]);
    prismaMock.contract.create
      .mockRejectedValueOnce(p2002)
      .mockResolvedValueOnce({
        id: "ct-1",
        tenantId: "t-1",
        serviceId: "svc-1",
        proposalId: null,
        number: "CT-00002",
        status: "DRAFT",
        signedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const result = await createContract("t-1", { serviceId: "svc-1" });

    expect(result.number).toBe("CT-00002");
    expect(prismaMock.contract.create).toHaveBeenCalledTimes(2);
  });
});
