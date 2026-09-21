import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateReferralCode } from "@/lib/referrals";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Convide seus vizinhos | Condo Ninja" };

const siteUrl = "https://condo-ninja.calrtd.chatgpt.site/";
const invitation = "Confira o que descobri com o raio-X do nosso condomínio:";

export default async function InviteNeighborsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  let whatsappUrl: string | null = null;
  try {
    const code = await getOrCreateReferralCode(user.id);
    const inviteUrl = `${siteUrl}convite/${code}`;
    whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${invitation}\n\n${inviteUrl}`)}`;
  } catch {
    console.error("referral_link_unavailable");
  }

  return (
    <div className="page-stack invite-neighbors">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Convide seus vizinhos</span>
          <h1>O condomínio é de vocês. A voz também.</h1>
          <p>Moradores unidos têm mais força para cobrar transparência, buscar economia e participar das decisões que afetam a vida de todos.</p>
        </div>
      </header>

      <section className="panel" aria-labelledby="invite-share-title">
        <h2 id="invite-share-title">Comece essa conversa com seus vizinhos</h2>
        <p>Compartilhe a Condo Ninja com um vizinho ou com o grupo do condomínio. Mais moradores informados significam mais vozes nas decisões — e menos decisões tomadas sem vocês.</p>
        {whatsappUrl ? <a className="button invite-share-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Compartilhar no WhatsApp <span aria-hidden="true">↗</span></a>
          : <p role="alert">Não foi possível preparar seu convite. Atualize a página para tentar novamente.</p>}
      </section>

      <section className="panel" aria-labelledby="invite-why-title">
        <h2 id="invite-why-title">Retomar o controle começa com participação</h2>
        <p>Você não precisa entender tudo sozinho. Quando os moradores se mobilizam, fica mais fácil reunir informações, acompanhar as contas e construir propostas para um condomínio melhor. É assim que o controle volta para as mãos de quem mora e paga a conta.</p>
        <ul className="info-list">
          <li>Transformem dúvidas individuais em uma conversa coletiva, com respeito e informação.</li>
          <li>Cobrem clareza sobre os gastos e busquem oportunidades de economia sem abrir mão do que importa.</li>
          <li>Participem das assembleias e acompanhem juntos as decisões e os compromissos da gestão.</li>
        </ul>
      </section>
    </div>
  );
}
