# Instagram Business Intelligence

Signal/Social turns Instagram analytics uploads into actionable performance insights, recommendations, and a seven-day content plan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/instagram-intelligence run dev` — run the customer-facing dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/instagram-intelligence/src` — dashboard shell, pages, chart components, and upload flows
- `artifacts/api-server/src/routes/instagram.ts` — analytics, recommendations, planner, and question-routing API
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and validation
- `knowledge/` — local marketing strategy context for responsible recommendations
- `sample-instagram-data.csv` — ready-to-upload example export

## Architecture decisions

- Analytics is calculated from the uploaded account's own posts; the demo uses the same pipeline as uploads.
- The agent returns user-safe tool activity and citations rather than exposing chain-of-thought.
- The API remains useful without a Gemini credential; a hosted Gemini/ADK adapter can be enabled through the environment contract in `.env.example`.
- The frontend uses the generated client from the shared OpenAPI contract, not handwritten fetch types.

## Product

The dashboard supports demo mode, CSV/JSON upload, metric summaries, trend and format analysis, top and underperforming post views, evidence-based recommendations, assistant Q&A with visible tool selection, and a generated seven-day planner.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
