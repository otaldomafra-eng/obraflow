import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ServiceDetailPage from "@/app/(app)/services/[serviceId]/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/services/actions", () => ({
  getServiceDetail: vi.fn(async () => ({
    id: "service-1",
    title: "Projeto de Incendio",
    type: "FIRE_SAFETY",
    status: "NEW",
    description: null,
    startDate: null,
    dueDate: null,
    client: {
      id: "client-1",
      name: "Cliente Teste",
      email: null,
      phone: null,
    },
    property: {
      id: "property-1",
      name: "Imovel Teste",
      address: "Rua 1",
      city: "Palmas",
    },
    _count: {
      tasks: 0,
      documents: 0,
      proposals: 0,
      contracts: 0,
      workLogs: 0,
    },
  })),
}));

vi.mock("@/features/service-tasks/actions", () => ({
  listServiceTasks: vi.fn(async () => []),
  createServiceTask: vi.fn(async () => ({})),
}));

vi.mock("@/features/service-tasks/ServiceTaskForm", () => ({
  ServiceTaskForm: () => null,
}));

vi.mock("@/features/service-tasks/ServiceTaskSortableList", () => ({
  ServiceTaskSortableList: () => null,
}));

vi.mock("@/features/proposals/actions", () => ({
  listProposals: vi.fn(async () => []),
}));

vi.mock("@/features/proposals/ProposalStatusBadge", () => ({
  ProposalStatusBadge: () => null,
}));

describe("ServiceDetailPage", () => {
  it("links client to /clients/[id] and property to /properties/[id]", async () => {
    render(
      await ServiceDetailPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Cliente Teste" })).toHaveAttribute(
      "href",
      "/clients/client-1",
    );
    expect(screen.getByRole("link", { name: "Imovel Teste" })).toHaveAttribute(
      "href",
      "/properties/property-1",
    );
  });

  it("renders stats section with zero counts when no tasks", async () => {
    render(
      await ServiceDetailPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    expect(screen.getAllByText("Tarefas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Registros de Trabalho")).toBeInTheDocument();
    expect(screen.getByText("Estatísticas")).toBeInTheDocument();
  });

  it("renders edit link", async () => {
    render(
      await ServiceDetailPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/services/service-1/edit",
    );
  });
});