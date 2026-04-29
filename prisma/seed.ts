import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adventures = [
    {
      name: "Juntos na Aventura — Serra & Cachoeiras",
      destination: "Serra do Cipó, MG",
      start_date: new Date("2026-06-10T12:00:00.000Z"),
      end_date: new Date("2026-06-14T12:00:00.000Z"),
    },
    {
      name: "Juntos na Aventura — Chapada dos Veadeiros",
      destination: "Alto Paraíso, GO",
      start_date: new Date("2026-07-05T12:00:00.000Z"),
      end_date: new Date("2026-07-10T12:00:00.000Z"),
    },
    {
      name: "Juntos na Aventura — Jalapão Experience",
      destination: "Jalapão, TO",
      start_date: new Date("2026-08-12T12:00:00.000Z"),
      end_date: new Date("2026-08-18T12:00:00.000Z"),
    },
    {
      name: "Juntos na Aventura — Lençóis Maranhenses",
      destination: "Barreirinhas, MA",
      start_date: new Date("2026-09-03T12:00:00.000Z"),
      end_date: new Date("2026-09-08T12:00:00.000Z"),
    },
    {
      name: "Juntos na Aventura — Praia & Trilhas",
      destination: "Ilhabela, SP",
      start_date: new Date("2026-10-15T12:00:00.000Z"),
      end_date: new Date("2026-10-20T12:00:00.000Z"),
    },
    {
      name: "Juntos na Aventura — Expedição Amazônia",
      destination: "Manaus, AM",
      start_date: new Date("2026-11-07T12:00:00.000Z"),
      end_date: new Date("2026-11-14T12:00:00.000Z"),
    },
  ];

  for (const adventureData of adventures) {
    const adventure = await prisma.adventure.create({
      data: {
        ...adventureData,
        min_people: 3,
        max_people: 4,
        pricings: {
          create: [
            { people_count: 1, price_per_person: 4000 },
            { people_count: 2, price_per_person: 3200 },
            { people_count: 3, price_per_person: 2700 },
            { people_count: 4, price_per_person: 2300 },
          ],
        },
      },
      include: { pricings: true },
    });

    console.log("Seeded adventure:", adventure.id, "-", adventure.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });