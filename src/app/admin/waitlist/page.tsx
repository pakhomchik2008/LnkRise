import { WaitlistTable } from "@/components/admin/waitlist-table";
import { prisma } from "@/lib/prisma";

export default async function AdminWaitlistPage() {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Waitlist</h1>
        <p className="mt-1 text-sm text-white/60">
          {entries.length} signup{entries.length === 1 ? "" : "s"} from the footer form.
        </p>
      </header>

      <WaitlistTable
        entries={entries.map((entry) => ({
          id: entry.id,
          email: entry.email,
          source: entry.source,
          createdAt: entry.createdAt.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}
