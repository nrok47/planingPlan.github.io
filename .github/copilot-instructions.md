<!--
Project-specific Copilot / AI agent instructions.
Keep this file concise — describe the repo architecture, key workflows, commands, and code patterns an AI helper should know.
-->
# Copilot instructions for planingPlan.github.io

This project is a TypeScript React SPA (Vite) that visualizes and edits a projects Gantt-style plan. Use these notes to be productive quickly.

1. Project layout & big picture
   - Entry: `index.tsx` -> `App.tsx` mounts the app.
   - UI components live in `components/` (e.g. `ProjectGanttChart.tsx`, `ProjectModal.tsx`, `CalendarModal.tsx`).
   - CSV parsing and shared logic: `src/csvParser.ts` (exports `parseCSV` and `parseProjectsFromCSV`). Tests target this file.
   - Types are in `types.ts` and constants in `constants.ts` (refer to them when adding fields).
   - Static data: `projects.csv` at repo root is used as a fallback data source.

2. Data flow and important behaviors
   - On load App attempts (in this order):
     1. `localStorage.projectsData` (persisted edits)
     2. `VITE_API_URL` (Apps Script / custom API) — accepts JSON, CSV, or JSONP
     3. `projects.csv` fetched from `VITE_DEPLOY_URL` (fallback)
   - The CSV parser is synchronous and tested (`tests/csvParser.test.ts`). When manipulating CSV, reuse `parseProjectsFromCSV`.
   - Changes are saved to `localStorage` (see `App.tsx` effect). There is no backend persistence by default.

3. Environment & run commands
   - Install: `npm install`
   - Dev server: `npm run dev` (runs `vite`)
   - Tests: `npm run test` (runs `vitest`)
   - Build: `npm run build` (runs `vite build`)
   - Preview build: `npm run preview`
   - Useful env vars (prefix with `VITE_`):
     - `VITE_API_URL` — optional Apps Script / API endpoint used by `App.tsx` (example: `https://.../project_api`)
     - `VITE_DEPLOY_URL` — base URL used to construct `projects.csv` path when deployed

4. Patterns and conventions to follow
   - Keep UI strings intact (many labels are in Thai). Avoid changing text unless asked.
   - `project.color` is expected to contain a Tailwind CSS background class (e.g. `bg-blue-500`) — components render it directly.
   - CSV headers are trimmed and mapped to the `Project` type; `parseProjectsFromCSV` coerces `startMonth` and `budget` to numbers.
   - The app tolerates multiple shapes from the API: JSON arrays, `{ data: [] }`, `{ projects: [] }`, or plain CSV text. When implementing API integration, preserve this tolerant behavior.
   - `ProjectModal.tsx` is a minimal placeholder — if you add fields or validations, update `App.tsx` save handlers and `localStorage` interactions.

5. Tests and developer checks
   - Unit tests use `vitest` and cover the CSV parser. Run `npm run test` after changes to `src/csvParser.ts`.
   - When changing types (`types.ts`) or CSV mapping, update `tests/csvParser.test.ts` accordingly.

6. Integration details & gotchas
   - CORS/API: `App.tsx` implements a JSONP fallback for APIs that only expose JSONP. If you add a backend, prefer returning CORS-enabled JSON to simplify client code.
   - Deployment fetch path: `PROJECTS_CSV_URL` is computed from `VITE_DEPLOY_URL` in `App.tsx`. If hosting under a subpath, set `VITE_DEPLOY_URL` appropriately.
   - Local dev uses `projects.csv` only if `localStorage` and `VITE_API_URL` are absent/failed. To test CSV behavior, clear `localStorage` or use Incognito.

7. Safety and scope
   - Do not introduce server-side secrets into the client. Env vars prefixed `VITE_` are bundled into the client at build time.
   - Keep UI changes focused and small — the app is primarily a front-end visualization with no server-side persistence by default.

If anything above is unclear or you want more details (e.g. `Project` shape from `types.ts`, example `projects.csv` rows, or expected API contract), tell me which area to expand and I will iterate.
