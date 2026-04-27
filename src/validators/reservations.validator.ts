export type CreateReservationInput = {
  adventure_id: string;
  name: string;
  email: string;
  whatsapp: string;
};

export function validateCreateReservation(body: any): {
  ok: boolean;
  data?: CreateReservationInput;
  error?: string;
} {
  const adventure_id = String(body?.adventure_id ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const whatsapp = String(body?.whatsapp ?? "").trim();

  if (!adventure_id) return { ok: false, error: "adventure_id is required" };
  if (name.length < 2) return { ok: false, error: "name is required" };
  if (!email.includes("@")) return { ok: false, error: "email is invalid" };
  if (whatsapp.length < 8) return { ok: false, error: "whatsapp is required" };

  return { ok: true, data: { adventure_id, name, email, whatsapp } };
}