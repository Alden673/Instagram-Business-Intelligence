import * as fs from "node:fs";
import path from "node:path";

import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";

import {
  AnalyzeInstagramDataBody,
  AnalyzeInstagramDataResponse,
  AskInstagramAgentBody,
  AskInstagramAgentResponse,
  GenerateInstagramContentPlanBody,
  GenerateInstagramContentPlanResponse,
  GetInstagramRecommendationsBody,
  GetInstagramRecommendationsResponse,
  LoadInstagramDemoResponse,
} from "@workspace/api-zod";

type Post = {
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

type Analysis = {
  accountName: string;
  period: string;

  metrics: {
    label: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
  }[];

  posts: Post[];
  topPosts: Post[];
  underperformingPosts: Post[];

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

/* =========================================================
   GEMINI CONFIGURATION
   ========================================================= */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-3.7-flash";

const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.6-flash";

console.log(
  `[Gemini] API key ${GEMINI_API_KEY ? "FOUND" : "MISSING"}`
);

console.log(`[Gemini] Model: ${GEMINI_MODEL}`);
console.log(`[Gemini] Fallback model: ${GEMINI_FALLBACK_MODEL}`);

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

/* =========================================================
   INSTAGRAM STRATEGY KNOWLEDGE BASE
   ========================================================= */

function loadInstagramKnowledge(): string {
  const knowledgePath = path.resolve(
    process.cwd(),
    "../../knowledge",
    "instagram-content-strategy.md",
  );

  try {
    if (!fs.existsSync(knowledgePath)) {
      console.warn(`[Knowledge] File not found: ${knowledgePath}`);
      return "";
    }

    const knowledge = fs.readFileSync(knowledgePath, "utf8").trim();

    console.log(
      `[Knowledge] Loaded Instagram strategy (${knowledge.length} characters)`,
    );

    return knowledge;
  } catch (error) {
    console.error("[Knowledge] Failed to load Instagram strategy:", error);
    return "";
  }
}

const instagramKnowledge = loadInstagramKnowledge();

function knowledgeSection(): string {
  if (!instagramKnowledge) {
    return "";
  }

  return `
--- INSTAGRAM STRATEGY KNOWLEDGE BASE ---
${instagramKnowledge}
--- END INSTAGRAM STRATEGY KNOWLEDGE BASE ---
`;
}

/* =========================================================
   GEMINI TEXT CALL
   ========================================================= */

async function askGemini(prompt: string): Promise<string> {
  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add GEMINI_API_KEY to the root .env file and restart the API server."
    );
  }

  const modelsToTry = [
    GEMINI_MODEL,
    GEMINI_FALLBACK_MODEL,
  ];

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `[Gemini] Sending request using ${model} (attempt ${attempt}/2)...`
        );

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: 4096,
          },
        });

        const text = response.text?.trim();

        if (!text) {
          console.error(
            "[Gemini] Empty response received:",
            JSON.stringify(response, null, 2)
          );
          throw new Error("Gemini returned an empty response.");
        }

        console.log(
          `[Gemini] Response received from ${model} (${text.length} characters)`
        );

        return text;
      } catch (error) {
        lastError = error;

        const status =
          typeof error === "object" &&
          error !== null &&
          "status" in error
            ? Number((error as { status?: unknown }).status)
            : undefined;

        console.error(
          `[Gemini] ${model} attempt ${attempt} failed:`,
          error
        );

        const retryable =
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (!retryable) {
          break;
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }

    if (model !== GEMINI_FALLBACK_MODEL) {
      console.log(
        `[Gemini] Primary model unavailable. Trying fallback model ${GEMINI_FALLBACK_MODEL}...`
      );
    }
  }

  if (lastError instanceof Error) {
    throw new Error(
      `Gemini API request failed after retries and fallback: ${lastError.message}`
    );
  }

  throw new Error(
    "Gemini API request failed after retries and fallback."
  );
}

/* =========================================================
   GEMINI JSON CALL
   ========================================================= */

async function askGeminiJson(
  prompt: string
): Promise<string> {
  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add GEMINI_API_KEY to the root .env file and restart the API server."
    );
  }

  const modelsToTry = [
    GEMINI_MODEL,
    GEMINI_FALLBACK_MODEL,
  ];

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `[Gemini] Sending JSON request using ${model} (attempt ${attempt}/2)...`
        );

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        });

        const text = response.text?.trim();

        if (!text) {
          console.error(
            "[Gemini] Empty JSON response:",
            JSON.stringify(response, null, 2)
          );
          throw new Error("Gemini returned an empty JSON response.");
        }

        console.log(
          `[Gemini] JSON response received from ${model} (${text.length} characters)`
        );

        return text;
      } catch (error) {
        lastError = error;

        const status =
          typeof error === "object" &&
          error !== null &&
          "status" in error
            ? Number((error as { status?: unknown }).status)
            : undefined;

        console.error(
          `[Gemini] ${model} JSON attempt ${attempt} failed:`,
          error
        );

        const retryable =
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (!retryable) {
          break;
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }

    if (model !== GEMINI_FALLBACK_MODEL) {
      console.log(
        `[Gemini] Primary model unavailable. Trying fallback model ${GEMINI_FALLBACK_MODEL}...`
      );
    }
  }

  if (lastError instanceof Error) {
    throw new Error(
      `Gemini JSON request failed after retries and fallback: ${lastError.message}`
    );
  }

  throw new Error(
    "Gemini JSON request failed after retries and fallback."
  );
}

/* =========================================================
   JSON EXTRACTION
   ========================================================= */

function extractJson<T>(text: string): T | null {
  const cleaned = text.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continue below.
  }

  const fenced = cleaned.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i
  );

  if (fenced) {
    try {
      return JSON.parse(fenced[1]) as T;
    } catch {
      // Continue below.
    }
  }

  const firstObject = cleaned.indexOf("{");
  const lastObject = cleaned.lastIndexOf("}");

  if (
    firstObject !== -1 &&
    lastObject !== -1 &&
    lastObject > firstObject
  ) {
    try {
      return JSON.parse(
        cleaned.slice(firstObject, lastObject + 1)
      ) as T;
    } catch {
      // Continue below.
    }
  }

  const firstArray = cleaned.indexOf("[");
  const lastArray = cleaned.lastIndexOf("]");

  if (
    firstArray !== -1 &&
    lastArray !== -1 &&
    lastArray > firstArray
  ) {
    try {
      return JSON.parse(
        cleaned.slice(firstArray, lastArray + 1)
      ) as T;
    } catch {
      // Nothing else to try.
    }
  }

  return null;
}

/* =========================================================
   DEMO DATA
   ========================================================= */

const seedPosts: Post[] = [
  {
    id: "p-01",
    date: "2026-08-21",
    caption:
      "The 3-minute morning ritual that changed my focus.",
    contentType: "Reel",
    reach: 8420,
    likes: 684,
    comments: 74,
    saves: 286,
    shares: 119,
    engagementRate: 13.8,
  },

  {
    id: "p-02",
    date: "2026-08-18",
    caption:
      "A behind-the-scenes look at our Sunday bake.",
    contentType: "Carousel",
    reach: 6210,
    likes: 512,
    comments: 42,
    saves: 168,
    shares: 54,
    engagementRate: 12.5,
  },

  {
    id: "p-03",
    date: "2026-08-15",
    caption:
      "New seasonal menu: bright, fresh, and made for sharing.",
    contentType: "Image",
    reach: 4070,
    likes: 238,
    comments: 19,
    saves: 44,
    shares: 8,
    engagementRate: 7.6,
  },

  {
    id: "p-04",
    date: "2026-08-12",
    caption:
      "What would you add to the perfect workday playlist?",
    contentType: "Reel",
    reach: 7330,
    likes: 602,
    comments: 89,
    saves: 218,
    shares: 93,
    engagementRate: 13.7,
  },

  {
    id: "p-05",
    date: "2026-08-09",
    caption:
      "Five details we never skip when styling a table.",
    contentType: "Carousel",
    reach: 5660,
    likes: 451,
    comments: 31,
    saves: 140,
    shares: 37,
    engagementRate: 11.6,
  },

  {
    id: "p-06",
    date: "2026-08-06",
    caption:
      "A quiet corner for your next catch-up.",
    contentType: "Image",
    reach: 2980,
    likes: 151,
    comments: 11,
    saves: 22,
    shares: 5,
    engagementRate: 6.3,
  },

  {
    id: "p-07",
    date: "2026-08-03",
    caption:
      "Meet the maker: our founder's favorite local spots.",
    contentType: "Story",
    reach: 1880,
    likes: 104,
    comments: 7,
    saves: 10,
    shares: 2,
    engagementRate: 6.5,
  },

  {
    id: "p-08",
    date: "2026-07-30",
    caption:
      "The ingredients behind our signature blend.",
    contentType: "Reel",
    reach: 6540,
    likes: 490,
    comments: 61,
    saves: 194,
    shares: 76,
    engagementRate: 12.5,
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function getPeriod(posts: Post[]): string {
  if (posts.length === 0) {
    return "No data";
  }

  const dates = posts
    .map((post) => new Date(post.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort(
      (a, b) => a.getTime() - b.getTime()
    );

  if (dates.length === 0) {
    return "Uploaded period";
  }

  const first = dates[0];
  const last = dates[dates.length - 1];

  return `${first.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} – ${last.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function normalizePost(post: any, index: number): Post {
  const contentType = String(
    post?.contentType || "Image"
  );

  const allowedTypes: Post["contentType"][] = [
    "Reel",
    "Carousel",
    "Image",
    "Story",
  ];

  const normalizedType = allowedTypes.includes(
    contentType as Post["contentType"]
  )
    ? (contentType as Post["contentType"])
    : "Image";

  return {
    id: String(
      post?.id || `upload-${index + 1}`
    ),

    date: String(
      post?.date || ""
    ),

    caption: String(
      post?.caption || ""
    ),

    contentType: normalizedType,

    reach: Number(
      post?.reach || 0
    ),

    likes: Number(
      post?.likes || 0
    ),

    comments: Number(
      post?.comments || 0
    ),

    saves: Number(
      post?.saves || 0
    ),

    shares: Number(
      post?.shares || 0
    ),

    engagementRate: Number(
      post?.engagementRate || 0
    ),
  };
}

/* =========================================================
   ANALYTICS
   ========================================================= */

function buildAnalysis(
  rawPosts: Post[],
  accountName = "@morningside.studio"
): Analysis {
  const posts = rawPosts.map(
    (post, index) =>
      normalizePost(post, index)
  );

  const totalReach = posts.reduce(
    (sum, post) =>
      sum + post.reach,
    0
  );

  const totalEngagement =
    posts.reduce(
      (sum, post) =>
        sum +
        post.likes +
        post.comments +
        post.saves +
        post.shares,
      0
    );

  const avgRate =
    posts.reduce(
      (sum, post) =>
        sum + post.engagementRate,
      0
    ) /
    Math.max(posts.length, 1);

  const groups =
    new Map<string, Post[]>();

  for (const post of posts) {
    const existing =
      groups.get(post.contentType) ??
      [];

    groups.set(
      post.contentType,
      [...existing, post]
    );
  }

  const contentTypes =
    [...groups.entries()]
      .map(([type, group]) => {
        const engagement =
          group.reduce(
            (sum, post) =>
              sum +
              post.likes +
              post.comments +
              post.saves +
              post.shares,
            0
          );

        const reach =
          group.reduce(
            (sum, post) =>
              sum + post.reach,
            0
          );

        const engagementRate =
          group.reduce(
            (sum, post) =>
              sum + post.engagementRate,
            0
          ) /
          Math.max(group.length, 1);

        return {
          type,
          posts: group.length,
          reach,
          engagement,
          engagementRate:
            Number(
              engagementRate.toFixed(1)
            ),
        };
      })
      .sort(
        (a, b) =>
          b.engagementRate -
          a.engagementRate
      );

  const sorted =
    [...posts].sort(
      (a, b) =>
        b.engagementRate -
        a.engagementRate
    );

  const trends =
    [...posts]
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      )
      .map((post, index) => ({
        label: `P${index + 1}`,
        reach: post.reach,
        engagement:
          post.likes +
          post.comments +
          post.saves +
          post.shares,
      }));

  const highestReach =
    Math.max(
      ...posts.map(
        (post) => post.reach
      ),
      0
    );

  const lowestReach =
    posts.length > 0
      ? Math.min(
          ...posts.map(
            (post) => post.reach
          )
        )
      : 0;

  const reachChange =
    lowestReach > 0
      ? ((highestReach -
          lowestReach) /
          lowestReach) *
        100
      : 0;

  return {
    accountName,
    period: getPeriod(posts),

    metrics: [
      {
        label: "Total reach",
        value:
          totalReach.toLocaleString(),
        change: `+${reachChange.toFixed(
          1
        )}%`,
        trend: "up",
      },

      {
        label: "Engagement rate",
        value: `${avgRate.toFixed(
          1
        )}%`,
        change:
          "Calculated from uploaded data",
        trend: "up",
      },

      {
        label: "Total interactions",
        value:
          totalEngagement.toLocaleString(),
        change:
          "Calculated from uploaded data",
        trend: "up",
      },

      {
        label: "Posts published",
        value:
          posts.length.toString(),
        change: "This period",
        trend: "neutral",
      },
    ],

    posts,

    topPosts:
      sorted.slice(0, 3),

    underperformingPosts:
      sorted
        .slice(-3)
        .reverse(),

    contentTypes,

    trends,
  };
}

function demoAnalysis(): Analysis {
  return buildAnalysis(
    seedPosts
  );
}

/* =========================================================
   AI RECOMMENDATIONS
   ========================================================= */

async function generateRecommendations(
  analysis: Analysis
) {
  const prompt = `
You are an expert Instagram Business Intelligence marketing strategist.

${knowledgeSection()}
Use the knowledge base as supporting strategic guidance, but always prioritize the supplied account analytics.

Analyze ONLY the following REAL Instagram analytics.

${JSON.stringify(
  analysis,
  null,
  2
)}

Create exactly 3 practical recommendations for this business.

IMPORTANT:
- Use ONLY the supplied analytics.
- Do not invent statistics.
- Every recommendation must contain evidence from the supplied data.
- Use actual post titles/captions where useful.
- Priority must be High, Medium, or Low.
- Type must be one of Format, Content, Optimization, Growth, Engagement.
- Make the recommendations specific and actionable.

Return ONLY a JSON array.

The JSON must have exactly this structure:

[
  {
    "title": "short recommendation title",
    "description": "specific actionable explanation",
    "evidence": "specific evidence from the analytics",
    "priority": "High",
    "type": "Format"
  }
]
`;

  const response =
    await askGeminiJson(
      prompt
    );

  const parsed =
    extractJson<
      {
        title: string;
        description: string;
        evidence: string;
        priority: string;
        type: string;
      }[]
    >(response);

  if (
    !parsed ||
    !Array.isArray(parsed) ||
    parsed.length < 3
  ) {
    throw new Error(
      "Gemini returned invalid recommendation JSON."
    );
  }

  return parsed
    .slice(0, 3)
    .map((item) => ({
      title: String(
        item.title || ""
      ),

      description: String(
        item.description || ""
      ),

      evidence: String(
        item.evidence || ""
      ),

      priority:
        item.priority ===
          "High" ||
        item.priority ===
          "Medium" ||
        item.priority ===
          "Low"
          ? item.priority
          : "Medium",

      type: String(
        item.type || "Content"
      ),
    }));
}

/* =========================================================
   AI CONTENT PLAN
   ========================================================= */

async function generateContentPlan(
  analysis: Analysis
) {
  const strongestFormats =
    analysis.contentTypes
      .slice(0, 3)
      .map(
        (item) =>
          `${item.type}: ${item.engagementRate}% average engagement`
      )
      .join(", ");

  const topPostSummary =
    analysis.topPosts
      .map(
        (post) =>
          `"${post.caption}" (${post.contentType}, ${post.reach.toLocaleString()} reach, ${post.engagementRate}% engagement)`
      )
      .join("\n");

  const prompt = `
You are an Instagram content strategist for a small business.

${knowledgeSection()}
Use the knowledge base as supporting strategic guidance, but always prioritize the supplied account analytics.

Use ONLY this real Instagram analytics data.

${JSON.stringify(
  analysis,
  null,
  2
)}

Strongest content formats:
${strongestFormats}

Top posts:
${topPostSummary}

Create a personalized 7-day Instagram content plan.

Requirements:
- Exactly 7 entries.
- Days must be Mon, Tue, Wed, Thu, Fri, Sat, Sun.
- Use the account's strongest formats.
- Base ideas on actual top posts and analytics.
- Do not invent analytics numbers.
- Do not claim results that are not in the data.
- Goal must be one of Reach, Saves, Shares, Comments, Replies, Trust, Connection.
- Make every topic and hook specific to this account.
- The plan should not simply repeat the exact same post.

Return ONLY a JSON array in this exact structure:

[
  {
    "day": "Mon",
    "format": "Reel",
    "topic": "specific topic",
    "hook": "specific hook",
    "goal": "Reach"
  }
]
`;

  const response =
    await askGeminiJson(
      prompt
    );

  const parsed =
    extractJson<
      {
        day: string;
        format: string;
        topic: string;
        hook: string;
        goal: string;
      }[]
    >(response);

  if (
    !parsed ||
    !Array.isArray(parsed) ||
    parsed.length < 7
  ) {
    throw new Error(
      "Gemini returned invalid content-plan JSON."
    );
  }

  const days = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  return days.map(
    (day, index) => {
      const item =
        parsed[index];

      return {
        day,

        format: String(
          item?.format ||
            analysis.contentTypes[
              index %
                Math.max(
                  analysis.contentTypes
                    .length,
                  1
                )
            ]?.type ||
            "Reel"
        ),

        topic: String(
          item?.topic ||
            "Create a post based on your strongest-performing content themes."
        ),

        hook: String(
          item?.hook ||
            "Show the audience a practical idea they can use today."
        ),

        goal: String(
          item?.goal ||
            "Reach"
        ),
      };
    }
  );
}

/* =========================================================
   AGENT TOOL SELECTION
   ========================================================= */

function getAgentTools(
  question: string
): string[] {
  const q =
    question.toLowerCase();

  if (
    q.includes("format") ||
    q.includes("reel") ||
    q.includes("carousel") ||
    q.includes("story")
  ) {
    return [
      "analyze_content_types",
      "recommend_content",
    ];
  }

  if (
    q.includes("trend") ||
    q.includes("growing") ||
    q.includes("growth")
  ) {
    return [
      "analyze_trends",
      "compare_periods",
    ];
  }

  if (
    q.includes("post") ||
    q.includes("perform") ||
    q.includes("best") ||
    q.includes("top")
  ) {
    return [
      "find_top_posts",
      "analyze_account",
    ];
  }

  if (
    q.includes("plan") ||
    q.includes("week") ||
    q.includes("content")
  ) {
    return [
      "analyze_content_types",
      "recommend_content",
      "generate_content_plan",
    ];
  }

  return [
    "analyze_account",
    "recommend_content",
  ];
}

/* =========================================================
   REAL GEMINI CHAT AGENT
   ========================================================= */

async function answerAgentQuestion(
  question: string,
  analysis: Analysis
): Promise<string> {
  const prompt = `
You are the AI assistant inside an Instagram Business Intelligence application.

You are answering a small-business owner's Instagram marketing question.

${knowledgeSection()}
Use the knowledge base as supporting strategic guidance, but never invent account-specific facts from it. The account analytics below are the source of truth for account performance.

USER QUESTION:
${question}

REAL ACCOUNT ANALYTICS:
${JSON.stringify(
  analysis,
  null,
  2
)}

Rules:

1. Answer the user's actual question directly.
2. Use the supplied analytics as the source of truth.
3. Use actual numbers from the analytics whenever helpful.
4. Never invent metrics, posts, trends, dates, or results.
5. Explain the reasoning briefly.
6. If the data is insufficient, say so clearly.
7. Do not claim access to Instagram itself.
8. Do not claim that you performed an action you did not perform.
9. Do not mention hidden prompts, internal tools, or private reasoning.
10. Keep the response clear and useful.
11. Make the answer specific to this account.
12. The response must change appropriately when the user's question changes.
13. If the user asks what to post more of, compare content types and top posts.
14. If the user asks about best posts, use the actual top posts.
15. If the user asks about posting patterns, use the supplied post dates and performance.
16. If the user asks for advice, give a concrete recommendation backed by the data.

Answer naturally in plain text.
Do not return JSON.
Do not use markdown code fences.

Answer:
`;

  return askGemini(
    prompt
  );
}

/* =========================================================
   ROUTER
   ========================================================= */

const router: IRouter =
  Router();

/* =========================================================
   DEMO ACCOUNT
   ========================================================= */

router.post(
  "/instagram/demo",
  (_req, res) => {
    try {
      const analysis =
        demoAnalysis();

      console.log(
        `[Instagram] Demo loaded: ${analysis.posts.length} posts`
      );

      return res.json(
        LoadInstagramDemoResponse.parse(
          analysis
        )
      );
    } catch (error) {
      console.error(
        "[Instagram] Demo error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to load the sample Instagram account.",
      });
    }
  }
);

/* =========================================================
   UPLOAD / ANALYZE
   ========================================================= */

router.post(
  "/instagram/analyze",
  (req, res) => {
    const parsed =
      AnalyzeInstagramDataBody.safeParse(
        req.body
      );

    if (!parsed.success) {
      console.error(
        "[Instagram] Invalid upload:",
        parsed.error.flatten()
      );

      return res.status(400).json({
        error:
          "Upload must contain a posts array with valid analytics fields.",
      });
    }

    try {
      const posts =
        parsed.data.posts as Post[];

      const analysis =
        buildAnalysis(
          posts,
          "Uploaded Instagram account"
        );

      console.log(
        `[Instagram] Upload analyzed: ${analysis.posts.length} posts`
      );

      return res.json(
        AnalyzeInstagramDataResponse.parse(
          analysis
        )
      );
    } catch (error) {
      console.error(
        "[Instagram] Analysis error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to analyze the uploaded Instagram data.",
      });
    }
  }
);

/* =========================================================
   AI RECOMMENDATIONS
   ========================================================= */

router.post(
  "/instagram/recommendations",
  async (req, res) => {
    const parsed =
      GetInstagramRecommendationsBody.safeParse(
        req.body
      );

    if (!parsed.success) {
      console.error(
        "[Instagram] Recommendation validation error:",
        parsed.error.flatten()
      );

      return res.status(400).json({
        error:
          "An analyzed account is required.",
      });
    }

    const analysis =
      parsed.data.analysis as Analysis;

    try {
      console.log(
        "[Gemini] Generating recommendations..."
      );

      const result =
        await generateRecommendations(
          analysis
        );

      console.log(
        "[Gemini] Recommendations generated successfully."
      );

      return res.json(
        GetInstagramRecommendationsResponse.parse(
          result
        )
      );
    } catch (error) {
      console.error(
        "[Instagram] Recommendation error:",
        error
      );

      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate recommendations.",
      });
    }
  }
);

/* =========================================================
   AI CONTENT PLAN
   ========================================================= */

router.post(
  "/instagram/content-plan",
  async (req, res) => {
    const parsed =
      GenerateInstagramContentPlanBody.safeParse(
        req.body
      );

    if (!parsed.success) {
      console.error(
        "[Instagram] Content-plan validation error:",
        parsed.error.flatten()
      );

      return res.status(400).json({
        error:
          "An analyzed account is required.",
      });
    }

    const analysis =
      parsed.data.analysis as Analysis;

    try {
      console.log(
        "[Gemini] Generating 7-day content plan..."
      );

      const plan =
        await generateContentPlan(
          analysis
        );

      console.log(
        "[Gemini] Content plan generated successfully."
      );

      return res.json(
        GenerateInstagramContentPlanResponse.parse(
          plan
        )
      );
    } catch (error) {
      console.error(
        "[Instagram] Content plan error:",
        error
      );

      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate content plan.",
      });
    }
  }
);

/* =========================================================
   REAL GEMINI CHAT
   ========================================================= */

router.post(
  "/instagram/chat",
  async (req, res) => {
    console.log(
      "[Instagram] Chat request received."
    );

    const parsed =
      AskInstagramAgentBody.safeParse(
        req.body
      );

    if (!parsed.success) {
      console.error(
        "[Instagram] Chat validation error:",
        parsed.error.flatten()
      );

      return res.status(400).json({
        error:
          "A question and analyzed account are required.",
      });
    }

    const question =
      parsed.data.question.trim();

    const analysis =
      parsed.data.analysis as Analysis;

    if (!question) {
      return res.status(400).json({
        error:
          "Please enter a question.",
      });
    }

    if (
      !analysis ||
      !Array.isArray(
        analysis.posts
      )
    ) {
      return res.status(400).json({
        error:
          "Valid Instagram analytics are required before asking the AI assistant.",
      });
    }

    try {
      console.log(
        `[Gemini] Chat question: "${question}"`
      );

      console.log(
        `[Gemini] Account: ${analysis.accountName}`
      );

      console.log(
        `[Gemini] Posts available: ${analysis.posts.length}`
      );

      const tools =
        getAgentTools(
          question
        );

      const answer =
        await answerAgentQuestion(
          question,
          analysis
        );

      if (
        !answer ||
        !answer.trim()
      ) {
        throw new Error(
          "Gemini returned an empty answer."
        );
      }

      console.log(
        "[Gemini] Chat answer successfully generated."
      );

      const payload = {
        answer: answer.trim(),

        tools,

        citations: [
          "Uploaded account analytics",
          `Gemini AI (${GEMINI_MODEL})`,
        ],
      };

      console.log(
        "[Gemini] Sending answer to frontend."
      );

      return res.json(
        AskInstagramAgentResponse.parse(
          payload
        )
      );
    } catch (error) {
      console.error(
        "[Instagram] AI chat error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to process the AI request.";

      return res.status(500).json({
        error: message,
      });
    }
  }
);

/* =========================================================
   GEMINI HEALTH CHECK
   ========================================================= */

router.get(
  "/instagram/gemini-health",
  async (_req, res) => {
    if (!ai) {
      return res.status(500).json({
        ok: false,
        model: GEMINI_MODEL,
        error:
          "GEMINI_API_KEY is missing.",
      });
    }

    try {
      const answer =
        await askGemini(
          "Reply with exactly: GEMINI_OK"
        );

      return res.json({
        ok: true,
        model: GEMINI_MODEL,
        answer,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        model: GEMINI_MODEL,
        error:
          error instanceof Error
            ? error.message
            : "Gemini health check failed.",
      });
    }
  }
);

/* =========================================================
   EXPORT
   ========================================================= */

export default router;