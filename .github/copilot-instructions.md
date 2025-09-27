# Copilot Instructions for AI Agents

## Project Overview
- This is a Nuxt 3 (Vue 3) application using TypeScript and Tailwind CSS.
- The project structure follows Nuxt conventions: `pages/` for routes, `components/` for UI, `composables/` for reusable logic, and `server/` for API endpoints.
- The app appears to be a chess platform with authentication, matchmaking, and gameplay features.

## Key Architectural Patterns
- **Pages & Routing:**
  - Vue files in `pages/` are auto-routed by Nuxt. Nested folders (e.g., `login/index.vue`) create nested routes.
- **Components:**
  - UI elements are in `components/`. Example: `ChessArena.vue` for the chess board/arena.
- **Composables:**
  - Shared logic (e.g., authentication) is in `composables/` (see `useAuth.ts`).
- **Server API:**
  - API endpoints are in `server/api/`, organized by feature (e.g., `auth/`, `matches/`).
  - Use `.get.ts`/`.post.ts` for HTTP method separation.
- **State Management:**
  - Custom stores in `server/utils/` (e.g., `chessStore.ts`, `sessionStore.ts`, `userStore.ts`).
- **Middleware:**
  - Global auth middleware in `middleware/auth.global.ts` for route protection.

## Developer Workflows
- **Install dependencies:**
  - `npm install` (or `pnpm install`, `yarn install`, `bun install`)
- **Start dev server:**
  - `npm run dev` (or `pnpm dev`, `yarn dev`, `bun run dev`)
- **Build for production:**
  - `npm run build`
- **Preview production build:**
  - `npm run preview`

## Project-Specific Conventions
- **API endpoints:** Use RESTful naming and HTTP method files (`.get.ts`, `.post.ts`).
- **TypeScript:** All logic and API code should be written in TypeScript.
- **Tailwind CSS:** Styles are managed via `assets/css/tailwind.css` and `tailwind.config.ts`.
- **Authentication:**
  - Auth logic is in `composables/useAuth.ts` and `server/api/auth/`.
  - Session management via `server/utils/sessionStore.ts`.
- **Chess Logic:**
  - Core chess logic and state in `server/utils/chessStore.ts`.
  - Types for Stockfish in `types/stockfish.d.ts`.

## Integration Points
- **External Auth:** Google authentication via `server/api/auth/google.post.ts`.
- **Chess Engine:** Likely integrates with Stockfish (see `types/stockfish.d.ts`).

## Examples
- To add a new API route: create a `.get.ts` or `.post.ts` in `server/api/<feature>/`.
- To add a new page: add a `.vue` file in `pages/`.
- To add a new composable: add a `.ts` file in `composables/`.

## References
- Nuxt docs: https://nuxt.com/docs/getting-started/introduction
- Tailwind docs: https://tailwindcss.com/docs/installation

---
If you are unsure about a pattern, check for similar examples in the relevant directory.
