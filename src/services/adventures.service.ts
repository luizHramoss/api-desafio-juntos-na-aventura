import { prisma } from "../prisma";

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