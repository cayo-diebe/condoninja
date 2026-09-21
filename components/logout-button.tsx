"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Não foi possível sair da conta. Tente novamente.");
      setBusy(false);
    }
  }

  return <div className="form-stack">
    <div><button type="button" className="button button-logout" onClick={logout} disabled={busy}>{busy ? "Saindo…" : "Sair da conta"}</button></div>
    {error && <div role="alert" className="form-error">{error}</div>}
  </div>;
}
