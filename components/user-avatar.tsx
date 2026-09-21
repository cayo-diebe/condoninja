"use client";
import type { UserRecord } from "@/lib/types";
import { useNinjaUpgrade } from "./ninja-upgrade-provider";

export function UserAvatar({ user }: { user: UserRecord }) {
  const upgrade = useNinjaUpgrade();
  const current = upgrade?.userId === user.id ? upgrade : null;
  const red = current?.red ?? (user.ninjaRed && !user.ninjaUpgradePending);
  const src = user.avatarVersion ? `/api/account/avatar?v=${encodeURIComponent(user.avatarVersion)}` : red ? "/default-avatar-ninja-red.png" : user.requiredDocumentsComplete || user.ninjaRed ? "/default-avatar-ninja.png" : "/default-avatar-ninja-white.png";
  if (!user.avatarVersion && current?.active) return <span className="ninja-avatar-upgrade ninja-awakening ninja-awakening-red">
    <img className="user-avatar ninja-red-image" src={src} width={36} height={36} alt="Ninja vermelho" />
    <span className="ninja-white-overlay"><img className="user-avatar" src="/default-avatar-ninja.png" width={36} height={36} alt="" /></span>
  </span>;
  return (
    // Private authenticated endpoint; bypass the public image optimization cache.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`user-avatar${red && !user.avatarVersion ? " ninja-red-image" : ""}`} src={src} width={36} height={36} alt="" />
  );
}
