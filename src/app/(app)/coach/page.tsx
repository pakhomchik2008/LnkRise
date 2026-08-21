import Link from "next/link";
import { redirect } from "next/navigation";
import { AddClientForm } from "@/components/coach/add-client-form";
import { RemoveClientButton } from "@/components/coach/remove-client-button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireCoachId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachPage() {
  let coachId: string;
  try {
    coachId = await requireCoachId();
  } catch {
    redirect("/dashboard");
  }

  const clients = await prisma.user.findMany({
    where: { coachId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      growthScore: true,
      streak: true,
      lastActiveAt: true,
      onboardedAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Clients</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Everyone whose account you manage. Add a client by the email they will sign in with.
      </p>

      <Card className="mt-6 p-5">
        <AddClientForm />
      </Card>

      {clients.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No clients yet"
          description="Add one above — their kabinet is scoped to their own data from the moment they're linked."
        />
      ) : (
        <div className="mt-6 space-y-2">
          {clients.map((client) => (
            <Card key={client.id} className="flex items-center justify-between gap-4 p-4">
              <Link href={`/coach/${client.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={client.name} email={client.email} src={client.image} size="md" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {client.name ?? client.email}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {client.onboardedAt ? `Score ${client.growthScore} · ${client.streak}-day streak` : "Not onboarded yet"}
                  </span>
                </span>
              </Link>
              <RemoveClientButton clientId={client.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
