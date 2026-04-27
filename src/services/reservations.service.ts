import { prisma } from "../prisma";
import crypto from "crypto";
import { getMinPricePerPerson } from "./pricing.service";

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
  const adventure = await prisma.adventure.findUnique({ where: { id: input.adventure_id } });
  if (!adventure) throw new Error("Adventure not found");

  const currentCount = await prisma.reservation.count({ where: { adventure_id: adventure.id } });
  if (currentCount >= adventure.max_people) throw new Error("Adventure is full");

  const minPrice = await getMinPricePerPerson(adventure.id);
  const deposit = Math.round(minPrice * 0.2); // 20% da menor tarifa (por pessoa)

  // cria reserva + token único (retry simples)
  for (let i = 0; i < 5; i++) {
    const token = newToken();
    try {
      const reservation = await prisma.reservation.create({
        data: {
          adventure_id: adventure.id,
          name: input.name,
          email: input.email,
          whatsapp: input.whatsapp,
          status: "pending_group",
          share_token: token,
        },
      });

      // auto-confirmar ao atingir min_people
      const afterCount = currentCount + 1;
      if (afterCount >= adventure.min_people) {
        await prisma.reservation.updateMany({
          where: { adventure_id: adventure.id, status: "pending_group" },
          data: { status: "confirmed" },
        });
      }

      return {
        reservation,
        deposit,
        share_url: `${process.env.PUBLIC_BASE_URL ?? "http://localhost:3000"}/join/${reservation.share_token}`,
      };
    } catch (e: any) {
      // colisão de share_token => tenta de novo
      if (String(e?.code) === "P2002") continue;
      throw e;
    }
  }

  throw new Error("Could not generate unique share_token");
}