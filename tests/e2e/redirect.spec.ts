import { expect, test } from "@playwright/test";

const PREFIX = `Teste Beta ${Date.now()}`;

test.describe("redirect pós-submit", () => {
  test("cria cliente e redireciona para detalhe", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    await page.goto("/clients/new");
    await expect(page.getByRole("heading", { name: "Novo Cliente" })).toBeVisible();

    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente`);
    await page.getByLabel("Email").fill(`${PREFIX}@test.local`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();

    // Wait for client-side navigation to detail page
    await page.waitForFunction(() => {
      const path = window.location.pathname;
      return path.startsWith("/clients/") && !path.endsWith("/new");
    }, { timeout: 15000 });

    const clientUrl = page.url();
    expect(clientUrl).toMatch(/\/clients\/[^/?#]+$/);
  });

  test("cria imóvel e redireciona para detalhe", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente Imóvel`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      const path = window.location.pathname;
      return path.startsWith("/clients/") && !path.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    await page.goto(`/properties/new?clientId=${clientId}`);
    await expect(page.getByRole("heading", { name: "Novo Imóvel" })).toBeVisible();
    await expect(page.getByLabel("Cliente *")).toHaveValue(clientId);

    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();

    await page.waitForFunction(() => {
      const path = window.location.pathname;
      return path.startsWith("/properties/") && !path.endsWith("/new");
    }, { timeout: 15000 });

    const propertyUrl = page.url();
    expect(propertyUrl).toMatch(/\/properties\/[^/?#]+$/);
  });

  test("cria serviço e redireciona para detalhe", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente Serviço`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      const path = window.location.pathname;
      return path.startsWith("/clients/") && !path.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel Serviço`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      const path = window.location.pathname;
      return path.startsWith("/properties/") && !path.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await expect(page.getByRole("heading", { name: "Novo Serviço" })).toBeVisible();
    await expect(page.getByLabel("Cliente *")).toHaveValue(clientId);

    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();

    await page.waitForFunction(() => {
      const path = window.location.pathname;
      return path.startsWith("/services/") && !path.endsWith("/new");
    }, { timeout: 15000 });

    const serviceUrl = page.url();
    expect(serviceUrl).toMatch(/\/services\/[^/?#]+$/);
  });
});
