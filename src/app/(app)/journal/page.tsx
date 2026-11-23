import { requireOnboarded } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { todayKey, parseJsonArray } from "@/lib/dates";
import { JOURNAL_TAGS } from "@/lib/constants";
import { DisclaimerStrip } from "@/components/Disclaimer";
import { createJournalEntryAction, deleteJournalEntryAction } from "@/actions/journal";

export default async function JournalPage() {
  const { user } = await requireOnboarded();
  const entries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 40,
  });

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = todayKey(d);
    return { key, has: entries.some((e) => e.date === key) };
  });

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Progress
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--brand-deep)]">Journal</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Log a day in under a minute. Photos are optional — same lighting/angle, no filters. No
          AI skin score.
        </p>
      </header>

      <div className="surface flex justify-between gap-1 p-4">
        {week.map((d) => (
          <div key={d.key} className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="text-[0.65rem] text-[var(--muted)]">{d.key.slice(5)}</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                d.has ? "bg-[var(--brand)]" : "bg-[var(--brand-soft)]"
              }`}
            />
          </div>
        ))}
      </div>

      <section className="surface space-y-3 p-5">
        <h2 className="font-display text-xl">New entry</h2>
        <form action={createJournalEntryAction} className="space-y-3" encType="multipart/form-data">
          <div>
            <label className="label" htmlFor="date">
              Date
            </label>
            <input className="field" id="date" name="date" type="date" defaultValue={todayKey()} />
          </div>
          <div>
            <p className="label">How skin feels</p>
            <div className="flex flex-wrap gap-2">
              {JOURNAL_TAGS.map((tag) => (
                <label key={tag} className="chip cursor-pointer">
                  <input type="checkbox" name="tags" value={tag} className="mr-1" />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea
              className="field min-h-24"
              id="notes"
              name="notes"
              placeholder="What changed, what you used, climate quirks…"
            />
          </div>
          <div>
            <label className="label" htmlFor="photo">
              Photo (optional)
            </label>
            <input className="field" id="photo" name="photo" type="file" accept="image/*" />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Stored in local <code>uploads/journal</code> for MVP — see README for private bucket
              setup.
            </p>
          </div>
          <button className="btn btn-primary" type="submit">
            Save entry
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">History</h2>
        {entries.map((e) => {
          const tags = parseJsonArray(e.tags);
          return (
            <article key={e.id} className="surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{e.date}</p>
                  {tags.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <form action={deleteJournalEntryAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-xs text-[var(--bad)]" type="submit">
                    Delete
                  </button>
                </form>
              </div>
              {e.notes ? <p className="mt-2 text-sm text-[var(--ink-soft)]">{e.notes}</p> : null}
              {e.photoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/journal/photo?path=${encodeURIComponent(e.photoPath)}`}
                  alt={`Journal photo for ${e.date}`}
                  className="mt-3 max-h-64 w-full rounded-xl object-cover"
                />
              ) : null}
            </article>
          );
        })}
        {!entries.length ? (
          <p className="text-sm text-[var(--muted)]">No entries yet — notes alone are enough.</p>
        ) : null}
      </section>

      <DisclaimerStrip />
    </main>
  );
}
