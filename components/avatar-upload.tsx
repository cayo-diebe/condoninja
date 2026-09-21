"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRecord } from "@/lib/types";
import { UserAvatar } from "./user-avatar";
import { FormRequestError, formErrorMessage } from "@/lib/form-errors";

export function AvatarUpload({ user }: { user: UserRecord }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function remove() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/account/avatar", { method: "DELETE" });
      if (!response.ok) throw new FormRequestError("Não foi possível remover a foto. Tente novamente.");
      setSuccess("Foto removida. O avatar padrão foi restaurado.");
      router.refresh();
    } catch (error) {
      setError(formErrorMessage(error, "Não foi possível remover a foto. Tente novamente."));
    } finally { setBusy(false); }
  }

  async function upload(file?: File) {
    if (!file) return;
    setError(""); setSuccess("");
    if (!file.size || file.size > 2 * 1024 * 1024) { setError("Envie uma foto de até 2 MB."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Selecione uma foto JPG, PNG ou WebP."); return; }
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      let photo: Blob;
      try {
        if (bitmap.width * bitmap.height > 16_000_000) throw new FormRequestError("Foto inválida. Envie JPG, PNG ou WebP de até 2 MB e 16 megapixels.");
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 256;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("image_processing_unavailable");
        const side = Math.min(bitmap.width, bitmap.height);
        context.drawImage(bitmap, (bitmap.width-side)/2, (bitmap.height-side)/2, side, side, 0, 0, 256, 256);
        photo = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("image_processing_failed")), "image/webp", 0.8));
      } finally { bitmap.close(); }
      const response = await fetch("/api/account/avatar", { method: "POST", body: photo });
      const result = await response.json();
      if (!response.ok) throw new FormRequestError(result.error || "Não foi possível salvar a foto.");
      setSuccess("Foto de perfil salva.");
      router.refresh();
    } catch (error) { setError(formErrorMessage(error, "Não foi possível enviar a foto. Tente novamente.")); }
    finally { setBusy(false); }
  }

  return <section className="panel form-stack" aria-labelledby="profile-photo-title">
    <h2 id="profile-photo-title">Foto de perfil</h2>
    <div className="profile-avatar-preview">
      <UserAvatar user={user} />
      {user.avatarVersion && <button type="button" className="avatar-remove" aria-label="Remover foto de perfil" title="Remover foto de perfil" disabled={busy} onClick={remove}><span aria-hidden="true">×</span></button>}
    </div>
    <div className="field">
      <label htmlFor="profile-photo">{busy ? "Atualizando foto…" : "Escolher foto"}</label>
      <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} aria-describedby="profile-photo-help" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
      <span id="profile-photo-help" className="field-hint">JPG, PNG ou WebP, até 2 MB e 16 megapixels. A foto é recortada em formato quadrado e salva automaticamente.</span>
    </div>
    {error && <div role="alert" className="form-error">{error}</div>}
    {success && <div role="status" className="form-success">{success}</div>}
  </section>;
}
