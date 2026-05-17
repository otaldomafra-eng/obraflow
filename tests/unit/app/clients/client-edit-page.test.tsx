import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ClientEditPage from "@/app/(app)/clients/[clientId]/edit/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/clients/actions", () => ({
  getClientEdit: vi.fn(async () => ({
    id: "client-1",
    name: "João Silva",
    kind: "PERSON",
    document: "123.456.789-00",
    email: "joao@test.local",
    phone: "+55 63 99999-0000",
    notes: "Cliente desde 2020",
  })),
  updateClient: vi.fn(),
}));

describe("ClientEditPage", () => {
  it("renders breadcrumb with client name", async () => {
    render(
      await ClientEditPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute(
      "href",
      "/clients",
    );
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("renders form with pre-filled values", async () => {
    render(
      await ClientEditPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    const nameInput = screen.getByLabelText("Nome *") as HTMLInputElement;
    expect(nameInput.value).toBe("João Silva");

    const docInput = screen.getByLabelText("CPF/CNPJ") as HTMLInputElement;
    expect(docInput.value).toBe("123.456.789-00");

    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    expect(emailInput.value).toBe("joao@test.local");

    const phoneInput = screen.getByLabelText("Telefone") as HTMLInputElement;
    expect(phoneInput.value).toBe("+55 63 99999-0000");
  });

  it("renders cancel link back to client detail", async () => {
    render(
      await ClientEditPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    expect(screen.getByText("Cancelar")).toHaveAttribute(
      "href",
      "/clients/client-1",
    );
  });

  it("renders submit button", async () => {
    render(
      await ClientEditPage({
        params: Promise.resolve({ clientId: "client-1" }),
      }),
    );

    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });
});
