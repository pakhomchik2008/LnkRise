import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      streak: true,
      subscription: { select: { plan: true } },
    },
  });

  // The session outlived the row (database reset, account deleted).
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        user={{ name: user.name, email: user.email, image: user.image }}
        plan={user.subscription?.plan ?? "trial"}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar streak={user.streak} notifications={[]} />
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
