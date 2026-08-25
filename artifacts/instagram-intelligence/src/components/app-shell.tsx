import { Link, useLocation } from 'wouter';
import { BarChart3, Bot, CalendarDays, ChevronDown, CircleHelp, Instagram, Settings2, Sparkles, Upload } from 'lucide-react';
import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type AppShellProps = {
  children: ReactNode;
  accountName?: string;
  hasAnalysis: boolean;
};

const navItems = [
  { href: '/', label: 'Overview', icon: BarChart3 },
  { href: '/planner', label: 'Content planner', icon: CalendarDays },
  { href: '/assistant', label: 'Ask the assistant', icon: Bot },
];

export function AppShell({ children, accountName, hasAnalysis }: AppShellProps) {
  const [location] = useLocation();
  return (
    <div className="noise min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground md:flex">
        <Link href="/" className="mb-10 flex items-center gap-3" data-testid="link-brand">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[4px_4px_0_hsl(var(--accent))]">
            <Instagram size={19} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">signal<span className="text-primary">/</span>social</span>
        </Link>
        <div className="mb-3 px-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
              >
                <Icon size={17} className={active ? 'text-primary' : 'text-sidebar-foreground/45 group-hover:text-primary'} />
                {item.label}
                {item.href === '/assistant' && <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 font-mono-ui text-[9px] text-primary">AI</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mb-3 mt-10 px-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/45">Account</div>
        <Link
          href="/settings"
          data-testid="link-nav-settings"
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium ${location === '/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
        >
          <Settings2 size={17} className={location === '/settings' ? 'text-primary' : 'text-sidebar-foreground/45'} />
          Data source & settings
        </Link>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-sidebar-foreground/45">Connected source</span>
            <span className={`h-2 w-2 rounded-full ${hasAnalysis ? 'bg-[#62c7a7]' : 'bg-sidebar-foreground/25'}`} />
          </div>
          <div className="truncate text-sm font-semibold">{accountName || 'No account loaded'}</div>
          <div className="mt-1 text-xs text-sidebar-foreground/50">{hasAnalysis ? 'Instagram analytics ready' : 'Load data to get started'}</div>
          <Link href="/settings" className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline" data-testid="link-manage-source">
            Manage source <ChevronDown size={13} className="-rotate-90" />
          </Link>
        </div>
        <div className="mt-5 flex items-center gap-2 px-2 text-xs text-sidebar-foreground/40">
          <CircleHelp size={14} /> Need a hand?
        </div>
      </aside>

      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary md:hidden"><Instagram size={17} /></span>
            <div className="hidden text-xs text-muted-foreground sm:block">Good week to make sense of the numbers.</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden"><Sparkles size={14} className="text-primary" /> Weekly signal</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:flex" data-testid="link-header-settings">
              <Upload size={14} /> {hasAnalysis ? 'Update data' : 'Load data'}
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9b8c9] font-display text-xs font-bold text-[#54223a]" data-testid="avatar-account">MK</div>
          </div>
        </header>
        <main className="min-h-[calc(100dvh-72px)] px-5 pb-28 pt-7 md:px-10 md:pb-12 md:pt-10">{children}</main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-2xl border border-border bg-sidebar px-2 py-2 shadow-xl md:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location === item.href;
          return <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${active ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/55'}`} data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} className={active ? 'text-primary' : ''} />{item.label.split(' ')[0]}</Link>;
        })}
        <Link href="/settings" className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${location === '/settings' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/55'}`} data-testid="link-mobile-settings"><Settings2 size={17} />Settings</Link>
      </nav>
    </div>
  );
}