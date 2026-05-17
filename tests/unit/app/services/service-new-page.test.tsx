import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NewServicePage from "@/app/(app)/services/new/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/clients/actions", () => ({
  listClientsForSelect: vi.fn(async () => [
    { id: "client-1", name: "João Silva" },
  ]),
}));

vi.mock("@/features/properties/actions", () => ({
  listProperties: vi.fn(async () => ({
    items: [
      { id: "prop-1", name: "Casa Teste", client: { id: "client-1", name: "João Silva" } },
    ],
    total: 1,
    page: 1,
    pageSize: 100,
  })),
}));

vi.mock("@/features/services/actions", () => ({
  createService: vi.fn(),
}));

describe("NewServicePage", () => {
  it("renders breadcrumb and heading", async () => {
    render(await NewServicePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "Serviços" })).toHaveAttribute(
      "href",
      "/services",
    );
    expect(
      screen.getByRole("heading", { name: "Novo Serviço" }),
    ).toBeInTheDocument();
  });

  it("renders form with client and property selectors", async () => {
    render(await NewServicePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByLabelText("Cliente *")).toBeInTheDocument();
    expect(screen.getByLabelText("Imóvel")).toBeInTheDocument();
    expect(screen.getByLabelText("Título *")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo de Serviço *")).toBeInTheDocument();
  });

  it("renders submit button", async () => {
    render(await NewServicePage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("button", { name: "Criar Serviço" }),
    ).toBeInTheDocument();
  });

  it("uses clientId and propertyId search params as initial selection", async () => {
    render(
      await NewServicePage({
        searchParams: Promise.resolve({
          clientId: "client-1",
          propertyId: "prop-1",
        }),
      }),
    );

    const clientSelect = screen.getByLabelText("Cliente *") as HTMLSelectElement;
    const propertySelect = screen.getByLabelText("Imóvel") as HTMLSelectElement;

    expect(clientSelect.value).toBe("client-1");
    expect(propertySelect.value).toBe("prop-1");
  });
});
