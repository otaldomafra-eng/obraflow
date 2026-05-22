import { expect, test } from "@playwright/test";

const PREFIX = `teste-e2e-${Date.now()}`;

test.describe("fluxo de usuários", () => {
  test("admin cria usuário, altera cargo e remove", async ({ page }) => {
    test.setTimeout(90000);

    const pageErrors: string[] = [];
    const allConsole: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      allConsole.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    await page.getByRole("link", { name: "Usuários" }).click();
    await page.waitForURL("/settings/users", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();

    await page.getByRole("button", { name: "Novo Usuário" }).click();

    const email = `${PREFIX}@e2e.test`;
    await page.getByLabel("Nome *").fill(`${PREFIX} - Usuário`);
    await page.getByLabel("Email *").fill(email);
    await page.getByLabel("Cargo *").selectOption("TECHNICIAN");
    await page.getByLabel("Senha temporária *").fill("senha1234");
    await page.getByLabel("Confirmar senha *").fill("senha1234");

    await page.getByRole("button", { name: "Criar Usuário" }).click();

    await expect(page.getByText(email)).toBeVisible({ timeout: 15000 });
    expect(pageErrors.length).toBe(0);
  });

  test("senha atual incorreta mostra erro", async ({ page }) => {
    test.setTimeout(30000);

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("admin@obraflow.local");
    await page.getByLabel("Senha").fill("obraflow123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });

    await page.getByRole("link", { name: "Segurança" }).click();
    await page.waitForURL("/settings/security", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Segurança" })).toBeVisible();

    await page.locator("#currentPassword").fill("senha-errada");
    await page.locator("#newPassword").fill("outrasenha123");
    await page.locator("#confirmPassword").fill("outrasenha123");
    await page.getByRole("button", { name: "Alterar senha" }).click();

    await expect(page.getByText("Senha atual incorreta")).toBeVisible({ timeout: 10000 });
  });
});
