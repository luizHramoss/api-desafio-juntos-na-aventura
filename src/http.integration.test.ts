import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  adventureFindUnique: vi.fn(),
  reservationCount: vi.fn(),
  reservationCreate: vi.fn(),
  reservationUpdateMany: vi.fn(),
  reservationFindUnique: vi.fn(),
  pricingFindFirst: vi.fn(),
  pricingFindMany: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    adventure: { findUnique: mocks.adventureFindUnique },
    reservation: {
      count: mocks.reservationCount,
      findUnique: mocks.reservationFindUnique,
    },
    pricing: {
      findFirst: mocks.pricingFindFirst,
      findMany: mocks.pricingFindMany,
    },
  },
}));

import { app } from "./app";

describe("HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pricingFindFirst.mockResolvedValue({ price_per_person: 1000, people_count: 4 });
    mocks.pricingFindMany.mockResolvedValue([
      { people_count: 1, price_per_person: 1200 },
      { people_count: 2, price_per_person: 900 },
      { people_count: 3, price_per_person: 750 },
      { people_count: 4, price_per_person: 650 },
    ]);
    mocks.transaction.mockImplementation(async (cb: any) =>
      cb({
        adventure: { findUnique: mocks.adventureFindUnique },
        reservation: {
          count: mocks.reservationCount,
          create: mocks.reservationCreate,
          updateMany: mocks.reservationUpdateMany,
        },
        pricing: { findFirst: mocks.pricingFindFirst },
      })
    );
  });

  it("GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /adventures/:id 404", async () => {
    mocks.adventureFindUnique.mockResolvedValue(null);
    const res = await request(app).get("/adventures/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Adventure not found" });
  });

  it("GET /adventures/:id 200", async () => {
    const payload = {
      id: "adv1",
      name: "Trip",
      destination: "MG",
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      min_people: 2,
      max_people: 4,
      pricings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mocks.adventureFindUnique.mockResolvedValue(payload);
    const res = await request(app).get("/adventures/adv1");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "adv1", name: "Trip" });
  });

  it("POST /reservations 400 validação", async () => {
    const res = await request(app).post("/reservations").send({ name: "x" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("POST /reservations 201", async () => {
    mocks.adventureFindUnique.mockResolvedValue({
      id: "adv1",
      max_people: 4,
      min_people: 3,
    });
    mocks.reservationCount.mockResolvedValue(0);
    mocks.reservationCreate.mockResolvedValue({
      id: "res1",
      adventure_id: "adv1",
      share_token: "abc",
      status: "pending_group",
    });

    const res = await request(app).post("/reservations").send({
      adventure_id: "adv1",
      name: "Ana Costa",
      email: "ana@example.com",
      whatsapp: "5511999999999",
    });

    expect(res.status).toBe(201);
    expect(res.body.deposit).toBe(200);
    expect(res.body.share_url).toMatch(/\/join\/abc$/);
  });

  it("POST /reservations 404 aventura inexistente", async () => {
    mocks.adventureFindUnique.mockResolvedValue(null);
    const res = await request(app).post("/reservations").send({
      adventure_id: "x",
      name: "Ana Costa",
      email: "ana@example.com",
      whatsapp: "5511999999999",
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Adventure not found");
  });

  it("GET /public/:token 400 token vazio", async () => {
    const res = await request(app).get("/public/%20");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("token is required");
  });

  it("GET /public/:token 404", async () => {
    mocks.reservationFindUnique.mockResolvedValue(null);
    const res = await request(app).get("/public/invalid-token");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Invalid token");
  });

  it("GET /public/:token 200", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      adventure: {
        id: "adv1",
        name: "Trip",
        destination: "MG",
        start_date: new Date("2026-06-01"),
        end_date: new Date("2026-06-05"),
        min_people: 3,
        max_people: 4,
        pricings: [],
      },
    });
    mocks.reservationCount.mockResolvedValue(2);

    const res = await request(app).get("/public/tok123");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Faltam 1 pessoa/);
    expect(res.body.statusNow).toBe("pending_group");
    expect(res.body.reservationsCount).toBe(2);
    expect(res.body.remainingSeats).toBe(2);
    expect(res.body.minPricePerPerson).toBe(650);
  });

  it("GET /public/:token mensagem de grupo confirmado", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      adventure: {
        id: "adv1",
        name: "Trip",
        destination: "MG",
        start_date: new Date("2026-06-01"),
        end_date: new Date("2026-06-05"),
        min_people: 3,
        max_people: 6,
        pricings: [
          { people_count: 1, price_per_person: 1200 },
          { people_count: 2, price_per_person: 900 },
          { people_count: 3, price_per_person: 800 },
          { people_count: 5, price_per_person: 700 },
        ],
      },
    });
    mocks.pricingFindMany.mockResolvedValue([
      { people_count: 1, price_per_person: 1200 },
      { people_count: 2, price_per_person: 900 },
      { people_count: 3, price_per_person: 800 },
      { people_count: 5, price_per_person: 700 },
    ]);
    mocks.pricingFindFirst.mockResolvedValue({ price_per_person: 700, people_count: 5 });
    mocks.reservationCount.mockResolvedValue(3);

    const res = await request(app).get("/public/tok123");
    expect(res.status).toBe(200);
    expect(res.body.statusNow).toBe("confirmed");
    expect(res.body.bestPriceReached).toBe(false);
    expect(res.body.message).toMatch(/Saída confirmada/);
  });

  it("GET /public/:token mensagem de tarifa mínima atingida", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      adventure: {
        id: "adv1",
        name: "Trip",
        destination: "MG",
        start_date: new Date("2026-06-01"),
        end_date: new Date("2026-06-05"),
        min_people: 3,
        max_people: 6,
        pricings: [
          { people_count: 1, price_per_person: 1200 },
          { people_count: 2, price_per_person: 900 },
          { people_count: 3, price_per_person: 800 },
          { people_count: 5, price_per_person: 700 },
        ],
      },
    });
    mocks.pricingFindMany.mockResolvedValue([
      { people_count: 1, price_per_person: 1200 },
      { people_count: 2, price_per_person: 900 },
      { people_count: 3, price_per_person: 800 },
      { people_count: 5, price_per_person: 700 },
    ]);
    mocks.pricingFindFirst.mockResolvedValue({ price_per_person: 700, people_count: 5 });
    mocks.reservationCount.mockResolvedValue(5);

    const res = await request(app).get("/public/tok123");
    expect(res.status).toBe(200);
    expect(res.body.statusNow).toBe("confirmed");
    expect(res.body.bestPriceReached).toBe(true);
    expect(res.body.message).toMatch(/Tarifa mínima atingida/);
  });
});
