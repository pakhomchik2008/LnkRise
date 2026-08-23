import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ROLE_TONE: Record<string, string> = {
  admin: "bg-accent-orange/20 text-orange-300",
  coach: "bg-brand-500/20 text-brand-300",
  user: "bg-white/10 text-white/70",
};

function fmt(date: Date | null): string {
  if (!date) return "—";
  return date.toISOString().slice(0, 10);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q, role } = await searchParams;

  const users = await prisma.user.findMany({
    where: {
      ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] } : {}),
      ...(role && role !== "all" ? { role } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      growthScore: true,
      streak: true,
      onboardedAt: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Users</h1>
        <p className="mt-1 text-sm text-white/60">
          {users.length === 100 ? "First 100 matches." : `${users.length} account${users.length === 1 ? "" : "s"}.`}
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search email or name"
          className="w-64 rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-brand-500 focus:outline-none"
        />
        <select
          name="role"
          defaultValue={role ?? "all"}
          className="rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/90"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Streak</th>
              <th className="px-4 py-3 font-medium">Onboarded</th>
              <th className="px-4 py-3 font-medium">Last active</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((u) => (
              <tr key={u.id} className="text-white/80 transition-colors hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-white hover:underline">
                    {u.name ?? u.email}
                  </Link>
                  <p className="truncate text-xs text-white/50">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_TONE[u.role] ?? ROLE_TONE.user}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{u.growthScore}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{u.streak}d</td>
                <td className="px-4 py-3 text-xs">{u.onboardedAt ? "yes" : "no"}</td>
                <td className="px-4 py-3 text-xs">{fmt(u.lastActiveAt)}</td>
                <td className="px-4 py-3 text-xs">{fmt(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
