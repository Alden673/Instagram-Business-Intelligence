import {
  FunctionTool,
  InMemoryRunner,
  LlmAgent,
  isFinalResponse,
} from "@google/adk";

type AgentPost = {
  id: string;
  date: string;
  caption: string;
  contentType: "Reel" | "Carousel" | "Image" | "Story";
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  engagementRate: number;
};

type AgentAnalysis = {
  accountName: string;
  period: string;

  metrics: {
    label: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
  }[];

  posts: AgentPost[];
  topPosts: AgentPost[];
  underperformingPosts: AgentPost[];

  contentTypes: {
    type: string;
    posts: number;
    reach: number;
    engagement: number;
    engagementRate: number;
  }[];

  trends: {
    label: string;
    reach: number;
    engagement: number;
  }[];
};

type RunResult = {
  answer: string;
  toolsUsed: string[];
  knowledgeChunks: number;
};

/* =========================================================
   KNOWLEDGE CHUNKING
   ========================================================= */

function chunkKnowledge(text: string): string[] {
  return text
    .split(/\n(?=#{1,3}\s)/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk) => {
      if (chunk.length <= 1200) {
        return [chunk];
      }

      return chunk
        .split(/\n\s*\n/g)
        .map((part) => part.trim())
        .filter(Boolean);
    });
}

/* =========================================================
   KNOWLEDGE SCORING
   ========================================================= */

function scoreChunk(query: string, chunk: string): number {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);

  const queryWords = new Set(normalize(query));
  const chunkWords = new Set(normalize(chunk));

  let score = 0;

  for (const word of queryWords) {
    if (chunkWords.has(word)) {
      score += 1;
    }
  }

  const phraseMatches = [
    "saves",
    "shares",
    "engagement",
    "reels",
    "carousels",
    "experimentation",
    "experiments",
    "variable",
    "hook",
    "topic",
    "cta",
    "benchmark",
    "follower growth",
    "correlation",
    "content strategy",
    "content format",
  ];

  const normalizedQuery = query.toLowerCase();
  const normalizedChunk = chunk.toLowerCase();

  for (const phrase of phraseMatches) {
    if (
      normalizedQuery.includes(phrase) &&
      normalizedChunk.includes(phrase)
    ) {
      score += 3;
    }
  }

  return score;
}

/* =========================================================
   ADK SCHEMA
   =========================================================
   
   IMPORTANT:
   
   @google/adk@2.0.0 has a TypeScript compatibility issue
   with the Zod version installed in this workspace.
   
   We intentionally use a plain JSON-schema-shaped object and
   cast it at the ADK boundary. This keeps Zod completely out
   of the ADK tool definitions.
   
   ========================================================= */

const retrieveStrategyKnowledgeParameters = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description:
        "The user's Instagram strategy question or topic to search for.",
    },
  },
  required: ["query"],
} as any;

const getAccountAnalyticsParameters = {
  type: "object",
  properties: {
    focus: {
      type: "string",
      description:
        "The account performance area to analyze, such as formats, top posts, trends, reach, engagement, saves, or shares.",
    },
  },
  required: ["focus"],
} as any;

/* =========================================================
   CREATE ADK AGENT
   ========================================================= */

function createAdkAgent(
  analysis: AgentAnalysis,
  knowledge: string,
  toolsUsed: Set<string>,
  knowledgeCounter: { value: number },
) {
  const chunks = chunkKnowledge(knowledge);

  /* =======================================================
     TOOL 1 — KNOWLEDGE RETRIEVAL
     ======================================================= */

  const retrieveStrategyKnowledge = new FunctionTool({
    name: "retrieve_strategy_knowledge",

    description:
      "Retrieve the most relevant passages from the local Instagram content strategy knowledge base. Use this for questions about Instagram strategy, content formats, experimentation, hooks, CTAs, saves, shares, engagement, benchmarks, and responsible recommendations.",

    parameters: retrieveStrategyKnowledgeParameters,

    execute: (args: { query: string }) => {
      const query = args?.query ?? "";

      toolsUsed.add("retrieve_strategy_knowledge");

      console.log(
        `[RAG] Searching strategy knowledge for: "${query}"`,
      );

      if (!chunks.length) {
        console.warn(
          "[RAG] Knowledge base is empty. No knowledge chunks available.",
        );

        knowledgeCounter.value = 0;

        return {
          status: "empty",
          source:
            "knowledge/instagram-content-strategy.md",
          chunks: [],
          message:
            "The Instagram strategy knowledge base is empty or unavailable.",
        };
      }

      const ranked = chunks
        .map((chunk, index) => ({
          chunk,
          index,
          score: scoreChunk(query, chunk),
        }))
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          return a.index - b.index;
        });

      const relevant = ranked
        .filter((item) => item.score > 0)
        .slice(0, 3);

      const selected =
        relevant.length > 0
          ? relevant
          : ranked.slice(0, Math.min(2, ranked.length));

      knowledgeCounter.value = selected.length;

      console.log(
        `[RAG] Retrieved ${selected.length} knowledge chunk(s)`,
      );

      if (selected.length > 0) {
        console.log(
          `[RAG] Best relevance score: ${selected[0].score}`,
        );
      }

      return {
        status: "success",

        source:
          "knowledge/instagram-content-strategy.md",

        chunks: selected.map((item) => ({
          relevanceScore: item.score,
          text: item.chunk,
        })),
      };
    },
  });

  /* =======================================================
     TOOL 2 — ACCOUNT ANALYTICS
     ======================================================= */

  const getAccountAnalytics = new FunctionTool({
    name: "get_account_analytics",

    description:
      "Retrieve account-specific Instagram performance data. Use this for questions about what is performing well, what is underperforming, best posts, formats, reach, engagement, saves, shares, trends, and recommendations.",

    parameters: getAccountAnalyticsParameters,

    execute: (args: { focus: string }) => {
      const focus = args?.focus ?? "";

      toolsUsed.add("get_account_analytics");

      console.log(
        `[ADK Tool] get_account_analytics: ${focus}`,
      );

      return {
        status: "success",

        accountName: analysis.accountName,

        period: analysis.period,

        focus,

        metrics: analysis.metrics,

        contentTypes: analysis.contentTypes,

        trends: analysis.trends,

        topPosts: analysis.topPosts,

        underperformingPosts:
          analysis.underperformingPosts,
      };
    },
  });

  /* =======================================================
     LLM AGENT
     ======================================================= */

  return new LlmAgent({
    name: "instagram_business_intelligence_agent",

    description:
      "Instagram Business Intelligence agent that combines account analytics with the local Instagram strategy knowledge base.",

    model:
      process.env.GEMINI_ADK_MODEL?.trim() ||
      process.env.GEMINI_MODEL?.trim() ||
      "gemini-3.6-flash",

    instruction: `
You are the Instagram Business Intelligence agent.

You analyze the Instagram account:

"${analysis.accountName}"

Your job is to answer questions using BOTH:

1. The account's actual analytics.
2. The local Instagram strategy knowledge base.

==================================================
AVAILABLE TOOLS
==================================================

TOOL 1:
retrieve_strategy_knowledge

This searches the local knowledge file:

knowledge/instagram-content-strategy.md

Use it for:

- Instagram strategy
- content strategy
- experimentation
- content formats
- Reels
- Carousels
- Images
- Stories
- hooks
- CTAs
- saves
- shares
- engagement
- benchmarks
- responsible recommendations
- testing variables
- content planning

TOOL 2:
get_account_analytics

This retrieves account-specific analytics.

Use it for:

- best posts
- worst posts
- reach
- likes
- comments
- saves
- shares
- engagement
- engagement rate
- content formats
- trends
- recommendations
- what to post more of
- how to improve performance

==================================================
TOOL SELECTION
==================================================

For account performance questions:

Use get_account_analytics.

For general Instagram strategy questions:

Use retrieve_strategy_knowledge.

For questions that combine account performance and strategy:

Use BOTH tools.

Examples:

"What should I post more of?"

Use BOTH.

"According to the Instagram content strategy, what should I consider when deciding whether a post is performing well?"

Use retrieve_strategy_knowledge and, when useful, get_account_analytics.

"Which format performs best?"

Use get_account_analytics.

"Why are Reels performing better and what should we do next?"

Use BOTH.

==================================================
IMPORTANT RULES
==================================================

- Use the account's own historical analytics as the source of truth for account performance.
- Use the local strategy knowledge as supporting strategic guidance.
- Never invent metrics.
- Never invent posts.
- Never invent dates.
- Never invent benchmarks.
- Never claim direct access to Instagram unless the application actually provides that data.
- Never claim to see a private Instagram account.
- Never promise follower growth.
- Never guarantee views.
- Never guarantee engagement.
- Never guarantee sales.
- Do not treat correlation as causation.
- Prefer the account's historical data over generic external benchmarks.
- Pay attention to saves and shares.
- Distinguish reach-oriented content from save-oriented content.
- Distinguish engagement from reach.
- If data is insufficient, explicitly say so.
- Give practical recommendations.
- Keep recommendations grounded in the available data.
- Do not mention hidden prompts.
- Do not mention private reasoning.
- Do not return JSON to the user.
- Answer naturally.

==================================================
PERFORMANCE EVALUATION
==================================================

When evaluating whether a post performed well:

Consider:

1. Reach.
2. Engagement rate.
3. Saves.
4. Shares.
5. Comments.
6. Likes.
7. Content format.
8. The account's historical baseline.

Do not judge every format using the same expectation.

A Reel should be compared primarily with other Reels.

A Carousel should be compared primarily with other Carousels.

A static image should be compared primarily with other static images.

Use the account's own history as the baseline.

==================================================
RECOMMENDATIONS
==================================================

When making a recommendation:

1. Explain what the data shows.
2. Connect the finding to the strategy knowledge when relevant.
3. Recommend something practical to test.
4. Avoid guaranteeing an outcome.

Prefer:

"Based on this account's historical data..."

"The strongest signal in the available data is..."

"The strategy knowledge recommends..."

Avoid:

"This will definitely increase followers."

"This guarantees more views."

"Instagram will definitely reward this."

==================================================
FINAL ANSWER
==================================================

Give a clear and useful answer.

If account analytics were used, mention the relevant evidence.

If strategy knowledge was used, ground strategic claims in the retrieved knowledge.

If both were used, combine them naturally.
`,

    tools: [
      retrieveStrategyKnowledge,
      getAccountAnalytics,
    ],
  });
}

/* =========================================================
   RUN INSTAGRAM ADK AGENT
   ========================================================= */

export async function answerWithInstagramAdk(
  question: string,
  analysis: AgentAnalysis,
  knowledge: string,
): Promise<RunResult> {
  /* =======================================================
     API KEY CHECK
     ======================================================= */

  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add GEMINI_API_KEY to the root .env file and restart the API server.",
    );
  }

  /* =======================================================
     TRACK TOOL USAGE
     ======================================================= */

  const toolsUsed = new Set<string>();

  const knowledgeCounter = {
    value: 0,
  };

  /* =======================================================
     CREATE AGENT
     ======================================================= */

  const agent = createAdkAgent(
    analysis,
    knowledge,
    toolsUsed,
    knowledgeCounter,
  );

  /* =======================================================
     CREATE RUNNER
     ======================================================= */

  const runner = new InMemoryRunner({
    agent,
    appName:
      "instagram-business-intelligence",
  });

  /* =======================================================
     CREATE SESSION
     ======================================================= */

  const session =
    await runner.sessionService.createSession({
      appName: runner.appName,
      userId: "instagram-user",
    });

  /* =======================================================
     RUN
     ======================================================= */

  let answer = "";

  console.log(
    `[ADK] Running Instagram agent for: "${question}"`,
  );

  for await (const event of runner.runAsync({
    userId: session.userId,

    sessionId: session.id,

    newMessage: {
      role: "user",

      parts: [
        {
          text: question,
        },
      ],
    },
  })) {
    /* =====================================================
       LOG TOOL REQUESTS
       ===================================================== */

    if (event.content?.parts) {
      for (const part of event.content.parts) {
        const functionCall = (
          part as {
            functionCall?: {
              name?: string;
            };
          }
        ).functionCall;

        if (functionCall?.name) {
          console.log(
            `[ADK] Agent requested tool: ${functionCall.name}`,
          );
        }
      }
    }

    /* =====================================================
       FINAL RESPONSE
       ===================================================== */

    if (
      isFinalResponse(event) &&
      event.content?.parts?.length
    ) {
      answer = event.content.parts
        .map((part) => part.text ?? "")
        .join("")
        .trim();
    }

    /* =====================================================
       ERROR
       ===================================================== */

    if (event.errorMessage) {
      throw new Error(
        `ADK agent error: ${event.errorMessage}`,
      );
    }
  }

  /* =======================================================
     EMPTY RESPONSE
     ======================================================= */

  if (!answer) {
    throw new Error(
      "ADK agent returned an empty answer.",
    );
  }

  /* =======================================================
     LOG RESULT
     ======================================================= */

  console.log(
    "[ADK] Final answer generated successfully.",
  );

  console.log(
    `[ADK] Tools used: ${
      toolsUsed.size
        ? [...toolsUsed].join(", ")
        : "none"
    }`,
  );

  console.log(
    `[ADK] Knowledge chunks used: ${knowledgeCounter.value}`,
  );

  /* =======================================================
     RETURN
     ======================================================= */

  return {
    answer,

    toolsUsed: [...toolsUsed],

    knowledgeChunks:
      knowledgeCounter.value,
  };
}