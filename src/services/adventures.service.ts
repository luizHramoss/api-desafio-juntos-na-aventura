import { prisma } from "../prisma";

export async function listAdventures() {
  const adventures = await prisma.adventure.findMany({
    include: {
      pricings: { orderBy: { people_count: "asc" } },
      _count: { select: { reservations: true } },
    },
    orderBy: { start_date: "asc" },
  });

  return adventures.map((adventure) => {
    const minPricing = adventure.pricings.reduce((acc, curr) =>
      curr.price_per_person < acc.price_per_person ? curr : acc
    );
    const fromPricing = adventure.pricings.reduce((acc, curr) =>
      curr.people_count < acc.people_count ? curr : acc
    );

    return {
      ...adventure,
      reservations_count: adventure._count.reservations,
      reservationsCount: adventure._count.reservations,
      min_price_per_person: minPricing.price_per_person,
      minPricePerPerson: minPricing.price_per_person,
      from_price_per_person: fromPricing.price_per_person,
      fromPricePerPerson: fromPricing.price_per_person,
    };
  });
}

export async function getAdventureById(adventureId: string) {
  if (!adventureId?.trim()) throw new Error("Adventure id is required");

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    include: {
      pricings: { orderBy: { people_count: "asc" } },
    },
  });

  if (!adventure) throw new Error("Adventure not found");
  return adventure;
}