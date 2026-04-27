import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adventure = await prisma.adventure.create({
    data: {
      name: "Juntos na Aventura — Serra & Cachoeiras",
      destination: "Serra do Cipó, MG",
      start_date: new Date("2026-06-10T12:00:00.000Z"),
      end_date: new Date("2026-06-14T12:00:00.000Z"),
      min_people: 3,
      max_people: 4,
      pricings: {
        create: [
          { people_count: 1, price_per_person: 1200 },
          { people_count: 2, price_per_person: 900 },
          { people_count: 3, price_per_person: 750 },
          { people_count: 4, price_per_person: 650 }, // menor tarifa (melhor preço)
        ],
      },
    },
    include: { pricings: true },
  });

  console.log("Seeded adventure:", adventure.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });