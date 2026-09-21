import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createSession, deleteSession, getSessionUser, hashToken, getCategoryProgressForUser } from "./repository";
import type { UserRecord } from "./types";
import { signupEmailCookie } from "./signup-leads";
import { referralCookieName } from "./referrals";
import { getNinjaUpgrade } from "./ninja-upgrade";

export const sessionCookieName = "kondo_session";
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1 }).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  try {
    const actual = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1 });
    const expected = Buffer.from(expectedHex, "hex");
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function establishSession(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs).toISOString();
  (await createSession(userId, hashToken(rawToken), expiresAt));
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
  cookieStore.delete(signupEmailCookie);
  cookieStore.delete(referralCookieName);
}

export async function clearSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;
  if (rawToken) (await deleteSession(hashToken(rawToken)));
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<UserRecord | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;
  if (!rawToken) return null;
  const user = (await getSessionUser(hashToken(rawToken)))?.user;
  if (!user) return null;
  const required = (await getCategoryProgressForUser(user.id)).filter((category) => category.required);
  const upgrade = await getNinjaUpgrade(user.id);
  return { ...user, ninjaRed: upgrade.unlocked, ninjaUpgradePending: upgrade.pending, requiredDocumentsComplete: required.length > 0 && required.every((category) => category.satisfied) };
}

export function safePasswordFingerprint(password: string) {
  return createHash("sha256").update(password).digest("hex").slice(0, 12);
}
