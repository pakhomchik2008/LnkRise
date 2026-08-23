import Link from "next/link";
import { notFound } from "next/navigation";
import { UserActions } from "@/components/admin/user-actions";
import { requireAdminId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <div className="text-right text-sm text-white/80">{children}</div>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const adminId = await requireAdminId();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      subscription: true,
      _count: { select: { dailyBriefs: true, posts: true, facts: true, clients: true } },
      coach: { select: { name: true, email: true } },
    },
  });

  if (!user) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/users" className="text-xs text-white/50 hover:text-white">← Users</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          {user.name ?? user.email}
        </h1>
        <p className="text-sm text-white/60">{user.email}</p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] px-5 py-2">
        <Row label="Role">{user.role}</Row>
        <Row label="Onboarded">{user.onboardedAt ? user.onboardedAt.toISOString().slice(0, 10) : "no"}</Row>
        <Row label="Growth score">{user.growthScore}</Row>
        <Row label="Streak">{user.streak}d (longest {user.longestStreak}d)</Row>
        <Row label="Last active">{user.lastActiveAt ? user.lastActiveAt.toISOString().slice(0, 10) : "—"}</Row>
        <Row label="Signed up">{user.createdAt.toISOString().slice(0, 10)}</Row>
        <Row label="Plan">{user.subscription?.plan ?? "trial (no subscription row)"}</Row>
        <Row label="Coach">
          {user.coach ? user.coach.name ?? user.coach.email : "—"}
        </Row>
        <Row label="Clients">{user._count.clients}</Row>
        <Row label="Briefs / posts / facts">
          {user._count.dailyBriefs} · {user._count.posts} · {user._count.facts}
        </Row>
      </div>

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Actions</h2>
        <UserActions userId={user.id} currentRole={user.role} isSelf={user.id === adminId} />
      </div>
    </div>
  );
}
