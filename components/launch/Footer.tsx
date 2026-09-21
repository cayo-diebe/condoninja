import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return <footer className="border-t border-white/5 bg-ink-950 text-ink-300">
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed">Nossa missão: mais economia e transparência nos condomínios, com mais poder nas mãos dos moradores.</p>
        </div>
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-400">Conheça</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/#problema" className="hover:text-white">O problema</Link></li>
              <li><Link href="/#como-funciona" className="hover:text-white">Como funciona</Link></li>
              <li><Link href="/#tecnologia" className="hover:text-white">Tecnologia</Link></li>
              <li><Link href="/#principios" className="hover:text-white">Princípios</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-400">Sua conta</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/cadastro" className="hover:text-white">Criar conta</Link></li>
              <li><Link href="/login" className="hover:text-white">Entrar</Link></li>
              <li><Link href="/app" className="hover:text-white">Área restrita</Link></li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="mt-10 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Condo Ninja. Todos os direitos reservados.</p>
        <p>Informação é o ponto de partida. Conclusões exigem análise e contexto.</p>
      </div>
    </div>
  </footer>;
}
