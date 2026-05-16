import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PropertyDetailPage from "@/app/(app)/properties/[propertyId]/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

const mockProperty = {
  id: "property-1",
  name: "Casa no Plano Diretor Sul",
  address: "Plano Diretor Sul",
  city: "Palmas",
  state: "TO",
  postalCode: "77000-000",
  notes: "Imóvel residencial",
  client: {
    id: "client-1",
    name: "Joao Silva",
    email: "joao@test.local",
    phone: "+55 63 99999-0000",
  },
  services: [
    {
      id: "service-1",
      title: "Projeto Residencial",
      status: "CONTRACTED",
    },
    {
      id: "service-2",
      title: "Acompanhamento de Obra",
      status: "PRODUCTION",
    },
  ],
};

vi.mock("@/features/properties/actions", () => ({
  getPropertyDetail: vi.fn(async () => mockProperty),
}));

describe("PropertyDetailPage", () => {
  it("renders property name and breadcrumb", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Casa no Plano Diretor Sul" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Imóveis" })).toHaveAttribute(
      "href",
      "/properties",
    );
  });

  it("links to the client detail page", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Joao Silva" })).toHaveAttribute(
      "href",
      "/clients/client-1",
    );
  });

  it("renders address and city/state", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByText("Plano Diretor Sul")).toBeInTheDocument();
    expect(screen.getByText("Palmas/TO")).toBeInTheDocument();
    expect(screen.getByText("77000-000")).toBeInTheDocument();
  });

  it("renders client contact information", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByText("joao@test.local")).toBeInTheDocument();
    expect(screen.getByText("+55 63 99999-0000")).toBeInTheDocument();
  });

  it("renders notes when present", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByText("Imóvel residencial")).toBeInTheDocument();
  });

  it("links to linked services", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(
      screen.getByRole("link", { name: "Projeto Residencial" }),
    ).toHaveAttribute("href", "/services/service-1");
    expect(
      screen.getByRole("link", { name: "Acompanhamento de Obra" }),
    ).toHaveAttribute("href", "/services/service-2");
  });

  it("renders edit link", async () => {
    render(
      await PropertyDetailPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/properties/property-1/edit",
    );
  });
});
