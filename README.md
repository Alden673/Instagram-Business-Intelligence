# Instagram Business Intelligence AI Agent

A customer-facing marketing assistant for small businesses. Upload Instagram analytics in CSV/JSON format or start with demo data to see calculated reach, engagement, format performance, top posts, trends, evidence-based recommendations, and a seven-day content plan.

## Local setup

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/instagram-intelligence run dev
```

The workspace workflows start both services with the correct preview routing. The built-in demo is intentionally available without external credentials. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` only when enabling a hosted Gemini adapter.

## Data format

Use `sample-instagram-data.csv` as a reference. JSON uploads should contain `{ "posts": [...] }` with the same fields: `id`, `date`, `caption`, `contentType`, `reach`, `likes`, `comments`, `saves`, `shares`, and `engagementRate`.

## Agent architecture

The API separates account analysis, content-type analysis, top-post discovery, trend analysis, recommendations, content planning, period comparison, and marketing-knowledge retrieval. The question endpoint selects the relevant tools from the question and returns only the user-safe activity summary and citations; it does not expose private reasoning. `knowledge/` is the local RAG source used for responsible recommendation context.

## Cloud Run

Build and deploy the frontend image from the repository root after configuring a Cloud Run service:

```bash
docker build -f artifacts/instagram-intelligence/Dockerfile -t instagram-intelligence .
docker run -p 8080:8080 instagram-intelligence
```

For a production deployment, serve the API behind the same domain or configure the API service's `/api` route in the Cloud Run ingress.