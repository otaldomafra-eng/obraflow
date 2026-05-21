import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

import { ClientForm } from "@/features/clients/ClientForm";
import { ClientEditForm } from "@/features/clients/ClientEditForm";
import { PropertyNewForm } from "@/features/properties/PropertyNewForm";
import { PropertyEditForm } from "@/features/properties/PropertyEditForm";
import { ServiceForm } from "@/features/services/ServiceForm";
import { ServiceEditForm } from "@/features/services/ServiceEditForm";

beforeEach(() => {
  mockPush.mockClear();
});

describe("ClientForm redirect", () => {
  it("navega para redirectUrl após submit bem-sucedido", async () => {
    const action = vi.fn(async () => ({ redirectUrl: "/clients/abc-123" }));
    const user = userEvent.setup();

    render(<ClientForm action={action} />);

    await user.type(screen.getByLabelText("Nome *"), "Teste");
    await user.click(screen.getByRole("button", { name: "Salvar Cliente" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clients/abc-123");
    }, { timeout: 5000 });
  });

  it("não navega se action retorna void", async () => {
    const action = vi.fn(async () => {});
    const user = userEvent.setup();

    render(<ClientForm action={action} />);

    await user.type(screen.getByLabelText("Nome *"), "Teste");
    await user.click(screen.getByRole("button", { name: "Salvar Cliente" }));

    await new Promise((r) => setTimeout(r, 500));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("ClientEditForm redirect", () => {
  const defaultValues = { name: "Nome", kind: "PERSON", document: "", email: "", phone: "", notes: "" };

  it("navega para redirectUrl após submit", async () => {
    const action = vi.fn(async () => ({ redirectUrl: "/clients/client-1" }));
    const user = userEvent.setup();

    render(<ClientEditForm action={action} clientId="client-1" defaultValues={defaultValues} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/clients/client-1");
    }, { timeout: 5000 });
  });
});

describe("PropertyNewForm redirect", () => {
  it("navega para redirectUrl após submit", async () => {
    const action = vi.fn(async () => ({ redirectUrl: "/properties/prop-1" }));
    const user = userEvent.setup();

    render(<PropertyNewForm action={action} clients={[{ id: "c1", name: "Cliente" }]} />);

    await user.selectOptions(screen.getByLabelText("Cliente *"), "c1");
    await user.type(screen.getByLabelText("Nome do Imóvel *"), "Imóvel");
    await user.click(screen.getByRole("button", { name: "Salvar Imóvel" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/properties/prop-1");
    }, { timeout: 5000 });
  });
});

describe("PropertyEditForm redirect", () => {
  const defaultValues = { name: "Casa", address: "", city: "", state: "", postalCode: "", notes: "" };

  it("navega para redirectUrl após submit", async () => {
    const action = vi.fn(async () => ({ redirectUrl: "/properties/prop-1" }));
    const user = userEvent.setup();

    render(<PropertyEditForm action={action} propertyId="prop-1" defaultValues={defaultValues} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/properties/prop-1");
    }, { timeout: 5000 });
  });
});

describe("ServiceForm redirect", () => {
  it("navega para redirectUrl após submit", async () => {
    const action = vi.fn(async () => ({ redirectUrl: "/services/svc-1" }));
    const user = userEvent.setup();

    render(
      <ServiceForm
        action={action}
        clients={[{ id: "c1", name: "Cliente" }]}
        propertiesByClient={{}}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Cliente *"), "c1");
    await user.type(screen.getByLabelText("Título *"), "Serviço");
    await user.selectOptions(screen.getByLabelText("Tipo de Serviço *"), "TECHNICAL_PROJECT");
    await user.click(screen.getByRole("button", { name: "Criar Serviço" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/services/svc-1");
    }, { timeout: 5000 });
  });
});

describe("ServiceEditForm redirect", () => {
  const defaultValues = { title: "Título", status: "NEW", description: "", startDate: "", dueDate: "", artNumber: "", technicalLead: "", councilRegNumber: "", internalCode: "" };

  it("navega para redirectUrl após submit", async () => {
    const action = vi.fn(async () => ({ redirectUrl: "/services/svc-1" }));
    const user = userEvent.setup();

    render(<ServiceEditForm action={action} serviceId="svc-1" defaultValues={defaultValues} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/services/svc-1");
    }, { timeout: 5000 });
  });
});
