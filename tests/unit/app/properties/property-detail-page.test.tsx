import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PropertyDetailPage from "@/app/(app)/properties/[propertyId]/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/properties/actions", () => ({
  getPropertyDetail: vi.fn(async () => ({
    id: "property-1",
    name: "Imóvel Teste",
    address: "Rua A, 123",
    city: "São Paulo",
    state: "SP",
    postalCode: null,
    notes: null,
    client: {
      id: "client-1",
      name: "Cliente Teste",
      email: null,
      phone: null,
    },
    services: [],
  })),
}));

describe("PropertyDetailPage", () => {
  it("links to new service with clientId and propertyId", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Novo" })).toHaveAttribute(
      "href",
      "/services/new?clientId=client-1&propertyId=property-1",
    );
  });

  it("shows empty state when property has no services", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(
      screen.getByText("Nenhum serviço vinculado a este imóvel."),
    ).toBeInTheDocument();
  });

  it("renders property name as heading", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Imóvel Teste" }),
    ).toBeInTheDocument();
  });
});
