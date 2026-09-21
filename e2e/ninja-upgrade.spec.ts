import { expect, test } from "@playwright/test";

test("a referred signup upgrades the inviter once, including after reload", async ({ page, context, browser }) => {
  const key = crypto.randomUUID();
  const register = async (request: typeof context.request, name: string) => {
    const result = await request.post("/api/auth/register", { data: { name, email: `${name}-${key}@example.com`, password: "Test-password-123!" } });
    expect(result.status()).toBe(201);
  };
  await register(context.request, "Inviter");
  await page.goto("/app/convide");
  let upgradeWrites = 0;
  page.on("request", request => { if (request.method() === "POST" && request.url().endsWith("/api/account/ninja-upgrade")) upgradeWrites++; });
  await page.getByRole("button", { name: "Começar Ninja vermelho" }).click();
  await expect(page.locator(".user-chip .ninja-awakening-red")).toHaveCount(1);
  await expect(page.locator(".user-chip .ninja-awakening-red")).toHaveCount(0, { timeout: 8000 });
  expect(upgradeWrites).toBe(0);
  expect((await (await context.request.get("/api/account/ninja-upgrade")).json()).user.ninjaRed).toBe(false);
  const whatsapp = await page.getByRole("link", { name: "Compartilhar no WhatsApp" }).getAttribute("href");
  const message = new URL(whatsapp!).searchParams.get("text")!;
  const code = message.split("/convite/")[1];
  const neighbor = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
  await neighbor.request.get(`/convite/${code}`);
  await register(neighbor.request, "Neighbor");
  await neighbor.close();
  const pending = await (await context.request.get("/api/account/ninja-upgrade")).json();
  expect(pending.user.ninjaUpgradePending).toBe(true);
  await page.reload();
  await expect(page.locator(".user-chip .ninja-awakening-red")).toHaveCount(1);
  await expect(page.locator(".user-chip img.ninja-red-image")).toHaveAttribute("src", "/default-avatar-ninja-red.png");
  const presented = await (await context.request.get("/api/account/ninja-upgrade")).json();
  expect(presented.user.ninjaUpgradePending).toBe(false);
  await page.reload();
  await expect(page.locator(".user-chip img.ninja-red-image")).toHaveCount(1);
  await expect(page.locator(".user-chip .ninja-awakening-red")).toHaveCount(0);
});
