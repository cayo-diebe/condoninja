import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/repository";

export const runtime = "nodejs";

export default async function AppHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = (await getDashboardData(user.id));
  if (data.onboarding.status !== "complete") redirect("/app/onboarding");
  return <DashboardView user={user} data={data} />;
}
