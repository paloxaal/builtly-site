# builtly-site

Static marketing site for Builtly Engineering. Deployed via Vercel.

## Structure

```
.
├── index.html              # Landing page (3 live demos inline: BIM showcase, Voronoi engine, vertical section)
├── platform.html           # Platform overview
├── industries.html         # Industry coverage
├── about.html              # Team, board, advisory
├── careers.html            # Open roles
├── contact.html            # Contact form
├── trust.html              # Security, compliance, partners
├── vercel.json             # Cache headers + clean URLs
├── logos/                  # Customer logos (8 partners)
├── logo-white.png          # White logo for dark backgrounds
└── data/                   # Source data (inlined into index.html — kept here for reference)
    ├── saga.json           # Saga Park IFC extraction (148 KB, 2622 elements)
    └── steinan-plan02.json # Steinan B1 PLAN 02 extraction (17 KB, 173 walls)
```

The data JSON files are already inlined as `<script type="application/json">` blocks inside `index.html`. They're committed here as source-of-truth and reference; they don't need to be served separately. If you add `.vercelignore` listing `data/`, Vercel will skip uploading them (saves ~165 KB per deploy).

## Local preview

Any static-file server works. Simplest:

```bash
cd /path/to/builtly-site
python3 -m http.server 8080
# Open http://localhost:8080
```

## Deploy

Connected to Vercel via GitHub — every push to `main` deploys to production, every branch/PR gets a preview URL.

Manual one-shot deploy:

```bash
npx vercel deploy        # preview
npx vercel deploy --prod # production
```

## Architecture notes

- Single-page-per-route, no SPA framework, no build step. Plain HTML + inline CSS + inline JS.
- Three live visualizations in `index.html`, all driven by inline JSON data:
  - **BIM showcase** — Three.js r165, 3D isometric reveal of Saga Park (2622 structural elements)
  - **Voronoi engine** — Canvas 2D, deterministic load-tributary tessellation (Sutherland-Hodgman half-plane clipping)
  - **Vertical section** — SVG, 9-storey reveal of a residential building (bottom-up storey-by-storey, color-coded element counts)
- Design tokens: Manrope (display), Newsreader (serif italic accents), JetBrains Mono (mono). Cream `#FAFAF7`, ink `#131820`, teal `#14B8A6`, rust `#B5614A`.
- All paths root-relative (`/about.html`, not `./about.html`) for clean deploy.

## Domain plan

- `builtly.ai` → this site (Vercel)
- `app.builtly.ai` → application (Render)
