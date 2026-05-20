import { expect, test } from "@playwright/test";

const PREFIX = `Teste E2E ${Date.now()}`;

test.describe("fluxo de contratos", () => {
  test("cria contrato a partir do servico e valida detalhe", async ({ page }) => {
    test.setTimeout(90000);

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/clients/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const serviceId = page.url().split("/").pop()!;

    await page.goto(`/services/${serviceId}`);

    await expect(page.getByRole("heading", { name: "Contratos" })).toBeVisible({ timeout: 5000 });

    await page.getByRole("link", { name: /criar contrato/i }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.endsWith("/contracts/new") && window.location.search.includes("serviceId=");
    }, { timeout: 10000 });

    await page.getByLabel("Status").selectOption("ISSUED");
    await page.getByRole("button", { name: "Criar Contrato" }).click();

    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/contracts/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    await expect(page.getByRole("heading", { name: /^Contrato CT-/ })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Emitido")).toBeVisible({ timeout: 5000 });

    await page.goto(`/services/${serviceId}`);
    await expect(page.getByText("CT-", { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test("cria contrato vinculado a proposta e valida no detalhe da proposta", async ({ page }) => {
    test.setTimeout(90000);

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/clients/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const serviceId = page.url().split("/").pop()!;

    await page.goto(`/services/${serviceId}`);

    await page.getByRole("link", { name: /criar proposta/i }).click();
    await page.waitForURL(`/proposals/new?serviceId=${serviceId}`, { timeout: 10000 });

    await page.getByLabel("Título *").fill(`${PREFIX} - Proposta`);
    await page.getByLabel("Status").selectOption("SENT");
    await page.getByRole("button", { name: "Criar Proposta" }).click();

    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/proposals/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const proposalId = page.url().split("/").pop()!;

    await page.getByRole("link", { name: /criar contrato/i }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.endsWith("/contracts/new") && window.location.search.includes("proposalId=");
    }, { timeout: 10000 });

    await page.getByRole("button", { name: "Criar Contrato" }).click();

    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/contracts/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    await expect(page.getByRole("heading", { name: /^Contrato CT-/ })).toBeVisible({ timeout: 5000 });

    await page.goto(`/proposals/${proposalId}`);

    await expect(page.getByText("CT-", { exact: false })).toBeVisible({ timeout: 5000 });
  });
});
