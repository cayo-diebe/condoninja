import { imageSize } from "image-size";
import { bindings } from "./bindings";
export const avatarMaxBytes = 2 * 1024 * 1024;

export async function normalizeAvatar(input: Buffer) {
  if (!input.length || input.length > avatarMaxBytes) throw new Error("Foto inválida.");
  // The existing picker now crops and strips metadata in the browser. Verify the
  // resulting format/dimensions again here; never accept SVG or arbitrary bytes.
  const metadata = imageSize(input);
  if (metadata.type !== "webp" || metadata.width !== 256 || metadata.height !== 256 || input.includes(Buffer.from("ANIM")) || input.includes(Buffer.from("EXIF"))) throw new Error("Foto inválida.");
  return input;
}
export async function saveAvatar(userId: string, image: Buffer) {
  const version = crypto.randomUUID();
  const key = `condo-v2/avatars/${userId}/${version}.webp`;
  const previous = await bindings.DB.prepare("SELECT storage_key FROM cn_user_avatars WHERE user_id = ?").bind(userId).first<{storage_key:string}>();
  await bindings.BUCKET.put(key, new Uint8Array(image), { httpMetadata: {contentType:"image/webp"} });
  try {
    await bindings.DB.prepare("INSERT INTO cn_user_avatars (user_id, storage_key, version) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET storage_key=excluded.storage_key, version=excluded.version").bind(userId,key,version).run();
  } catch(error) { await bindings.BUCKET.delete(key); throw error; }
  if(previous) await bindings.BUCKET.delete(previous.storage_key).catch(() => console.error("avatar_cleanup_failed"));
  return version;
}
export async function getAvatar(userId: string) {
  const row = await bindings.DB.prepare("SELECT storage_key FROM cn_user_avatars WHERE user_id = ?").bind(userId).first<{storage_key:string}>();
  if(!row) return undefined;
  const object = await bindings.BUCKET.get(row.storage_key);
  return object ? {image:new Uint8Array(await object.arrayBuffer())} : undefined;
}
export async function removeAvatar(userId: string) {
  const row = await bindings.DB.prepare("SELECT storage_key FROM cn_user_avatars WHERE user_id = ?").bind(userId).first<{storage_key:string}>();
  await bindings.DB.prepare("DELETE FROM cn_user_avatars WHERE user_id = ?").bind(userId).run();
  if(row) await bindings.BUCKET.delete(row.storage_key);
}
