import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryProgressForUser, getOnboarding } from "@/lib/repository";

export const runtime = "nodejs";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const onboarding = (await getOnboarding(user.id));
  if (onboarding.status === "complete") redirect("/app");
  return <OnboardingFlow initialOnboarding={onboarding} initialCategories={(await getCategoryProgressForUser(user.id))} />;
}
