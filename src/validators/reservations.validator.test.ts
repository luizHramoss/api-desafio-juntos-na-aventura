import { describe, expect, it } from "vitest";
import { validateCreateReservation } from "./reservations.validator";

describe("validateCreateReservation", () => {
  it("aceita payload válido", () => {
    const r = validateCreateReservation({
      adventure_id: "adv_1",
      name: "Ana",
      email: "ana@example.com",
      whatsapp: "5511999999999",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({
        adventure_id: "adv_1",
        name: "Ana",
        email: "ana@example.com",
        whatsapp: "5511999999999",
      });
    }
  });

  it("rejeita adventure_id vazio", () => {
    const r = validateCreateReservation({
      adventure_id: "   ",
      name: "Ana",
      email: "a@b.com",
      whatsapp: "12345678",
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("adventure_id is required");
  });

  it("rejeita nome curto", () => {
    const r = validateCreateReservation({
      adventure_id: "x",
      name: "A",
      email: "a@b.com",
      whatsapp: "12345678",
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("name is required");
  });

  it("rejeita email sem @", () => {
    const r = validateCreateReservation({
      adventure_id: "x",
      name: "Ana",
      email: "invalid",
      whatsapp: "12345678",
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("email is invalid");
  });

  it("rejeita whatsapp curto", () => {
    const r = validateCreateReservation({
      adventure_id: "x",
      name: "Ana",
      email: "a@b.com",
      whatsapp: "1234567",
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("whatsapp is required");
  });

  it("faz trim nos campos", () => {
    const r = validateCreateReservation({
      adventure_id: "  id1  ",
      name: "  Bo  ",
      email: "  x@y.com ",
      whatsapp: " 5511999887766 ",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data?.adventure_id).toBe("id1");
      expect(r.data?.name).toBe("Bo");
      expect(r.data?.email).toBe("x@y.com");
      expect(r.data?.whatsapp).toBe("5511999887766");
    }
  });
});
