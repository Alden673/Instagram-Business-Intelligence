# Instagram Business Intelligence AI Agent

An AI-powered Instagram analytics and content strategy assistant designed for small businesses and creators.

The application analyzes Instagram post data and combines calculated performance metrics with Gemini-powered reasoning to help users understand what is working, why it is working, and what content they should create next.

## 🚀 Features

- 📊 Instagram performance analytics
- 📈 Reach and engagement analysis
- 🏆 Top-performing post identification
- 🎯 Content-format performance comparison
- 📅 Content trend analysis
- 🤖 Gemini-powered AI analysis
- 💬 Natural-language chat with the Instagram AI agent
- 🧠 Strategy knowledge/RAG support
- 💡 Evidence-based content recommendations
- 🗓️ Seven-day content planning
- 📁 CSV-based Instagram data input
- 🧪 Demo/sample Instagram dataset
- 🔐 Environment-variable based API key configuration

---

## 🖥️ What the Application Does

The application accepts Instagram analytics data and turns it into actionable business insights.

A typical workflow is:

```text
Instagram Analytics Data
          ↓
     Data Processing
          ↓
 Performance Metrics
          ↓
   Strategy Knowledge
          ↓
    Gemini AI Agent
          ↓
 Business Recommendations
          ↓
 Content Strategy / 7-Day Plan
```

Users can also ask questions through the AI chat interface, for example:

> "Which type of content is performing best?"

> "What signals should I prioritize when evaluating content performance?"

> "What should I post next week?"

The AI agent uses the available Instagram data and the project's content strategy knowledge to generate the response.

---

## 🛠️ Technology Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- TypeScript
- Express
- REST API

### AI

- Google Gemini
- Google Agent Development Kit (ADK)
- Retrieval-Augmented Generation (RAG) / strategy knowledge

### Package Management

- pnpm

---

## 📂 Project Structure

```text
Instagram-Business-Intelligence/
│
├── artifacts/
│   │
│   ├── api-server/
│   │   └── src/
│   │       ├── agents/
│   │       │   └── instagram-adk-agent.ts
│   │       │
│   │       ├── lib/
│   │       │   └── gemini.ts
│   │       │
│   │       ├── routes/
│   │       │   └── instagram.ts
│   │       │
│   │       └── index.ts
│   │
│   └── instagram-intelligence/
│       └── src/
│           └── pages/
│               └── settings.tsx
│
├── knowledge/
│   └── Instagram strategy knowledge
│
├── sample-instagram-data.csv
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

# ⚙️ Local Setup

## 1. Requirements

Install the following:

- Node.js
- pnpm
- Git

Optional:

- Google Gemini API key

---

## 2. Clone the Repository

```bash
git clone https://github.com/Alden673/Instagram-Business-Intelligence.git
cd Instagram-Business-Intelligence
```

---

## 3. Install Dependencies

```bash
pnpm install
```

---

## 4. Configure Environment Variables

Create a `.env` file in the project root.

You can start from the example file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Important:** Never commit your real `.env` file or API keys to GitHub.

The repository's `.gitignore` excludes `.env`.

---

# ▶️ Running the Application

## Start the Backend

From the project root:

```bash
pnpm --filter @workspace/api-server run dev
```

The API server runs locally and provides the Instagram analysis endpoints.

---

## Start the Frontend

Open another terminal in the project root:

```bash
pnpm --filter @workspace/instagram-intelligence run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

Open that address in your browser.

---

# 🤖 Gemini AI Integration

The application uses Google Gemini for AI-powered Instagram analysis.

The backend sends relevant Instagram information and strategy context to the Gemini model, which produces business-focused recommendations.

The AI layer is responsible for tasks such as:

- Interpreting Instagram performance
- Identifying useful performance signals
- Explaining trends
- Comparing content formats
- Generating recommendations
- Answering natural-language questions
- Creating content strategy suggestions

The Gemini API key is loaded from the environment:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

# 🧠 AI Agent

The project includes an Instagram-focused AI agent:

```text
artifacts/api-server/src/agents/instagram-adk-agent.ts
```

The agent provides a conversational interface for Instagram business intelligence.

It can combine:

1. Instagram analytics
2. Content performance information
3. Strategy knowledge
4. User questions
5. Gemini reasoning

to generate useful recommendations.

---

# 📊 Instagram Data

The repository includes a sample dataset:

```text
sample-instagram-data.csv
```

This allows the application to be demonstrated without requiring a real Instagram account or private Instagram credentials.

The application can use Instagram analytics data containing information such as:

- Post date
- Caption
- Content type
- Reach
- Likes
- Comments
- Saves
- Shares
- Other engagement-related metrics

The exact fields depend on the supplied dataset.

---

# 💬 Example Questions

The AI assistant can answer questions such as:

```text
Which posts performed best?

Which content format gets the highest engagement?

What signals should I prioritize when evaluating content performance?

What type of content should I create more often?

What are the main trends in my Instagram performance?

Create a seven-day content plan based on my recent performance.
```

---

# 🔌 API

The Instagram backend routes are located at:

```text
artifacts/api-server/src/routes/instagram.ts
```

The backend exposes the application's Instagram analysis functionality to the frontend.

The frontend communicates with the backend through the application's API endpoints.

---

# 🔐 Security

API keys and other secrets should be stored in environment variables.

Example:

```env
GEMINI_API_KEY=your_key_here
```

Do **not** put API keys directly into source code.

The `.gitignore` file prevents the local `.env` file from being committed:

```text
.env
```

Before publishing the repository, verify that no real API keys or credentials are present in the Git history.

---

# 🧪 Demo Mode

The project includes sample Instagram data so the application can be demonstrated without connecting to a real Instagram account.

This makes it possible to:

- Test the dashboard
- Test analytics calculations
- Test AI recommendations
- Demonstrate the chat interface
- Present the project without exposing private Instagram credentials

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │   Instagram UI      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Backend API      │
                    │ Node.js / Fastify   │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │ Instagram Data  │         │ Strategy        │
        │ & Analytics     │         │ Knowledge / RAG │
        └────────┬────────┘         └────────┬────────┘
                 │                           │
                 └─────────────┬─────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Instagram AI      │
                    │       Agent         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Google Gemini     │
                    │   AI Reasoning      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Recommendations &   │
                    │ Content Strategy    │
                    └─────────────────────┘
```

---

# 🧩 Development

To check the backend TypeScript code:

```bash
pnpm --filter @workspace/api-server run typecheck
```

To build the backend:

```bash
pnpm --filter @workspace/api-server run build
```

---

# 🐳 Docker

Docker is **not required for the normal local development setup** described above.

If Docker-related configuration exists in the repository, it can be used for containerized deployment or future deployment workflows.

For local development, simply use:

```bash
pnpm install
```

followed by the frontend and backend development commands.

---

# ☁️ Cloud Deployment

The application is designed so that the backend can be deployed to a cloud environment in the future.

Cloud Run deployment is **not required for running the application locally**.

For a deployment, environment variables such as the Gemini API key should be configured through the deployment platform rather than committed to the repository.

---

# 🎯 Project Goal

The goal of Instagram Business Intelligence is to make Instagram analytics easier to understand for small businesses.

Instead of requiring a user to manually interpret large amounts of engagement data, the application combines analytics with AI reasoning to provide practical answers such as:

> What is working?

> Why is it working?

> What should I do next?

This turns raw Instagram analytics into actionable content strategy.

---

# 📌 Project Status

The application currently provides:

- Instagram analytics
- Performance insights
- AI-powered analysis
- Conversational Instagram assistant
- Strategy knowledge integration
- Sample data for demonstration
- Local frontend/backend development

Cloud deployment can be added separately when required.

---

## 👨‍💻 Author

**Alden673**

GitHub:

https://github.com/Alden673

---

## 📄 License

This project is intended for educational, hackathon, and demonstration purposes.
