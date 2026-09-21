import { getDb, nowIso } from "./db.ts";
import { registrationSchema } from "./validation.ts";

export const signupEmailSchema = registrationSchema.shape.email.transform(email => email.toLowerCase());
export const signupEmailCookie = "condo_signup_email";

export async function saveSignupLead(input: unknown) {
  const email = signupEmailSchema.parse(input);
  (await getDb().prepare(`
    INSERT INTO signup_leads (email, source, created_at) VALUES (?, ?, ?)
    ON CONFLICT(email) DO NOTHING
  `).run(email, "homepage_raio_x", nowIso()));
  return email;
}

// Best-effort, bounded per-process throttle, independent of the saved leads.
// Production proxies must sanitize forwarded IP headers before passing them on.
const attempts = new Map<string, { count: number; expiresAt: number }>();
export function allowSignupLeadAttempt(key: string, now = Date.now()) {
  for (const [entryKey, entry] of attempts) {
    if (entry.expiresAt <= now) attempts.delete(entryKey);
  }
  const entry = attempts.get(key);
  if (entry) {
    if (entry.count >= 10) return false;
    entry.count += 1;
    return true;
  }
  if (attempts.size >= 1000) return false;
  attempts.set(key, { count: 1, expiresAt: now + 10 * 60 * 1000 });
  return true;
}
