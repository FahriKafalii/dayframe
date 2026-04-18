import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  ListChecks,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <header className="h-14 flex items-center justify-between max-w-6xl mx-auto px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] flex items-center justify-center text-sm font-semibold">
            D
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Dayframe
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] h-9 px-3 inline-flex items-center"
          >
            Sign in
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-full px-3 py-1">
            <Sparkles size={12} />
            A calm execution system
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[color:var(--color-fg)] leading-[1.05]">
            Plan the day.
            <br />
            Write the story.
            <br />
            <span className="text-[color:var(--color-fg-subtle)]">
              See the pattern.
            </span>
          </h1>
          <p className="mt-6 text-lg text-[color:var(--color-fg-muted)] max-w-2xl leading-relaxed">
            Dayframe is a personal operating system for focused individuals.
            Tasks, journaling, and calendar visibility — on one quiet surface,
            built to reward showing up.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Start free
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                I have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            icon={<ListChecks size={18} />}
            title="Task discipline"
            body="Capture what matters. Move it through OPEN, DONE, or drop it — with priorities that actually steer your attention."
          />
          <Feature
            icon={<NotebookPen size={18} />}
            title="Daily journal"
            body="One entry per day. Mood, wins, blockers, notes. A quiet ritual you can keep."
          />
          <Feature
            icon={<CalendarRange size={18} />}
            title="Calendar visibility"
            body="A month view that stitches tasks and journaling together. Your rhythm, made visible."
          />
        </div>
      </section>

      <section className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Build the week you meant to have.
          </h2>
          <p className="mt-3 text-[color:var(--color-fg-muted)] max-w-xl mx-auto">
            No clutter, no gamification. Just a workspace that treats your
            attention with respect.
          </p>
          <div className="mt-6">
            <Link href="/register">
              <Button size="lg">
                Create your account
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-[color:var(--color-fg-subtle)]">
        © {new Date().getFullYear()} Dayframe. A disciplined daily operating
        system.
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl p-6 shadow-[var(--shadow-card)]">
      <div className="h-9 w-9 rounded-lg bg-[color:var(--color-surface-2)] flex items-center justify-center text-[color:var(--color-fg)]">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-[color:var(--color-fg-muted)] leading-relaxed">
        {body}
      </p>
    </div>
  );
}
