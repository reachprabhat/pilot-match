# DESIGN.md

Read this before building or changing any screen. If a choice isn't covered here, ask me instead of guessing.

## 1. The feeling, in labels

Neat and professional look like a CXO meeting room. Easy on eye. Refer to below screen shot

![Design reference](media/image1.png)

One big number per screen. The value prop/fit details should be clearly visible and highlighted. No chart. No large empty space. The CTA should be easy to site and have contrasting text to read clearly.

## 2. References, one per component

User colour palatte like below

![Design reference](media/image1.png)

Search box like

![Design reference](media/image2.png)

Matched operator profile and CTA

![Design reference](media/image3.png)

Take the box with text

Ignore photo and name

## 3. Type and colour

Font: Inter

Sizes: display 40 for the fit percentage · heading 20 · body 16

Text: near-black on warm off-white

Accent: Dark Brown as per the color palette, only on the main button

Errors: red

## 4. Screens

Ask: Enter the requirement as free text. For e.g. “We have an AI-enabled Supply chain & manufacturing decision intelligence tool that identifies supply chain/production bottlenecks across industries. Looking for a 6–8 week pilot with ₹100 Cr+ companies, ideally contract manufactures, retail or industrial products."

“Search” button

Main action: Enter the requirement -\> Search

Empty: Enter the requirement as free text. For e.g. “We have an AI-enabled Supply chain & manufacturing decision intelligence tool that identifies supply chain/production bottlenecks across industries. Looking for a 6–8 week pilot with ₹100 Cr+ companies, ideally contract manufactures, retail or industrial products."

Loading: "Looking for the best operator…" ·

Error: "Error! Please re-load the page”

Done: Display Operator card page

Operator card: Matched profile. Top to bottom: Fit percentage, "**\<** Head of Supply Chain Management with 25+ years of experience across procurement, planning, logistics, inventory and fulfilment.  
Leads supply-chain transformation, operational excellence and cost optimization, making him a strong potential sponsor for an AI-driven manufacturing/supply-chain pilot.”

Main action: Interested to meet -\> Request in-progress

Empty: "No match found. We will notify as soon as there is a match" ·

Loading: "Contacting the best operator…" ·

Error: "That doesn't look like a professional profile. Please enter your requirements again." ·

Done: Display meeting request status

## 5. The first screen's words

Headline : Meet the best operators

Under it: Connects best operators to startup founders with new innovative solutions

Button : Founder, enter your requirements

## 6. Principles

\- One main action per screen, in thumb reach.

\- Every AI answer can be corrected in one tap.

\- Errors say what to do next, never a code.

\- No new colour or size without asking.

\- Check every screen at phone width before saying done.

## Approved Besto branding
All screens use an Inter 20px Besto text wordmark and the exact 16px promise Warm pilot intros to senior operators. Shared non-navigating header and normal-flow footer: Besto / Ask. Match. Meet. Existing warm surfaces, near-black text, brown primary controls and red errors remain. All headings are 20px; fit scores remain 40px. Full-screen reveals include the same header/footer with buttons near the bottom; saved welcomes and private saved facts remain unchanged.

## Approved handshake logo update (supersedes the header above)
Original geometric solid-fill handshake SVG with thin finger separations, dark brown #493426. Beside it: bold Inter 40px Besto in #493426; below Besto: Inter 16px Meet the best Operators in existing lighter brown #514a43. This is the only tagline; remove the previous Warm pilot intros promise everywhere. Existing shared footer, 20px headings, 40px fit scores, palette and all screen behavior remain.


## Approved navy system and operator signup (supersedes brown palette)
Shared tokens in styles.css: accent #142D4E, lighter tagline #49627D, hover #1E416B, ink #20262E, muted/placeholder #52647A, line #CDD5DF, disabled #E2E7ED. Preserve cream background #f5f2ec, surface #faf8f4 and red errors #a32720. WhatsApp is #25D366 with white text, explicitly requested by owner. All screens use the same tokens, Inter fonts and original geometric handshake.

Phone header: original SVG viewBox cropped to 0 12 96 60, 116px wide by 72px tall at 390px; visible handshake taller than the 64px name/tagline block. Besto is 40px bold with 40px line height, sole tagline Meet the best Operators is 16px/20px with 4px gap. Lockup gap 12px, phone edges 16px, header padding bottom 12px. Keep existing shared footer. Ask textarea is 192px on phones, scrolls internally, preserves full ask; Search visible in a 390x844 viewport.

Signup at /signup.html: paired identity/contact fields, full-width revenue dropdown, two wrapping checkbox chip groups capped at three, exact required consent, Submit for approval. Input order/copy and vocabulary follow the approved plan. Source of both chip lists and revenue ranges is convex/lib/operatorApplication.ts; the page reads public vocabulary only. Pending/Approved status is saved separately from existing operators. Private admin adds a Pending operators section without replacing meeting sections. Existing owner personal-link generation and manual sharing remain unchanged.


## Signup refinement
Your industry replaces Pilot preferences: the same vocabulary rendered as a required single-choice radio chip group, with Choose exactly one guidance. Areas I can help with retains checkbox chips and the existing three-choice cap. Immediately below it, optional Any other pain points you have textarea, 112px initial height, maxlength 200, and Optional / Maximum 200 characters guidance. Existing colors, header, form spacing and consent unchanged.


Other industry chip: final radio option in the existing Your industry group. Reveal a full-width Your industry (Other) text input immediately below the chips only when selected. Native maxlength 50, required for Other, disabled/hidden for ordinary chips, with Maximum 50 characters helper. Existing typography, navy tokens, spacing, help areas, pain-points box and consent unchanged.

Admin approved operators: reuse existing section/card typography and spacing; name, company, industry, approved date, then full-width WhatsApp-green (#25D366) Send on WhatsApp with white text. New request cards add Not notified/Notified and matching green Notify operator. Header, signup, reveal and other screens retain their current layouts. Long IDs wrap at phone width. Admin guidance states that opening a draft is not delivery.

## Dev daily matches and QR reveal states
Reuse the existing navy/cream/Inter header, footer and cards. Results title: Your best-fit operators. Show X searches left today on Ask and Results. Locked founder reveal keeps the existing full-screen shell, shows Accepted. Pay to see who it is., a centred 240px saved QR and waiting instructions; no identity or WhatsApp button until owner Mark paid. Admin Payments and New operator matches panels reuse existing admin styling. Notify founder stays WhatsApp green #25D366 with white text. Operator and ordinary revealed card layouts remain unchanged.


## Returning founder home (dev only)
Personal links reopen at home with Your operators, Your best-fit operators, and Search for new operators in that order. Your operators lists every saved request once under its public operator number, with latest Requested, Accepted, Declined or Locked until payment status. Only existing allowed reveals show identity and WhatsApp; locked cards retain the QR payment flow. Best-fit cards remain capped at two and exclude all request history. Saved scores, explanation and search allowance remain unchanged. Preserve navy/cream/Inter, 16px corners and phone spacing. A successful search opens results with clearly separate operator-history and best-fit sections; Back to my home returns to the ask.


Best-fit results show only eligible saved scores of 80 or more, at most two. When none qualify, show exactly: "No strong match yet. Besto's AI will notify you when a better-fit operator joins." Preserve Your operators and all payment/reveal UI. Every completed search spends one daily search even when no candidate qualifies; errors remain uncharged.


Each search has at most its original top two scored operators, both subject to the 80 floor. Rank three or lower never fills a requested slot. When both original qualifying matches are requested, the best-fit section contains no cards and exactly: "You've requested both matches from this search. Search again for new operators." Your operators and existing reveal/payment cards remain unchanged.


Accepted founder/admin cards share payment labels: Free (first connect), Payment pending, or Paid, marked <saved date/time> IST. Display uses saved paidAt before free status, independent of grandfathered access. Founder cards place payment label after meeting status. QR, locks, reveal and operator layout remain unchanged.

## Approved matching footer branding
Footers reuse the header's exact inline handshake SVG, brand-lockup and brand-wordmark styles. Besto remains Inter 40px bold navy; Ask. Match. Meet. appears below Besto using the shared Inter 16px/20px lighter navy tagline rule. Centre the complete lockup within the existing footer. Header and all page content, buttons, flows and data remain unchanged.
