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
  const tiers = await prisma.pricing.findMany({
    where: { adventure_id },
    orderBy: { people_count: "asc" },
  });
  if (tiers.length === 0) throw new Error("Pricing not found");

  // fallback seguro: abaixo da menor faixa usa a menor, acima da maior usa a maior
  const normalizedPeopleCount = Math.max(reservationsCount, tiers[0].people_count);
  const matchedTier = tiers.find((tier) => tier.people_count === normalizedPeopleCount);
  if (matchedTier) return matchedTier.price_per_person;

  return tiers[tiers.length - 1].price_per_person;
}

export async function getBestTierPeopleCount(adventure_id: string) {
  const best = await prisma.pricing.findFirst({
    where: { adventure_id },
    orderBy: { price_per_person: "asc" },
  });
  if (!best) throw new Error("Pricing not found");
  return best.people_count; // ex: 4
}