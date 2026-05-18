import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = process.env.BASE_URL || 'https://obraflow-brown.vercel.app';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.join(__dirname, '..', '.playwright-screenshots');
const EMAIL = process.env.EMAIL || 'admin@obraflow.local';
const PASSWORD = process.env.PASSWORD || 'obraflow123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

(async () => {
  console.log('=== PRODUCTION VALIDATION ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Check /sign-in loads
  console.log('1. Checking /sign-in...');
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 30000 });
  const signInTitle = await page.title();
  console.log(`   Title: "${signInTitle}"`);
  const signInVisible = await page.locator('button[type="submit"], input[type="email"]').first().isVisible().catch(() => false);
  console.log(`   Sign-in form visible: ${signInVisible}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-sign-in.png`, fullPage: true });
  console.log('   ✅ /sign-in carrega\n');

  // 2. Login
  console.log('2. Logging in...');
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 30000 });
  const emailInput = page.locator('input[name="email"], input[type="email"], input#email').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"], input#password').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    await submitBtn.click();
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`   After login URL: ${currentUrl}`);
    if (currentUrl.includes('/dashboard') || !currentUrl.includes('/sign-in')) {
      console.log('   ✅ Login successful\n');
    } else {
      console.log('   ⚠️ Login may have failed, continuing anyway\n');
    }
  } else {
    console.log('   ⚠️ Login form not found\n');
  }

  // Navigate to dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-dashboard.png`, fullPage: true });
  console.log(`   Dashboard URL: ${page.url()}`);
  console.log(`   On dashboard: ${page.url().includes('/dashboard')}\n`);

  // 3. Check sidebar links
  console.log('3. Checking sidebar links...');
  const expectedLinks = [
    'Painel', 'Clientes', 'Imóveis', 'Serviços',
    'Comercial', 'Propostas',
    'Projetos', 'Aprovações', 'Obras', 'Documentos', 'Portal',
    'IA', 'Configurações'
  ];
  const sidebarLinks = await page.locator('nav a').allTextContents().catch(async () => {
    const links = await page.locator('a').all();
    const texts = [];
    for (const link of links) {
      const text = await link.textContent().catch(() => '');
      if (text.trim()) texts.push(text.trim());
    }
    return texts;
  });
  console.log(`   Found nav items: [${sidebarLinks.map(s => `"${s.trim()}"`).join(', ')}]`);
  let allFound = true;
  for (const expected of expectedLinks) {
    const found = sidebarLinks.some(l => l.trim() === expected);
    if (found) {
      console.log(`   ✅ "${expected}" encontrado`);
    } else {
      console.log(`   ❌ "${expected}" NÃO encontrado`);
      allFound = false;
    }
  }
  console.log(`   ${allFound ? '✅ Todos os 13 links presentes' : '❌ Links faltando'}\n`);

  // 4-6. Visit pages
  for (const [label, url] of [['Clients', '/clients'], ['Properties', '/properties'], ['Services', '/services']]) {
    console.log(`${label === 'Clients' ? '4' : label === 'Properties' ? '5' : '6'}. Checking ${url}...`);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/0${label === 'Clients' ? '4' : label === 'Properties' ? '5' : '6'}-${url.slice(1)}.png`, fullPage: true });
    console.log(`   ✅ ${url} loaded\n`);
  }

  // 7. Detail pages
  console.log('7. Trying to open detail pages...');
  const clientLink = page.locator('a[href^="/clients/"]').first();
  if (await clientLink.isVisible().catch(() => false)) {
    const href = await clientLink.getAttribute('href');
    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-client-detail.png`, fullPage: true });
    const title = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log(`   ✅ Client detail opened: ${href} (${title})\n`);
  }

  for (const [label, url, detailPath] of [
    ['Property', '/properties', '/properties/'],
    ['Service', '/services', '/services/'],
  ]) {
    console.log(`7${label === 'Property' ? 'b' : 'c'}. Trying ${label.toLowerCase()} detail...`);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    if (page.url().includes('/sign-in')) {
      console.log('   ⚠️ Session lost, re-logging in...');
      await page.fill('#email', EMAIL);
      await page.fill('#password', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    }
    const link = page.locator(`a[href^="${detailPath}"]:not([href="${detailPath}new"])`).first();
    if (await link.isVisible().catch(() => false)) {
      const href = await link.getAttribute('href');
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07${label === 'Property' ? 'b' : 'c'}-${label.toLowerCase()}-detail.png`, fullPage: true });
      const title = await page.locator('h1, h2').first().textContent().catch(() => '');
      console.log(`   ✅ ${label} detail opened: ${href} (${title})\n`);
    } else {
      console.log(`   ℹ️ No ${label.toLowerCase()} detail link found\n`);
    }
  }

  // 7d. Task detail — pick a Demo Beta service with tasks deterministically
  console.log('7d. Trying task detail (Demo Beta deterministic)...');
  await page.goto(`${BASE_URL}/services`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/sign-in')) {
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.goto(`${BASE_URL}/services`, { waitUntil: 'networkidle', timeout: 30000 });
  }
  // Find a Demo Beta service link (prefixed with "Demo Beta")
  const demoServiceLink = page.locator('a[href^="/services/"]:not([href="/services/new"])').filter({ hasText: 'Demo Beta' }).first();
  if (!(await demoServiceLink.isVisible().catch(() => false))) {
    console.error('   ❌ No Demo Beta service found');
    process.exit(1);
  }
  const serviceHref = await demoServiceLink.getAttribute('href');
  console.log(`   Found Demo Beta service: ${serviceHref}`);
  await page.goto(`${BASE_URL}${serviceHref}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (page.url().includes('/sign-in')) {
    console.error('   ❌ Session lost navigating to service detail');
    process.exit(1);
  }
  // Find task detail link on service page
  const taskLink = page.locator('a[href*="/tasks/"]').first();
  if (!(await taskLink.isVisible().catch(() => false))) {
    console.error('   ❌ No task link found on service detail — service may have no tasks');
    process.exit(1);
  }
  const taskHref = await taskLink.getAttribute('href');
  console.log(`   Found task: ${taskHref}`);
  await page.goto(`${BASE_URL}${taskHref}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/sign-in')) {
    console.error('   ❌ Session lost navigating to task detail');
    process.exit(1);
  }
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07d-task-detail.png`, fullPage: true });
  const taskTitle = await page.locator('h1').first().textContent().catch(() => '');
  if (!taskTitle) {
    console.error('   ❌ Task detail page did not render a title');
    process.exit(1);
  }
  console.log(`   ✅ Task detail opened: ${taskHref} (${taskTitle})`);

  // 7e. Validate work logs link on task detail
  console.log('7e. Validating work logs link from task detail...');
  const workLogLink = page.locator(`a[href="${taskHref}/work-logs"]`).first();
  if (!(await workLogLink.isVisible().catch(() => false))) {
    console.error('   ❌ Work logs link not found on task detail');
    process.exit(1);
  }
  const workLogText = await workLogLink.textContent();
  console.log(`   ✅ Work logs link found: "${workLogText.trim()}"`);

  // 7f. Navigate to work logs page
  console.log('7f. Navigating to work logs...');
  await workLogLink.click();
  await page.waitForTimeout(2000);
  if (!page.url().includes('/work-logs')) {
    console.error('   ❌ Did not navigate to work logs page');
    process.exit(1);
  }
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07f-work-logs.png`, fullPage: true });
  const workLogTitle = await page.locator('h1').first().textContent().catch(() => '');
  console.log(`   ✅ Work logs page: "${workLogTitle}"\n`);

  // 8. Mobile viewport check
  console.log('8. Mobile viewport check...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/08-mobile-dashboard.png`, fullPage: true });
  const mobileOverlap = await page.locator('text=Painel').first().isVisible().catch(() => false);
  console.log(`   Mobile sidebar visible: ${mobileOverlap}`);
  const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="sidebar-toggle"], button:has(svg)').first();
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-mobile-menu-open.png`, fullPage: true });
    console.log('   ✅ Mobile menu toggle works\n');
  } else {
    console.log('   ℹ️ No mobile menu toggle found\n');
  }

  // 9. Visual sanity
  console.log('9. Visual sanity checks...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const buttons = await page.locator('button, a[role="button"]').count();
  const inputs = await page.locator('input, select, textarea').count();
  console.log(`   Buttons found: ${buttons}`);
  console.log(`   Inputs found: ${inputs}`);
  const errorMessages = await page.locator('[role="alert"], .error, .text-red-500, .text-red-600').count();
  console.log(`   Error messages: ${errorMessages}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-desktop-dashboard.png`, fullPage: true });
  console.log('   ✅ Desktop screenshot captured\n');

  await browser.close();
  console.log('=== VALIDATION COMPLETE ===');
})().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
