import { PrismaClient } from "@/generated/prisma";

// Standard Next.js dev-mode-safe Prisma singleton.
// Prevents exhausting database connections when Next.js hot-reloads
// modules in development (each reload would otherwise instantiate a
// new PrismaClient).

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
