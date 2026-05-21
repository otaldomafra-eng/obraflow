import { expect, test } from "@playwright/test";

const PREFIX = `Teste E2E ${Date.now()}`;

test.describe("portal do cliente", () => {
  test("ativa portal, acessa sem auth e valida dados do servico", async ({ page }) => {
    test.setTimeout(120000);

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

    // Create a CLIENT_VISIBLE document for the service
    await page.getByRole("link", { name: /adicionar documento/i }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.endsWith("/documents/new") && window.location.search.includes("serviceId=");
    }, { timeout: 10000 });
    await page.getByLabel("Título *").fill(`${PREFIX} - Memorial`);
    await page.getByLabel("URL do Arquivo *").fill("https://exemplo.com/memorial.pdf");
    await page.getByLabel("Visibilidade").selectOption("CLIENT_VISIBLE");
    await page.getByRole("button", { name: "Adicionar Documento" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/documents/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    // Go back to service detail
    await page.goto(`/services/${serviceId}`);

    // Verify "Portal do Cliente" section is visible
    await expect(page.getByRole("heading", { name: "Portal do Cliente" })).toBeVisible({ timeout: 5000 });

    // Click "Ativar portal"
    await page.getByRole("button", { name: "Ativar portal" }).click();

    // Wait for page to revalidate and show portal URL
    await expect(page.getByText("Portal ativo")).toBeVisible({ timeout: 10000 });

    // Read the portal URL from the readonly input
    const portalUrl = await page.getByRole("textbox", { name: "Link do portal" }).inputValue();

    // Verify portal URL format
    expect(portalUrl).toContain("/portal/");

    // Extract portal token from URL
    const token = portalUrl.split("/portal/")[1];

    // Open portal page in a new context (no auth cookies)
    const portalContext = await page.context().browser()!.newContext();
    const portalPage = await portalContext.newPage();
    await portalPage.goto(`/portal/${token}`);

    // Verify portal shows service data
    await expect(portalPage.getByText(`${PREFIX} - Serviço`)).toBeVisible({ timeout: 10000 });
    await expect(portalPage.getByText(`${PREFIX} - Cliente`, { exact: true })).toBeVisible();

    // Verify portal shows CLIENT_VISIBLE document
    await expect(portalPage.getByText(`${PREFIX} - Memorial`)).toBeVisible();

    // Verify portal shows status
    await expect(portalPage.getByText("Novo")).toBeVisible();

    await portalContext.close();
  });

  test("token invalido retorna 404", async ({ page }) => {
    const response = await page.goto("/portal/invalid-token-12345");
    expect(response?.status()).toBe(404);
  });
});
