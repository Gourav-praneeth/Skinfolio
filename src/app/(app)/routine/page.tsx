import Link from "next/link";
import { requireOnboarded } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/dates";
import { DisclaimerStrip } from "@/components/Disclaimer";
import {
  addProductAction,
  archiveProductAction,
} from "@/actions/shelf";
import {
  addRoutineStepAction,
  removeRoutineStepAction,
  completeRoutineAction,
  applyRoutineTemplateAction,
} from "@/actions/routine";
import { CLASH_PAIRS } from "@/lib/constants";

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user } = await requireOnboarded();
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const date = todayKey();

  const [products, steps, completions] = await Promise.all([
    prisma.product.findMany({
      where: {
        userId: user.id,
        archived: false,
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { brand: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.routineStep.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: [{ period: "asc" }, { order: "asc" }],
    }),
    prisma.routineCompletion.findMany({ where: { userId: user.id, date } }),
  ]);

  const am = steps.filter((s) => s.period === "AM");
  const pm = steps.filter((s) => s.period === "PM");
  const clashHints = detectClashes(steps.map((s) => s.product?.ingredients ?? s.label ?? ""));

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Shelf + checklist
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--brand-deep)]">Routine</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Build AM/PM from what you own. Mark today in under 30 seconds.
        </p>
      </header>

      <section className="surface space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl">Today ({date})</h2>
          <Link href="/product-check" className="text-sm font-semibold text-[var(--brand)]">
            Product check →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TodayPeriod period="AM" steps={am} done={completions.some((c) => c.period === "AM")} />
          <TodayPeriod period="PM" steps={pm} done={completions.some((c) => c.period === "PM")} />
        </div>
        {clashHints.length ? (
          <div className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--warn)]">
            <p className="font-semibold">Clash hints (suggestions, not locks)</p>
            <ul className="mt-1 list-disc pl-4">
              {clashHints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="surface space-y-3 p-5">
        <h2 className="font-display text-xl">Templates</h2>
        <form action={applyRoutineTemplateAction} className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" name="template" value="minimal" type="submit">
            Minimal
          </button>
          <button className="btn btn-ghost" name="template" value="barrier" type="submit">
            Barrier-first
          </button>
          <button className="btn btn-ghost" name="template" value="acne" type="submit">
            Acne-care-lite
          </button>
        </form>
      </section>

      <RoutineEditor period="AM" steps={am} products={products} />
      <RoutineEditor period="PM" steps={pm} products={products} />

      <section className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl">Your shelf</h2>
          <form className="flex gap-2">
            <input
              className="field"
              name="q"
              defaultValue={q}
              placeholder="Search shelf"
              aria-label="Search shelf"
            />
            <button className="btn btn-ghost" type="submit">
              Search
            </button>
          </form>
        </div>

        <form action={addProductAction} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Product name
            </label>
            <input className="field" id="name" name="name" required placeholder="Cleanser you already own" />
          </div>
          <div>
            <label className="label" htmlFor="brand">
              Brand (optional)
            </label>
            <input className="field" id="brand" name="brand" />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select className="field" id="category" name="category" defaultValue="cleanser">
              <option value="cleanser">Cleanser</option>
              <option value="treatment">Treatment</option>
              <option value="moisturizer">Moisturizer</option>
              <option value="spf">SPF</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="ingredients">
              Key ingredients / INCI (optional)
            </label>
            <textarea className="field min-h-20" id="ingredients" name="ingredients" />
          </div>
          <button className="btn btn-primary sm:col-span-2" type="submit">
            Add to shelf
          </button>
        </form>

        <ul className="space-y-2">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] px-3 py-3"
            >
              <div>
                <p className="font-semibold">
                  {p.name}
                  {p.brand ? (
                    <span className="font-normal text-[var(--muted)]"> · {p.brand}</span>
                  ) : null}
                </p>
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{p.category}</p>
              </div>
              <form action={archiveProductAction}>
                <input type="hidden" name="id" value={p.id} />
                <button className="btn btn-ghost text-xs" type="submit">
                  Archive
                </button>
              </form>
            </li>
          ))}
          {!products.length ? (
            <li className="text-sm text-[var(--muted)]">No products yet — add 3–8 you already use.</li>
          ) : null}
        </ul>
      </section>

      <DisclaimerStrip />
    </main>
  );
}

function TodayPeriod({
  period,
  steps,
  done,
}: {
  period: "AM" | "PM";
  steps: Array<{ id: string; label: string | null; product: { name: string } | null }>;
  done: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{period}</p>
        <span className={`chip ${done ? "chip-active" : ""}`}>{done ? "Done" : "Pending"}</span>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-[var(--ink-soft)]">
        {steps.map((s) => (
          <li key={s.id}>{s.product?.name ?? s.label}</li>
        ))}
        {!steps.length ? <li className="list-none pl-0">No steps yet</li> : null}
      </ol>
      {!done && steps.length ? (
        <div className="mt-3 flex gap-2">
          <form action={completeRoutineAction}>
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="status" value="done" />
            <button className="btn btn-primary" type="submit">
              Done
            </button>
          </form>
          <form action={completeRoutineAction} className="flex gap-1">
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="status" value="skipped" />
            <input
              className="field max-w-[9rem] py-2 text-xs"
              name="skipReason"
              placeholder="Skip reason"
            />
            <button className="btn btn-ghost" type="submit">
              Skip
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function RoutineEditor({
  period,
  steps,
  products,
}: {
  period: "AM" | "PM";
  steps: Array<{ id: string; label: string | null; product: { name: string } | null }>;
  products: Array<{ id: string; name: string }>;
}) {
  return (
    <section className="surface space-y-3 p-5">
      <h2 className="font-display text-xl">{period} steps</h2>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2"
          >
            <span className="text-sm">
              <span className="mr-2 text-[var(--muted)]">{i + 1}.</span>
              {s.product?.name ?? s.label}
            </span>
            <form action={removeRoutineStepAction}>
              <input type="hidden" name="id" value={s.id} />
              <button className="text-xs text-[var(--bad)]" type="submit">
                Remove
              </button>
            </form>
          </li>
        ))}
      </ol>
      <form action={addRoutineStepAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="period" value={period} />
        <select className="field" name="productId" defaultValue="">
          <option value="">Shelf product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input className="field" name="label" placeholder="Or free-text step" />
        <button className="btn btn-primary" type="submit">
          Add step
        </button>
      </form>
    </section>
  );
}

function detectClashes(texts: string[]): string[] {
  const blob = texts.join(" \n ");
  const hints: string[] = [];
  for (const [a, b, tip] of CLASH_PAIRS) {
    if (a.test(blob) && b.test(blob)) hints.push(tip);
  }
  return hints;
}
