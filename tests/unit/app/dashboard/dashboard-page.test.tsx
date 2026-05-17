import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/tenant", () => ({
  requireTenantId: vi.fn(async () => "tenant-1"),
}));

const mockData = {
  clientCount: 5,
  propertyCount: 10,
  serviceCount: 20,
  servicesByStatus: [
    { status: "NEW", count: 3 },
    { status: "PRODUCTION", count: 7 },
    { status: "DELIVERED", count: 10 },
  ],
  upcomingDueDates: [
    {
      id: "svc-1",
      title: "Projeto A",
      dueDate: new Date("2026-06-15"),
      client: { name: "Cliente A" },
    },
  ],
  recentServices: [
    {
      id: "svc-2",
      title: "Projeto B",
      status: "NEW",
      createdAt: new Date("2026-05-15"),
      client: { name: "Cliente B" },
    },
  ],
  pendingTasks: [
    {
      id: "task-1",
      title: "Fundação",
      dueDate: new Date("2026-07-01"),
      serviceId: "svc-1",
      serviceTitle: "Projeto A",
    },
  ],
  overdueTasks: [
    {
      id: "task-2",
      title: "Pintura",
      dueDate: new Date("2026-05-01"),
      serviceId: "svc-2",
      serviceTitle: "Projeto B",
    },
  ],
};

const emptyData = {
  clientCount: 0,
  propertyCount: 0,
  serviceCount: 0,
  servicesByStatus: [],
  upcomingDueDates: [],
  recentServices: [],
  pendingTasks: [],
  overdueTasks: [],
};

vi.mock("@/features/dashboard/actions", () => ({
  getDashboardData: vi.fn(),
}));

import { getDashboardData } from "@/features/dashboard/actions";

import DashboardPage from "@/app/(app)/dashboard/page";

describe("DashboardPage", () => {
  it("renders heading", async () => {
    vi.mocked(getDashboardData).mockResolvedValue(mockData);
    render(await DashboardPage());

    expect(
      screen.getByRole("heading", { name: "Painel" }),
    ).toBeInTheDocument();
  });

  it("renders total counts as links", async () => {
    vi.mocked(getDashboardData).mockResolvedValue(mockData);
    render(await DashboardPage());
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText("Imóveis")).toBeInTheDocument();
    expect(screen.getByText("Serviços")).toBeInTheDocument();
  });

  it("renders services by status", async () => {
    vi.mocked(getDashboardData).mockResolvedValue(mockData);
    render(await DashboardPage());

    expect(screen.getAllByText("Novo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Produção")).toBeInTheDocument();
    expect(screen.getByText("Entregue")).toBeInTheDocument();
  });

  it("renders upcoming due dates", async () => {
    vi.mocked(getDashboardData).mockResolvedValue(mockData);
    render(await DashboardPage());

    expect(screen.getByText("Projeto A")).toBeInTheDocument();
    expect(screen.getByText(/Cliente A/)).toBeInTheDocument();
  });

  it("renders recent services table", async () => {
    vi.mocked(getDashboardData).mockResolvedValue(mockData);
    render(await DashboardPage());

    expect(screen.getByText("Projeto B")).toBeInTheDocument();
    expect(screen.getByText("Cliente B")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos" })).toHaveAttribute(
      "href",
      "/services",
    );
  });

  it("renders pending and overdue tasks", async () => {
    vi.mocked(getDashboardData).mockResolvedValue(mockData);
    render(await DashboardPage());

    expect(screen.getByText("Fundação")).toBeInTheDocument();
    expect(screen.getByText("Pintura")).toBeInTheDocument();
    expect(screen.getByText("Tarefas Pendentes")).toBeInTheDocument();
    expect(screen.getByText("Tarefas Atrasadas")).toBeInTheDocument();
  });

  it("renders empty state when no data", async () => {
    vi.mocked(getDashboardData).mockResolvedValue(emptyData);
    render(await DashboardPage());

    expect(screen.getByText(/Nenhum dado encontrado/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "cliente" })).toHaveAttribute(
      "href",
      "/clients/new",
    );
  });
});
