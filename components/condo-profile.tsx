"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CondoForm } from "@/components/condo-form";
import type { OnboardingRecord } from "@/lib/types";

export function CondoProfile({ initial }: { initial: OnboardingRecord }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  return <><CondoForm initial={initial} onSaved={() => { setSaved(true); router.refresh(); }} />{saved && <div className="form-success" role="status">Dados do condomínio salvos.</div>}</>;
}
