import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const linkedinEnabled = Boolean(
  process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET,
);

/**
 * The dev sign-in exists so the whole product is walkable without OAuth
 * credentials. It accepts an email and creates the account if it does not
 * exist — which is exactly why it must never be reachable in production.
 * It is not registered at all unless NODE_ENV is development.
 */
export const devSignInEnabled = process.env.NODE_ENV === "development";

/**
 * Sign-in always requests the OpenID scopes. The Community Management scopes
 * are only requested once LINKEDIN_COMMUNITY_API=enabled, because LinkedIn
 * rejects the whole authorization request when an app asks for a permission it
 * has not been approved for — asking early would break sign-in entirely.
 */
export function linkedinScopes(): string[] {
  const scopes = ["openid", "profile", "email"];

  if (process.env.LINKEDIN_COMMUNITY_API === "enabled") {
    scopes.push("r_member_postAnalytics", "w_member_social");
  }

  return scopes;
}

const credentialsSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(80).optional(),
});

function buildProviders(): NextAuthConfig["providers"] {
  const providers: NextAuthConfig["providers"] = [];

  if (googleEnabled) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: false,
      }),
    );
  }

  if (linkedinEnabled) {
    providers.push(
      LinkedIn({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        authorization: { params: { scope: linkedinScopes().join(" ") } },
      }),
    );
  }

  if (devSignInEnabled) {
    providers.push(
      Credentials({
        id: "dev",
        name: "Development sign-in",
        credentials: {
          email: { label: "Email", type: "email" },
          name: { label: "Name", type: "text" },
        },
        async authorize(raw) {
          const parsed = credentialsSchema.safeParse(raw);
          if (!parsed.success) return null;

          const { email, name } = parsed.data;

          const user = await prisma.user.upsert({
            where: { email },
            update: { lastActiveAt: new Date() },
            create: {
              email,
              name: name || email.split("@")[0],
              lastActiveAt: new Date(),
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            onboardedAt: user.onboardedAt,
          };
        },
      }),
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: buildProviders(),
  trustHost: true,
});

/** Session user id, or null. Use in server components and actions. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Throws if unauthenticated — for server actions that must not run anonymously. */
export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error("Not authenticated");
  return id;
}

/** Throws unless the caller is signed in with the coach role. */
export async function requireCoachId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "coach") {
    throw new Error("Not authorized");
  }
  return session.user.id;
}

/** Throws unless the caller is signed in with the admin role. */
export async function requireAdminId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }
  return session.user.id;
}
