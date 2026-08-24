"use server";

import { revalidatePath } from "next/cache";
import { requireAdminId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteWaitlistEntry(id: string): Promise<{ ok: boolean }> {
  await requireAdminId();
  await prisma.waitlistEntry.delete({ where: { id } });
  revalidatePath("/admin/waitlist");
  return { ok: true };
}
