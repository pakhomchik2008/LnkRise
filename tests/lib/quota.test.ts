import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = {
  user: { findUnique: vi.fn() },
  aiUsage: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const { quotaFor, consumeGeneration, releaseGeneration } = await import("@/lib/quota");

function subscriptionRow(plan: string, overrides: Partial<{ status: string; currentPeriodEnd: Date | null }> = {}) {
  return { plan, status: overrides.status ?? "active", currentPeriodEnd: overrides.currentPeriodEnd ?? null };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("quotaFor", () => {
  it("gives a trial account the trial limit with no subscription row", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscription: null });
    mockPrisma.aiUsage.findUnique.mockResolvedValue(null);

    const state = await quotaFor("user-1");

    expect(state).toEqual({ used: 0, limit: 3, remaining: 3, plan: "trial" });
  });

  it("gives a pro account the pro limit", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscription: subscriptionRow("pro") });
    mockPrisma.aiUsage.findUnique.mockResolvedValue({ generations: 12 });

    const state = await quotaFor("user-2");

    expect(state).toEqual({ used: 12, limit: 50, remaining: 38, plan: "pro" });
  });

  it("falls back to trial once a Starter pass has expired, even though the row still says starter", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      subscription: subscriptionRow("starter", { currentPeriodEnd: new Date(Date.now() - 60_000) }),
    });
    mockPrisma.aiUsage.findUnique.mockResolvedValue(null);

    const state = await quotaFor("user-3");

    expect(state.plan).toBe("trial");
    expect(state.limit).toBe(3);
  });

  it("never reports negative remaining when usage has somehow exceeded the limit", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscription: null });
    mockPrisma.aiUsage.findUnique.mockResolvedValue({ generations: 99 });

    const state = await quotaFor("user-4");

    expect(state.remaining).toBe(0);
  });
});

describe("consumeGeneration", () => {
  it("refuses before writing anything once the quota is already exhausted", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscription: null });
    mockPrisma.aiUsage.findUnique.mockResolvedValue({ generations: 3 });

    const result = await consumeGeneration("user-5");

    expect(result.ok).toBe(false);
    expect(mockPrisma.aiUsage.upsert).not.toHaveBeenCalled();
  });

  it("reserves a slot and reports the new remaining count", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscription: null });
    mockPrisma.aiUsage.findUnique.mockResolvedValue({ generations: 1 });
    mockPrisma.aiUsage.upsert.mockResolvedValue({ generations: 2 });

    const result = await consumeGeneration("user-6");

    expect(result.ok).toBe(true);
    expect(result.state.used).toBe(2);
    expect(result.state.remaining).toBe(1);
  });

  it("refunds and refuses when a concurrent request already took the last slot", async () => {
    // before.limit is 3 (trial); the increment lands at 4, meaning someone
    // else's request landed between the read and this write.
    mockPrisma.user.findUnique.mockResolvedValue({ subscription: null });
    mockPrisma.aiUsage.findUnique.mockResolvedValue({ generations: 2 });
    mockPrisma.aiUsage.upsert.mockResolvedValue({ generations: 4 });

    const result = await consumeGeneration("user-7");

    expect(result.ok).toBe(false);
    expect(result.state.remaining).toBe(0);
    expect(mockPrisma.aiUsage.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe("releaseGeneration", () => {
  it("only decrements rows that are still above zero", async () => {
    await releaseGeneration("user-8");

    expect(mockPrisma.aiUsage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-8", generations: { gt: 0 } }),
        data: { generations: { decrement: 1 } },
      }),
    );
  });
});
