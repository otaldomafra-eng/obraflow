import { expect, test } from "@playwright/test";

test("admin signs in and sees app shell navigation", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("heading", { name: /obraflow/i })).toBeVisible();

  await page.getByLabel("Email").fill("admin@obraflow.local");
  await page.getByLabel("Senha").fill("obraflow123");
  await page.getByRole("button", { name: /entrar/i }).click();

  await page.waitForURL("/dashboard", { timeout: 15000 });

  await expect(page.getByText("Painel")).toBeVisible();
  await expect(page.getByText("Visão executiva da operação.")).toBeVisible();

  const navEntries = [
    "Painel",
    "Clientes",
    "Imóveis",
    "Serviços",
    "Comercial",
    "Propostas",
    "Projetos",
    "Aprovações",
    "Obras",
    "Documentos",
    "Portal",
    "IA",
    "Configurações",
  ];

  for (const entry of navEntries) {
    await expect(page.getByRole("link", { name: entry })).toBeVisible();
  }

  await expect(page.getByText("Demo ObraFlow")).toBeVisible();
});

test("shows error for invalid credentials", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("admin@obraflow.local");
  await page.getByLabel("Senha").fill("wrong-password");
  await page.getByRole("button", { name: /entrar/i }).click();

  await expect(page.getByText("Credenciais inválidas")).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL("/sign-in");
});
