import { createHash } from "node:crypto";
import { bindings } from "./bindings";
import path from "node:path";
import { maxUploadBytes, supportedExtensions } from "./config";

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

function objectKey(storageKey: string) {
  if (!/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\.[a-z0-9]+$/.test(storageKey)) throw new Error("Invalid storage key");
  return `condo-v2/documents/${storageKey}`;
}
export async function writeStoredFile(storageKey: string, buffer: Buffer) {
  await bindings.BUCKET.put(objectKey(storageKey), new Uint8Array(buffer), { httpMetadata: { contentType: "application/octet-stream" } });
  return storageKey;
}
export async function readStoredFile(storageKey: string) {
  const object = await bindings.BUCKET.get(objectKey(storageKey));
  if (!object) throw new Error("File not found");
  return Buffer.from(await object.arrayBuffer());
}
export async function removeStoredFile(storageKey: string) {
  await bindings.BUCKET.delete(objectKey(storageKey));
}

export function downloadName(name: string) {
  const cleaned = name.replace(/[\u0000-\u001f\\/]+/g, "_").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 180) || "documento";
}
