import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import { appointmentRoutes } from "./routes/appointments.js";
import { waitlistRoutes } from "./routes/waitlist.js";
import { webhookRoutes } from "./routes/webhook.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { patientRoutes } from "./routes/patients.js";
import { activityRoutes } from "./routes/activity.js";
import {
  createRecoveryWorker,
  createTimeoutWorker,
  createReminderWorker,
} from "@carequeue/queue";
import { auth } from "./lib/auth.js";

// ─── Server Setup ───────────────────────────────────

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

// ─── Plugins ────────────────────────────────────────

await app.register(cors, {
  origin: (origin, cb) => {
    // Allow any localhost origin in development
    if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      cb(null, true);
    } else {
      cb(null, process.env.FRONTEND_URL || false);
    }
  },
  credentials: true,
});
await app.register(formbody);

// ─── Routes ─────────────────────────────────────────

app.get("/api/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  service: "carequeue-api",
}));

// ── Clinic discovery (returns first clinic for dev/demo) ──
app.get("/api/clinics/discover", async (request, reply) => {
  const { prisma } = await import("@carequeue/db");
  const clinic = await prisma.clinic.findFirst({
    include: { doctors: { select: { id: true, name: true, specialty: true } } },
  });
  if (!clinic) return reply.status(404).send({ error: "No clinic found. Run seed." });
  return reply.send(clinic);
});

// ── Auth Endpoints (Web Standard Request Pipeline) ──
app.all("/api/auth/*", async (request, reply) => {
  const origin = request.headers.origin || request.headers.referer || "";
  const baseURL = process.env.BETTER_AUTH_URL || origin.replace(/\/$/, "") || "http://localhost:5002";
  const url = `${baseURL}${request.url}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach(v => headers.append(key, v));
    else if (typeof value === "string") headers.append(key, value);
  }

  const req = new Request(url, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? JSON.stringify(request.body) : undefined,
  });

  const response = await auth.handler(req);

  response.headers.forEach((value, key) => {
    // fastify handles set-cookie array natively
    if (key.toLowerCase() === 'set-cookie') {
      reply.header(key, value);
    } else {
      reply.header(key, value);
    }
  });
  reply.status(response.status);

  const text = await response.text();
  return reply.send(text ? JSON.parse(text) : undefined);
});

// ── Protected Routes Middleware ──
app.addHook("preHandler", async (request, reply) => {
  const url = request.url;
  
  // Public routes
  if (
    url.startsWith("/api/auth") ||
    url.startsWith("/api/whatsapp") ||
    url === "/api/health" ||
    url.startsWith("/api/clinics/discover")
  ) {
    return;
  }

  // Check Better Auth session
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach(v => headers.append(key, v));
    else if (typeof value === "string") headers.append(key, value);
  }

  const session = await auth.api.getSession({
    headers,
  });

  if (!session) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  // We could attach user/session to request here if needed
  // (request as any).user = session.user;
});

await app.register(appointmentRoutes, { prefix: "/api/clinics" });
await app.register(waitlistRoutes, { prefix: "/api/clinics" });
await app.register(webhookRoutes, { prefix: "/api/whatsapp" });
await app.register(dashboardRoutes, { prefix: "/api/clinics" });
await app.register(patientRoutes, { prefix: "/api/clinics" });
await app.register(activityRoutes, { prefix: "/api/clinics" });

// ─── Start Workers ──────────────────────────────────

const recoveryWorker = createRecoveryWorker();
const timeoutWorker = createTimeoutWorker();
const reminderWorker = createReminderWorker();

console.log("🔧 BullMQ workers started: recovery, timeout, reminder");

// ─── Start Server ───────────────────────────────────

const PORT = parseInt(process.env.API_PORT || "3001", 10);
const HOST = process.env.API_HOST || "0.0.0.0";

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`\n🚀 CareQueue API running at http://${HOST}:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// ─── Graceful Shutdown ──────────────────────────────

async function shutdown() {
  console.log("\n🛑 Shutting down...");
  await recoveryWorker.close();
  await timeoutWorker.close();
  await reminderWorker.close();
  await app.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
