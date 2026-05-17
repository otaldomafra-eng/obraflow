import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NewClientPage from "@/app/(app)/clients/new/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/features/clients/actions", () => ({
  createClient: vi.fn(),
}));

describe("NewClientPage", () => {
  it("renders breadcrumb and heading", async () => {
    render(await NewClientPage());

    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute(
      "href",
      "/clients",
    );
    expect(
      screen.getByRole("heading", { name: "Novo Cliente" }),
    ).toBeInTheDocument();
  });

  it("renders form fields", async () => {
    render(await NewClientPage());

    expect(screen.getByLabelText("Nome *")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("CPF/CNPJ")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("renders submit button", async () => {
    render(await NewClientPage());

    expect(
      screen.getByRole("button", { name: "Salvar Cliente" }),
    ).toBeInTheDocument();
  });
});
