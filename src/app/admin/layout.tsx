import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true, name: true },
  });

  // Only role=admin gets past this. Not silently redirected to /dashboard
  // because a wrong url plus a silent redirect looks like the button broke.
  if (!user || user.role !== "admin") {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink text-white">
        <div className="mx-auto max-w-sm space-y-3 rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm font-semibold">Admin only</p>
          <p className="text-xs text-white/60">
            You&apos;re signed in as {user?.email ?? "an unknown account"} — this area needs the admin role.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-[var(--radius-sm)] bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-white/90"
          >
            Back to the app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-ink text-white">
      <AdminNav userLabel={user.name ?? user.email} />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
