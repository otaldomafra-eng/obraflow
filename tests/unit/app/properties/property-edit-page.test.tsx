import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PropertyEditPage from "@/app/(app)/properties/[propertyId]/edit/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/properties/actions", () => ({
  getPropertyDetail: vi.fn(async () => ({
    id: "property-1",
    name: "Casa Teste",
    address: "Rua A, 123",
    city: "Palmas",
    state: "TO",
    postalCode: "77000-000",
    notes: "Observação",
    client: { id: "client-1", name: "Cliente Teste", email: null, phone: null },
    services: [],
  })),
  updateProperty: vi.fn(),
}));

describe("PropertyEditPage", () => {
  it("renders form with pre-filled values", async () => {
    render(
      await PropertyEditPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    const nameInput = screen.getByLabelText("Nome do Imóvel *") as HTMLInputElement;
    expect(nameInput.value).toBe("Casa Teste");

    const addressInput = screen.getByLabelText("Endereço") as HTMLInputElement;
    expect(addressInput.value).toBe("Rua A, 123");

    const cityInput = screen.getByLabelText("Cidade") as HTMLInputElement;
    expect(cityInput.value).toBe("Palmas");

    const stateInput = screen.getByLabelText("Estado") as HTMLInputElement;
    expect(stateInput.value).toBe("TO");

    const cepInput = screen.getByLabelText("CEP") as HTMLInputElement;
    expect(cepInput.value).toBe("77000-000");
  });

  it("renders cancel link back to property detail", async () => {
    render(
      await PropertyEditPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByText("Cancelar")).toHaveAttribute(
      "href",
      "/properties/property-1",
    );
  });

  it("renders submit button", async () => {
    render(
      await PropertyEditPage({
        params: Promise.resolve({ propertyId: "property-1" }),
      }),
    );

    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });
});
