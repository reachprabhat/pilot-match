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
- Shipping completed: implementation committed as 4ed372d and pushed to main, then npm run deploy published the backend and six static files to https://first-guanaco-957.convex.site. The first non-interactive attempt stopped at the production confirmation prompt; reran in an interactive terminal and confirmed the already authorised production deployment.
- Live production checks passed on Chrome at desktop, 390px phone and 320px small phone: three saves, fourth blocked, disabled Search and clear message, double-click protection, count retained on reload, reset restoring three, independent founders, error message without charging on injected 503, no overflow or browser exceptions. Eight concurrent requests allowed exactly three; retrying one request charged once. Production screenshots inspected.
- Live tests used two disposable fictional founders added alongside existing rows. Removed both fictional founders and every one of their saved asks using Convex's authenticated dashboard cleanup operation. Verified both real production founders remained byte-for-byte unchanged. No development counts/asks were copied to production, and no AI or WhatsApp call ran.
- Phone check: open your existing personal link on the production address, enter an ask, and watch remaining searches decrease. After three, Search disables; reload preserves the count. In the production dashboard, founderSearches:reset with {"founderId":"1"} restores founder 1 to three; refresh their personal page. Next milestone is 5: AI matching.

## Milestone 5 - real matching checked in dev; awaiting owner review

- Owner approved two anonymous operator matches, each with a score out of 100 and one short reason, then supplied the exact ask to test on founder 1. Actual ask, profiles and matching results remain in Convex; they are not committed as fixtures.
- Search now calls a Convex internal action making one native Responses API request with gpt-6-luna, low reasoning, max_output_tokens 1200 and store false. No tools, web search, additional service, automatic retry, meeting action or WhatsApp call. Followed the explicit single-call design rather than introducing a chat-agent framework.
- OpenAI receives only the ask and founder/operator IDs with allowlisted profile text. Dedicated names, contacts, source URLs, raw rows and link codes are excluded. Known personal names (including name components), phone formats, email addresses and URLs are redacted from free text. Private reference lists are used inside Convex to reject leaks and never included in the OpenAI request.
- The prompt compares all stored profiles against problem, industry, target customer, company size, role, use case and intent. Structured output requests two distinct known IDs with integer scores 0-100 and short plain-language reasons. Unavailable facts remain unknown. Reply validation rejects missing/duplicate/unknown matches, invalid scores, private contacts/names, HTML and overlong reasons. Fit scores are AI assessments, not verified probabilities.
- Replaced save-only counting with reserve/complete/fail steps. A founder has one active search at a time. The shared aiCalls table caps enrichment plus matching attempts at 100 per sliding hour; the founder count increases only when validated matches and the success state commit together. Failed/incomplete/refused calls leave it unchanged and show the required busy message. A 45-second provider timeout and 90-second abandoned-request window prevent lasting locks.
- Request IDs replay saved matches without another provider call or charge. A known failed response allows a new request ID on the founder's next explicit click; no automatic retry. Unknown transport failures retain the same request ID. Old save-only requests remain in the database but cannot bypass matching through the former submit function, which was removed.
- Reset still accepts the sheet founderId. It now also invalidates in-flight matching, so a late response cannot spend a search after reset. Existing rows were preserved through optional schema fields and indexes.
- Added two match cards: side by side on desktop, stacked on phones, with only Operator ID, score and reason. The reason spells out supply chain management instead of SCM. Input/loading/error/limit states, safe text rendering and existing colours/fonts remain. Reload preserves the count; restoring old result cards automatically belongs to a later milestone.
- Saved matching, quota and access checks pass, including failed/incomplete replies, one call/no tools, output privacy, known distinct IDs, success-only charging, cache replay, shared cap, concurrency and reset during matching. Existing enrichment, risks-only, PDF, dash and build-cache checks and Convex TypeScript pass.
- Real test: checked the assembled outbound request for founder 1 against all ten dev operators before sending; verified no stored personal names or contacts. Exactly one matching attempt ran with the owner's supplied ask, returned two valid matches and moved founder 1 from count 0 to 1 (two remaining). Matches and the provider response ID are saved in Convex. Cache replay preserved one attempt and count 1; no rerun or reset was performed.
- Hosted dev browser checks at 1280px, 390px and 320px passed for two cards, responsive layout, empty/overlong asks, double clicks, the exact busy message, preserved input after failure, disabled Search after three, count on reload, reset refresh and no overflow/browser exceptions. These repeatable browser checks use fictional intercepted replies and make no paid calls. Separately rendered the actual saved matches at all three widths and inspected the screenshots without another provider call.
- Real Convex integration checks used a disposable fictional founder: eight concurrent reservations allowed exactly one and returned busy for the other seven; failing it left count zero. Completing a fictional result and replaying it through the hosted HTTP search endpoint returned two matches and count 1, with no provider call. Removed the founder, asks and synthetic attempt records afterward; both real founder rows remained unchanged by these checks.
- Development backend and six static files are published at https://neat-hyena-46.convex.site. Production is unchanged; no commit/push/production deployment for milestone 5 yet.
- Phone check: use your personal link with the origin changed to https://neat-hyena-46.convex.site while preserving #f=. Enter an ask (maximum 300 words) and tap Search to see two anonymous cards. A successful match spends one search; founder 1 already has two left after the authorised real test. Review the two saved results in the dev dashboard Data > founderSearches on the completed row if you prefer to inspect them without another AI call. Next: owner reviews the matches before shipping milestone 5.


## Milestone 5 - owner approved shipping

- Owner confirmed milestone 5 works and authorised commit, push and production deployment. Matching, search-limit, founder-access and Convex TypeScript checks passed before shipping.
- Production preflight found no operator rows; the ten approved development profiles and their existing enrichment evidence will be copied into production with audit references remapped. No research or matching provider call will run during shipping, and real founder counts will be preserved.

- Shipping completed: 85ae646 committed and pushed to main; npm run deploy published the Convex backend and six static files at https://first-guanaco-957.convex.site.
- Copied ten approved operator rows and 17 historical enrichment audit records from dev to production, remapping audit IDs and verifying all profile/evidence fields. No enrichment rerun occurred. Production founder rows remained unchanged.
- Live Chrome checks passed at desktop, 390px phone and 320px small phone with fictional intercepted replies: anonymous match cards, errors, double-click protection, three-search cap, reload/reset and no overflow. Inspected the phone screenshot.
- Live backend checks used a disposable fictional founder: ten profiles available, failed attempt uncharged, completed cached matches returned twice through the HTTP endpoint with count one. No OpenAI call ran. Removed all fictional founder/search/attempt records and verified real founders unchanged.
- Phone check: open your existing personal link at the production address, enter an ask and tap Search. Two anonymous cards show scores and reasons; successful searches count toward three. Next milestone is 6: Request to meet, Park and Reject.

## Milestone 6 - checked in dev; awaiting owner phone review

- Owner approved adding Request to meet, Park and Reject to both existing match cards, with Requested, Parked and Rejected saved per founder/operator and retained on reload. This milestone only records choices; no operator notification, WhatsApp action or introduction exists.
- Added founderChoices in Convex with one indexed row per founder/operator pair. Internal save resolves the existing personal-link fingerprint and accepts only operators in that founder's latest completed matches. Repeated clicks update the existing row. Responses expose operator ID, status and timestamp only. Invalid links, unsupported statuses and unmatched operators return 404, 400 and 409 respectively.
- A separate read endpoint restores the latest completed two anonymous matches and current pair choices. Neither read nor save runs matching, modifies founder/search rows or records an AI call. Existing matching logic and the three-search limit remain unchanged.
- Cards retain their scores, explanations, Inter and warm palette. Request to meet uses the existing brown main button; Park and Reject are neutral. Each card shows a saved status, selected button state, disabled buttons during saving, and a recovery message when saving cannot be confirmed. Old pages cannot apply a returned status to another founder or a different search.
- Development backend and six static files published at https://neat-hyena-46.convex.site. Milestone 6 is not committed, pushed or deployed to production; owner phone confirmation precedes shipping under AGENTS.md.
- Real dev browser test used founderId "1" and its existing personal link and saved matches, with actual mouse clicks on every button on each of operator "5" and operator "2". After each click, read the saved row directly from Convex, reloaded the page, waited for a new page to finish loading and verified the matching Requested, Parked or Rejected label. All six checks passed. Both choices end as Rejected; they remain available to change.
- Before/after database comparisons prove all founder rows, founder 1's search rows, saved matching results and all 28 AI-call records unchanged. Founder 1 stayed at searchCount 1; browser sent zero search requests. No paid AI or WhatsApp request ran.
- An injected 503 on a choice click left its stored Rejected status unchanged and showed "Rejected. Could not confirm your choice. Try again or reload." Reload restored the saved Rejected label. Unknown link, invalid status and unmatched operator checks passed against the real dev HTTP endpoints.
- Saved choice rules, matching, quotas, access, enrichment, evidence, risks, dash, build-cache and Convex TypeScript checks pass. Updated the old browser check to expect restored cards and the old link check to use the founder's current remaining searches. Hosted fictional matching checks and real personal-link checks pass at desktop, 390px and 320px, without spending searches.
- Inspected the phone screenshot; real dev captures at 1280px, 390px and 320px show two cards, six buttons and no horizontal overflow or browser exceptions. Separate design review found no material fixes. Existing design files were preserved; the detector only flags Inter, required by DESIGN.md.
- Phone check: open founder 1's existing personal link with its origin changed to https://neat-hyena-46.convex.site, preserving #f=. The saved two matches appear without pressing Search. Tap a choice, reload and verify its label remains. Search count must stay at 1 with two searches remaining. Next: owner confirms milestone 6 works before commit, push and production deploy.

## Milestone 6 - owner approved shipping

- Owner confirmed milestone 6 works on their phone and authorised commit, push and npm run deploy. Marked milestone 6 complete; milestone 7 is next.
- Pre-shipping choice, matching, search-limit, founder-access and Convex TypeScript checks pass. Shipping includes only the approved saved-choice milestone and its verification/documentation; no notifications or WhatsApp integration.

- Shipping completed: cda86d2 committed and pushed to main; npm run deploy published the Convex backend and six static files at https://first-guanaco-957.convex.site. Live HTML, JavaScript and CSS exactly match the deployed build.
- Live production browser checks used one disposable fictional founder with fictional saved matches. Actual mouse clicks on all three buttons on both cards saved Requested, Parked and Rejected in Convex and retained each label after a fully completed reload. An injected 503 preserved the prior saved choice and showed the recovery message. Invalid link, invalid status and unmatched-operator requests returned 404, 400 and 409.
- Checked live desktop, 390px phone and 320px small phone: two anonymous cards, six buttons, no horizontal overflow or browser exceptions. Inspected the phone screenshot. Search count stayed at one, AI-call records stayed at 17 and the browser sent zero search requests. No paid AI or WhatsApp call ran.
- Removed the fictional founder, its synthetic search and both saved choice rows using authenticated Convex dashboard data functions. Before/after comparisons confirm all existing production founder, search, choice and AI-call records are unchanged. No development results, counts or choices were copied to production.
- Phone check: open your existing personal link at https://first-guanaco-957.convex.site. Existing production matches, if any, appear automatically. Choose Request to meet, Park or Reject on a card, then reload; the saved label remains and the search count does not change. A new AI search is needed only if the founder has no completed production matches. Next milestone is 7: operator notification and In progress status.

## Results screen correction - checked in dev; awaiting owner phone review

- Owner requested a separate results screen to follow DESIGN.md and approved the plan. Successful Search now opens "Your two best-fit operators" and hides the ask screen. The existing two anonymous cards, scores, reasons and choice controls are retained.
- The URL's screen query parameter records results or ask while preserving the existing personal-link fragment. "Back to my ask" and browser back/forward switch screens without calling Search. Reloading results reads the latest saved matches and choices from Convex and stays on results. Reloading ask stays on ask. No profile, ask or choice is stored in browser storage.
- The existing read-only choices.latest response now includes the founder's saved ask so Back after reload restores their text. Matching, the search limit, the save-choice mutation and existing data remain unchanged. Restoring a page focuses its visible heading; results-fetch failures can display an error on the results screen.
- Development backend and static files published at https://neat-hyena-46.convex.site. Production remains unchanged; no commit, push or production deployment for this correction yet.
- Final real dev browser run used two disposable fictional founders, at desktop 1280px and phone 390px, with one actual Search for each. Convex reads showed count 0 before Search, 1 afterward, 1 after reload on results and 1 after Back to my ask. Each browser sent exactly one search request. Saved Requested/Parked choice rows, match scores/reasons and saved asks remained identical through reload, Back, browser back/forward and ask reload. Real founder rows were unchanged.
- A prior browser run was interrupted because another check reused the same browser tab; fixed the saved browser check to create and close its own tab. The interrupted run had one successful real AI call, and the final run had two. Retained all three actual usage records in aiCalls for the hourly cap; removed every disposable founder, search and choice record after testing.
- Saved matching, choices, quotas, access, enrichment, evidence, risks, dash and build-cache checks and Convex TypeScript pass. Updated the saved browser checks to verify separate screens and retained counts, and personal-link checks to verify the saved ask is restored. Hosted browser checks pass at desktop, 390px and 320px with no overflow or exceptions.
- A phone capture initially excluded the browser scrollbar and measured 375px; recaptured with mobile emulation at exactly 390px without another Search. Read-only founder 1 verification kept count 1 before and after Back. Separate design review of both screens at desktop and 390px found no material fixes. Existing design files, font and palette are retained.
- Phone check: use an existing personal link with its origin changed to https://neat-hyena-46.convex.site. To review already saved matches without spending a search, use /?screen=results before the existing #f= fragment. Results show without the ask box; reload stays there. Tap Back to my ask and confirm the saved ask and remaining count. New searches spend one search as before. Next: owner reviews this correction before shipping; milestone 7 remains next.

## Mobile landing correction - checked in dev; awaiting owner phone review

- Owner approved a mobile-only layout correction with the exact steps Ask, Match and Meet. The landing headline now starts near the top at 40px, followed by the unchanged subline, a numbered How it works block and the existing full-width button in the lower part of the screen.
- Only landing markup and mobile CSS changed for this correction. The steps are hidden on desktop. The existing colours, Inter font, headline, subline, button text and link behaviour are preserved; the earlier results-screen correction remains in the working tree.
- Built and published static files to https://neat-hyena-46.convex.site. Production remains unchanged; no commit, push or production deployment for these corrections yet.
- Real Chrome checks at 390x844 and 320x740 passed: headline top 49px and size 40px, exact Ask/Match/Meet steps, no horizontal overflow, and the button fully visible ending at 639px. Captured and inspected both screenshots. The 1280x900 desktop screenshot is byte-for-byte identical to its pre-change capture.
- Clicking Founder, enter your requirements and returning Back preserved the existing flow. The browser sent zero search requests and reported no errors. Build and git diff checks passed.
- Phone check: open https://neat-hyena-46.convex.site without a personal-link fragment to see the landing page. Next: owner reviews the mobile layout before shipping.

## Shared mobile screen layout - checked in dev; awaiting owner phone review

- Owner approved extending the mobile landing layout to Ask, Results, loading, error and empty states. Changed only the mobile CSS for this request: every screen panel starts 24px from the top with 16px outer sides and 24px inside padding; screen headings start at 49px, use 40px Inter at weight 650, and existing main actions span the content width at the bottom of their card. Navigation follows the heading; statuses precede actions. Results retain both complete operator cards and scroll naturally.
- Existing words, colours, fonts, event handlers, matching, counts and saved choices were not edited for this correction. Desktop CSS remains unchanged. The earlier approved results and mobile landing corrections remain in the working tree; an unrelated existing PLAN.md change was left intact.
- Built and published static files to https://neat-hyena-46.convex.site. Production remains unchanged; no commit, push or production deployment yet.
- Captured 13 screen/state comparisons at each exact width, 390x844 and 320x740: generic Ask, empty Ask/no saved matches, filled Ask, personal-link loading, link error, invalid link, search loading, search error, saved-match restoration error, used search limit, Results, saving choice and choice error. Every comparison shows Landing on the left and the full scrollable state on the right. All panel/top/padding/heading/full-width/no-overflow assertions passed. Longer Ask and Results content uses normal page scrolling.
- State checks used intercepted fictional browser replies, never real founder data or paid AI. At both widths, reload and Back kept count 1 and Requested/Parked choices, with zero additional search requests. Choice errors retained their previous saved status. Existing browser contracts passed at desktop, 390px and 320px for matching, failed searches, double-click protection, three-search cap, reload and navigation. Saved-choice and build-cache checks passed.
- Desktop landing screenshot is byte-for-byte unchanged from the pre-mobile-correction baseline. Landing button and Back work with zero searches; browser errors were absent. Separate visual review inspected all 26 paired captures and found no material fixes. Design documentation retained after review; prescribed Inter and warm palette detector findings were accepted.
- Side-by-side screenshot galleries: C:/Users/reach/AppData/Local/Temp/shared-layout/gallery-390.html and gallery-320.html. No private data is present in these artifacts. A screenshot-composition helper initially failed on the favicon request; a corrected bounded helper generated all pairs. Corrected the helper's HTML encoding so comparison labels display cleanly.
- Phone check: open the dev page for Landing, then your existing personal link at the dev origin for Ask; add ?screen=results before its existing fragment to review saved Results without Search. Next: owner phone review before shipping.

## Personal-link landing round trip - checked in dev

- Owner approved preserving a founder's personal-link code and ask when using Back to landing page and then the landing button. The existing Back handler now retains the personal code in the URL and keeps the typed ask and company for a recognised founder. Generic visits keep their existing behaviour. No layout, words, matching, quota or saved-choice code changed for this fix.
- Added the round trip to the existing founder-search browser check. Before the fix, it failed because Back removed the personal-link fragment; after the fix it passes at desktop, 390px and 320px with Search enabled and no additional searches. Updated the existing personal-link check to assert the newly requested preservation rather than its old cleanup behaviour.
- Built and published six static files to https://neat-hyena-46.convex.site. Production remains unchanged; no commit, push or production deployment yet.
- Real dev proof used founder 1's existing private link, real mouse clicks on Back and the landing button, and read-only Convex queries before/after. Search was enabled before and after; the identical personal code, existing ask and company remained. Search count was 2 before and 2 after, browser search requests 0, choice writes 0, saved-choice rows identical and browser exceptions absent. No AI call occurred. Screenshot of the enabled Search button contains no personal code or company data and lives outside the repository.
- Saved matching browser contracts pass at desktop, 390px and 320px, including failed searches, double-click protection, the three-search limit, results reload and navigation. Build-cache and diff checks pass.
- Phone check: open your dev personal link with searches remaining and a valid ask, tap Back to landing page, then Founder, enter your requirements. The same ask and remaining count appear and Search stays enabled. Next: owner phone review before shipping.

## UI corrections - owner approved shipping

- Owner confirmed the UI fixes work in dev and authorised commit, push and production deployment. Shipping covers the separate Results screen, shared mobile layout with Ask/Match/Meet, saved-ask restoration and preserved personal-link landing round trip. No milestone 7 notification or WhatsApp work is included.
- Saved-choice and matching browser checks passed at desktop, 390px and 320px before shipping; Convex TypeScript validation passed. Existing unrelated PLAN.md edits are not included in this commit.

- Shipping completed: 8b3e761 committed and pushed to main; npm run deploy published the production backend and six static files at https://first-guanaco-957.convex.site. The first non-interactive attempt stopped at Convex's confirmation prompt; reran interactively and confirmed using the owner's explicit shipping approval. Production deployment ID: 7e6a6cf3-2fd7-41d7-9b92-d5c59fc1af63.
- All six production assets exactly match the built files. Live browser contracts passed at desktop, 390px and 320px with fictional intercepted replies, covering separate results, navigation, reload, limits, errors and double-click protection without paid AI calls. Production landing checks passed at both phone widths; the desktop landing capture is byte-for-byte unchanged from its original baseline.
- Real production founder 1 checks used its existing private link and actual mouse clicks. Back to landing and the landing button retained the same code, ask and company, with Search enabled. Direct Convex reads showed count 1 before and 1 after; the browser sent zero search requests and zero choice writes, all saved-choice rows stayed identical and browser exceptions were absent.
- A separate real production read-only check opened Results, fully reloaded it and returned Back to my ask. Both matches, their scores/reasons, saved choices and saved ask remained identical; Results remained the active screen after reload. Search count stayed 1. Captured and inspected live mobile landing and real anonymous results screenshots. No data was copied from dev to production and no notification or WhatsApp action ran.
- Phone check: use your existing production personal link. Back to landing then the landing button returns to your own Ask with Search enabled when an ask is valid and searches remain. Use ?screen=results before the existing #f= fragment to review saved Results without spending a search; reload remains there and Back to my ask preserves the count. Next milestone remains 7. The unrelated owner PLAN.md edit remains uncommitted.

## Focused heading outline - owner requested production correction

- Owner clarified that card borders and selected-choice rings must stay, while the black box on programmatically focused page headings must disappear. Added one narrow CSS rule for a focused panel h1 with tabindex=-1. Heading focus remains intact; global keyboard-control focus outlines and selected-choice rings are unchanged.
- Dev checks at 390px verified Ask and Results remain the active focused heading with focus-visible true and outline-style none. Card border stays 1px; keyboard button focus and selected-choice ring both stay 2px. Founder 1's dev count stayed 3, with zero search requests, zero choice writes and no browser exceptions.
- Added focused-heading checks to the existing matching browser contract; desktop, 390px and 320px pass. Built and checked dev before shipping. Owner explicitly requested a production Ask screenshot, authorising deployment of this correction.

- Shipped b192a0e to main and production with npm run deploy; production deployment ID 2ad4f19a-35c1-41a9-8a9e-6b9f1108f2ec. All six live assets match the built files.
- Real production checks at 390px confirm Ask and Results keep heading focus even in keyboard focus-visible mode, with outline-style none and no heading box. Card borders remain 1px, keyboard button outlines and selected-choice rings remain 2px. No overflow or browser exceptions; founder 1's count stayed 2 before/after, search requests 0 and choice writes 0. Captured and inspected the production Ask screenshot after saved matches/ask finished restoring. Screenshot remains outside the repository.
- Phone check: reload your existing production personal link. Ask and Results open with heading focus retained and no black heading box. Next: owner checks the production view; no other changes were shipped. The unrelated PLAN.md edit remains untouched.
