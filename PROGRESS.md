# PROGRESS.md

## Milestone 0 — built and checked locally; awaiting owner phone check

- Built the landing page with DESIGN.md's exact headline, supporting text and founder button.
- Added the approved placeholder ask screen: editable pilot ask, disabled Search, and "Matching opens soon".
- Used Inter, 20px headings, 16px body text, warm off-white, near-black and a dark-brown primary button.
- No matching, AI, WhatsApp, database connection or saved input. Returning to landing or reloading clears the ask.
- Browser-checked at 1280px desktop, 390px phone and 320px small phone: navigation works, no horizontal overflow, Search stays disabled, fonts load, storage stays empty and typing sends no requests.
- Inspected all six screenshots; independent design review passed after improving button placement on phones.
- Local preview: run `npm run dev`, then open `http://192.168.1.113:5173` on a phone on the computer's Wi-Fi. Computer and preview must remain running. Not deployed.
- Assumptions: dark brown and neutral shades were taken from the reference's feel; no photos, names, fake fit scores or extra sections; a compact page leaves unused viewport space with the approved short copy. The back button returns to landing and clears the ask.
- Reference files are `media/Image 1.png`, `media/Image 2.png`, and `media/Image 3.png`; DESIGN.md uses different filenames.
- No commit, push or deployment yet: AGENTS.md requires the owner to confirm the milestone works first. The folder is not currently a git repository.
