# Skinfolio

Personal **skincare coach + journal** — brand-neutral guidance grounded in *your* profile, shelf, and constraints. Habit loops over diagnose-from-selfie theater. No paywalls in this MVP.

> Not a doctor. Not a diagnosis. See `/disclaimer`.

## Features (MVP)

- **Auth** — Auth.js (NextAuth v5) email + password; Prisma user model
- **Onboarding** — disclaimer + skin profile / constraints (persisted)
- **Home** — today’s AM/PM status, coach & journal CTAs, Skinfolio brand
- **Routine** — shelf CRUD, AM/PM checklist, templates, clash hints
- **Journal** — notes + tags + optional photo upload
- **Chat** — server-side AI coach with profile/shelf/journal context; offline fallback without `OPENAI_API_KEY`
- **Product check** — paste name/INCI vs profile (allergies, pregnancy gate)
- Mobile-first bottom nav: Home / Routine / Journal / Chat

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js App Router + TypeScript |
| Auth | Auth.js (`next-auth` v5) |
| DB | Prisma — **SQLite** local/dev; **Postgres** for production |
| AI | OpenAI API (optional) |
| Hosting | Vercel + managed Postgres recommended |

## Setup

### 1. Clone & install

```bash
git clone https://github.com/Gourav-praneeth/Skinfolio.git
cd Skinfolio
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Default `file:./dev.db` (SQLite) |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_URL` | Yes | e.g. `http://localhost:3000` |
| `OPENAI_API_KEY` | No | Chat works in offline mode without it |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |

### 3. Database

```bash
npx prisma db push
# or: npm run db:migrate
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Register → Onboarding → Routine.

### 5. Production build

```bash
npm run build
npm start
```

## Postgres (production)

1. In `prisma/schema.prisma`, change the datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Set `DATABASE_URL` to your Postgres connection string.
3. Run `npx prisma migrate deploy` (or `db push` for early testing).

SQLite remains the documented local/dev default so `npm run build` and day-one testing need no hosted DB.

## Journal photos

MVP stores files under `uploads/journal/<userId>/` and serves them privately via `/api/journal/photo`. See [`uploads/README.md`](./uploads/README.md) for wiring Vercel Blob / S3.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Set env: `DATABASE_URL` (Postgres), `AUTH_SECRET`, `AUTH_URL` (your domain), optional `OPENAI_API_KEY`.
3. Switch Prisma provider to `postgresql` as above.
4. Build command: `prisma generate && prisma migrate deploy && next build` (or `db push` if you skip migrations early).
5. For durable journal photos, add Blob/S3 — local disk is ephemeral on serverless.

## Safety

- Persistent “not a doctor” disclaimer
- Pregnancy / nursing gate for retinoids & related actives in coach + product check
- Medical red-flag language redirects to clinician care
- No monetization / paywall UI

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Prisma generate + Next production build |
| `npm run db:push` | Sync schema (dev) |
| `npm run db:studio` | Prisma Studio |

## Positioning

Brand-neutral literacy + habit/tracking + honest uncertainty — not a brand scanner, not a vanity skin-age score.
