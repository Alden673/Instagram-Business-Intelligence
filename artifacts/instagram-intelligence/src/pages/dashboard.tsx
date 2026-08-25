import { useMemo, useState } from 'react';
import { ArrowRight, FileUp, RefreshCw, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAnalyzeInstagramData, useGetInstagramRecommendations, useLoadInstagramDemo } from '@workspace/api-client-react';
import type { InstagramAnalysis, InstagramPost, Recommendation } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ContentMix, EmptyState, ErrorState, LoadingDashboard, MetricCard, PostRow, RecommendationCard, SectionHeading, TrendChart } from '@/components/insight-ui';

type DashboardProps = { analysis: InstagramAnalysis | null; onAnalysis: (analysis: InstagramAnalysis) => void };

export default function Dashboard({ analysis, onAnalysis }: DashboardProps) {
  const demo = useLoadInstagramDemo();
  const analyze = useAnalyzeInstagramData();
  const recommendations = useGetInstagramRecommendations();
  const [, setLocation] = useLocation();
  const [uploadError, setUploadError] = useState('');

  const loadDemo = () => demo.mutate(undefined, { onSuccess: onAnalysis });
  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const text = await file.text();
      const parsed = file.name.endsWith('.json') ? JSON.parse(text) : parseCsv(text);
      const posts = Array.isArray(parsed) ? parsed : parsed?.posts;
      if (!Array.isArray(posts) || posts.length === 0) throw new Error('No posts found');
      analyze.mutate({ data: { posts } }, { onSuccess: onAnalysis, onError: () => setUploadError('We could not read that export. Try a JSON file or a CSV with post metrics.') });
    } catch {
      setUploadError('We could not read that export. Try a JSON file or a CSV with post metrics.');
    }
  };

  const getRecommendations = () => {
    if (analysis) recommendations.mutate({ data: { analysis } });
  };

  const recs = recommendations.data || [];
  const headline = analysis?.accountName || 'Your Instagram';
  const topPosts = useMemo(() => analysis?.topPosts?.slice(0, 3) || [], [analysis]);
  const lowPosts = useMemo(() => analysis?.underperformingPosts?.slice(0, 3) || [], [analysis]);

  if (demo.isPending || analyze.isPending) return <LoadingDashboard />;
  if (!analysis) return <div className="mx-auto max-w-5xl"><div className="mb-9"><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Overview / welcome</div><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.04em] md:text-5xl">Make your content<br /><span className="text-primary">work harder.</span></h1><p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">Signal/Social turns your Instagram analytics into a clear weekly rhythm — what landed, what lagged, and what to make next.</p></div><EmptyState onDemo={loadDemo} isPending={demo.isPending} /><div className="mt-5 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center"><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="label-upload-empty"><FileUp size={14} className="text-primary" /> Upload your export<input type="file" accept=".csv,.json" onChange={onUpload} className="sr-only" data-testid="input-upload-empty" /></label>{uploadError && <span className="text-xs text-primary">{uploadError}</span>}</div></div>;

  return <div className="mx-auto max-w-[1380px]">
    <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Live analysis</div><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] md:text-4xl">{headline}</h1><p className="mt-2 text-sm text-muted-foreground">A clear read on <span className="font-medium text-foreground">{analysis.period}</span> · updated just now</p></div>
      <div className="flex items-center gap-2"><label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-primary/50" data-testid="label-upload-dashboard"><FileUp size={14} className="text-primary" /> Update data<input type="file" accept=".csv,.json" onChange={onUpload} className="sr-only" data-testid="input-upload-dashboard" /></label><Button type="button" variant="outline" size="sm" onClick={loadDemo} disabled={demo.isPending} data-testid="button-refresh-demo"><RefreshCw size={14} className={demo.isPending ? 'animate-spin' : ''} /> Demo</Button></div>
    </div>
    {uploadError && <div className="mb-5 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary" data-testid="status-upload-error">{uploadError}</div>}
    {analyze.isError ? <ErrorState onRetry={() => analyze.reset()} /> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{analysis.metrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} />)}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_24px_hsl(var(--foreground)/.035)] md:p-6"><SectionHeading eyebrow="Momentum" title="Reach is finding a rhythm" action={<div className="flex items-center gap-1 text-xs font-medium text-accent"><Sparkles size={13} /> 7 day view</div>} /><TrendChart trends={analysis.trends} /></section>
        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_24px_hsl(var(--foreground)/.035)] md:p-6"><SectionHeading eyebrow="Format signal" title="What your audience picks" /><ContentMix items={analysis.contentTypes} /><Link href="/planner" className="mt-6 flex items-center justify-between rounded-xl bg-secondary px-3 py-3 text-xs font-semibold hover:bg-primary/10" data-testid="link-open-planner"><span>Turn this into a week</span><ArrowRight size={15} className="text-primary" /></Link></section>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-card-border bg-card p-5 md:p-6"><SectionHeading eyebrow="Proof points" title="Posts pulling ahead" action={<Link href="/assistant" className="text-xs font-semibold text-primary hover:underline" data-testid="link-ask-posts">Ask why <ArrowRight size={13} className="ml-1 inline" /></Link>} />{topPosts.length ? topPosts.map((post, i) => <PostRow key={post.id} post={post} index={i} />) : <p className="text-sm text-muted-foreground">No top posts in this period.</p>}</section>
        <section className="rounded-2xl border border-card-border bg-card p-5 md:p-6"><SectionHeading eyebrow="Room to improve" title="Posts losing attention" />{lowPosts.length ? lowPosts.map((post, i) => <PostRow key={post.id} post={post} index={i} underperforming />) : <p className="text-sm text-muted-foreground">No underperforming posts in this period.</p>}</section>
      </div>
      <section className="mt-8"><SectionHeading eyebrow="Recommended next moves" title="Small shifts, backed by your data" action={<Button type="button" size="sm" variant="outline" onClick={getRecommendations} disabled={recommendations.isPending} data-testid="button-generate-recommendations">{recommendations.isPending ? 'Reading your signals…' : recs.length ? 'Refresh recommendations' : 'Generate recommendations'} </Button>} />{recommendations.isError && <ErrorState onRetry={getRecommendations} />}{recs.length > 0 && <div className="grid gap-4 md:grid-cols-3">{recs.map((item, i) => <RecommendationCard key={`${item.title}-${i}`} item={item} index={i} onUse={() => setLocation('/planner')} />)}</div>}{!recs.length && !recommendations.isError && <div className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-8 text-center text-sm text-muted-foreground"><span className="font-medium text-foreground">Ready when you are.</span> Generate recommendations to find your highest-leverage next moves.</div>}</section>
    </>}
  </div>;
}

function parseCsv(text: string): InstagramPost[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift()?.split(',').map((value) => value.trim().replace(/^"|"$/g, '')) || [];
  return lines.filter(Boolean).map((line, index) => {
    const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] || '']));
    return { id: row.id || `upload-${index}`, date: row.date || '', caption: row.caption || '', contentType: row.contentType || 'Image', reach: Number(row.reach || 0), likes: Number(row.likes || 0), comments: Number(row.comments || 0), saves: Number(row.saves || 0), shares: Number(row.shares || 0), engagementRate: Number(row.engagementRate || 0) } as InstagramPost;
  });
}