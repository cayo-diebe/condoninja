import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { maxUploadBytes, supportedExtensions, uploadsDir } from "./config";

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export function fileExtension(name: string) {
  const extension = path.extname(name).slice(1).toLowerCase();
  return extension;
}

function hasSignature(extension: string, buffer: Buffer) {
  if (extension === "pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (extension === "png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === "jpg" || extension === "jpeg") return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (extension === "doc" || extension === "xls") {
    return buffer.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]));
  }
  if (extension === "docx" || extension === "xlsx") {
    return buffer.subarray(0, 2).equals(Buffer.from([80, 75]));
  }
  if (extension === "csv") {
    return !buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0);
  }
  return false;
}

export function validateFileMetadata(name: string, size: number) {
  const extension = fileExtension(name);
  if (!extension || !supportedExtensions.includes(extension)) {
    throw new UploadValidationError("Formato não suportado. Envie PDF, Office, CSV ou imagem.");
  }
  if (size <= 0) throw new UploadValidationError("O arquivo está vazio.");
  if (size > maxUploadBytes) {
    throw new UploadValidationError(`O arquivo excede o limite de ${Math.round(maxUploadBytes / 1024 / 1024)} MB.`);
  }
  return extension;
}

export function validateFileContent(extension: string, buffer: Buffer) {
  if (!hasSignature(extension, buffer)) {
    throw new UploadValidationError("O conteúdo do arquivo não corresponde ao formato informado.");
  }
}

export function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function storageKeyFor(condominiumId: string, documentId: string, extension: string) {
  return `${condominiumId}/${documentId}.${extension}`;
}

function resolveStorageKey(storageKey: string) {
  const resolved = path.resolve(uploadsDir, storageKey);
  const root = `${path.resolve(uploadsDir)}${path.sep}`;
  if (!resolved.startsWith(root)) throw new Error("Invalid storage key");
  return resolved;
}

export async function writeStoredFile(storageKey: string, buffer: Buffer) {
  const finalPath = resolveStorageKey(storageKey);
  await mkdir(path.dirname(finalPath), { recursive: true, mode: 0o700 });
  const tempPath = `${finalPath}.${randomUUID()}.uploading`;
  await writeFile(tempPath, buffer, { mode: 0o600 });
  await rename(tempPath, finalPath);
  return finalPath;
}

export async function readStoredFile(storageKey: string) {
  return readFile(resolveStorageKey(storageKey));
}

export async function removeStoredFile(storageKey: string) {
  await rm(resolveStorageKey(storageKey), { force: true });
}

export function downloadName(name: string) {
  const cleaned = name.replace(/[\u0000-\u001f\\/]+/g, "_").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 180) || "documento";
}
