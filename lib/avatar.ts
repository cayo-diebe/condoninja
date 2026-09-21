import sharp from "sharp";
import { getDb, newId } from "./db";

export const avatarMaxBytes = 2 * 1024 * 1024;

export async function normalizeAvatar(input: Buffer) {
  if (!input.length || input.length > avatarMaxBytes) throw new Error("Envie uma foto de até 2 MB.");
  const image = sharp(input, { limitInputPixels: 16_000_000 });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) {
    throw new Error("Envie uma imagem estática JPG, PNG ou WebP.");
  }
  return image.rotate().resize(256, 256, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
}

export async function saveAvatar(userId: string, image: Buffer) {
  const version = newId();
  (await getDb().prepare(`INSERT INTO user_avatars (user_id, image, version) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET image = excluded.image, version = excluded.version`).run(userId, image, version));
  return version;
}

export async function getAvatar(userId: string) {
  return (await getDb().prepare("SELECT image FROM user_avatars WHERE user_id = ?").get(userId)) as { image: Uint8Array } | undefined;
}

export async function removeAvatar(userId: string) {
  (await getDb().prepare("DELETE FROM user_avatars WHERE user_id = ?").run(userId));
}
