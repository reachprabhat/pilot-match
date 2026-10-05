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
- Next: milestone 1, operator loading. No later milestone has been built.
