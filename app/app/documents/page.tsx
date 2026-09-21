import { redirect } from "next/navigation";
import { DocumentChecklist } from "@/components/document-checklist";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryProgressForUser, getOnboarding } from "@/lib/repository";

export const runtime = "nodejs";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const onboarding = (await getOnboarding(user.id));
  if (onboarding.status !== "complete") redirect("/app/onboarding");
  return <div className="page-stack"><header className="page-heading"><div><span className="eyebrow">Documentos</span><h1>Mais transparência. Mais poder de decisão.</h1><p>Os documentos do seu condomínio são o ponto de partida para entender os gastos, encontrar oportunidades de economia e ter mais voz nas decisões.</p></div></header><section className="panel"><DocumentChecklist initialCategories={(await getCategoryProgressForUser(user.id))} collapsibleGroups /></section></div>;
}
