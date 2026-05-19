import { expect, test } from "@playwright/test";

const PREFIX = `Teste E2E ${Date.now()}`;

test.describe("fluxo operacional de tarefas", () => {
  test("navega /services → service detail → task detail → work logs", async ({ page }) => {
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
    // Create task via inline form
    await page.waitForSelector("text=Nova Tarefa");
    await page.getByLabel("Título *").fill(`${PREFIX} - Tarefa`);
    await page.getByRole("button", { name: /salvar tarefa/i }).click();
    // Wait for server action + RSC re-render to propagate
    await page.waitForTimeout(2000);

    // Find task link by title text (robust — works regardless of URL structure)
    const createdTaskLink = page.getByRole("link", { name: `${PREFIX} - Tarefa` });
    await expect(createdTaskLink).toBeVisible({ timeout: 8000 });
    const taskHref = await createdTaskLink.getAttribute("href");
    await page.goto(taskHref!);
    await page.waitForURL(`**/tasks/**`, { timeout: 10000 });

    // Validate task detail page
    await expect(page.getByRole("heading", { name: `${PREFIX} - Tarefa` })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Registros de Trabalho", { exact: true })).toBeVisible();
    await expect(page.getByText("Editar tarefa →")).toBeVisible();

    // Navigate to work logs
    await page.getByRole("link", { name: /registros de trabalho/i }).click();
    await page.waitForURL(`**/work-logs`, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Registros de Trabalho" })).toBeVisible({ timeout: 5000 });
  });

  test("editar tarefa redireciona de volta ao detalhe", async ({ page }) => {
    test.setTimeout(90000);
    // Login
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Create client + property + service
    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente 2`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/clients/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel 2`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço 2`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    // Create task
    await page.waitForSelector("text=Nova Tarefa");
    await page.getByLabel("Título *").fill(`${PREFIX} - Tarefa Edit`);
    await page.getByRole("button", { name: /salvar tarefa/i }).click();
    // Wait for server action + RSC re-render to propagate
    await page.waitForTimeout(2000);

    // Navigate to task detail by title
    const createdTaskLink = page.getByRole("link", { name: `${PREFIX} - Tarefa Edit` });
    await expect(createdTaskLink).toBeVisible({ timeout: 8000 });
    const taskHref = await createdTaskLink.getAttribute("href");
    await page.goto(taskHref!);
    await page.waitForURL(`**/tasks/**`, { timeout: 10000 });
    const taskId = page.url().split("/").pop()!;

    // Navigate to edit
    await page.getByRole("link", { name: /editar tarefa/i }).click();
    await page.waitForURL(`**/tasks/${taskId}/edit`, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Editar Tarefa" })).toBeVisible();

    // Update title and save
    const titleInput = page.getByLabel("Título *");
    await titleInput.clear();
    await titleInput.fill(`${PREFIX} - Tarefa Edit Atualizada`);
    await page.getByRole("button", { name: "Salvar Tarefa" }).click();

    // Should redirect back to task detail
    await page.waitForURL(/\/services\/.+\/tasks\/[^/]+$/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: `${PREFIX} - Tarefa Edit Atualizada` })).toBeVisible({ timeout: 5000 });
  });
});
