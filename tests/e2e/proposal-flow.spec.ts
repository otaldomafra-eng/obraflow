import { expect, test } from "@playwright/test";

const PREFIX = `Teste E2E ${Date.now()}`;

test.describe("fluxo comercial de propostas", () => {
  test("cria proposta a partir do servico e navega ao detalhe", async ({ page }) => {
    test.setTimeout(90000);

    // Login
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Create client
    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/clients/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    // Create property
    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    // Create service
    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const serviceId = page.url().split("/").pop()!;

    // Navigate to service detail
    await page.goto(`/services/${serviceId}`);

    // Click "Criar Proposta" link
    await page.getByRole("link", { name: /criar proposta/i }).click();
    await page.waitForURL(`/proposals/new?serviceId=${serviceId}`, { timeout: 10000 });

    // Fill proposal form
    await page.getByLabel("Título *").fill(`${PREFIX} - Proposta`);
    await page.getByLabel("Valor Total").fill("15000");
    // Status defaults to "Rascunho" (DRAFT)
    await page.getByRole("button", { name: "Criar Proposta" }).click();

    // Wait for redirect to proposal detail (exclude /new)
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/proposals/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const proposalId = page.url().split("/").pop()!;

    // Verify title is visible on the detail page
    await expect(page.getByRole("heading", { name: `${PREFIX} - Proposta` })).toBeVisible({ timeout: 5000 });

    // Verify status badge shows "Rascunho"
    await expect(page.getByText("Rascunho")).toBeVisible({ timeout: 5000 });

    // Navigate to edit page
    await page.getByRole("link", { name: /editar proposta/i }).click();
    await page.waitForFunction(
      (id: string) => window.location.pathname === `/proposals/${id}/edit`,
      proposalId,
      { timeout: 15000 },
    );

    // Change status to "Enviada" (SENT) and update title
    const titleInput = page.getByLabel("Título *");
    await titleInput.clear();
    await titleInput.fill(`${PREFIX} - Proposta (Enviada)`);

    await page.getByLabel("Status").selectOption("SENT");
    await page.getByRole("button", { name: "Salvar Proposta" }).click();

    // Confirm redirect back to detail page
    await page.waitForFunction(
      (id: string) => window.location.pathname === `/proposals/${id}`,
      proposalId,
      { timeout: 15000 },
    );

    // Confirm updated title and badge
    await expect(page.getByRole("heading", { name: `${PREFIX} - Proposta (Enviada)` })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Enviada", { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test("dashboard comercial exibe metricas", async ({ page }) => {
    // Login
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Navigate to commercial dashboard
    await page.goto("/commercial");
    await page.waitForURL("/commercial", { timeout: 10000 });

    // Verify heading and metric cards
    await expect(page.getByRole("heading", { name: "Comercial" })).toBeVisible();
    await expect(page.getByText("Total de Propostas")).toBeVisible();
  });
});
