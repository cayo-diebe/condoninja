import { AuthTransition } from "@/components/auth-transition";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthTransition>{children}</AuthTransition>;
}
