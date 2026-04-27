import { beforeEach, describe, expect, it, vi } from "vitest";
import { createReservation } from "./reservations.service";

const mocks = vi.hoisted(() => ({
  adventureFindUnique: vi.fn(),
  reservationCount: vi.fn(),
  reservationCreate: vi.fn(),
  reservationUpdateMany: vi.fn(),
  pricingFindFirst: vi.fn(),
}));

vi.mock("../prisma", () => ({
  prisma: {
    adventure: { findUnique: mocks.adventureFindUnique },
    reservation: {
      count: mocks.reservationCount,
      create: mocks.reservationCreate,
      updateMany: mocks.reservationUpdateMany,
    },
    pricing: { findFirst: mocks.pricingFindFirst },
  },
}));

const baseAdventure = {
  id: "adv1",
  max_people: 4,
  min_people: 3,
};

describe("createReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pricingFindFirst.mockResolvedValue({ price_per_person: 500 });
  });

  it("lança se aventura não existir", async () => {
    mocks.adventureFindUnique.mockResolvedValue(null);
    await expect(
      createReservation({
        adventure_id: "x",
        name: "Ana",
        email: "a@b.com",
        whatsapp: "5511999999999",
      }),
    ).rejects.toThrow("Adventure not found");
  });

  it("lança se grupo estiver cheio", async () => {
    mocks.adventureFindUnique.mockResolvedValue(baseAdventure);
    mocks.reservationCount.mockResolvedValue(4);
    await expect(
      createReservation({
        adventure_id: "adv1",
        name: "Ana",
        email: "a@b.com",
        whatsapp: "5511999999999",
      }),
    ).rejects.toThrow("Adventure is full");
  });

  it("cria reserva e calcula depósito (20% da menor tarifa)", async () => {
    mocks.adventureFindUnique.mockResolvedValue(baseAdventure);
    mocks.reservationCount.mockResolvedValue(0);
    mocks.reservationCreate.mockResolvedValue({
      id: "res1",
      adventure_id: "adv1",
      share_token: "tok1",
      status: "pending_group",
    });

    const prev = process.env.PUBLIC_BASE_URL;
    process.env.PUBLIC_BASE_URL = "http://api.test";

    const out = await createReservation({
      adventure_id: "adv1",
      name: "Ana",
      email: "a@b.com",
      whatsapp: "5511999999999",
    });

    if (prev === undefined) delete process.env.PUBLIC_BASE_URL;
    else process.env.PUBLIC_BASE_URL = prev;

    expect(mocks.pricingFindFirst).toHaveBeenCalled();
    expect(out.deposit).toBe(100);
    expect(out.share_url).toBe("http://api.test/join/tok1");
    expect(mocks.reservationUpdateMany).not.toHaveBeenCalled();
  });

  it("confirma grupo quando atinge min_people", async () => {
    mocks.adventureFindUnique.mockResolvedValue(baseAdventure);
    mocks.reservationCount.mockResolvedValue(2);
    mocks.reservationCreate.mockResolvedValue({
      id: "res1",
      adventure_id: "adv1",
      share_token: "tok1",
      status: "pending_group",
    });

    await createReservation({
      adventure_id: "adv1",
      name: "Ana",
      email: "a@b.com",
      whatsapp: "5511999999999",
    });

    expect(mocks.reservationUpdateMany).toHaveBeenCalledWith({
      where: { adventure_id: "adv1", status: "pending_group" },
      data: { status: "confirmed" },
    });
  });

  it("retenta em colisão P2002 de share_token", async () => {
    mocks.adventureFindUnique.mockResolvedValue(baseAdventure);
    mocks.reservationCount.mockResolvedValue(0);
    const err = { code: "P2002" };
    mocks.reservationCreate
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({
        id: "res1",
        adventure_id: "adv1",
        share_token: "tok2",
        status: "pending_group",
      });

    const out = await createReservation({
      adventure_id: "adv1",
      name: "Ana",
      email: "a@b.com",
      whatsapp: "5511999999999",
    });

    expect(mocks.reservationCreate).toHaveBeenCalledTimes(2);
    expect(out.reservation.share_token).toBe("tok2");
  });
});
