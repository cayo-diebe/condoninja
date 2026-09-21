import { bindings } from "./bindings";
export const appUrl = bindings.APP_URL || "https://condo-ninja.calrtd.chatgpt.site";
// Values remain server-only. Never fall back to a generated per-isolate secret.
export const authSecret = bindings.AUTH_SECRET;
export const maxUploadBytes = 25 * 1024 * 1024;
// Files are sent individually by the UI to stay below the Worker memory budget.
export const maxUploadBatchBytes = 26 * 1024 * 1024;
export const supportedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "jpg", "jpeg", "png"];
export const supportedMimeTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "text/plain", "image/jpeg", "image/png"]);
