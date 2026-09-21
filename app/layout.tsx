import type { Metadata } from "next";
import "./globals.css";
import "./restricted-theme.css";
import { NinjaUpgradeProvider } from "@/components/ninja-upgrade-provider";

export const metadata: Metadata = {
  title: "Condo Ninja | Clareza para o seu condomínio",
  description: "Organize os documentos e prepare o Raio-X do seu condomínio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><NinjaUpgradeProvider>{children}</NinjaUpgradeProvider></body>
    </html>
  );
}
