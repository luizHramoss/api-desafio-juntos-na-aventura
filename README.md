## Juntos na Aventura (MVP)

### Requisitos
- Node 20+
- Docker (opcional, para Postgres)

### Subir Postgres (Docker)
docker compose up -d

### Backend
cd backend
npm i
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

### Frontend
cd ../frontend
npm i
npm run dev

### Observações
- Defina NEXT_PUBLIC_ADVENTURE_ID com o ID impresso pelo seed.
- Regras:
  - status começa pending_group
  - ao atingir min_people, todas reservas passam para confirmed
  - depósito = 20% da menor tarifa (price_per_person mínima)
  - /join/[token] mostra detalhes e preço dinâmico por faixa (1..4)