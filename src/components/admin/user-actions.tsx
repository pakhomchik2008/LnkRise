"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteUser, setUserRole } from "@/app/admin/actions";

export function UserActions({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submitRole(next: string) {
    setError(null);
    setRole(next);
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if (!result.ok) {
        setError(result.error ?? "Failed");
        setRole(currentRole);
      }
    });
  }

  function submitDelete() {
    if (!confirm("Delete this account and everything they own? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.ok) {
        setError(result.error ?? "Failed");
        return;
      }
      router.push("/admin/users");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="role" className="text-xs text-white/60">Role</label>
        <select
          id="role"
          value={role}
          disabled={pending}
          onChange={(event) => submitRole(event.target.value)}
          className="rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="user">user</option>
          <option value="coach">coach</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <button
        type="button"
        disabled={isSelf || pending}
        onClick={submitDelete}
        className="rounded-[var(--radius-sm)] border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete account
      </button>

      {isSelf && <p className="text-xs text-white/40">You can't delete yourself here.</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
