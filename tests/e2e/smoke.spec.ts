import { expect, test } from "@playwright/test";

test("admin signs in and sees app shell navigation", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill("admin@obraflow.local");
  await page.getByLabel("Senha").fill("obraflow123");
  await page.getByRole("button", { name: /sign in|entrar/i }).click();

  await page.waitForURL("/dashboard", { timeout: 15000 });

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
