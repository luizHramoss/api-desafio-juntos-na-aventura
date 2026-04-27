import { prisma } from "../prisma";

export async function getMinPricePerPerson(adventure_id: string) {
  const min = await prisma.pricing.findFirst({
    where: { adventure_id },
    orderBy: { price_per_person: "asc" },
  });
  if (!min) throw new Error("Pricing not found");
  return min.price_per_person;
}

export async function getCurrentPricePerPerson(adventure_id: string, reservationsCount: number) {
  // faixa: 1..4; se passar de 4, trava em 4 (mas max_people também deve impedir)
  const peopleCount = Math.min(Math.max(reservationsCount, 1), 4);

  const pricing = await prisma.pricing.findUnique({
    where: { adventure_id_people_count: { adventure_id, people_count: peopleCount } },
  });
  if (!pricing) throw new Error("Pricing not found for people_count");
  return pricing.price_per_person;
}

export async function getBestTierPeopleCount(adventure_id: string) {
  const best = await prisma.pricing.findFirst({
    where: { adventure_id },
    orderBy: { price_per_person: "asc" },
  });
  if (!best) throw new Error("Pricing not found");
  return best.people_count; // ex: 4
}