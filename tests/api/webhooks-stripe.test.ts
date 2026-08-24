import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockHeadersGet = vi.fn();
vi.mock("next/headers", () => ({
  headers: async () => ({ get: mockHeadersGet }),
}));

const mockPrisma = {
  subscription: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockStripeEnabled = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripeEnabled: () => mockStripeEnabled(),
  stripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
}));

const { POST } = await import("@/app/api/webhooks/stripe/route");

function fakeRequest(body: string): Request {
  return { text: async () => body } as unknown as Request;
}

const ORIGINAL_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  mockStripeEnabled.mockReturnValue(true);
  mockHeadersGet.mockReturnValue("sig_test");
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

afterEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL_SECRET;
});

describe("guard clauses", () => {
  it("refuses when Stripe is not configured on this deployment", async () => {
    mockStripeEnabled.mockReturnValue(false);

    const response = await POST(fakeRequest("{}"));

    expect(response.status).toBe(400);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("refuses when the stripe-signature header is missing", async () => {
    mockHeadersGet.mockReturnValue(null);

    const response = await POST(fakeRequest("{}"));

    expect(response.status).toBe(400);
  });

  it("refuses when STRIPE_WEBHOOK_SECRET is not set, even with a signature present", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await POST(fakeRequest("{}"));

    expect(response.status).toBe(400);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("refuses a body whose signature does not verify, without touching the database", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const response = await POST(fakeRequest("tampered"));

    expect(response.status).toBe(400);
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });
});

describe("checkout.session.completed", () => {
  it("stamps a 15-day expiry for a Starter pass instead of reading one from Stripe", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: { userId: "user-1", planId: "starter" }, customer: "cus_1", subscription: null } },
    });

    await POST(fakeRequest("{}"));

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledTimes(1);
    const call = mockPrisma.subscription.upsert.mock.calls[0]![0];
    expect(call.where).toEqual({ userId: "user-1" });
    expect(call.update.plan).toBe("starter");
    expect(call.update.status).toBe("active");

    const daysUntilExpiry = (call.update.currentPeriodEnd.getTime() - Date.now()) / 86_400_000;
    expect(daysUntilExpiry).toBeGreaterThan(14.9);
    expect(daysUntilExpiry).toBeLessThan(15.1);
  });

  it("looks up the real subscription from Stripe for a Pro checkout instead of trusting the session alone", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: { metadata: { userId: "user-2", planId: "pro" }, customer: "cus_2", subscription: "sub_123" },
      },
    });
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_end: 1_800_000_000,
      items: { data: [{ price: { id: "price_pro" } }] },
    });

    await POST(fakeRequest("{}"));

    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith("sub_123");
    const call = mockPrisma.subscription.upsert.mock.calls[0]![0];
    expect(call.update.plan).toBe("pro");
    expect(call.update.stripePriceId).toBe("price_pro");
  });

  it("does nothing when the session has no userId in its metadata", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: {}, customer: "cus_3" } },
    });

    await POST(fakeRequest("{}"));

    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });
});

describe("customer.subscription.updated / .deleted", () => {
  it("syncs plan and status straight from the subscription's own metadata.userId", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_9",
          status: "active",
          current_period_end: 1_800_000_000,
          metadata: { userId: "user-9" },
          items: { data: [{ price: { id: "price_pro" } }] },
          customer: "cus_9",
        },
      },
    });

    await POST(fakeRequest("{}"));

    expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-9" } }),
    );
  });

  it("falls back to a stripeCustomerId lookup when metadata.userId is missing", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_10",
          status: "active",
          current_period_end: 1_800_000_000,
          metadata: {},
          items: { data: [{ price: { id: "price_pro" } }] },
          customer: "cus_10",
        },
      },
    });
    mockPrisma.subscription.findFirst.mockResolvedValue({ userId: "user-10" });

    await POST(fakeRequest("{}"));

    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeCustomerId: "cus_10" } }),
    );
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-10" } }),
    );
  });

  it("demotes to trial when a canceled subscription event arrives, so access doesn't outlive the cancellation", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_11",
          status: "canceled",
          current_period_end: 1_800_000_000,
          metadata: { userId: "user-11" },
          items: { data: [{ price: { id: "price_pro" } }] },
          customer: "cus_11",
        },
      },
    });

    await POST(fakeRequest("{}"));

    const call = mockPrisma.subscription.upsert.mock.calls[0]![0];
    expect(call.update.plan).toBe("trial");
    expect(call.update.status).toBe("canceled");
  });

  it("silently no-ops when neither metadata nor a matching customer resolves a userId", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_12", status: "active", metadata: {}, customer: "cus_unknown" },
      },
    });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);

    const response = await POST(fakeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });
});

describe("unhandled event types", () => {
  it("acknowledges receipt without touching the database", async () => {
    mockConstructEvent.mockReturnValue({ type: "invoice.paid", data: { object: {} } });

    const response = await POST(fakeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
  });
});
