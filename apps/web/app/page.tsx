import { auth } from "@/auth";
import AppShell from "@/components/app/AppShell";

/**
 * Root page — replaces the static marketing landing page.
 *
 * Behaviour:
 *  • Authenticated  → AppShell with cloud mode enabled + real session
 *  • Guest (no auth) → AppShell in guest mode (mock pipeline, temp state)
 *
 * auth() is wrapped in try/catch so a missing AUTH_SECRET or unconfigured
 * Google OAuth never crashes the page — it simply falls back to guest mode.
 */
export default async function Home() {
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
    // Auth not configured (missing secret / OAuth creds) — run as guest
    userInfo = null;
  }

  return <AppShell userInfo={userInfo} />;
}
