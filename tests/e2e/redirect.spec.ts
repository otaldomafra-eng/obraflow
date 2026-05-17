import { expect, test } from "@playwright/test";

const PREFIX = `Teste Beta PR8 ${Date.now()}`;

test.describe("redirect pós-submit", () => {
  test("cria e edita cliente com redirect", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Create
    await page.goto("/clients/new");
    await expect(page.getByRole("heading", { name: "Novo Cliente" })).toBeVisible();
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      const path = window.location.pathname;
      return path.startsWith("/clients/") && !path.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;
    expect(clientId).toBeTruthy();

    // Edit redirect
    await page.goto(`/clients/${clientId}/edit`);
    await expect(page.getByRole("heading", { name: "Editar Cliente" })).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForFunction(() => /^\/clients\/[^/]+$/.test(window.location.pathname), { timeout: 15000 });
    expect(page.url()).toMatch(/\/clients\/[^/?#]+\/?$/);
  });

  test("cria e edita imóvel com redirect", async ({ page }) => {
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
    await expect(page.getByRole("heading", { name: "Novo Imóvel" })).toBeVisible();
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;
    expect(propertyId).toBeTruthy();

    // Edit redirect
    await page.goto(`/properties/${propertyId}/edit`);
    await expect(page.getByRole("heading", { name: "Editar Imóvel" })).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForFunction(() => /^\/properties\/[^/]+$/.test(window.location.pathname), { timeout: 15000 });
    expect(page.url()).toMatch(/\/properties\/[^/?#]+\/?$/);
  });

  test("cria e edita serviço com redirect", async ({ page }) => {
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
    await expect(page.getByRole("heading", { name: "Novo Serviço" })).toBeVisible();
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const serviceId = page.url().split("/").pop()!;
    expect(serviceId).toBeTruthy();

    // Edit redirect
    await page.goto(`/services/${serviceId}/edit`);
    await expect(page.getByRole("heading", { name: "Editar Serviço" })).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForFunction(() => /^\/services\/[^/]+$/.test(window.location.pathname), { timeout: 15000 });
    expect(page.url()).toMatch(/\/services\/[^/?#]+\/?$/);
  });
});
