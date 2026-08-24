import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();

vi.mock("next-auth", () => ({
  default: () => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock("next-auth/providers/credentials", () => ({ default: vi.fn(() => ({})) }));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn(() => ({})) }));
vi.mock("next-auth/providers/linkedin", () => ({ default: vi.fn(() => ({})) }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: vi.fn(() => ({})) }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { upsert: vi.fn(), findUnique: vi.fn() } } }));

const { currentUserId, requireUserId, requireCoachId, requireAdminId } = await import("@/lib/auth");

function session(overrides: { id?: string; role?: string } = {}) {
  return { user: { id: overrides.id, role: overrides.role }, expires: "" };
}

beforeEach(() => {
  mockAuth.mockReset();
});

describe("currentUserId / requireUserId", () => {
  it("returns null when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await currentUserId()).toBeNull();
  });

  it("returns the session's user id when signed in", async () => {
    mockAuth.mockResolvedValue(session({ id: "u1", role: "user" }));
    expect(await currentUserId()).toBe("u1");
  });

  it("requireUserId throws instead of returning an id from an empty session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireUserId()).rejects.toThrow("Not authenticated");
  });

  it("requireUserId resolves for any authenticated role, not just 'user'", async () => {
    mockAuth.mockResolvedValue(session({ id: "u2", role: "admin" }));
    await expect(requireUserId()).resolves.toBe("u2");
  });
});

describe("requireCoachId", () => {
  it("throws for a signed-in user whose role is not coach", async () => {
    mockAuth.mockResolvedValue(session({ id: "u3", role: "user" }));
    await expect(requireCoachId()).rejects.toThrow("Not authorized");
  });

  it("throws for no session at all", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireCoachId()).rejects.toThrow("Not authorized");
  });

  it("throws for an admin — role check is exact, not 'at least coach'", async () => {
    mockAuth.mockResolvedValue(session({ id: "u4", role: "admin" }));
    await expect(requireCoachId()).rejects.toThrow("Not authorized");
  });

  it("resolves the coach's id when the role matches", async () => {
    mockAuth.mockResolvedValue(session({ id: "coach-1", role: "coach" }));
    await expect(requireCoachId()).resolves.toBe("coach-1");
  });
});

describe("requireAdminId", () => {
  it("throws for a coach — coach is not a lesser form of admin", async () => {
    mockAuth.mockResolvedValue(session({ id: "u5", role: "coach" }));
    await expect(requireAdminId()).rejects.toThrow("Not authorized");
  });

  it("resolves the admin's id when the role matches", async () => {
    mockAuth.mockResolvedValue(session({ id: "admin-1", role: "admin" }));
    await expect(requireAdminId()).resolves.toBe("admin-1");
  });
});
