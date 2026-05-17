import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NewPropertyPage from "@/app/(app)/properties/new/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/clients/actions", () => ({
  listClientsForSelect: vi.fn(async () => [
    { id: "client-1", name: "João Silva" },
    { id: "client-2", name: "Maria Souza" },
  ]),
}));

vi.mock("@/features/properties/actions", () => ({
  createProperty: vi.fn(),
}));

describe("NewPropertyPage", () => {
  it("renders breadcrumb and heading", async () => {
    render(await NewPropertyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "Imóveis" })).toHaveAttribute(
      "href",
      "/properties",
    );
    expect(
      screen.getByRole("heading", { name: "Novo Imóvel" }),
    ).toBeInTheDocument();
  });

  it("renders form with client selector", async () => {
    render(await NewPropertyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByLabelText("Cliente *")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do Imóvel *")).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
  });

  it("renders cancel link", async () => {
    render(await NewPropertyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Cancelar")).toHaveAttribute("href", "/properties");
  });

  it("renders submit button", async () => {
    render(await NewPropertyPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("button", { name: "Salvar Imóvel" }),
    ).toBeInTheDocument();
  });
});
