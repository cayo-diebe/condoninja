import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { getOnboarding } from "@/lib/repository";

export const runtime = "nodejs";

export default async function RestrictedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const onboarding = (await getOnboarding(user.id));
  const condominiumName = onboarding.addressDraft?.name || onboarding.condominium?.name || "Condomínio não informado";
  return <AppShell user={user} onboardingPending={onboarding.status !== "complete"} condominiumName={condominiumName}>{children}</AppShell>;
}
