# PROGRESS.md

## Milestone 0 — approved, published and checked live

- Built the landing page with DESIGN.md's exact headline, supporting text and founder button.
- Added the approved placeholder ask screen: editable pilot ask, disabled Search, and "Matching opens soon".
- Used Inter, 20px headings, 16px body text, warm off-white, near-black and a dark-brown primary button.
- No matching, AI, WhatsApp, database connection or saved input. Returning to landing or reloading clears the ask.
- Browser-checked at 1280px desktop, 390px phone and 320px small phone: navigation works, no horizontal overflow, Search stays disabled, fonts load, storage stays empty and typing sends no requests.
- Inspected all six screenshots; independent design review passed after improving button placement on phones.
- Local preview: run `npm run dev`, then open `http://localhost:5173` on the computer.
- Live site: https://first-guanaco-957.convex.site — open on a phone, tap the founder button, type an ask, and confirm Search remains disabled with "Matching opens soon". Back or reload clears the text.
- Public repository: https://github.com/reachprabhat/pilot-match — code committed and pushed to main.
- Convex static hosting 0.2.1 is mounted at `/`; `npm run build` copies only the six public site files to dist, and `npm run deploy` builds, deploys the Convex backend and uploads them to production. Git pushes do not deploy.
- Hosted development and production checks passed at 1280px, 390px and 320px: correct copy and fonts, no horizontal overflow, working navigation, disabled Search, empty browser storage and no requests from typing. No browser exceptions. Production deployment completed successfully.
- Assumptions: dark brown and neutral shades were taken from the reference's feel; no photos, names, fake fit scores or extra sections; a compact page leaves unused viewport space with the approved short copy. The back button returns to landing and clears the ask.
- Reference files are `media/Image 1.png`, `media/Image 2.png`, and `media/Image 3.png`; DESIGN.md uses different filenames.
- `.env.local`, node_modules, dist, browser-check artifacts and CSV/XLSX imports remain ignored. Environment files and key patterns were checked before publishing.
- Milestone 1 results are recorded below.

## Milestone 1 — approved; operator data verified in dev

- Found the source outside the project at `C:\Users\reach\OneDrive\Documents\build-sprint-data\MVP - Operator data.csv` (not operators.csv).
- Source contains ten populated rows plus one empty row. Added an operators schema with a by_operator_id index; no public profile functions or screens added.
- Convex rejected source headers containing spaces. Prepared a normalized JSON import in the operating system's temporary folder, outside the project, and used `npx convex import --deployment neat-hyena-46 --table operators` with that temporary path.
- Omitted the empty row; preserved source IDs and WhatsApp values as text. Empty industry, revenue, company problems and source link fields are stored as "not found". No enrichment or AI calls ran.
- Import reported ten documents added. Independent database read verified ten rows, ten unique operator IDs, and zero field mismatches against the normalized source. All ten source rows share the same WhatsApp value; it was preserved, not changed.
- Original source file hash is unchanged. Temporary JSON was deleted immediately after import; no CSV or profile data is in the project. Schema type checks and dev deployment passed.
- Dashboard: https://dashboard.convex.dev/t/reachprabhat-iitr/build-sprint-app/neat-hyena-46 — select Data, then operators, in the development deployment.
- Owner confirmed milestone 1 works and authorized commit, push and deployment.
- Repaired the replacement character (U+FFFD) in operator 5's currentRole and headline to a plain dash in Convex dev. Database verification confirms both dashes and all ten rows remain. A saved check uses made-up text to verify replacement, preservation and repeat runs.
- Real operator data remains only in dev; deploying code does not copy dev rows to production. The original source CSV remains unchanged.
- Next: milestone 2, company-detail enrichment.
