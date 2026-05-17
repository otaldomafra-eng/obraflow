import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ClientDetailPage from "@/app/(app)/clients/[clientId]/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/clients/actions", () => ({
  getClientDetail: vi.fn(async () => ({
    id: "client-1",
    name: "Cliente Teste",
    kind: "PERSON",
    document: null,
    email: "cliente@test.com",
    phone: "11999999999",
    notes: null,
    properties: [],
    services: [],
  })),
}));

vi.mock("@/features/properties/PropertyForm", () => ({
  PropertyForm: () => null,
}));

describe("ClientDetailPage", () => {
  it("links to new property with clientId", async () => {
    render(
      await ClientDetailPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    const novoLinks = screen.getAllByRole("link", { name: "Novo" });
    const propertyLink = novoLinks.find(
      (l) => l.getAttribute("href") === "/properties/new?clientId=client-1",
    );
    expect(propertyLink).toBeInTheDocument();
  });

  it("links to new service with clientId", async () => {
    render(
      await ClientDetailPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    const novoLinks = screen.getAllByRole("link", { name: "Novo" });
    const serviceLink = novoLinks.find(
      (l) => l.getAttribute("href") === "/services/new?clientId=client-1",
    );
    expect(serviceLink).toBeInTheDocument();
  });

  it("links to all properties filtered by client", async () => {
    render(
      await ClientDetailPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    const verTodosLinks = screen.getAllByRole("link", { name: "Ver todos" });
    const propertiesLink = verTodosLinks.find(
      (l) => l.getAttribute("href") === "/properties?clientId=client-1",
    );
    expect(propertiesLink).toBeInTheDocument();
  });

  it("links to all services filtered by client", async () => {
    render(
      await ClientDetailPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    const verTodosLinks = screen.getAllByRole("link", { name: "Ver todos" });
    const servicesLink = verTodosLinks.find(
      (l) => l.getAttribute("href") === "/services?clientId=client-1",
    );
    expect(servicesLink).toBeInTheDocument();
  });

  it("shows empty state when client has no services", async () => {
    render(
      await ClientDetailPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    expect(
      screen.getByText("Nenhum serviço vinculado."),
    ).toBeInTheDocument();
  });

  it("shows empty state when client has no properties", async () => {
    render(
      await ClientDetailPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    expect(
      screen.getByText("Nenhum imóvel vinculado."),
    ).toBeInTheDocument();
  });
});
