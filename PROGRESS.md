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

## Milestone 2 — operator 1 trial checked in dev; awaiting owner review

- Owner approved building the action and running operator 1 only. Operators 2–10 must remain untouched until further instruction.
- Added internal operatorEnrichment:run action using the Responses API, gpt-6-luna, low reasoning, 1200 output tokens, one required web_search tool call, and OPENAI_API_KEY from Convex environment variables. Only stored company text goes to OpenAI; no operator name, phone or personal profile is sent. Provider response storage is disabled.
- An atomic reservation records the attempt before the external call and prevents duplicate/concurrent runs. Explicit rerun:true is required to search a previously attempted operator again. No automatic triggers, retries or scheduled calls. The aiCalls table enforces a 100-attempt sliding-hour cap.
- Search status is separate from "not found" fields: absent enrichment means unsearched; completed records timestamp, attempt count, response ID, consulted sources and per-fact source URL/evidence. Failed attempts are recorded and never automatically retried.
- Each accepted fact must use a returned search URL and quote a passage found on that page; the saved value must occur in the supporting passage. Revenue rejects estimates/forecasts and unrelated amounts. Unavailable or unverifiable facts stay "not found".
- Unit checks use fictional examples for repeat-run rules, privacy, one-call/output limits, invalid/unsearched sources, unavailable pages, invented amounts and estimated revenue. Existing dash checks pass; TypeScript and dev push pass.
- Operator 1 completed with industry and two company-specific risks. Source review found a missed published operating-income figure; corrected the accounting-label validator and added a regression check. The owner-only verifyRevenueFromExistingSource action verified and saved the figure from a source already returned by the search, with no additional AI request or search. Actual company facts and evidence stay in Convex only.
- Database audit verifies operator 1 has one attempt and one completed web search, with exactly one aiCalls record. A repeat trigger returns already_searched and leaves the audit unchanged. All ten rows remain; operators 2–10 were confirmed unchanged and unsearched.
- Review in the development dashboard's Data → operators: open operatorId 1 and inspect enrichment.facts for individual source links and evidence. The returned figure carries its reporting period and the source's operating-income label; risks are dated by their cited report.
- No production deployment or GitHub push for this milestone yet. Next: owner reviews operator 1's result before authorizing the other nine.

## Milestone 2 ? remaining nine searched in dev; awaiting owner review

- Owner confirmed operator 1 and authorized exactly one search each for operators 2?10. All nine completed successfully; no reruns were requested or performed.
- Before/after comparison verifies operator 1 is unchanged. Database audit shows ten rows, ten AI attempt records total, and exactly one attempt and one completed web search per operator.
- One of the nine newly searched operators has verified revenue and a stated risk; its industry remains not found. The other eight retain not found for all three fields because returned evidence did not pass page verification. This does not establish that no public information exists; PDF sources and unavailable pages are limitations of this pass.
- Accepted facts retain their source URL and quoted evidence in enrichment.facts; consulted URLs remain in enrichment.consultedSources even when no fact could be verified. Names, profiles and results remain only in Convex, not in repository files.
- Review on a phone in the development dashboard: Data ? operators ? open each row and expand enrichment.facts. No frontend, matching, WhatsApp, production deployment or GitHub push was added by this batch.
- Next: review missing evidence from already consulted sources without another AI search.

## Milestone 2 ? PDF checking and Indian entity corrections

- Owner authorized fixing PDF evidence checking, correcting the broken company accent and rerunning only rows with missing facts once each.
- Evidence fetching now follows validated HTTPS redirects, limits documents to 80 MB and extracts PDF text in the Convex Node runtime using pdf-parse. No separate service or extra AI calls for document reading. HTML checking remains supported.
- A generated fictional PDF regression check confirms published revenue passes and an invented amount fails. Added checks for PDF line-break hyphenation and financial table headings that say revenues. Existing duplicate-run, source and estimate safeguards pass. TypeScript and dev deployment pass.
- Real annual reports were read successfully inside Convex, including a 54 MB report. Configured research targets separately from original operator companies to use the requested Indian entities. Fixed the company accent in the database.
- Exactly nine new searches ran, one each for operators 2?10 because each had at least one missing field. Operator 1 was verified unchanged. Total audit count is 19, with one attempt for operator 1 and two each for the other nine.
- Recovered additional verified facts by reading sources already returned by these searches, with no extra AI requests. Indian company revenue was available for the brewery, so no global fallback was needed. Each saved fact retains evidence and a source link. Financial periods differ; some results are from older investor presentations or a published draft annual return and must be shown with their period.
- Some fields remain not found because sources could not be retrieved or no company-specific supported statement was established. No figure was invented and no generic customer problem was substituted.
- Code and data checked in dev; production shipping remains after owner approval.

## Milestone 2 - risks-only follow-up in dev

- Owner authorized one further search for rows whose stated risks remained not found, targeting latest annual-report Management Discussion and Analysis / Risks and Concerns or latest earnings calls.
- Added a separate risks-only reservation/action and evidence recovery path. Neither patches revenue or industry, including their per-fact evidence. Searches remain internal, company-only, one tool call each, no retries, and use the existing hourly cap.
- Selected seven rows (IDs 3, 4, 5, 6, 7, 8, 10). Six searches completed; one failed and was not retried. Total attempt audit count increased from 19 to 26, exactly seven new attempts. Existing risks on the other three rows were untouched.
- Verified source passages from returned latest earnings calls and saved up to three plain-language risks with a source and verbatim evidence for each. One company risk is explicitly from India-specific remarks in its global group earnings call, concerning currency translation; it is not a generic global operating risk. Unsupported Indian entity risks remain not found.
- Database comparisons confirmed all ten revenue and industry values and evidence unchanged; the three unselected rows were completely unchanged. Unit checks confirm duplicate prevention, financial/industry preservation on finish and recovery, and rejection of invented evidence. PDF tests, TypeScript and dev push pass.
- No further AI requests were made for source reading or recovery. Results remain only in Convex; no personal data was written to project files. Next: owner reviews the updated risks table and remaining gaps.

## Milestone 2 - approved for shipping

- Owner authorised one retry of the failed risks search, latest full-year revenue refresh for one operator, leaving the three specified gaps not found, and commit/push/deploy to close milestone 2.
- The one authorised retry failed again; no third attempt was made. The separate risks reservation now permits an explicit retry of a failed attempt only and increments its count, never automatically.
- Latest FY2025-26 revenue was verified and saved from the annual report already returned by the earlier search, with no new AI search for revenue. Other revenue, industries, risks and the three specified gaps were preserved. Real company figures remain in Convex only.
- Marked milestone 2 complete with accepted missing fields; milestone 3 is next. Production code shipping does not copy development operator data.

- Shipping completed: implementation committed and pushed to main; npm run deploy successfully published backend functions and six static files to https://first-guanaco-957.convex.site.
- After deployment, verified the PDF reader in production against a real annual report without an AI request. Production OPENAI_API_KEY is present; no key value was printed.
- Live browser checks passed at desktop, 390px phone and 320px small phone: fonts load, no overflow or browser errors, ask navigation works, Search remains disabled, no input is saved and typing sends no requests.
- Operator data remains in development; code deployment did not copy real profiles to production. Owner changes to AGENTS.md were preserved outside the implementation commit.

## Milestone 3 - two founders and personal links checked in dev

- Owner approved importing the two founders, generating personal links, showing the founder company on the existing ask screen and publishing a development preview before production shipping.
- Found the source at C:\Users\reach\OneDrive\Documents\build-sprint-data\MVP - Founder data.csv. It contains exactly two populated rows. Imported using npx convex import into dev through a normalized temporary JSON outside the project; deleted the temporary file and verified the original CSV hash unchanged.
- Independent database comparison found exactly two founders and zero mismatches across all 12 source fields. IDs and WhatsApp numbers remain strings. Actual profiles and contacts live only in Convex; none are in project files.
- Generated two distinct 256-bit random codes; stored only SHA-256 fingerprints in indexed founder rows. Raw codes are not stored in the database or repository and are printed only in the owner handoff. Links use URL fragments and are reusable without login.
- Internal indexed lookup and a same-origin POST endpoint return only the corresponding company; names, phones, full profiles and database IDs are never returned to the page. Invalid/unknown links cannot open a founder ask screen. Responses are not cached.
- Links open directly on the ask screen, with company text rendered safely, disabled Search and Matching opens soon. Added loading, invalid-link and connection-retry messages using the existing design. Back clears company context, URL fragment and typed ask. Reloading keeps the link identity but clears the ask. No asks are saved.
- A browser check exposed stale cached JavaScript. Build output now versions script and stylesheet URLs by their content; a regression check covers cache freshness. No extra public files or dependency installation was needed.
- Hosted dev browser checks passed for both personal links at 1280px desktop, 390px phone and 320px small phone. Correct company, no overflow, disabled Search, no saved browser data, no typing requests and cleared input on reload. Link switching, back cleanup, unknown/malformed links and offline retry pass with no browser exceptions. Existing landing/placeholder flow also passes.
- Access checks use fictional data to verify privacy, fingerprint lookup, malformed links, server failures and prevention of accidental link rotation. All existing backend checks and TypeScript pass. Design detector findings only flag the font and palette explicitly required by DESIGN.md.
- Development preview: https://neat-hyena-46.convex.site. No production deployment, GitHub push, AI call, search or WhatsApp action for this milestone.
- Next: owner checks the two personal links on a phone before production shipping. Existing owner edits in AGENTS.md and PRODUCT.md remain outside this change.

## Milestone 3 - owner approved shipping

- Owner confirmed both personal links work on a phone and authorised commit, push and deploy.
- Shipping includes the two founder rows in production with their existing link fingerprints, so the same codes work on the production address. No operators or AI actions are included.

- Shipping completed: committed and pushed to main, then npm run deploy published the backend and six static files to https://first-guanaco-957.convex.site.
- Production has exactly two founders; all source fields and existing link fingerprints match development. The temporary import file stayed outside the project and was deleted.
- Both production links passed live browser checks at desktop, 390px phone and 320px small phone. Correct company, disabled Search, no saved ask, no typing requests, invalid-link handling and offline retry all pass. Inspected the live phone screen. No AI, search or WhatsApp call was made.
- Milestone 3 is complete; milestone 4 is next. Owner edits in AGENTS.md and PRODUCT.md remain untouched.

## Milestones 4 and 11 - checked in dev; awaiting owner phone review

- First committed and pushed only the owner's AGENTS.md and PRODUCT.md edits as 5fa55a8, without deploying.
- Owner approved combining milestones 4 and 11 with a limit of three per founder, then requested an owner-run reset and no charge for failed searches.
- Each founder's optional searchCount lives in Convex; existing founders start at zero. SEARCH_LIMIT in convex/searchRules.ts is set to 3. Personal-link lookup returns company and count information only; no names, phones, profiles or database IDs.
- This milestone saves submitted pilot asks, not AI results. Matching belongs to milestone 5. The page says "Your ask is saved. Matching opens soon." after a successful save. When matching is connected, count only completed matching results; failed AI calls must not consume a search.
- Saving an ask and increasing the count happen in one Convex mutation: both succeed or neither does. Empty, overlong, invalid-link and failed-save requests cost zero. The founderSearches table stores asks and request IDs with a founder/request index. A request ID prevents a retry from charging twice, including when the response is lost after Convex successfully saves the ask. A transport error does not undo a successful database save; retrying the same ask in the same page retrieves the saved attempt.
- Personal links show remaining searches. Empty asks and asks over 300 words or 12,000 characters cannot be submitted. Search disables while saving and after the third save, with "You've used all 3 searches." Reloading and reopening retain the count. Returning to a tab refreshes it without clearing typed input. The generic landing-page ask remains disabled.
- Owner-only founderSearches:reset accepts the founderId field (not the Convex _id) and sets only that founder's searchCount to 0. It preserves asks, profiles and personal links. There is no public reset endpoint. Refresh the founder page after resetting.
- How to reset yourself: open https://dashboard.convex.dev/t/reachprabhat-iitr/build-sprint-app/neat-hyena-46, select Functions, choose founderSearches:reset, enter {"founderId":"YOUR_FOUNDER_ID"} with the ID copied from Data > founders > founderId, then Run. The reply shows searchCount 0 and searchesRemaining 3. For the live app after shipping, select the production deployment before running the same function.
- Saved rule/access checks pass: three successful saves per founder, validation and database failures cost zero, retries cost once, independent founders, private responses and owner-only reset. Existing enrichment, PDF, risks, dash and build-cache checks pass; TypeScript and the development Convex push pass.
- Hosted browser checks on Chrome at 1280px desktop, 390px phone and 320px small phone pass: three saves, disabled button/message, double-click protection, remembered count after reload, reset restoring three, independent founder and generic-link behavior, no overflow or browser storage. Eight simultaneous real Convex requests allow exactly three and reject five. An injected 503 response leaves the count unchanged and shows the required busy message. Screenshots inspected; the design detector only flags Inter and the warm palette required by DESIGN.md.
- Tests used two disposable fictional founders in development. Both founders, their saved asks and temporary verification helpers were removed afterward. Real founders were not searched or reset. No AI or WhatsApp request ran.
- Phone check: use an existing personal link, replacing its origin with https://neat-hyena-46.convex.site while keeping the #f= code. Enter and submit three asks; check remaining counts 2, 1 and 0, the disabled Search button and clear limit message. Reload to confirm the limit persists. Use the reset above, refresh, and confirm three searches are available again.
- Development backend and static files are published for review. Production remains unchanged. Commit, push and npm run deploy follow owner confirmation that the milestone works.

## Reset follow-up - sheet ID verified in development

- Owner reported Founder not found when supplying Convex _id and explicitly authorised testing the reset on founder 1.
- Actual cause: reset queries founders.by_founder_id against the sheet's founderId string; the supplied Convex _id belongs to a different field. Development contains the sheet IDs "1" and "2". Simple sheet IDs were already supported; no import or ID migration was needed.
- Reset now trims surrounding whitespace and gives an actionable error: use the founderId from the sheet, such as "1" or "2", not Convex _id, and check the selected deployment. Added regression checks for wrong IDs, whitespace, both fictional sheet IDs and preservation of the other founder.
- TypeScript, saved search-limit and founder-access checks pass, and the updated backend was pushed successfully to development neat-hyena-46.
- Reproduced the wrong-_id error on the real development row without changing it, then ran founderSearches:reset with {"founderId":"1"}. Count changed from 3 to 0; reply was {"searchCount":0,"searchLimit":3,"searchesRemaining":3}. Database comparisons confirm founder 1's other fields, saved asks and the entire founder 2 row were unchanged.
- Exact dashboard steps: select development neat-hyena-46, Functions > founderSearches:reset, enter {"founderId":"1"}, then Run. For founder 2, use {"founderId":"2"}. Keep the numbers in quotes. Refresh the founder's personal page afterward.
- No production change, AI call, WhatsApp action, additional search, GitHub push or milestone shipping approval occurred.

## Milestones 4 and 11 - owner approved shipping

- Owner confirmed milestone 4 works and authorised commit, push and deployment of the combined search-limit milestone, including milestone 11 and the sheet-ID reset.
- Marked milestones 4 and 11 complete; milestone 5 (AI matching) is next. Searches currently save asks, and the page continues to say matching opens soon.
- Pre-shipping checks passed: search quotas/reset, founder access, enrichment, risks-only, PDF evidence, dash repair, build cache and Convex TypeScript.

