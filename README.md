# CareQueue

**CareQueue** is a comprehensive SaaS platform designed to modernize clinic operations. It transforms traditional appointment booking into a smart, dynamic system that minimizes no-shows and maximizes clinic efficiency through automated slot recovery, intelligent waitlist ranking, and real-time patient communication.

---

## 🚀 Key Features

*   **Intelligent Waitlist Ranking:** Patients are automatically prioritized based on a weighted scoring algorithm:
    *   Urgency (35%)
    *   Location Proximity (25% - via OpenRouteService API)
    *   Wait Time (20%)
    *   Historical Reliability Score (15%)
*   **Automated No-Show Recovery:** When an appointment is cancelled, the system automatically triggers a BullMQ worker to offer the newly available slot to the highest-ranking patient on the waitlist.
*   **Multi-Channel Communication:** 
    *   WhatsApp integration via Twilio for immediate, interactive notifications with Quick Replies.
    *   SMS fallback via MSG91 ensures delivery even if the patient is offline.
*   **Real-Time Receptionist Dashboard:** A central hub providing "management by exception," featuring real-time activity feeds, appointment timelines, and live waitlist monitoring.
*   **Comprehensive Patient Management:** Full CRUD capabilities for managing the clinic's patient registry, including tracking reliability scores and visit history.

---

## 🛠️ Technology Stack

CareQueue is built as a robust, scalable monorepo using **Turborepo**.

*   **Frontend (`@carequeue/web`):**
    *   Next.js 14 (App Router)
    *   React & Tailwind CSS
    *   Lucide Icons for UI elements
*   **Backend (`@carequeue/api`):**
    *   Fastify (High-performance API framework)
    *   TypeScript
*   **Database & ORM (`@carequeue/db`):**
    *   PostgreSQL (Neon)
    *   Prisma ORM
*   **Queueing & Background Jobs (`@carequeue/queue`):**
    *   BullMQ
    *   Upstash Redis (ioredis)
*   **Authentication:**
    *   Better Auth
*   **Integrations:**
    *   Twilio (WhatsApp API)
    *   MSG91 (SMS API)
    *   OpenRouteService (Mapping/Proximity API)

---

## 📂 Project Structure

```text
├── apps/
│   ├── api/            # Fastify backend, API routes, Webhooks
│   └── web/            # Next.js frontend, UI components
├── packages/
│   ├── db/             # Prisma schema, migrations, seed data
│   ├── auth/           # Better Auth configuration
│   ├── queue/          # BullMQ worker definitions (Recovery, Reminders)
│   ├── sms/            # MSG91 integration client
│   └── whatsapp/       # Twilio integration client
├── docker-compose.yml  # Local Redis/Postgres services
└── package.json        # Turborepo root config
```

---

## 🚦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   pnpm (v9+)
*   Docker (for running local Redis and PostgreSQL, if not using cloud equivalents)

### Environment Variables
Copy `.env.example` to `.env` in the root directory and fill in the necessary keys for Neon (Postgres), Upstash (Redis), Twilio, MSG91, and Better Auth.

### Installation

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

2.  **Start Local Services (Optional, if using local DB/Redis):**
    ```bash
    docker-compose up -d
    ```

3.  **Database Setup:**
    ```bash
    pnpm db:generate
    pnpm db:push
    pnpm db:seed
    ```

### Running the Application

Start the backend API and Next.js frontend concurrently from the root directory:

```bash
# Start the Fastify API (runs on port 3001)
pnpm run dev:api

# Open a new terminal and start the Next.js Frontend (runs on port 5002)
pnpm run dev:web --port 5002
```

Navigate to `http://localhost:5002` to access the receptionist dashboard.

---

## 🧪 System Architecture Highlights

*   **Resilience-First Design:** External API calls (Twilio, Maps) are wrapped in `try/catch` with graceful degradation (e.g., falling back to Haversine distance if the mapping API fails).
*   **Atomic Transactions:** Prisma `$transaction` blocks are used during slot claiming to prevent race conditions when multiple waitlist entries try to claim a recovered slot simultaneously.
*   **Idempotency & Retry Logic:** BullMQ handles backoffs and job retries to ensure that temporary network failures do not result in dropped notifications.
