import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { appUrl } from "./config";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  return user;
}

export function assertSameOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return true;

  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }

  const trustedOrigins = new Set([new URL(request.url).origin, new URL(appUrl).origin]);
  if (trustedOrigins.has(origin.origin)) return true;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto ? `${forwardedProto}:` : new URL(request.url).protocol;
  return Boolean(host && origin.origin === `${protocol}//${host}`);
}

export function isJsonRequest(request: Request) {
  return request.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}
