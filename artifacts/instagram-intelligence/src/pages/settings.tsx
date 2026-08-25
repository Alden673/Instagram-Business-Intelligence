import { useState } from 'react';
import { Check, FileJson, FileUp, Info, Instagram, Trash2 } from 'lucide-react';
import { useAnalyzeInstagramData, useLoadInstagramDemo } from '@workspace/api-client-react';
import type { InstagramAnalysis, InstagramPost } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';

type SettingsProps = { analysis: InstagramAnalysis | null; onAnalysis: (analysis: InstagramAnalysis) => void; onClear: () => void };

export default function Settings({ analysis, onAnalysis, onClear }: SettingsProps) {
  const demo = useLoadInstagramDemo();
  const analyze = useAnalyzeInstagramData();
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const loadDemo = () => demo.mutate(undefined, { onSuccess: onAnalysis });
  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadError('');
    try {
      const text = await file.text();
      const parsed = file.name.endsWith('.json') ? JSON.parse(text) : parseCsv(text);
      const posts = Array.isArray(parsed) ? parsed : parsed?.posts;
      if (!Array.isArray(posts) || posts.length === 0) throw new Error('No posts found');
      analyze.mutate({ data: { posts } }, { onSuccess: onAnalysis, onError: () => setUploadError('That file could not be analyzed. Check that it includes post metrics.') });
    } catch {
      setUploadError('That file could not be analyzed. Check that it includes post metrics.');
    }
  };
  return <div className="mx-auto max-w-4xl"><div className="mb-9"><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Account / settings</div><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.045em]">Your data, <span className="text-primary">your call.</span></h1><p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Choose the source behind your weekly signals. Nothing is posted to Instagram from here.</p></div><div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]"><section className="rounded-2xl border border-card-border bg-card p-6 shadow-[0_8px_24px_hsl(var(--foreground)/.035)]"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Instagram size={20} /></div><div><h2 className="font-display text-lg font-semibold">Instagram analytics</h2><p className="text-xs text-muted-foreground">CSV or JSON post export</p></div><span className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-wider ${analysis ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}><span className={`h-1.5 w-1.5 rounded-full ${analysis ? 'bg-accent' : 'bg-muted-foreground/50'}`} />{analysis ? 'Connected' : 'Not connected'}</span></div><div className="mt-7 rounded-xl border border-dashed border-border bg-background px-5 py-6 text-center"><FileUp className="mx-auto text-primary" size={23} /><div className="mt-3 text-sm font-semibold">{analyze.isPending ? 'Analyzing your export…' : fileName || 'Upload a fresh export'}</div><p className="mt-1 text-xs text-muted-foreground">Use a file with post-level reach and engagement metrics.</p><label className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-secondary px-3 py-2 text-xs font-semibold hover:bg-primary/10" data-testid="label-upload-settings">Choose file<input type="file" accept=".csv,.json" onChange={onUpload} className="sr-only" data-testid="input-upload-settings" /></label>{uploadError && <div className="mt-3 text-xs text-primary" data-testid="status-settings-upload-error">{uploadError}</div>}</div><div className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><Info size={14} className="mt-0.5 shrink-0 text-primary" /> Your file is analyzed in this workspace session and becomes the source for the overview.</div></section><section className="rounded-2xl border border-card-border bg-card p-6 shadow-[0_8px_24px_hsl(var(--foreground)/.035)]"><div className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-muted-foreground">Workspace controls</div><h2 className="mt-2 font-display text-lg font-semibold">Keep exploring</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">See how Signal/Social works with a thoughtfully prepared account, or clear the current analysis from this session.</p><Button type="button" onClick={loadDemo} disabled={demo.isPending} variant="outline" className="mt-6 w-full justify-start" data-testid="button-load-demo-settings"><FileJson size={16} /> {demo.isPending ? 'Loading sample…' : 'Load sample account'}</Button>{analysis && <Button type="button" onClick={onClear} variant="outline" className="mt-3 w-full justify-start text-destructive hover:text-destructive" data-testid="button-clear-analysis"><Trash2 size={16} /> Clear current analysis</Button>}<div className="mt-7 border-t border-border pt-5"><div className="flex items-center gap-2 text-xs font-semibold"><Check size={14} className="text-accent" /> Private by default</div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your upload stays in this workspace session and powers your recommendations and assistant context.</p></div></section></div></div>;
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