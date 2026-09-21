export type OnboardingStep = "welcome" | "address" | "condominium" | "documents" | "review";
export type OnboardingStatus = "in_progress" | "complete";
export type DocumentStatus = "stored" | "awaiting_analysis";
export type MembershipRole = "owner" | "member";

export interface UserRecord {
  ninjaRed?: boolean;
  ninjaUpgradePending?: boolean;
  avatarVersion?: string;
  requiredDocumentsComplete?: boolean;
  id: string;
  name: string;
  email: string;
}

export interface CondominiumRecord {
  id: string;
  name: string;
  address: string;
  addressNumber: string;
  cep: string;
  city: string;
  state: string;
  cnpj: string | null;
  propertyType: string | null;
  unitCount: number | null;
}

export interface OnboardingRecord {
  addressDraft?: { address: string; addressNumber: string; cep: string; city: string; state: string; unitIdentifier: string; name?: string } | null;
  step: OnboardingStep;
  status: OnboardingStatus;
  condominium: CondominiumRecord | null;
  relationship: string | null;
  unitIdentifier: string | null;
  completedAt: string | null;
}

export interface DocumentCategory {
  archived?: boolean;
  slug: string;
  label: string;
  description: string;
  whyRequired: string;
  groupName: string;
  required: boolean;
  minimumCount: number;
  sortOrder: number;
  allowedExtensions: string[];
}

export interface DocumentRecord {
  id: string;
  categorySlug: string;
  categoryLabel: string;
  groupName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  uploadedAt: string;
  uploadedBy: string;
}

export interface CategoryProgress extends DocumentCategory {
  documents: DocumentRecord[];
  satisfied: boolean;
}
