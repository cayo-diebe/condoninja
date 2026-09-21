import { createHmac, timingSafeEqual } from "node:crypto";
import { authSecret } from "./config";
import { getDb, newId, nowIso } from "./db";

export const referralCookieName = "condo_referral";
export const referralLifetimeSeconds = 30 * 24 * 60 * 60;
const codePattern = /^[0-9a-f]{32}$/;
export type Referral = { code: string; visitedAt: string };

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await getDb().prepare("SELECT code FROM referral_links WHERE user_id = ?").get(userId) as { code: string } | undefined;
  if (existing) return existing.code;
  await getDb().prepare("INSERT INTO referral_links (user_id, code, created_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING")
    .run(userId, newId().replaceAll("-", ""), nowIso());
  const row = await getDb().prepare("SELECT code FROM referral_links WHERE user_id = ?").get(userId) as { code: string } | undefined;
  if (!row) throw new Error("REFERRAL_LINK_UNAVAILABLE");
  return row.code;
}

export async function findReferralOwner(code: string) {
  if (!codePattern.test(code)) return null;
  const row = await getDb().prepare("SELECT user_id FROM referral_links WHERE code = ?").get(code) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

function sign(payload: string) {
  return createHmac("sha256", authSecret).update(`referral:${payload}`).digest("hex");
}

export function encodeReferralCookie(code: string, time = Date.now()) {
  const payload = `${code}.${time}`;
  return `${payload}.${sign(payload)}`;
}

export function decodeReferralCookie(value: string | undefined, time = Date.now()): Referral | null {
  if (!value || value.length > 130) return null;
  const [code, timestamp, signature, extra] = value.split(".");
  if (extra !== undefined || !codePattern.test(code) || !/^\d{13}$/.test(timestamp ?? "") || !/^[0-9a-f]{64}$/.test(signature ?? "")) return null;
  const visited = Number(timestamp);
  if (visited > time || time - visited >= referralLifetimeSeconds * 1000) return null;
  if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(`${code}.${timestamp}`), "hex"))) return null;
  return { code, visitedAt: new Date(visited).toISOString() };
}
