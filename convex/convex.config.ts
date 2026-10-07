import { defineApp } from "convex/server";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import agent from "@convex-dev/agent/convex.config";

// Your own HTTP endpoints (convex/http.ts) are served under /api so the
// static site can own the root.
const app = defineApp({ httpPrefix: "/api" });
app.use(staticHosting, { httpPrefix: "/" });
app.use(agent);

export default app;
