import { getDb, nowIso } from "./db";

export async function getNinjaUpgrade(userId: string) {
  const row = await getDb().prepare("SELECT earned_at, presented_at FROM ninja_upgrades WHERE user_id = ?").get(userId) as { earned_at: string; presented_at: string | null } | undefined;
  if (row) return { unlocked: true, pending: !row.presented_at };
  // Older successful referrals also qualify; initialize their flag only on POST.
  const referral = await getDb().prepare("SELECT 1 FROM user_referrals WHERE inviter_user_id = ? LIMIT 1").get(userId);
  return { unlocked: !!referral, pending: !!referral };
}

export async function claimNinjaUpgrade(userId: string) {
  await getDb().prepare(`INSERT INTO ninja_upgrades (user_id, earned_at)
    SELECT inviter_user_id, MIN(registered_at) FROM user_referrals WHERE inviter_user_id = ? GROUP BY inviter_user_id
    ON CONFLICT(user_id) DO NOTHING`).run(userId);
  // Atomic compare-and-set: only one tab/device can present this upgrade.
  const claimed = await getDb().prepare(`UPDATE ninja_upgrades SET presented_at = ?
    WHERE user_id = ? AND presented_at IS NULL RETURNING user_id`).get(nowIso(), userId);
  return !!claimed;
}
