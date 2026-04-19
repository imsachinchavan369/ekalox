# EKALOX Mobile-First Marketplace Scaffold

This repository contains a **clean, upgrade-friendly project scaffold** for building EKALOX as a mobile-first marketplace web app.

It intentionally includes only the essentials so you can grow the codebase without early complexity.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Folder Structure

```txt
.
├── app/                # App Router entry, global layout, home page
├── components/         # Reusable UI components shared across features
├── db/                 # Database config and migration placeholder files
├── docs/               # Architecture and team-facing project notes
├── features/           # Domain modules (auth, marketplace, profile, etc.)
├── lib/                # Shared utilities, constants, and helper functions
├── public/             # Static assets (images, icons, manifest, etc.)
├── styles/             # Global style tokens and Tailwind entry css
├── types/              # Shared TypeScript types/interfaces
└── ...root config files
```

## Getting Started

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Notes for Beginners

- Put route-level UI in `app/`.
- Put business/domain logic in `features/`.
- Put generic reusable UI in `components/`.
- Keep `lib/` for shared helpers and config, not feature-specific logic.
- Keep `types/` as your single source for shared TypeScript models.

## Upgrade-Friendly Principles Used

- Domain-first separation (`features`) + framework entrypoint separation (`app`)
- Minimal root configuration
- Explicit placeholders for docs, db, and shared types
- No premature abstractions or hidden magic
