# Punnawat Lohanuit — Resume Web

Single-page resume site generated from `public/punnawat-resume.pdf`, with a QR code that opens the live URL.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion
- Zod (resume schema)
- Vercel hosting
- `qrcode` (build-time script)

## Content model

| File | Role |
|------|------|
| `src/data/resume.json` | Resume values shown on the public page |
| `src/data/edit-form.json` | **JSON-driven form schema** for `/edit` (sections, fields, add defaults) |
| `src/lib/resume-schema.ts` | Zod validation |
| `src/components/edit/JsonDrivenForm.tsx` | Renders the form from `edit-form.json` |

To change form layout (labels, field order, new sections), edit **`edit-form.json`** — no React field markup required.

## Develop

```bash
npm install
npm run generate:qr   # optional; uses SITE_URL / NEXT_PUBLIC_SITE_URL
npm run dev
```

Open http://localhost:3000/edit — enter password **`punpun`** (override with `RESUME_EDIT_PASSWORD`). **Save to disk** writes `src/data/resume.json` locally.

### Production edits

`/edit` is password-gated. After unlocking:

1. Edit fields
2. Click **Validate & download** (Vercel filesystem is read-only) or **Save to disk** locally
3. Replace `src/data/resume.json` in the repo if you downloaded it
4. Redeploy

Set `RESUME_EDIT_PASSWORD` in Vercel env if you want a different password than the default.

## Generate QR

After you have a production URL:

```bash
SITE_URL=https://your-deployment.vercel.app npm run generate:qr
```

Writes `public/qr/resume-qr.png`. Commit and redeploy so the footer QR matches production.

## Live

- Site: https://my-portfolio-two-tau-13.vercel.app
- Edit: https://my-portfolio-two-tau-13.vercel.app/edit
- QR: `public/qr/resume-qr.png` (points at the site URL above)

## Deploy

```bash
npx vercel --prod
```

`NEXT_PUBLIC_SITE_URL` is set on the Vercel project for Open Graph `metadataBase`.
