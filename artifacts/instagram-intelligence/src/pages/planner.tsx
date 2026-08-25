import { useState } from 'react';
import { CalendarDays, Check, Clipboard, Copy, FileText, RefreshCw, WandSparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useGenerateInstagramContentPlan } from '@workspace/api-client-react';
import type { ContentPlanDay, InstagramAnalysis } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ErrorState, SectionHeading } from '@/components/insight-ui';

export default function Planner({ analysis }: { analysis: InstagramAnalysis | null }) {
  const generator = useGenerateInstagramContentPlan();
  const [plan, setPlan] = useState<ContentPlanDay[]>([]);
  const [copied, setCopied] = useState(false);
  const createPlan = () => { if (analysis) generator.mutate({ data: { analysis } }, { onSuccess: setPlan }); };
  const copyPlan = async () => {
    if (!plan.length) return;
    await navigator.clipboard?.writeText(plan.map((item) => `${item.day} — ${item.format}\n${item.topic}\nHook: ${item.hook}\nGoal: ${item.goal}`).join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  if (!analysis) return <div className="mx-auto max-w-3xl py-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><CalendarDays size={25} /></div><h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">Your plan starts with a signal.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Load an Instagram analysis first, then we’ll map the next seven days around what your audience is already telling you.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-planner-load-data">Go to overview</Link></div>;
  return <div className="mx-auto max-w-[1160px]">
    <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Planning room / 01</div><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.045em]">A week with <span className="text-primary">intention.</span></h1><p className="mt-3 max-w-lg text-sm text-muted-foreground">A seven-day content rhythm shaped by {analysis.accountName}’s recent signals, not a generic calendar.</p></div><div className="flex gap-2">{plan.length > 0 && <Button type="button" variant="outline" size="sm" onClick={copyPlan} data-testid="button-copy-plan">{copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy plan'}</Button>}<Button type="button" size="sm" onClick={createPlan} disabled={generator.isPending} data-testid="button-generate-plan"><RefreshCw size={14} className={generator.isPending ? 'animate-spin' : ''} /> {plan.length ? 'Regenerate' : 'Generate my week'}</Button></div></div>
    {generator.isError && <div className="mb-6"><ErrorState onRetry={createPlan} /></div>}
    {!plan.length && !generator.isPending && !generator.isError && <div className="soft-grid rounded-3xl border border-dashed border-primary/30 bg-card px-7 py-16 text-center"><WandSparkles className="mx-auto text-primary" size={30} /><h2 className="mt-4 font-display text-2xl font-semibold">Make the next post easier.</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">We’ll balance your strongest formats with topics that move people from scrolling to remembering.</p><button type="button" onClick={createPlan} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:-translate-y-0.5" data-testid="button-generate-plan-empty">Build seven days</button></div>}
    {generator.isPending && <div className="space-y-3">{[1,2,3,4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>}
    {plan.length > 0 && <div><SectionHeading eyebrow="Your next seven days" title="Keep the thread going" action={<span className="font-mono-ui text-[10px] text-muted-foreground">{plan.length} entries · {analysis.period}</span>} /><div className="grid gap-4">{plan.map((item, index) => <PlanCard key={`${item.day}-${index}`} item={item} index={index} />)}</div></div>}
    <div className="mt-9 flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-4 text-xs text-muted-foreground"><FileText className="mt-0.5 shrink-0 text-accent" size={16} /><span><strong className="text-foreground">Use this as a starting line.</strong> The best plan leaves room for the real moments that happen in your business this week.</span></div>
  </div>;
}

function PlanCard({ item, index }: { item: ContentPlanDay; index: number }) {
  return <article className="group relative grid gap-4 overflow-hidden rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_24px_hsl(var(--foreground)/.035)] transition-transform hover:-translate-y-0.5 md:grid-cols-[120px_130px_1fr_180px] md:items-center md:p-6" data-testid={`card-plan-day-${index}`}><div className="absolute left-0 top-0 h-full w-1 bg-primary" /><div className="pl-2"><div className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary">Day {index + 1}</div><div className="mt-1 font-display text-lg font-semibold">{item.day}</div></div><div><span className="inline-flex rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground">{item.format}</span><div className="mt-2 text-[10px] text-muted-foreground">Format</div></div><div><div className="text-sm font-semibold">{item.topic}</div><div className="mt-2 border-l-2 border-primary/35 pl-3 text-xs italic leading-relaxed text-muted-foreground">“{item.hook}”</div></div><div className="rounded-xl bg-[#f7f0ec] p-3 dark:bg-sidebar-accent"><div className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">The job</div><div className="mt-1 text-xs font-medium leading-relaxed">{item.goal}</div></div></article>;
}