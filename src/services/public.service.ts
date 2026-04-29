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
  const minPriceTier = adventure.pricings.reduce((acc, curr) =>
    curr.price_per_person < acc.price_per_person ? curr : acc
  );
  const minPricePerPerson = minPriceTier.price_per_person;
  const bestTier = await getBestTierPeopleCount(adventure.id);
  const missingToConfirm = Math.max(0, adventure.min_people - reservationsCount);
  const remainingSeats = Math.max(0, adventure.max_people - reservationsCount);
  const statusNow = reservationsCount >= adventure.min_people ? "confirmed" : "pending_group";
  const bestPriceReached = reservationsCount >= bestTier || currentPricePerPerson <= minPricePerPerson;

  let message: string;
  if (statusNow === "pending_group") {
    message = `Faltam ${missingToConfirm} pessoa(s) para confirmar o grupo.`;
  } else if (!bestPriceReached) {
    message = "Saída confirmada! Convide mais pessoas para reduzir ainda mais a tarifa.";
  } else {
    message = "Tarifa mínima atingida! O melhor preço já está garantido para o grupo.";
  }

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
    reservations_count: reservationsCount,
    currentPricePerPerson,
    current_price_per_person: currentPricePerPerson,
    minPricePerPerson,
    min_price_per_person: minPricePerPerson,
    missingToConfirm,
    missing_to_confirm: missingToConfirm,
    remainingSeats,
    remaining_seats: remainingSeats,
    message,
    bestPriceReached,
    best_price_reached: bestPriceReached,
    statusNow,
    status_now: statusNow,
  };
}