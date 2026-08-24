"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWaitlistEntry } from "@/app/admin/waitlist/actions";

interface Entry {
  id: string;
  email: string;
  source: string | null;
  createdAt: string;
}

export function WaitlistTable({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    if (!confirm("Remove this waitlist entry?")) return;
    startTransition(async () => {
      await deleteWaitlistEntry(id);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03]">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {entries.map((entry) => (
            <tr key={entry.id} className="transition-colors hover:bg-white/5">
              <td className="px-4 py-3 font-medium text-white">{entry.email}</td>
              <td className="px-4 py-3 text-xs text-white/60">{entry.source ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-white/60">{entry.createdAt}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  disabled={pending}
                  className="text-xs font-medium text-red-300 transition-colors hover:text-red-200 disabled:opacity-40"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-white/50">
                No signups yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
