import { AuthForm } from "@/components/auth-form";
import { cookies } from "next/headers";
import { signupEmailCookie, signupEmailSchema } from "@/lib/signup-leads";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const prefill = signupEmailSchema.safeParse(cookieStore.get(signupEmailCookie)?.value);
  return <AuthForm mode="register" initialEmail={prefill.success ? prefill.data : ""} />;
}
