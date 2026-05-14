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

describe("ServiceDetailPage", () => {
  it("links the client to its detail page and renders property as text", async () => {
    render(
      await ServiceDetailPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Cliente Teste" })).toHaveAttribute(
      "href",
      "/clients/client-1",
    );
    expect(screen.getByText("Imovel Teste")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Imovel Teste/ }),
    ).not.toBeInTheDocument();
  });
});
