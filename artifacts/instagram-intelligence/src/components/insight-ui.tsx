import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleAlert, Lightbulb, Minus, Sparkles, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentTypePerformance, InstagramMetric, InstagramPost, Recommendation, TrendPoint } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-3"><div>{eyebrow && <div className="mb-1 font-mono-ui text-[10px] uppercase tracking-[.17em] text-primary">{eyebrow}</div>}<h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h2></div>{action}</div>;
}

export function MetricCard({ metric, index }: { metric: InstagramMetric; index: number }) {
  const isUp = metric.trend === 'up';
  const isDown = metric.trend === 'down';
  return <div className={`animate-rise animate-delay-${Math.min(index + 1, 4)} rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_24px_hsl(var(--foreground)/.035)]`}>
    <div className="mb-4 flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{metric.label}</span><span className={`rounded-md p-1.5 ${isUp ? 'bg-accent/10 text-accent' : isDown ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{isUp ? <ArrowUpRight size={14} /> : isDown ? <ArrowDownRight size={14} /> : <Minus size={14} />}</span></div>
    <div className="font-display text-[27px] font-semibold tracking-tight">{metric.value}</div>
    <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${isUp ? 'text-accent' : isDown ? 'text-primary' : 'text-muted-foreground'}`}>{metric.change} <span className="font-normal text-muted-foreground">vs previous period</span></div>
  </div>;
}

export function TrendChart({ trends }: { trends: TrendPoint[] }) {
  const max = Math.max(...trends.map((t) => t.reach), 1);
  const points = trends.map((item, i) => `${(i / Math.max(trends.length - 1, 1)) * 100},${88 - (item.reach / max) * 66}`).join(' ');
  const engagementPoints = trends.map((item, i) => `${(i / Math.max(trends.length - 1, 1)) * 100},${88 - (item.engagement / Math.max(...trends.map((t) => t.engagement), 1)) * 40}`).join(' ');
  return <div className="relative h-[218px] w-full overflow-hidden rounded-xl bg-[#f7f0ec] p-4 dark:bg-sidebar-accent"><div className="absolute inset-x-4 top-4 bottom-8 flex flex-col justify-between">{[0, 1, 2, 3].map((line) => <div key={line} className="border-t border-foreground/[.07]" />)}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-4 top-4 h-[175px] w-[calc(100%-32px)] overflow-visible"><polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /><polyline points={engagementPoints} fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" /></svg><div className="absolute inset-x-4 bottom-3 flex justify-between font-mono-ui text-[9px] text-muted-foreground">{trends.map((t) => <span key={t.label}>{t.label}</span>)}</div><div className="absolute right-4 top-3 flex gap-3 bg-[#f7f0ec]/80 px-1 text-[10px] dark:bg-sidebar-accent/80"><span className="flex items-center gap-1 text-primary"><i className="h-1.5 w-1.5 rounded-full bg-primary" /> Reach</span><span className="flex items-center gap-1 text-accent"><i className="h-1.5 w-1.5 rounded-full bg-accent" /> Engagement</span></div></div>;
}

export function ContentMix({ items }: { items: ContentTypePerformance[] }) {
  const max = Math.max(...items.map((item) => item.reach), 1);
  return <div className="space-y-4">{items.map((item, index) => <div key={item.type} data-testid={`row-content-type-${index}`}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold">{item.type}</span><span className="font-mono-ui text-muted-foreground">{item.engagementRate.toFixed(1)}% ER</span></div><div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${index === 0 ? 'bg-primary' : index === 1 ? 'bg-accent' : 'bg-[#e1a957]'}`} style={{ width: `${Math.max(8, (item.reach / max) * 100)}%` }} /></div><span className="w-16 text-right font-mono-ui text-[10px] text-muted-foreground">{formatCompact(item.reach)} reach</span></div></div>)}</div>;
}

export function PostRow({ post, index, underperforming = false }: { post: InstagramPost; index: number; underperforming?: boolean }) {
  return <div className="group flex items-center gap-3 border-b border-border/70 py-3.5 last:border-0" data-testid={`row-post-${post.id || index}`}><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono-ui text-[10px] font-medium ${underperforming ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{post.contentType.slice(0, 3).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{post.caption || 'Untitled post'}</div><div className="mt-1 flex gap-2 text-[10px] text-muted-foreground"><span>{post.date}</span><span>•</span><span>{post.contentType}</span></div></div><div className="text-right"><div className="font-mono-ui text-xs font-medium">{formatCompact(post.reach)}</div><div className={`mt-1 text-[10px] ${underperforming ? 'text-primary' : 'text-accent'}`}>{post.engagementRate.toFixed(1)}% ER</div></div></div>;
}

export function RecommendationCard({ item, index, onUse }: { item: Recommendation; index: number; onUse: (item: Recommendation) => void }) {
  const color = item.priority === 'High' ? 'text-primary bg-primary/10' : item.priority === 'Medium' ? 'text-[#a66c17] bg-[#e9b85e]/20' : 'text-accent bg-accent/10';
  return <div className="group rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_24px_hsl(var(--foreground)/.035)] transition-transform hover:-translate-y-0.5" data-testid={`card-recommendation-${index}`}><div className="mb-4 flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3e7e4] text-primary dark:bg-sidebar-accent"><Lightbulb size={17} /></span><span className={`rounded-full px-2 py-1 font-mono-ui text-[9px] uppercase tracking-wider ${color}`}>{item.priority}</span></div><h3 className="font-display text-[15px] font-semibold leading-snug">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p><div className="mt-4 border-l-2 border-primary/35 pl-3 text-[11px] italic text-foreground/65">{item.evidence}</div><button type="button" onClick={() => onUse(item)} className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary hover:gap-2" data-testid={`button-use-recommendation-${index}`}>Build this into my plan <ChevronRight size={14} /></button></div>;
}

export function EmptyState({ onDemo, isPending }: { onDemo: () => void; isPending?: boolean }) {
  return <div className="soft-grid flex min-h-[410px] flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-card px-6 text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary text-primary-foreground shadow-[7px_7px_0_hsl(var(--accent))]"><TrendingUp size={28} /></div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Your weekly cockpit</div><h2 className="mt-3 max-w-md font-display text-2xl font-semibold tracking-tight">Bring your Instagram numbers. Leave with a sharper next move.</h2><p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Load a sample account to explore the dashboard, or upload your own post export from Instagram.</p><Button type="button" onClick={onDemo} disabled={isPending} className="mt-7 rounded-xl bg-primary px-5" data-testid="button-load-demo-empty">{isPending ? 'Loading sample…' : 'Explore demo account'}</Button></div>;
}

export function LoadingDashboard() {
  return <div className="space-y-7 animate-pulse"><div className="h-8 w-72 rounded-lg bg-muted" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted" />)}</div><div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="h-72 rounded-2xl bg-muted" /><div className="h-72 rounded-2xl bg-muted" /></div></div>;
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-center"><CircleAlert className="mb-3 text-primary" size={28} /><h3 className="font-display text-lg font-semibold">That signal got lost</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{message || 'We could not process the data right now. Give it another try.'}</p><button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-primary/30 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10" data-testid="button-retry">Try again</button></div>;
}

export function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return value.toLocaleString();
}