import { prisma } from "../prisma";
import crypto from "crypto";

function newToken() {
  // curto, url-safe; colisão protegida por unique + retry
  return crypto.randomBytes(16).toString("base64url");
}

export async function createReservation(input: {
  adventure_id: string;
  name: string;
  email: string;
  whatsapp: string;
}) {
  // transação com retry para reduzir inconsistência sob concorrência
  for (let i = 0; i < 5; i += 1) {
    const token = newToken();
    try {
      const out = await prisma.$transaction(async (tx) => {
        const adventure = await tx.adventure.findUnique({
          where: { id: input.adventure_id },
        });
        if (!adventure) throw new Error("Adventure not found");

        const currentCount = await tx.reservation.count({
          where: { adventure_id: adventure.id },
        });
        if (currentCount >= adventure.max_people) throw new Error("Adventure is full");

        const minPricing = await tx.pricing.findFirst({
          where: { adventure_id: adventure.id },
          orderBy: { price_per_person: "asc" },
        });
        if (!minPricing) throw new Error("Pricing not found");

        const reservation = await tx.reservation.create({
          data: {
            adventure_id: adventure.id,
            name: input.name,
            email: input.email,
            whatsapp: input.whatsapp,
            status: "pending_group",
            share_token: token,
          },
        });

        const afterCount = currentCount + 1;
        if (afterCount >= adventure.min_people) {
          await tx.reservation.updateMany({
            where: { adventure_id: adventure.id, status: "pending_group" },
            data: { status: "confirmed" },
          });
        }

        return {
          reservation,
          deposit: Math.round(minPricing.price_per_person * 0.2),
        };
      });

      return {
        reservation: out.reservation,
        deposit: out.deposit,
        share_url: `${process.env.PUBLIC_BASE_URL ?? "http://localhost:3000"}/join/${out.reservation.share_token}`,
        shareUrl: `${process.env.PUBLIC_BASE_URL ?? "http://localhost:3000"}/join/${out.reservation.share_token}`,
      };
    } catch (e: any) {
      // colisão de token único/erro serializável => retry
      if (String(e?.code) === "P2002" || String(e?.code) === "P2034") continue;
      throw e;
    }
  }

  throw new Error("Could not generate unique share_token");
}