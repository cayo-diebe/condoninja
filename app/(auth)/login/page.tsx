import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ existing?: string | string[] }> }) {
  const params = await searchParams;
  return <AuthForm mode="login" existingAccount={params.existing === "1"} />;
}
