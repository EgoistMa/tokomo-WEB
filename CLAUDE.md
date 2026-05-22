# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript compile + Vite bundle (outputs to ./dist)
npm run lint         # ESLint check
npm run preview      # Build + local preview
npm run cf-typegen   # Regenerate Cloudflare Worker environment types
npm run build && wrangler deploy  # Deploy to Cloudflare
```

There are no tests configured in this project.

## Architecture

**TOKOMO** is a game browsing/management platform. The frontend is a React 19 + TypeScript SPA built with Vite, deployed as a Cloudflare Worker that serves static assets from `./dist` with SPA fallback routing.

All business logic lives in the frontend — the Cloudflare Worker (`worker/index.ts`) is a minimal stub that returns "OK". The real API is the external backend at `https://devapi.tokomoapp.org/api` (configurable via `VITE_API_BASE_URL` env var, also set in `wrangler.jsonc` as `vars.API_BASE_URL`).

### Key source layout

- `src/lib/auth.tsx` — `AuthContext` + `useAuth` hook; stores JWT token in `localStorage`, wraps the entire app
- `src/lib/api-types.ts` — All TypeScript interfaces for API request/response shapes; reference this before adding new API calls
- `src/pages/` — Route-level pages; admin pages live under `src/pages/admin/`
- `src/layouts/` — `RootLayout` (nav + auth guard) and `AdminLayout` (admin sidebar)
- `src/components/ui/` — shadcn-style Radix UI wrappers (Button, Dialog, Table, etc.)

### Routing

Routes are defined in `src/App.tsx` using React Router 7. The admin section (`/admin/*`) is nested under `AdminLayout`. Public routes (login, register, password reset) bypass the auth guard in `RootLayout`.

### Authentication flow

`AuthContext` reads/writes a JWT token from `localStorage`. API calls include the token as a `Bearer` header. The `useAuth()` hook exposes `user`, `token`, `login()`, `logout()`, and `isAdmin` — use it rather than reading localStorage directly.

### Styling

TailwindCSS 4 with dark mode via CSS class strategy. CSS variables for theme tokens are defined in `src/index.css`. The `@` alias maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Admin features

The admin panel (`src/pages/admin/`) covers: dashboard stats, user management, game CRUD (with image upload and Excel export via `xlsx`), payment codes, VIP codes, and group management. Game export uses the `xlsx` library to generate downloadable spreadsheets.
