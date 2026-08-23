import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the auth config.
 *
 * The middleware runs on the edge runtime, where Prisma cannot. This file holds
 * everything the middleware needs (session strategy, pages, the route guard);
 * `src/lib/auth.ts` adds the adapter and the providers on the Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const signedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      const isAppRoute = ["/dashboard", "/daily-brief", "/content", "/analytics", "/connections", "/settings", "/onboarding", "/billing", "/coach", "/admin"].some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      );

      if (isAppRoute) return signedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboarded = "onboardedAt" in user ? Boolean(user.onboardedAt) : false;
        token.role = "role" in user ? (user.role as string) : "user";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
