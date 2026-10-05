# AGENTS.md

## 1. How the product works
Interface: Each founder has a personal link with a long random code. The app find the founder from that code, No login. Web page and the one thing they do there: free text based search. 

Business logic: Based on founder's inputted requirement, there should be best fit assessment across all the operators present in the platform. The match reads the founder's profile and their ask together. The AI only receives profile text and IDs, never names or phone numbers. The fit assessment should be from multiple angles - problem, industry, ICP, company, use case, intent, etc. The business opportunity must be dynamically generated (based on the features offered only) to make it appealing for the operator. The search should calculate a Fitment score out of 100. Top 2 profiles based on fitment score must be selected to be shown next to each other. Once a founder selects an operator for meeting, a request notification has to be
sent to the operator. Once the Operator accepts the request, an brief intro should be send along with Name and contact details to respective WhatsApp number. The AI must never: show an operator's name or contact before both operator and founder has accepted each other's request to meet.

Database: a Convex table of operators. For each operator: Unique Operator ID, Name, WhatsApp contact number, Company, Current role, About.revenue band, industry, company problems, source link, and "not found" when nothing is public. a Convex table of founders. For each founder: Unique Founder ID, Name, WhatsApp contact number, Company, Current role, About, Pilot done, industry, top features, free text searches. For each search: Business Opportunity card, List of Best fit Operator profiles. For each Operator profile, Fitment score, Detailed explanation of profile fit, Detailed explanation of industry fit, Detailed explanation of company fit, Detailed explanation of problem fit. a Convex table of meeting transactions. For each transaction: Unique transaction ID, Unique founder id, Unique Operator id, Meeting status, timestamp.


Third party: [ChatGpt AI, searches and consolidate best fit score and details based on founder's intent search, and where its key is stored: Key: OPENAI_API_KEY in Convex environment variables, dev and prod.], [OpenAI web search, searches and consolidate revenue band, industry, company problems, source link and where its key is stored: Key: OPENAI_API_KEY in Convex environment variables, dev and prod.] 
[WhatsApp Cloud API, used to share name and contact details, Key: WHATSAPP_TOKEN in Convex environment variables, dev and prod.]
Not in v1: Sign up, Login, Operator keying their pain point and best founder match is provided, Feedback loop to check if meeting happened and did it finally resulted in getting a pilot

## 2. How we work
- Read IDEA_SCOPE.md, PRODUCT.md, PLAN.md and PROGRESS.md before anything else, and DESIGN.md before any screen work.
- Before writing code, tell me in two or three sentences what you think I'm after, then your plan. Wait for my yes.
- One milestone at a time: the next one in PLAN.md, working end to end. Nothing outside it.
- Never say "done" until you've seen it work and told me how to check it on my phone.
- Never put a key or password in code, in a VITE_ variable or in a committed file.
- [a rule of your own: anything you've had to say twice]

## 3. Shipping
Live link: [your .convex.site link]
Repo: [github.com/you/your-repo], publi
Deploy: npm run deploy. After I say a milestone works: commit, push, then deploy.
Keys: OPENAI_API_KEY, WHATSAPP_TOKEN lives in Convex environment variables. Never ask me to paste it into chat.
Real people's data (operator and founder names, phone numbers, profiles) goes into the Convex database only. Never in the repo, not even as a test file. Tests use made-up examples.
.gitignore covers .env.local and any .xlsx or .csv data files.

## 4. The AI call
Model: gpt-6-luna, thinking low
What goes in, and its limit: the founder's pilot ask (max 300 words) plus the stored operator profiles
Where it runs: a Convex action. Never in the interface.
Key: OPENAI_API_KEY in Convex environment variables, dev and prod.
Reply cap: max_output_tokens 1200
Calls cap: at most 100 AI calls an hour across the app; each founder gets 3 searches, then the search is disabled
Provider limit: a hard monthly limit of $25, set by me in OpenAI
When a cap is hit or the call fails: show "Busy right now. Try again in a few minutes."
Industry, company problems, source link must be populated with "not found" when nothing is public.
Web search runs only when an operator is loaded, never during a founder search. At most one web search per operator, only when I load them. Re-run only when i trigger it.
Login: none in v1

