import { redirect } from "next/navigation";
import { CondoProfile } from "@/components/condo-profile";
import { getCurrentUser } from "@/lib/auth";
import { getOnboarding } from "@/lib/repository";

export const runtime = "nodejs";

export default async function CondominiumPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const onboarding = (await getOnboarding(user.id));
  if (onboarding.status !== "complete") redirect("/app/onboarding");
  return <div className="page-stack"><header className="page-heading"><div><span className="eyebrow">Condomínio</span><h1>Dados de identificação</h1><p>Mantenha o contexto do condomínio atualizado para organizar os documentos corretamente.</p></div></header><section className="panel"><CondoProfile initial={onboarding} /></section></div>;
}
