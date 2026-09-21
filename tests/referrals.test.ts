import { describe, expect, it, vi } from "vitest";
import { createUser } from "../lib/repository";
import { getDb } from "../lib/db";
import { decodeReferralCookie, encodeReferralCookie, getOrCreateReferralCode, referralLifetimeSeconds } from "../lib/referrals";
import { GET } from "../app/convite/[code]/route";

const state = vi.hoisted(() => ({ cookie: undefined as string | undefined, user: null as object | null }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => state.cookie ? { value: state.cookie } : undefined }) }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => state.user }));
const makeUser = (name: string) => createUser({ name, email: `${name}@example.com`, password: "unused-password" }, "hash");

describe("referral attribution", () => {
  it("generates stable opaque codes, unique per user even with concurrent requests", async () => {
    const a = await makeUser("inviter-a");
    const b = await makeUser("inviter-b");
    const codes = await Promise.all([getOrCreateReferralCode(a.id), getOrCreateReferralCode(a.id)]);
    expect(codes[0]).toMatch(/^[0-9a-f]{32}$/);
    expect(codes[0]).toBe(codes[1]);
    expect(await getOrCreateReferralCode(b.id)).not.toBe(codes[0]);
  });

  it("rejects tampered, expired, future and malformed cookies", () => {
    const time = Date.now();
    const value = encodeReferralCookie("a".repeat(32), time);
    expect(decodeReferralCookie(value, time)?.code).toBe("a".repeat(32));
    expect(decodeReferralCookie(value.replace(/^a/, "b"), time)).toBeNull();
    expect(decodeReferralCookie(value, time + referralLifetimeSeconds * 1000)).toBeNull();
    expect(decodeReferralCookie(value, time - 1)).toBeNull();
    expect(decodeReferralCookie("invalid", time)).toBeNull();
  });

  it("records attribution atomically at signup, ignores unknown codes and preserves existing attribution", async () => {
    const inviter = await makeUser("inviter-c");
    const code = await getOrCreateReferralCode(inviter.id);
    const visitedAt = new Date().toISOString();
    const input = { name: "Invited", email: "invited@example.com", password: "unused-password" };
    const invited = await createUser(input, "hash", { code, visitedAt });
    const row = await getDb().prepare("SELECT * FROM user_referrals WHERE referred_user_id = ?").get(invited.id);
    expect(row).toMatchObject({ referred_user_id: invited.id, inviter_user_id: inviter.id, referral_code: code, visited_at: visitedAt });
    await expect(createUser(input, "hash", { code, visitedAt })).rejects.toThrow();
    expect(await getDb().prepare("SELECT * FROM user_referrals WHERE referred_user_id = ?").get(invited.id)).toEqual(row);
    const unknown = await createUser({ ...input, email: "unknown@example.com" }, "hash", { code: "f".repeat(32), visitedAt });
    expect(await getDb().prepare("SELECT * FROM user_referrals WHERE referred_user_id = ?").get(unknown.id)).toBeUndefined();
  });

  it("redirects to the homepage with a protected cookie and retains the first valid invitation", async () => {
    const inviter = await makeUser("inviter-route");
    const code = await getOrCreateReferralCode(inviter.id);
    const call = (value = code) => GET(new Request(`https://example.com/convite/${value}`), { params: Promise.resolve({ code: value }) });
    state.cookie = undefined;
    state.user = null;
    const response = await call();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    state.cookie = encodeReferralCookie(code);
    expect((await call()).headers.get("set-cookie")).toBeNull();
    state.cookie = undefined;
    expect((await call("invalid")).headers.get("set-cookie")).toBeNull();
    state.user = inviter;
    expect((await call()).headers.get("set-cookie")).toBeNull();
    state.user = null;
  });
});
