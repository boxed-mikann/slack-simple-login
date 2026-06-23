import { redirect } from "next/navigation";
import { verifyLoginToken } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) {
    redirect("/");
  }

  const identity = verifyLoginToken(token);
  if (!identity) {
    redirect("/login/invalid");
  }

  redirect(`/api/login?token=${encodeURIComponent(token)}`);
}