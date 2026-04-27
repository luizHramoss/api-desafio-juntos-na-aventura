import { prisma } from "../prisma";
import { getBestTierPeopleCount, getCurrentPricePerPerson } from "./pricing.service";

export async function getPublicDataByToken(token: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { share_token: token },
    include: { adventure: { include: { pricings: true } } },
  });
  if (!reservation) throw new Error("Invalid token");

  const adventure = reservation.adventure;
  const reservationsCount = await prisma.reservation.count({ where: { adventure_id: adventure.id } });

  const currentPricePerPerson = await getCurrentPricePerPerson(adventure.id, reservationsCount);
  const bestTier = await getBestTierPeopleCount(adventure.id);

  let message: string;
  if (reservationsCount < adventure.min_people) {
    message = `Faltam ${adventure.min_people - reservationsCount} pessoa(s) para confirmar o grupo.`;
  } else {
    message = "Grupo confirmado!";
  }

  const bestPriceReached = reservationsCount >= bestTier;

  return {
    adventure: {
      id: adventure.id,
      name: adventure.name,
      destination: adventure.destination,
      start_date: adventure.start_date,
      end_date: adventure.end_date,
      min_people: adventure.min_people,
      max_people: adventure.max_people,
    },
    reservationsCount,
    currentPricePerPerson,
    message,
    bestPriceReached,
    statusNow: reservationsCount >= adventure.min_people ? "confirmed" : "pending_group",
  };
}