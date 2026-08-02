import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge runtime — no Prisma here. The route guard lives in authConfig.callbacks.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
