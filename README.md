# World Wise Scholar - TypeScript Init Notes

- To start the existing JS server:

```bash
pnpm install
pnpm start
```

- To run in TypeScript dev mode (ts-node-dev):

```bash
pnpm install
pnpm run dev
```

- To build TypeScript (no code converted yet, `src/index.ts` bootstraps existing `index.js`):

```bash
pnpm run build
pnpm start
```

Environment: copy `.env.example` to `.env` and set values.

Notes:
- I added `tsconfig.json`, `src/index.ts`, and updated `package.json` with dev deps and scripts to allow gradual migration.
- The `src/index.ts` simply imports your existing `index.js` so the server continues working while you migrate files to `src/*.ts`.

Next steps I can help with:
- Convert `index.js` to `src/index.ts` and fix any typing issues.
- Install the dev dependencies for you (`pnpm install`).
