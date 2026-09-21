import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AvatarUpload } from "@/components/avatar-upload";
import { LogoutButton } from "@/components/logout-button";
import { listCondominiumJourneys } from "@/lib/repository";
import { CondominiumSwitcher } from "@/components/condominium-switcher";

export const runtime = "nodejs";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="page-stack"><header className="page-heading"><div><span className="eyebrow">Conta</span><h1>Seu acesso</h1><p>Estas são as informações usadas para acessar a área restrita.</p></div><LogoutButton /></header><AvatarUpload user={user} /><section className="panel"><div className="review-grid"><div className="review-row"><span>Nome</span><strong>{user.name}</strong></div><div className="review-row"><span>E-mail</span><strong>{user.email}</strong></div></div><p className="small muted" style={{ marginTop: 20 }}>A troca de senha e preferências adicionais serão incluídas em uma próxima versão.</p></section>
    <section className="panel" aria-labelledby="registered-condominiums">
      <h2 id="registered-condominiums">Condomínios cadastrados</h2>
      <CondominiumSwitcher journeys={(await listCondominiumJourneys(user.id))} />
    </section>
  </div>;
}
