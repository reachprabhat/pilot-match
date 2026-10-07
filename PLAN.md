# PLAN.md

## Milestones

* Milestone 0 — complete: Build the landing page using the words and design in DESIGN.md.
* Milestone 1 — complete: As product owner, load 10 senior operator profiles in supply chain and manufacturing in India, including WhatsApp contact numbers.
* Milestone 2 — complete: As product owner, enrich each operator with company revenue, industry and stated problems once at load time.
* Milestone 3 - complete: As product owner, load founder profiles including WhatsApp contact numbers and generate a personal link for each founder.
* Milestone 4 - complete: As product owner, control the maximum searches allowed per founder (N) to control AI usage.
* Milestone 5 - complete: As a founder, enter a pilot ask and see the best matching operators.
* Milestone 6 - complete: As a founder, see fitment scores and explanations and choose "Request to meet", "Park" or "Reject".
* Milestone 7 - complete: Each operator gets a personal link, like founders, to a "Requests for you" screen listing founders who pressed "Request to meet", with the business opportunity card and no founder name or phone number.
* Milestone 8 - complete: As an operator, tap "Interested" or "Not relevant"; the choice is saved and shown back to the founder as "Accepted" or "Declined", respectively.
* Milestone 9 - complete: As Prabhat, open a private admin page with its own secret link, listing new requests so I can WhatsApp the operator their personal link by hand, and accepted requests with both founder and operator names and phone numbers so I can send the introduction by hand.
* Milestone 11 - complete: As a founder, use up to N searches before search is disabled.
* Milestone 12: As a founder, close and reopen the app and find my data still there.
* Milestone 13: As an operator, close and reopen the app and find my data still there.

## Parked ideas

* Sign up and login.
* Operators enter their pain points and receive founder matches.
* Meeting scheduling and automatic follow-ups.
* Check whether a meeting happened and collect its outcome.
* Use meeting feedback to improve matching.
* New ideas go here for future consideration.
* Ask screen without a personal link: no next step for new founders


## Approved extension: Accepted connection reveal

Dev verified; owner authorised dev proof followed by production deployment. Save one AI welcome per accepted request, show each person a first full-screen view and later card, and restrict contacts to the accepted pair. Hide on Not relevant.

Complete: Accepted connection reveal shipped and live-verified; original milestone 12/13 scope remains unchanged.

## Approved extension: WhatsApp message link

Dev verified; authorised for deployment. Clean the saved number, add 91 only for ten digits, and open a new tab with the specified first-name greeting prefilled. Layout and contact access stay unchanged. Native phone-app screenshot requires the owner phone.

WhatsApp link extension shipped after dev checks: live exact message/new-tab behavior verified. Native phone-app screenshot remains an owner check.

## Approved extension: Besto branding
Owner approved dev first then deploy. Shared header/footer on landing, ask, results, operator requests, both reveals, admin and recovery states; WhatsApp drafts say introduced through Besto. Parked no-personal-link Ask issue addressed with guidance only; other parked ideas stay parked. Dev proof followed by live 390px screenshots and production-data comparison.

Complete: Besto branding dev tested, deployed, and all live 390px screen states captured; underlying production data and links unchanged.

## Approved extension: original handshake branding
Owner approved dev then deploy: original geometric handshake, large dark brown Besto wordmark, sole tagline Meet the best Operators. No other screen or data-flow change; capture all live screens at 390px.

Complete: original handshake and sole tagline dev verified, deployed, all live screen states captured at 390px; production data unchanged.


## Approved extension: operator signup and navy branding (dev only)
Owner approved the public operator signup plan, navy palette and compact shared header. WhatsApp buttons stay #25D366 with white text. New applications are Pending in a separate table; only private-admin approval inserts a new operator into the existing matching table. Identity/contact fields and consent required; each vocabulary chip list allows zero to three selections. Existing profiles, links, matching/scoring, quota, meeting flows and Accepted-only contact access stay unchanged. Production deployment is not authorised for this extension.

Dev complete: real signup and approval walked in browser, Pending excluded from matching, approval replay inserts no duplicate, denied admin cannot read/approve. 390px signup, Ask and both reveal screenshots captured. Next: owner reviews the dev site on their phone.


## Approved signup refinement (dev only)
Rename Pilot preferences to Your industry and require exactly one choice for new applications. Keep help areas unchanged. Add optional Any other pain points you have, maximum 200 characters, mapped on approval to the existing companyProblems field matching reads. Existing operators, matching logic, approval flow and production remain unchanged. Older Pending applications retain their prior industry selections and approval behavior. Dev browser proof and data comparison complete; phone review next.


## Approved Other industry option (dev only)
Keep exactly one Your industry choice and add Other. Selecting Other reveals a required short text field capped at 50 characters; approval saves its trimmed value in the existing industry field. Help areas and optional 200-character companyProblems mapping remain unchanged. Owner explicitly authorised a fictional Fashion E-commerce signup and approval. Existing operators, matching logic, approval flow and production unchanged.

## Approved operators and manual WhatsApp notices (dev only)
Owner-authorised extension completed: signup retains single Your industry / Other max 50 and optional companyProblems max 200. Approval now creates the standard operator personal requests link without rotating any existing link. Admin lists approved applications with saved name, company, industry and approval date; green Send on WhatsApp opens the exact welcome draft. Each current new request has green Notify operator using saved company/name/link; tapping persists a separate Notified marker without changing request status or sending a message. Owner-only access, matching and reveal unchanged. Browser proof complete; production not authorised.

## Approved daily matches, QR access and new-operator matching (dev only)
Built and browser-verified on neat-hyena-46. Show Your best-fit operators with the top two eligible operators; every previously requested/connected operator is excluded, and saved asks refill eligible candidates without spending another daily search. When fewer than two eligible profiles exist, show the available profiles and an honest empty state. Three successful searches per founder per India calendar day; failed calls do not charge quota. Daily count refreshes at midnight and when the page returns to view.
First accepted unique operator per founder stays free; later founder reveals show the admin-uploaded QR until owner Mark paid. Existing seen intros were grandfathered once. Operator-side acceptance and reveals remain unchanged. Contacts and saved welcomes are omitted from locked replies. Existing reveal welcome generation stays once per accepted request.
New approval creates one queued batch job and makes one AI call across the complete eligible operator pool and all current saved founder asks, with anonymous profiles only. It updates the saved top-two list, preserves requested card details, and lists qualifying founders privately with the exact green Notify founder WhatsApp draft and their unchanged personal link. Global AI cap remains shared. No automatic WhatsApp sends.
Proof completed at 390px: search 3 to 2, eligible list after first connect, first free reveal, locked second QR reveal, second reveal after owner Mark paid, and new-operator Notify list. QR proof uses a clearly labelled non-payment demo image because no real UPI QR was supplied. Production was neither accessed nor deployed. Next: upload the real UPI QR in dev admin and review on the phone.
