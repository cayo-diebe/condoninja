import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const fixturesDir = path.join(process.cwd(), "e2e", "fixtures");
const runtimeFailures = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const failures: string[] = [];
  runtimeFailures.set(page, failures);
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      const expectedInvalidLogin = location.url.endsWith("/api/auth/login") && message.text().includes("401");
      const expectedExistingAccount = location.url.endsWith("/api/auth/register") && message.text().includes("409");
      const expectedDocumentConflict = location.url.includes("/api/documents/") && message.text().includes("409");
      if (!expectedInvalidLogin && !expectedExistingAccount && !expectedDocumentConflict) failures.push(`console: ${message.text()} @ ${location.url || "unknown"}`);
    }
  });
  page.on("requestfailed", (request) => {
    // CitySelect aborts its pending lookup when the user changes state or leaves the step.
    if (new URL(request.url()).pathname === "/api/address/cities" && request.failure()?.errorText === "net::ERR_ABORTED") return;
    // A full condominium-context navigation cancels in-flight Next.js RSC fetches.
    // Keep HTTP failures, API errors and other network failures visible.
    if (request.method() === "GET" && new URL(request.url()).searchParams.has("_rsc") && request.failure()?.errorText === "net::ERR_ABORTED") return;
    failures.push(`request: ${request.method()} ${request.url()} · ${request.failure()?.errorText ?? "failed"}`);
  });
  page.on("response", (response) => {
    const expectedInvalidLogin = response.status() === 401 && response.url().endsWith("/api/auth/login");
    const expectedExistingAccount = response.status() === 409 && response.url().endsWith("/api/auth/register");
    const expectedRequiredRemoval = response.status() === 409 && response.url().includes("/api/documents/");
    if (response.status() >= 500 || (response.status() >= 400 && !expectedInvalidLogin && !expectedExistingAccount && !expectedRequiredRemoval)) {
      failures.push(`response: ${response.status()} ${response.url()}`);
    }
  });
  await page.route("**/api/address/search**", async (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has("q") && !url.searchParams.has("cep")) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [{
          id: "01311000-sp-rua-das-flores",
          street: "Rua das Flores",
          neighborhood: "Jardim Paulista",
          city: "São Paulo",
          state: "SP",
          cep: "01311000",
          label: "Rua das Flores · Jardim Paulista · São Paulo/SP",
        }],
      }),
    });
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const failures = runtimeFailures.get(page) ?? [];
  if (failures.length > 0) {
    await testInfo.attach("browser-runtime-failures", { body: failures.join("\n"), contentType: "text/plain" });
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

function uniqueCredentials() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    name: "Ana de Teste",
    email: `ana.${suffix}@example.com`,
    password: "uma-senha-segura",
  };
}

async function openNavigation(page: Page) {
  await page.waitForLoadState("load");
  const trigger = page.getByRole("button", { name: "Abrir menu", exact: true });
  if ((page.viewportSize()?.width ?? 1280) <= 720) {
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  }
}

async function uploadCategory(page: import("@playwright/test").Page, label: string, fixture: string) {
  const card = page.locator("article.category-card").filter({ hasText: label }).first();
  await card.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, fixture));
  await expect(card.locator(".document-row").filter({ hasText: fixture })).toBeVisible({ timeout: 15_000 });
}

test("account is accessible through the user identity instead of the main menu", async ({ page, playwright }, testInfo) => {
  const credentials = uniqueCredentials();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(credentials.name);
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app\/onboarding$/);
  await expect(page.locator('.sidebar-nav a[href="/app/conta"]')).toHaveCount(0);
  await openNavigation(page);
  const account = page.locator(".user-chip");
  await expect(account).toBeVisible();
  await expect(page.locator(".app-sidebar").getByRole("button", { name: "Sair da conta" })).toHaveCount(0);
  await expect(account.locator("img")).toHaveAttribute("src", "/default-avatar-ninja-white.png");
  await expect.poll(() => account.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await account.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/conta$/);
  await expect(page.getByRole("heading", { name: "Seu acesso" })).toBeVisible();
  await expect(account).toHaveAttribute("aria-current", "page");
  const headingBox = await page.getByRole("heading", { name: "Seu acesso" }).boundingBox();
  const logoutBox = await page.getByRole("button", { name: "Sair da conta" }).boundingBox();
  expect(logoutBox!.x).toBeGreaterThanOrEqual(headingBox!.x + headingBox!.width);
  expect(logoutBox!.y).toBeLessThan(headingBox!.y + headingBox!.height);
  const input = page.getByLabel("Escolher foto", { exact: true });
  await input.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.locator(".form-error[role=alert]")).toContainText("até 2 MB");
  const photo = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#0d725c" } }).png().toBuffer();
  await input.setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: photo });
  await expect(page.getByRole("status")).toHaveText("Foto de perfil salva.");
  await expect(account.locator("img")).toHaveAttribute("src", /\/api\/account\/avatar/);
  await page.reload();
  await expect(account.locator("img")).toHaveAttribute("src", /\/api\/account\/avatar/);
  const persisted = await page.request.get("/api/account/avatar");
  expect(persisted.ok()).toBe(true);
  const metadata = await sharp(await persisted.body()).metadata();
  expect(metadata.width).toBe(256);
  expect(metadata.format).toBe("webp");
  const original = await persisted.body();
  const invalid = await page.request.post("/api/account/avatar", { data: "not an image" });
  expect(invalid.status()).toBe(400);
  expect(await (await page.request.get("/api/account/avatar")).body()).toEqual(original);
  const other = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
  expect((await other.get("/api/account/avatar")).status()).toBe(401);
  expect((await other.delete("/api/account/avatar")).status()).toBe(401);
  const secondUser = uniqueCredentials();
  await other.post("/api/auth/register", { data: secondUser });
  expect((await other.get(`/api/account/avatar?userId=${credentials.email}`)).status()).toBe(404);
  expect((await other.delete(`/api/account/avatar?userId=${credentials.email}`)).ok()).toBe(true);
  expect(await (await page.request.get("/api/account/avatar")).body()).toEqual(original);
  await other.dispose();
  await page.screenshot({ path: testInfo.outputPath("account-avatar.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Remover foto de perfil" }).click();
  await expect(page.getByRole("status")).toHaveText("Foto removida. O avatar padrão foi restaurado.");
  await expect(account.locator("img")).toHaveAttribute("src", "/default-avatar-ninja-white.png");
  await expect(page.getByRole("button", { name: "Remover foto de perfil" })).toHaveCount(0);
  await page.reload();
  await expect(account.locator("img")).toHaveAttribute("src", "/default-avatar-ninja-white.png");
  expect((await page.request.get("/api/account/avatar")).status()).toBe(404);
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(`${process.env.APP_URL}/`);
  await page.goto("/app/conta");
  await expect(page).toHaveURL(/\/login/);
});

test("mobile drawer opens from the left and manages focus and navigation", async ({ page }, testInfo) => {
  const credentials = uniqueCredentials();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(credentials.name);
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app\/onboarding$/);
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByRole("button", { name: "Abrir menu", exact: true });
  await expect(page.locator(".app-sidebar")).not.toBeVisible();
  await trigger.click();
  const close = page.getByRole("button", { name: "Fechar menu" });
  await expect(close).toBeFocused();
  await expect(page.locator(".app-content")).toHaveAttribute("inert", "");
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator(".user-chip")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("drawer-open.png") });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator(".sidebar-backdrop").click({ position: { x: 380, y: 200 } });
  await expect(page.locator(".app-sidebar")).not.toBeVisible();
  await trigger.click();
  await page.locator(".user-chip").click();
  await expect(page).toHaveURL(/\/app\/conta$/);
  await expect(page.locator(".app-sidebar")).not.toBeVisible();
  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(trigger).not.toBeVisible();
  await expect(page.locator(".app-sidebar")).toBeVisible();
  await expect(page.locator(".app-content")).not.toHaveAttribute("inert", "");
  await page.setViewportSize({ width: 889, height: 500 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const sidebarBox = await page.locator(".app-sidebar").boundingBox();
  expect(sidebarBox!.y).toBe(0);
  expect(sidebarBox!.height).toBe(500);
  await page.locator(".user-chip").scrollIntoViewIfNeeded();
  await expect(page.locator(".user-chip")).toBeInViewport();
  expect((await page.locator(".app-sidebar").boundingBox())!.y).toBe(0);
});

test("live address search expands abbreviations and selects a real CEP", async ({ page }) => {
  await page.unroute("**/api/address/search**");
  const credentials = uniqueCredentials();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(credentials.name);
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByRole("button", { name: "Começar identificação" }).click();
  await expect(page.locator("#condo-city")).toBeDisabled();
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await page.getByLabel("CEP (se souber)").fill("013");
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await page.getByLabel("CEP (se souber)").fill("");
  await page.getByLabel("Estado", { exact: false }).selectOption("RS");
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await expect(page.locator("#condo-city option").nth(1)).toHaveText("Porto Alegre (capital)", { timeout: 15000 });
  await expect(page.locator('#condo-city option[value="Porto Alegre"]')).toHaveCount(2);
  await page.locator("#condo-city").selectOption("Porto Alegre");
  await expect(page.locator("#condo-address")).toBeVisible();
  await page.getByLabel("Estado", { exact: false }).selectOption("SP");
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await expect(page.locator("#condo-city")).toHaveValue("");
  await expect(page.locator("#condo-city option").nth(1)).toHaveText("São Paulo (capital)", { timeout: 15000 });
  await expect(page.locator('#condo-city option[value="São Paulo"]')).toHaveCount(2);
  await expect(page.locator("#condo-city option")).toHaveCount(647);
  await page.locator("#condo-city").selectOption("São Paulo");
  await page.locator("#condo-address").fill("Av Paulista");
  const option = page.getByRole("option", { name: /Avenida Paulista/ }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
  await expect(page.locator("#condo-address")).toHaveValue("Avenida Paulista");
  await expect(page.locator("#condo-cep")).toHaveValue(/\d{5}-\d{3}/);
  await page.locator("#condo-address").fill("Zzxxyylogradouroinexistente");
  await expect(page.locator(".autocomplete-field .address-help")).toContainText("Nenhum endereço encontrado", { timeout: 15000 });
  await page.locator("#condo-address").fill("Av Paulista");
  await page.getByRole("option", { name: /1728.*Edifício Ourinvest/ }).click();
  await expect(page.getByLabel("Número *")).toHaveValue("1728");
  await page.getByLabel("Complemento / unidade / apartamento *").fill("Sala 42");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Ourinvest");
  await page.reload();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Ourinvest");
  await page.getByLabel("Nome do condomínio *").fill("Edifício Ourinvest corrigido");
  await page.getByLabel("Sua relação *").selectOption("morador");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Monte o pacote documental" })).toBeVisible();
  await page.getByRole("button", { name: /Condomínio/ }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Ourinvest corrigido");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.locator("#condo-address").fill("Av Paulista");
  await page.getByRole("option", { name: /960.*Edifício Paulicéia/ }).click();
  await expect(page.getByLabel("Número *")).toHaveValue("960");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Paulicéia");
  await page.reload();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Paulicéia");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.locator("#condo-address").fill("Av Paulista");
  await page.getByRole("option", { name: /Avenida Paulista de \d+ a \d+ - lado/ }).first().click();
  const savedAddress = await page.locator("#condo-address").inputValue();
  const savedCep = await page.locator("#condo-cep").inputValue();
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Paulicéia");
  const lookup = page.waitForRequest(request => request.url().includes("/api/address/search?"));
  await page.getByLabel("Nome do condomínio *").fill("nome digitado não é a consulta");
  const query = new URL((await lookup).url());
  expect(query.searchParams.get("q")).toBe(savedAddress);
  expect(query.searchParams.get("city")).toBe("São Paulo");
  expect(query.searchParams.get("state")).toBe("SP");
  await page.getByRole("listbox", { name: "Sugestões de condomínio" }).getByRole("option", { name: /Edifício Ourinvest/ }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Ourinvest");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.reload();
  await expect(page.locator("#condo-address")).toHaveValue(savedAddress);
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Ourinvest");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Monte o pacote documental" })).toBeVisible();
  await page.getByRole("button", { name: /Endereço/ }).click();
  await expect(page.locator("#condo-address")).toHaveValue(savedAddress);
  await expect(page.locator("#condo-cep")).toHaveValue(savedCep);
  await expect(page.getByLabel("Número *")).toHaveValue("1728");
  await expect(page.getByLabel("Complemento / unidade / apartamento *")).toHaveValue("Sala 42");
});

test("protected routes redirect visitors and invalid credentials are rejected", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("E-mail").fill("missing@example.com");
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator(".form-error")).toHaveText("E-mail ou senha inválidos.");
});

test("duplicate registration continues at login with the email already filled", async ({ page }) => {
  const credentials = uniqueCredentials();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(credentials.name);
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app\/onboarding$/);

  await openNavigation(page);
  await page.locator(".user-chip").click();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(`${process.env.APP_URL}/`);
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Outra pessoa");
  await page.getByLabel("E-mail").fill(credentials.email.toUpperCase());
  await page.getByLabel("Senha").fill("outra-senha-segura");
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/login\?existing=1$/);
  await expect(page.getByRole("status")).toContainText("Este e-mail já tem uma conta");
  await expect(page.getByLabel("E-mail")).toHaveValue(credentials.email);
  await expect(page.getByLabel("Senha")).toBeFocused();
  await expect(page.getByLabel("Senha")).toHaveValue("");

  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app\/onboarding$/);
});

test("new user completes onboarding, persists documents, and returns to the dashboard", async ({ page }, testInfo) => {
  test.setTimeout(60000);
  const credentials = uniqueCredentials();

  await page.goto("/");
  await page.screenshot({ path: path.join("test-results", `landing-${testInfo.project.name}.png`), fullPage: true });
  await page.locator("section[aria-labelledby='hero-title']").getByRole("link", { name: "Quero meu Raio-X gratuito", exact: true }).click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await page.getByLabel("Nome").fill(credentials.name);
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/app\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Vamos preparar seu Raio-X." })).toBeVisible();
  await expect(page.locator(".nav-badge-pending")).toHaveText("Pendente");
  await expect(page.locator('.sidebar-nav a[href="/app/documents"], .sidebar-nav a[href="/app/condominio"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Começar identificação" }).click();
  await expect(page.getByRole("heading", { name: "Endereço do condomínio" })).toBeVisible();
  await expect(page.locator("#condo-name")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Documentos/ })).toBeDisabled();
  await page.getByRole("button", { name: /Começo/ }).click();
  await expect(page.getByRole("heading", { name: "O primeiro passo para entender seu condomínio" })).toBeVisible();
  await page.getByRole("button", { name: "Começar identificação" }).click();
  await expect(page.getByRole("heading", { name: "Endereço do condomínio" })).toBeVisible();

  await expect(page.locator("form.form-stack > .field").first()).toContainText("CEP (se souber)");
  await page.getByLabel("CEP (se souber)").fill("01311-000");
  await expect(page.getByLabel("Endereço *")).toHaveValue("Rua das Flores");
  await expect(page.getByLabel("Cidade *")).toHaveValue("São Paulo");
  await expect(page.getByLabel("Estado *")).toHaveValue("SP");

  await page.getByLabel("Endereço *").fill("Rua das Flore");
  await expect(page.getByRole("option", { name: /Rua das Flores/ })).toBeVisible();
  await page.getByRole("option", { name: /Rua das Flores/ }).click();
  await expect(page.getByLabel("Endereço *")).toHaveValue("Rua das Flores");
  await page.getByLabel("Endereço *").fill("Rua das Flores corrigida");
  await page.getByLabel("Número *").fill("10");
  await page.getByLabel("Complemento / unidade / apartamento *").fill("Bloco B, ap. 42");
  await page.screenshot({ path: path.join("test-results", `condominium-${testInfo.project.name}.png`), fullPage: true });
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Identifique o condomínio" })).toBeVisible();
  await page.reload();
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await page.getByLabel("Nome do condomínio *").fill("Condomínio Jardim E2E");
  await page.getByLabel("Sua relação *").selectOption("proprietario");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Monte o pacote documental" })).toBeVisible();

  await page.getByRole("button", { name: /Endereço/ }).click();
  await expect(page.getByLabel("Endereço *")).toHaveValue("Rua das Flores corrigida");
  await expect(page.getByLabel("Número *")).toHaveValue("10");
  await expect(page.getByLabel("Complemento / unidade / apartamento *")).toHaveValue("Bloco B, ap. 42");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Monte o pacote documental" })).toBeVisible();
  await uploadCategory(page, "Convenção do condomínio", "convencao.pdf");
  await uploadCategory(page, "Prestação de contas / balancetes", "balancete.pdf");
  await expect(page.locator(".user-chip img")).toHaveAttribute("src", "/default-avatar-ninja-white.png");
  await uploadCategory(page, "Boleto ou recibo condominial", "boleto.pdf");
  await expect(page.locator(".user-chip img")).toHaveAttribute("src", "/default-avatar-ninja-white.png");
  await page.reload();
  await expect(page.locator(".user-chip img")).toHaveAttribute("src", "/default-avatar-ninja-white.png");

  await page.reload();
  await expect(page.locator("article.category-card").filter({ hasText: "Convenção do condomínio" }).first()).toContainText("convencao.pdf");
  await page.getByRole("button", { name: "Revisar envio" }).click();
  await expect(page.getByRole("heading", { name: "Revise antes de concluir" })).toBeVisible();
  await expect(page.locator('.sidebar-nav a[href="/app/documents"], .sidebar-nav a[href="/app/condominio"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Concluir onboarding" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator(".nav-badge-pending")).toHaveCount(0);
  await expect(page.locator(".user-chip .ninja-awakening")).toHaveCount(1);
  await expect(page.locator(".user-chip .ninja-white-overlay")).toHaveCSS("animation-delay", "2.5s");
  await expect(page.locator(".user-chip .sidebar-avatar > img")).toHaveAttribute("src", "/default-avatar-ninja.png");
  await expect(page.locator(".user-chip .ninja-white-overlay")).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "Desativar efeito" }).click();
  await expect(page.locator(".user-chip .ninja-awakening")).toHaveCount(0);
  await page.getByRole("button", { name: "Testar ninja" }).click();
  await expect(page.locator(".user-chip .ninja-awakening")).toHaveCount(1);
  await expect(page.locator(".user-chip .sidebar-avatar")).toHaveCSS("overflow", "visible");
  await expect(page.locator('.sidebar-nav a[href="/app/documents"], .sidebar-nav a[href="/app/condominio"]')).toHaveCount(2);
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await expect(page.getByText("3 de 3")).toBeVisible();
  await page.screenshot({ path: path.join("test-results", `dashboard-${testInfo.project.name}.png`), fullPage: true });

  await openNavigation(page);
  await page.locator(".user-chip").click();
  await expect(page.getByRole("heading", { name: "Condomínios cadastrados" })).toBeVisible();
  await expect(page.locator(".account-condominium-card:not(.condominium-add)")).toHaveCount(1);
  await expect(page.locator(".account-condominium-card").first()).toContainText("Condomínio Jardim E2E");
  await expect(page.locator(".account-condominium-card").first()).toContainText("Rua das Flores corrigida, 10");
  await page.getByRole("button", { name: /Adicionar novo condomínio/ }).click();
  await expect(page).toHaveURL(/\/app\/onboarding$/);
  await expect(page.getByRole("button", { name: "Começar identificação" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Começar identificação" })).toBeVisible();
  await openNavigation(page);
  await page.locator(".user-chip").click();
  await expect(page.locator(".account-condominium-card:not(.condominium-add)")).toHaveCount(2);
  await expect(page.locator('.sidebar-nav a[href="/app/documents"], .sidebar-nav a[href="/app/condominio"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Selecionar Condomínio Jardim E2E", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("3 de 3")).toBeVisible();
  await openNavigation(page);
  await page.locator(".user-chip").click();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(`${process.env.APP_URL}/`);
  await page.getByRole("link", { name: "Entrar" }).click();
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("convencao.pdf")).toHaveCount(0);
  await openNavigation(page);
  await page.getByRole("link", { name: "Documentos", exact: true }).click();
  await expect(page.getByText("convencao.pdf")).toBeVisible();
  await page.unroute("**/api/address/search**");
  await openNavigation(page);
  await page.getByRole("link", { name: "Condomínio", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dados de identificação" })).toBeVisible();
  await page.getByLabel("CEP (se souber)").fill("01310-919");
  await expect(page.getByLabel("Endereço *")).toHaveValue("Avenida Paulista", { timeout: 15000 });
  await expect(page.getByLabel("Número *")).toHaveValue("1728");
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Ourinvest");
  await page.getByLabel("Nome do condomínio *").click();
  await page.getByRole("listbox", { name: "Sugestões de condomínio" }).getByRole("option", { name: /960.*Edifício Paulicéia/ }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Paulicéia");
  await expect(page.getByLabel("Número *")).toHaveValue("960");
  await expect(page.locator(".user-chip")).toContainText("Edifício Paulicéia");
  await expect(page.locator(".user-chip")).not.toContainText(credentials.email);
  await expect(page.getByLabel("Nome do condomínio *")).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Paulicéia");
  // Autosave persists the selected name and number, not unsaved CEP/street edits.
  await expect(page.getByLabel("Número *")).toHaveValue("960");
  await expect(page.getByLabel("CEP (se souber)")).toHaveValue("01311-000");
  await page.getByLabel("Endereço *").fill("Av Paulista");
  await page.getByRole("listbox", { name: "Sugestões de endereço" }).getByRole("option", { name: /1728.*Edifício Ourinvest/ }).click();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Edifício Ourinvest");
  await page.getByLabel("Nome do condomínio *").fill("Condomínio revisado");
  await page.getByLabel("Sua relação *").selectOption("sindico");
  await page.getByText("Adicionar dados complementares (opcional)").click();
  await page.getByLabel("CNPJ do condomínio").fill("12345678000195");
  await page.getByLabel("Número de unidades").fill("120");
  await page.getByLabel("Tipo", { exact: true }).selectOption("misto");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Dados do condomínio salvos." })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome do condomínio *")).toHaveValue("Condomínio revisado");
  await expect(page.getByLabel("Endereço *")).toHaveValue("Avenida Paulista");
  await expect(page.getByLabel("Número *")).toHaveValue("1728");
  await expect(page.getByLabel("Sua relação *")).toHaveValue("sindico");
  await page.getByText("Adicionar dados complementares (opcional)").click();
  await expect(page.getByLabel("CNPJ do condomínio")).toHaveValue("12.345.678/0001-95");
  await expect(page.getByLabel("Número de unidades")).toHaveValue("120");
  await expect(page.getByLabel("Tipo", { exact: true })).toHaveValue("misto");
  await page.getByLabel("CEP (se souber)").fill("");
  await page.getByLabel("Estado *").selectOption("RS");
  await expect(page.getByLabel("Cidade *")).toHaveValue("");
  await expect(page.locator("#condo-city option").nth(1)).toHaveText("Porto Alegre (capital)", { timeout: 15000 });
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await page.getByLabel("Cidade *").selectOption("Porto Alegre");
  await expect(page.getByLabel("Endereço *")).toBeVisible();
});

test("condominium identification accepts a complete manual address without CEP", async ({ page }) => {
  const credentials = uniqueCredentials();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(credentials.name);
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByRole("button", { name: "Começar identificação" }).click();

  await page.getByLabel("Estado *").selectOption("SP");
  await page.getByLabel("Cidade *").selectOption("Campinas");
  await page.getByLabel("Endereço *").fill("Rua Manual");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Endereço do condomínio" })).toBeVisible();
  await page.getByLabel("Número *").fill("S/N");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Endereço do condomínio" })).toBeVisible();
  await page.getByLabel("Complemento / unidade / apartamento *").fill("Casa 2");
  await page.getByLabel("CEP (se souber)").fill("123");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Endereço do condomínio" })).toBeVisible();
  await page.getByLabel("CEP (se souber)").fill("");
  await expect(page.getByLabel("CEP (se souber)")).toHaveValue("");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Identifique o condomínio" })).toBeVisible();
  await page.reload();
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await page.getByLabel("Nome do condomínio *").fill("Condomínio Sem CEP");
  await page.getByLabel("Sua relação *").selectOption("morador");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Monte o pacote documental" })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /Endereço/ }).click();
  await expect(page.getByLabel("CEP (se souber)")).toHaveValue("");
  await expect(page.getByLabel("Endereço *")).toHaveValue("Rua Manual");
  await expect(page.getByLabel("Número *")).toHaveValue("S/N");
  await expect(page.getByLabel("Complemento / unidade / apartamento *")).toHaveValue("Casa 2");
});

test("upload validation reports a failed file instead of claiming success", async ({ page }, testInfo) => {
  const credentials = uniqueCredentials();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(credentials.name);
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByRole("button", { name: "Começar identificação" }).click();
  await page.getByLabel("CEP (se souber)").fill("01311-000");
  await expect(page.getByLabel("Endereço *")).toHaveValue("Rua das Flores");
  await page.getByLabel("Número *").fill("20");
  await page.getByLabel("Complemento / unidade / apartamento *").fill("Ap. 1");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Identifique o condomínio" })).toBeVisible();
  await page.reload();
  await expect(page.locator("#condo-address")).toHaveCount(0);
  await page.getByLabel("Nome do condomínio *").fill("Condomínio Falha E2E");
  await page.getByLabel("Sua relação *").selectOption("morador");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();

  const card = page.locator("article.category-card").filter({ hasText: "Convenção do condomínio" }).first();
  const disclosure = card.getByRole("button", { name: "Convenção do condomínio", exact: true });
  const info = card.locator(".category-info");
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => info.evaluate(element => element.getBoundingClientRect().height)).toBe(0);
  await disclosure.click();
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => info.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(20);
  await disclosure.click();
  await expect.poll(() => info.evaluate(element => element.getBoundingClientRect().height)).toBe(0);
  await card.locator('input[type="file"]').setInputFiles({
    name: "nao-e-pdf.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("texto que não é um PDF"),
  });
  await expect(card).toContainText("conteúdo do arquivo não corresponde", { timeout: 15_000 });
  await expect(page.getByText("Upload confirmado e salvo no armazenamento local.")).toHaveCount(0);

  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 867, height: 952 });
  await page.getByRole("heading", { name: "Monte o pacote documental" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join("test-results", `document-groups-${testInfo.project.name}.png`), fullPage: true });
  const transfer = await page.evaluateHandle(bytes => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array(bytes)], "convencao.pdf", { type: "application/pdf" }));
    return data;
  }, Array.from(await readFile(path.join(fixturesDir, "convencao.pdf"))));
  await card.dispatchEvent("dragenter", { dataTransfer: transfer });
  await expect(card).toHaveClass(/dragging/);
  await card.dispatchEvent("dragover", { dataTransfer: transfer });
  await card.dispatchEvent("drop", { dataTransfer: transfer });
  await expect(card).not.toHaveClass(/dragging/);
  await expect(card.locator(".document-row").filter({ hasText: "convencao.pdf" })).toBeVisible({ timeout: 15000 });
  await transfer.dispose();
  await card.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, "convencao.pdf"));
  await expect(card).toContainText("já foi enviado", { timeout: 15_000 });
  page.once("dialog", (dialog) => void dialog.accept());
  await card.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Envie um documento substituto antes de remover este item obrigatório.")).toBeVisible();
  await expect(card).toContainText("convencao.pdf");
});
