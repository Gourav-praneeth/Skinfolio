import Link from "next/link";
import { requireOnboarded } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { todayKey, parseJsonArray } from "@/lib/dates";
import { BrandMark } from "@/components/BrandMark";
import { DisclaimerStrip } from "@/components/Disclaimer";
import { logoutAction } from "@/actions/auth";
import { completeRoutineAction } from "@/actions/routine";

export default async function HomePage() {
  const { user, profile } = await requireOnboarded();
  const date = todayKey();

  const [completions, amSteps, pmSteps, recentJournal] = await Promise.all([
    prisma.routineCompletion.findMany({ where: { userId: user.id, date } }),
    prisma.routineStep.count({ where: { userId: user.id, period: "AM" } }),
    prisma.routineStep.count({ where: { userId: user.id, period: "PM" } }),
    prisma.journalEntry.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    }),
  ]);

  const amDone = completions.some((c) => c.period === "AM" && c.status === "done");
  const pmDone = completions.some((c) => c.period === "PM" && c.status === "done");
  const concerns = parseJsonArray(profile.concerns);

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <BrandMark
          size="md"
          subtitle={`Hi ${user.name?.split(" ")[0] ?? "there"} — today’s loop, not a skin score.`}
        />
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost text-xs">
            Sign out
          </button>
        </form>
      </div>

      <section className="surface p-5 animate-rise">
        <h2 className="font-display text-xl text-[var(--brand-deep)]">Today</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{date}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PeriodCard
            period="AM"
            done={amDone}
            stepCount={amSteps}
          />
          <PeriodCard
            period="PM"
            done={pmDone}
            stepCount={pmSteps}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/chat" className="surface block p-5 transition hover:border-[var(--brand)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            Coach
          </p>
          <p className="mt-1 font-display text-xl">Ask about your routine</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Context from profile
            {concerns.length ? ` (${concerns.slice(0, 3).join(", ")})` : ""}.
          </p>
        </Link>
        <Link href="/journal" className="surface block p-5 transition hover:border-[var(--brand)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            Journal
          </p>
          <p className="mt-1 font-display text-xl">
            {recentJournal ? "Continue your log" : "Log how skin feels"}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Notes first; photos optional. No vanity score.
          </p>
        </Link>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/routine" className="btn btn-primary">
          Open routine
        </Link>
        <Link href="/product-check" className="btn btn-ghost">
          Product check
        </Link>
        <Link href="/profile" className="btn btn-ghost">
          Profile
        </Link>
      </div>

      <DisclaimerStrip />
    </main>
  );
}

function PeriodCard({
  period,
  done,
  stepCount,
}: {
  period: "AM" | "PM";
  done: boolean;
  stepCount: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{period} routine</p>
        <span className={`chip ${done ? "chip-active" : ""}`}>
          {done ? "Done" : stepCount ? "Due today" : "Empty"}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {stepCount ? `${stepCount} step${stepCount === 1 ? "" : "s"}` : "Add steps in Routine"}
      </p>
      {!done && stepCount > 0 ? (
        <form action={completeRoutineAction} className="mt-3">
          <input type="hidden" name="period" value={period} />
          <input type="hidden" name="status" value="done" />
          <button className="btn btn-primary w-full" type="submit">
            Mark {period} done
          </button>
        </form>
      ) : null}
    </div>
  );
}
