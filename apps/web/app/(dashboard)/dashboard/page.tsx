import AppShell from "@/components/app/AppShell";
import { auth } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenAnim — Studio",
  description: "Deterministic animation rendering orchestration",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let userInfo = null;

  try {
    const session = await auth();
    if (session?.user) {
      userInfo = {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      };
    }
  } catch {
    // Auth not configured — fall back to guest mode
    userInfo = null;
  }

  return <AppShell userInfo={userInfo} />;
}
