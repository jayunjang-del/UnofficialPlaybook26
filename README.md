# 2026 UNOFFICIAL PLAYBOOK: Nex Summer Internship

Interactive web edition of the 2026 NEX Summer Internship playbook.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

## Main files

- `app/page.tsx` — page order, click/drag controls, special cut pages, tracing-paper overlay
- `app/globals.css` — layout, binding, page-turn animation and visual effects
- `public/pages/` — all page artwork

The GitHub repository should include the full contents of this folder. Do not commit `node_modules`, `.next`, or environment files.
