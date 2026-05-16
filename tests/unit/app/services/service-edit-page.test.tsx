import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ServiceEditPage from "@/app/(app)/services/[serviceId]/edit/page";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

const mockService = {
  id: "service-1",
  title: "Projeto de Incendio",
  type: "FIRE_SAFETY",
  status: "NEW",
  description: "Descrição do serviço",
  startDate: new Date("2026-01-01"),
  dueDate: new Date("2026-06-01"),
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
};

vi.mock("@/features/services/actions", () => ({
  getServiceDetail: vi.fn(async () => mockService),
  updateService: vi.fn(),
}));

describe("ServiceEditPage", () => {
  it("renders form with pre-filled title and status", async () => {
    render(
      await ServiceEditPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    const titleInput = screen.getByLabelText("Título *") as HTMLInputElement;
    expect(titleInput.value).toBe("Projeto de Incendio");

    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(statusSelect.value).toBe("NEW");
  });

  it("renders description textarea when description is present", async () => {
    render(
      await ServiceEditPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    const descTextarea = screen.getByLabelText("Descrição") as HTMLTextAreaElement;
    expect(descTextarea.value).toBe("Descrição do serviço");
  });

  it("renders date inputs", async () => {
    render(
      await ServiceEditPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    const startInput = screen.getByLabelText("Data de Início") as HTMLInputElement;
    expect(startInput.value).toBe("2026-01-01");

    const dueInput = screen.getByLabelText("Data de Entrega") as HTMLInputElement;
    expect(dueInput.value).toBe("2026-06-01");
  });

  it("renders cancel link back to service detail", async () => {
    render(
      await ServiceEditPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    expect(screen.getByText("Cancelar")).toHaveAttribute(
      "href",
      "/services/service-1",
    );
  });

  it("renders submit button", async () => {
    render(
      await ServiceEditPage({
        params: Promise.resolve({ serviceId: "service-1" }),
      }),
    );

    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });
});
