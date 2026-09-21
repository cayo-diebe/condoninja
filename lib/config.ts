import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const projectRoot = process.cwd();

const configuredDataDir = process.env.DATA_DIR;
export const dataDir = configuredDataDir
  ? path.resolve(/* turbopackIgnore: true */ configuredDataDir)
  : path.join(projectRoot, "data");
export const databasePath = path.join(dataDir, "kondo-ninja.sqlite");
export const uploadsDir = path.join(dataDir, "uploads");
export const appUrl = process.env.APP_URL ?? "http://localhost:3000";
export const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024);
export const maxUploadBatchBytes = Number(process.env.MAX_UPLOAD_BATCH_BYTES ?? 100 * 1024 * 1024);

export function ensureDataDirs() {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  mkdirSync(uploadsDir, { recursive: true, mode: 0o700 });
}

function loadOrCreateAuthSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;

  ensureDataDirs();
  const secretPath = path.join(dataDir, ".auth-secret");
  try {
    return readFileSync(secretPath, "utf8").trim();
  } catch {
    const secret = randomBytes(48).toString("base64url");
    writeFileSync(secretPath, secret, { mode: 0o600 });
    chmodSync(secretPath, 0o600);
    return secret;
  }
}

export const authSecret = loadOrCreateAuthSecret();

export const supportedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "jpg", "jpeg", "png"];

export const supportedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
]);
