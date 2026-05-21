import { expect, test } from "@playwright/test";

const PREFIX = `Teste E2E ${Date.now()}`;

test.describe("fluxo de documentos", () => {
  test("cria documento a partir do servico e valida detalhe e link externo", async ({ page }) => {
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

    // Verify "Documentos" section heading is visible
    await expect(page.getByRole("heading", { name: "Documentos" })).toBeVisible({ timeout: 5000 });

    // Click "Adicionar Documento" link
    await page.getByRole("link", { name: /adicionar documento/i }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.endsWith("/documents/new") && window.location.search.includes("serviceId=");
    }, { timeout: 10000 });

    // Fill document form
    await page.getByLabel("Título *").fill(`${PREFIX} - Memorial`);
    await page.getByLabel("URL do Arquivo *").fill("https://exemplo.com/teste.pdf");
    await page.getByLabel("Visibilidade").selectOption("CLIENT_VISIBLE");
    await page.getByLabel("Tipo (opcional)").fill("application/pdf");

    // Submit
    await page.getByRole("button", { name: "Adicionar Documento" }).click();

    // Wait for redirect to document detail
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/documents/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    // Verify heading
    await expect(page.getByRole("heading", { name: `${PREFIX} - Memorial` })).toBeVisible({ timeout: 5000 });

    // Verify visibility badge (use first() since badge appears in heading + metadata)
    await expect(page.getByText("Visível ao Cliente", { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // Verify "Abrir Arquivo →" link attributes
    const abrirLink = page.getByRole("link", { name: /abrir arquivo/i });
    await expect(abrirLink).toHaveAttribute("href", "https://exemplo.com/teste.pdf");
    await expect(abrirLink).toHaveAttribute("target", "_blank");

    // Navigate to service detail and verify document title appears
    await page.goto(`/services/${serviceId}`);
    await expect(page.getByText(`${PREFIX} - Memorial`)).toBeVisible({ timeout: 5000 });
  });

  test("cria documento vinculado a proposta e valida no detalhe da proposta", async ({ page }) => {
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
    await page.getByLabel("Valor Total").fill("10000");
    await page.getByLabel("Status").selectOption("SENT");
    await page.getByRole("button", { name: "Criar Proposta" }).click();

    // Wait for redirect to proposal detail
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/proposals/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const proposalId = page.url().split("/").pop()!;

    // Click "Adicionar Documento" link from proposal detail
    await page.getByRole("link", { name: /adicionar documento/i }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.endsWith("/documents/new") && window.location.search.includes("proposalId=");
    }, { timeout: 10000 });

    // Fill document form
    await page.getByLabel("Título *").fill(`${PREFIX} - Contrato`);
    await page.getByLabel("URL do Arquivo *").fill("https://exemplo.com/contrato.pdf");

    // Submit
    await page.getByRole("button", { name: "Adicionar Documento" }).click();

    // Wait for redirect to document detail
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/documents/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    // Navigate to proposal detail
    await page.goto(`/proposals/${proposalId}`);

    // Verify document title appears in the documents section
    await expect(page.getByText(`${PREFIX} - Contrato`)).toBeVisible({ timeout: 5000 });
  });

  test("cria documento com upload de PDF e visualiza no detalhe", async ({ page }) => {
    test.setTimeout(90000);

    // Login
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Create client
    await page.goto("/clients/new");
    await page.getByLabel("Nome *").fill(`${PREFIX} - Cliente Upload`);
    await page.getByRole("button", { name: "Salvar Cliente" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/clients/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const clientId = page.url().split("/").pop()!;

    // Create property
    await page.goto(`/properties/new?clientId=${clientId}`);
    await page.getByLabel("Nome do Imóvel *").fill(`${PREFIX} - Imóvel Upload`);
    await page.getByRole("button", { name: "Salvar Imóvel" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/properties/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const propertyId = page.url().split("/").pop()!;

    // Create service
    await page.goto(`/services/new?clientId=${clientId}&propertyId=${propertyId}`);
    await page.getByLabel("Título *").fill(`${PREFIX} - Serviço Upload`);
    await page.getByLabel("Tipo de Serviço *").selectOption("TECHNICAL_PROJECT");
    await page.getByRole("button", { name: "Criar Serviço" }).click();
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/services/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });
    const serviceId = page.url().split("/").pop()!;

    // Navigate to document creation
    await page.goto(`/documents/new?serviceId=${serviceId}`);

    // Switch to upload mode
    await page.getByRole("button", { name: /upload de arquivo/i }).click();

    // Create a small PDF file
    const pdfContent = Buffer.from("%PDF-1.4 test content");
    await page.setInputFiles('input[type="file"]', {
      name: "test-document.pdf",
      mimeType: "application/pdf",
      buffer: pdfContent,
    });

    // Fill form
    await page.getByLabel("Título *").fill(`${PREFIX} - PDF Upload`);
    await page.getByLabel("Visibilidade").selectOption("CLIENT_VISIBLE");
    await page.getByRole("button", { name: "Adicionar Documento" }).click();

    // Wait for redirect
    await page.waitForFunction(() => {
      return window.location.pathname.startsWith("/documents/") && !window.location.pathname.endsWith("/new");
    }, { timeout: 15000 });

    // Verify document detail shows upload info
    await expect(page.getByRole("heading", { name: `${PREFIX} - PDF Upload` })).toBeVisible();
    await expect(page.getByText("Baixar Arquivo")).toBeVisible();
    await expect(page.getByText("test-document.pdf")).toBeVisible();
  });
});
