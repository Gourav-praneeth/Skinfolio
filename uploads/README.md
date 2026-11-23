# Journal photo storage (MVP stub)

Photos uploaded from the Journal tab are saved under:

```text
uploads/journal/<userId>/<timestamp>-<id>.<ext>
```

They are served only to the owning signed-in user via:

```text
GET /api/journal/photo?path=<userId>/...
```

## Why this is a stub

- Files live on the app server disk — fine for local/dev and tiny tester loads.
- Not durable across ephemeral hosts (many Vercel deployments wipe local disk).
- No CDN, virus scan, or EXIF stripping beyond what you add later.

## Production recommendation

Use a **private** object store with per-account keys and short-lived signed URLs:

1. **Vercel Blob** — set `BLOB_READ_WRITE_TOKEN`, store keys as `journal/<userId>/…`, never mark public.
2. **S3 / R2 / GCS** — private bucket; generate signed GET URLs in the photo API; delete objects on account deletion.

Update `src/lib/storage.ts` to write to the bucket instead of `fs`, and keep the same `photoPath` column as an object key.

## Tip for users

Same lighting, same angle, no filters. Journal is for trends you notice — Skinfolio does not score skin age from photos.
