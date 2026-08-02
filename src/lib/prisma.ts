import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Prisma's Json input type requires an index signature, which our domain
 * interfaces deliberately do not have. These two helpers keep the cast in one
 * place instead of scattering `as unknown as` across every call site.
 */
export function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export function fromJson<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return (value ?? null) as T | null;
}
