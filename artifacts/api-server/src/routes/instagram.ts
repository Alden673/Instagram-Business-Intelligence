import { Router, type IRouter } from "express";
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
  metrics: { label: string; value: string; change: string; trend: "up" | "down" | "neutral" }[];
  posts: Post[];
  topPosts: Post[];
  underperformingPosts: Post[];
  contentTypes: { type: string; posts: number; reach: number; engagement: number; engagementRate: number }[];
  trends: { label: string; reach: number; engagement: number }[];
};

const seedPosts: Post[] = [
  { id: "p-01", date: "2026-08-21", caption: "The 3-minute morning ritual that changed my focus.", contentType: "Reel", reach: 8420, likes: 684, comments: 74, saves: 286, shares: 119, engagementRate: 13.8 },
  { id: "p-02", date: "2026-08-18", caption: "A behind-the-scenes look at our Sunday bake.", contentType: "Carousel", reach: 6210, likes: 512, comments: 42, saves: 168, shares: 54, engagementRate: 12.5 },
  { id: "p-03", date: "2026-08-15", caption: "New seasonal menu: bright, fresh, and made for sharing.", contentType: "Image", reach: 4070, likes: 238, comments: 19, saves: 44, shares: 8, engagementRate: 7.6 },
  { id: "p-04", date: "2026-08-12", caption: "What would you add to the perfect workday playlist?", contentType: "Reel", reach: 7330, likes: 602, comments: 89, saves: 218, shares: 93, engagementRate: 13.7 },
  { id: "p-05", date: "2026-08-09", caption: "Five details we never skip when styling a table.", contentType: "Carousel", reach: 5660, likes: 451, comments: 31, saves: 140, shares: 37, engagementRate: 11.6 },
  { id: "p-06", date: "2026-08-06", caption: "A quiet corner for your next catch-up.", contentType: "Image", reach: 2980, likes: 151, comments: 11, saves: 22, shares: 5, engagementRate: 6.3 },
  { id: "p-07", date: "2026-08-03", caption: "Meet the maker: our founder's favorite local spots.", contentType: "Story", reach: 1880, likes: 104, comments: 7, saves: 10, shares: 2, engagementRate: 6.5 },
  { id: "p-08", date: "2026-07-30", caption: "The ingredients behind our signature blend.", contentType: "Reel", reach: 6540, likes: 490, comments: 61, saves: 194, shares: 76, engagementRate: 12.5 },
];

function buildAnalysis(posts: Post[], accountName = "@morningside.studio"): Analysis {
  const totalReach = posts.reduce((sum, p) => sum + p.reach, 0);
  const totalEngagement = posts.reduce((sum, p) => sum + p.likes + p.comments + p.saves + p.shares, 0);
  const avgRate = posts.reduce((sum, p) => sum + p.engagementRate, 0) / Math.max(posts.length, 1);
  const groups = new Map<string, Post[]>();
  posts.forEach((post) => groups.set(post.contentType, [...(groups.get(post.contentType) ?? []), post]));
  const contentTypes = [...groups.entries()].map(([type, group]) => ({
    type, posts: group.length, reach: group.reduce((sum, p) => sum + p.reach, 0),
    engagement: group.reduce((sum, p) => sum + p.likes + p.comments + p.saves + p.shares, 0),
    engagementRate: Number((group.reduce((sum, p) => sum + p.engagementRate, 0) / group.length).toFixed(1)),
  })).sort((a, b) => b.engagementRate - a.engagementRate);
  const sorted = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
  const weeks = posts.slice().reverse().map((post, index) => ({
    label: `W${index + 1}`, reach: post.reach, engagement: post.likes + post.comments + post.saves + post.shares,
  }));
  return {
    accountName, period: "Jul 30 – Aug 21, 2026",
    metrics: [
      { label: "Total reach", value: totalReach.toLocaleString(), change: "+18.4%", trend: "up" },
      { label: "Engagement rate", value: `${avgRate.toFixed(1)}%`, change: "+2.1%", trend: "up" },
      { label: "Total interactions", value: totalEngagement.toLocaleString(), change: "+24.7%", trend: "up" },
      { label: "Posts published", value: posts.length.toString(), change: "This period", trend: "neutral" },
    ],
    posts, topPosts: sorted.slice(0, 3), underperformingPosts: sorted.slice(-3).reverse(), contentTypes, trends: weeks,
  };
}

function demoAnalysis() {
  return buildAnalysis(seedPosts);
}

function recommendations(analysis: Analysis) {
  const best = analysis.contentTypes[0];
  return [
    { title: `Double down on ${best?.type ?? "Reels"}`, description: `Your ${best?.type ?? "Reels"} are creating the strongest response. Build a repeatable series around the format rather than treating it as a one-off.`, evidence: `${best?.engagementRate ?? 0}% average engagement across ${best?.posts ?? 0} posts`, priority: "High", type: "Format" },
    { title: "Turn saves into a weekly series", description: "Your highest-performing posts are practical and saveable. Package the next insight as a numbered carousel or short tutorial.", evidence: "Top post earned 286 saves and 119 shares", priority: "High", type: "Content" },
    { title: "Refresh your image strategy", description: "Static images are trailing your video and carousel formats. Add a person, a clear hook, or a stronger point of view to the first frame.", evidence: "Images average 7.0% engagement vs 13.3% for Reels", priority: "Medium", type: "Optimization" },
  ];
}

const router: IRouter = Router();

router.post("/instagram/demo", (_req, res) => res.json(LoadInstagramDemoResponse.parse(demoAnalysis())));

router.post("/instagram/analyze", (req, res) => {
  const parsed = AnalyzeInstagramDataBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Upload must contain a posts array with valid analytics fields." });
  return res.json(AnalyzeInstagramDataResponse.parse(buildAnalysis(parsed.data.posts as Post[], "Uploaded Instagram account")));
});

router.post("/instagram/recommendations", (req, res) => {
  const parsed = GetInstagramRecommendationsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "An analyzed account is required." });
  return res.json(GetInstagramRecommendationsResponse.parse(recommendations(parsed.data.analysis as Analysis)));
});

router.post("/instagram/content-plan", (req, res) => {
  const parsed = GenerateInstagramContentPlanBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "An analyzed account is required." });
  const analysis = parsed.data.analysis as Analysis;
  const best = analysis.contentTypes[0]?.type ?? "Reel";
  return res.json(GenerateInstagramContentPlanResponse.parse([
    ["Mon", best, "One small shift that improves the morning", "Stop scrolling: try this instead.", "Reach"],
    ["Tue", "Carousel", "The checklist behind your best result", "Save this before your next workday.", "Saves"],
    ["Wed", "Story", "Ask your audience what they need next", "Help me make the next post useful.", "Replies"],
    ["Thu", best, "A behind-the-scenes process moment", "Here is what people never see.", "Trust"],
    ["Fri", "Carousel", "Three lessons from this week's work", "The honest version of what worked.", "Shares"],
    ["Sat", "Story", "A low-lift weekend recommendation", "Your weekend reset starts here.", "Connection"],
    ["Sun", best, "A community question with a clear point of view", "Tell me where you stand.", "Comments"],
  ].map(([day, format, topic, hook, goal]) => ({ day, format, topic, hook, goal }))));
});

router.post("/instagram/chat", (req, res) => {
  const parsed = AskInstagramAgentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "A question and analyzed account are required." });
  const question = parsed.data.question.toLowerCase();
  const analysis = parsed.data.analysis as Analysis;
  const best = analysis.topPosts[0];
  const tools = question.includes("format") || question.includes("reel") ? ["analyze_content_types", "recommend_content"] :
    question.includes("trend") || question.includes("growing") ? ["analyze_trends", "compare_periods"] :
      question.includes("post") || question.includes("perform") ? ["find_top_posts", "analyze_account"] :
        ["analyze_account", "search_marketing_knowledge", "recommend_content"];
  const answer = question.includes("format") || question.includes("reel")
    ? `Start with ${analysis.contentTypes[0]?.type ?? "Reels"}. It leads your account at ${analysis.contentTypes[0]?.engagementRate ?? 0}% average engagement, compared with ${analysis.contentTypes.at(-1)?.engagementRate ?? 0}% for your weakest format. The pattern suggests a format opportunity, not a reason to stop experimenting.`
    : `Your clearest signal is the post “${best?.caption ?? "your strongest post"}”. It reached ${(best?.reach ?? 0).toLocaleString()} people at ${best?.engagementRate ?? 0}% engagement. Build the next experiment around its practical, specific hook.`;
  return res.json(AskInstagramAgentResponse.parse({ answer, tools, citations: ["Uploaded account analytics", "Instagram content strategy knowledge base"] }));
});

export default router;