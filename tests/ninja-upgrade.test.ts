import { describe, expect, it, vi } from "vitest";
import { createUser } from "../lib/repository";
import { getDb } from "../lib/db";
import { getOrCreateReferralCode } from "../lib/referrals";
import { claimNinjaUpgrade, getNinjaUpgrade } from "../lib/ninja-upgrade";
import { POST } from "../app/api/account/ninja-upgrade/route";
const state = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => state.user }));
const input = (name: string) => ({ name, email: `${name}@example.com`, password: "unused-password" });

describe("red ninja upgrade", () => {
  it("unlocks only for a successful referred signup and can be presented once across concurrent devices", async () => {
    const inviter = await createUser(input("red-inviter"), "hash");
    const code = await getOrCreateReferralCode(inviter.id);
    expect(await getNinjaUpgrade(inviter.id)).toEqual({ unlocked: false, pending: false });
    expect(await claimNinjaUpgrade(inviter.id)).toBe(false);
    const referred = await createUser(input("red-invited"), "hash", { code, visitedAt: new Date().toISOString() });
    expect(await getNinjaUpgrade(inviter.id)).toEqual({ unlocked: true, pending: true });
    expect(await getNinjaUpgrade(referred.id)).toEqual({ unlocked: false, pending: false });
    expect(await getDb().prepare("SELECT presented_at FROM ninja_upgrades WHERE user_id = ?").get(inviter.id)).toMatchObject({ presented_at: null });
    const claims = await Promise.all([claimNinjaUpgrade(inviter.id), claimNinjaUpgrade(inviter.id)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await getNinjaUpgrade(inviter.id)).toEqual({ unlocked: true, pending: false });
    await createUser(input("red-invited-again"), "hash", { code, visitedAt: new Date().toISOString() });
    expect(await claimNinjaUpgrade(inviter.id)).toBe(false);
    expect(await getNinjaUpgrade(inviter.id)).toEqual({ unlocked: true, pending: false });
  });

  it("handles existing referrals from before the feature without resetting the flag", async () => {
    const inviter = await createUser(input("legacy-inviter"), "hash");
    const code = await getOrCreateReferralCode(inviter.id);
    await createUser(input("legacy-invited"), "hash", { code, visitedAt: new Date().toISOString() });
    await getDb().prepare("DELETE FROM ninja_upgrades WHERE user_id = ?").run(inviter.id);
    expect(await getNinjaUpgrade(inviter.id)).toEqual({ unlocked: true, pending: true });
    expect(await claimNinjaUpgrade(inviter.id)).toBe(true);
    expect(await claimNinjaUpgrade(inviter.id)).toBe(false);
  });

  it("does not award on invalid referral or failed duplicate signup", async () => {
    const inviter = await createUser(input("failed-inviter"), "hash");
    const code = await getOrCreateReferralCode(inviter.id);
    await expect(createUser(input("failed-inviter"), "hash", { code, visitedAt: new Date().toISOString() })).rejects.toThrow();
    expect(await getNinjaUpgrade(inviter.id)).toEqual({ unlocked: false, pending: false });
    const unknown = await createUser(input("invalid-invited"), "hash", { code: "a".repeat(32), visitedAt: new Date().toISOString() });
    expect(await getNinjaUpgrade(unknown.id)).toEqual({ unlocked: false, pending: false });
  });

  it("requires authentication and same origin; ignores client-supplied user ids", async () => {
    const request = (origin: string) => new Request("http://localhost:3000/api/account/ninja-upgrade", { method: "POST", headers: { origin }, body: JSON.stringify({ userId: "other-user" }) });
    expect((await POST(request("http://localhost:3000"))).status).toBe(401);
    state.user = await createUser(input("api-user"), "hash");
    expect((await POST(request("https://evil.example"))).status).toBe(403);
    const response = await POST(request("http://localhost:3000"));
    expect(await response.json()).toEqual({ present: false });
    state.user = null;
  });
});
