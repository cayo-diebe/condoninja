import { expect, it } from "vitest";
import sharp from "sharp";
import { avatarMaxBytes, normalizeAvatar } from "../lib/avatar";

it("validates and normalizes avatars without retaining metadata", async () => {
  const input = await sharp({ create: { width: 400, height: 200, channels: 3, background: "red" } }).withMetadata().jpeg().toBuffer();
  const output = await normalizeAvatar(input);
  const metadata = await sharp(output).metadata();
  expect(metadata.width).toBe(256);
  expect(metadata.height).toBe(256);
  expect(metadata.format).toBe("webp");
  expect(metadata.exif).toBeUndefined();
  await expect(normalizeAvatar(Buffer.alloc(avatarMaxBytes + 1))).rejects.toThrow();
  await expect(normalizeAvatar(Buffer.from("not an image"))).rejects.toThrow();
  await expect(normalizeAvatar(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'))).rejects.toThrow();
});
