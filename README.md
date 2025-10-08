# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Convex Setup Guide

This project uses [Convex](https://www.convex.dev/) as the backend database service to manage chess games, user profiles, and real-time game state. Follow these steps to set up Convex in your development environment:

### Prerequisites

- Node.js 16+
- npm, yarn, pnpm, or bun
- A Convex account (create one at [dashboard.convex.dev](https://dashboard.convex.dev))

### 1. Install Convex CLI

```bash
npm install -g convex
```

### 2. Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```
GOOGLE_CLIENT_ID=your-google-client-id
CONVEX_URL=your-convex-deployment-url
CONVEX_HTTP=your-convex-http-url
NUXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
```

> **Note**: You can obtain your `CONVEX_URL` and `CONVEX_HTTP` from the Convex dashboard after creating a project.

### 3. Initialize Convex (First-time setup only)

If you're setting up a new Convex project:

```bash
npx convex init
```

This creates a `convex/` directory with necessary configuration files.

### 4. Development Workflow

Start the Convex development server alongside your Nuxt app:

```bash
# Terminal 1: Start Convex dev server
npm run convex:dev

# Terminal 2: Start Nuxt dev server
npm run dev
```

### 5. Understanding the Convex Structure

- `convex/schema.ts`: Defines your database tables (profiles, games)
- `convex/_generated/`: Auto-generated TypeScript types for your schema
- `convex/profiles.ts`, `convex/games.ts`: Contains database queries and mutations

### 6. Deployment

Deploy your Convex functions to production:

```bash
npm run convex:deploy
```

### 7. Using Convex in the App

The project includes the `useConvex` composable for interacting with Convex:

```typescript
// Example usage
const { getGame, makeMove, subscribeToGame } = useConvex()

// Get a game
const game = await getGame('game-id-123')

// Make a move
await makeMove('game-id-123', 'e2e4', 'player-id-123')

// Subscribe to real-time updates
subscribeToGame('game-id-123', (updatedGame) => {
  console.log('Game updated:', updatedGame)
})
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
