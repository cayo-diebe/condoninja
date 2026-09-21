import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import InviteNeighborsPage from "../app/app/convide/page";
import { AppShell } from "../components/app-shell";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => ({ id: "resident" })) }));
vi.mock("@/lib/referrals", () => ({ getOrCreateReferralCode: vi.fn(async () => "a".repeat(32)) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/app/convide", redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

describe("neighbor invitations", () => {
  it("shares only the requested message and public homepage through WhatsApp", async () => {
    const html = renderToStaticMarkup(await InviteNeighborsPage());
    const href = html.match(/href="(https:\/\/wa\.me\/[^\"]+)"/)?.[1];
    expect(href).toBeDefined();
    expect(new URL(href!).searchParams.get("text")).toBe(`Confira o que descobri com o raio-X do nosso condomínio:\n\nhttps://condo-ninja.calrtd.chatgpt.site/convite/${"a".repeat(32)}`);
    expect(html).not.toContain("<blockquote");
    expect(html).not.toContain("Escolha o contato");
    expect(html).toContain('class="button invite-share-button"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it.each([true, false])("keeps the invitation last in navigation with onboarding pending=%s", pending => {
    const html = renderToStaticMarkup(createElement(AppShell, { user: { id: "resident", name: "Teste", email: "test@example.com" }, onboardingPending: pending, condominiumName: "Teste", children: null }));
    const nav = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    expect(nav).toMatch(/href="\/app\/convide"[^>]*>[\s\S]*Convide seus vizinhos<\/a>$/);
    expect(nav).toContain('aria-current="page"');
  });

  it("requires login", async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    await expect(InviteNeighborsPage()).rejects.toThrow("redirect:/login");
  });
});
