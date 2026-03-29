# CareQueue — Product Requirements Document (PRD)

## 1. Overview

**CareQueue** is a SaaS platform for small clinics (dentists, physios, dermatologists) that automatically recovers cancelled appointment slots, reduces no-shows, and gives receptionists a simple dashboard.

**Core Value Proposition:** When a patient cancels, CareQueue fills that slot automatically via WhatsApp in under 3 minutes — zero receptionist involvement.

**Target Market:** Small to mid-size clinics in India (5–20 appointments/day).

---

## 2. Problem Statement

| Problem | Impact |
|---|---|
| Last-minute cancellations | 15–30% revenue loss per clinic |
| Manual slot recovery | 10–15 min receptionist time per cancellation (calling waitlist patients) |
| No-shows | Wasted doctor time, blocked slots |
| No waitlist intelligence | Random calling order, no priority scoring |

---

## 3. User Personas

### Clinic Owner
- Wants revenue recovery metrics, monthly ROI reports
- Cares about fill rate and recovery time

### Receptionist
- Manages daily schedule, needs dead-simple UI
- Wants to see who's confirmed, who's waitlisted, what's auto-recovered
- Can manually override any automated action

### Doctor
- Wants full schedule, minimal gaps
- Doesn't interact with the system directly

### Patient
- Receives WhatsApp messages
- Replies YES/CONFIRM/CANCEL via WhatsApp
- Never opens a web app

---

## 4. Core Features

### 4.1 Smart Waitlist with Ranking Algorithm

Patients join waitlist for a specific doctor or any available doctor. System scores each entry using a weighted formula:

| Factor | Weight | Range |
|---|---|---|
| **Urgency** (Urgent/Follow-up/Routine) | 35% | 0–100 |
| **Proximity** (Haversine distance) | 25% | 0–100 |
| **Wait Time** (days waiting × 5, capped) | 20% | 0–100 |
| **Reliability Score** (past no-show history) | 15% | 0–100 |

### 4.2 Automatic Slot Recovery

**Trigger:** Appointment cancellation or no-show detection.

**Flow:**
1. Score all WAITING entries for the relevant doctor/clinic
2. Pick top 3 candidates
3. Set status → OFFERED, send WhatsApp to all 3
4. First "YES" reply wins (atomic DB transaction prevents races)
5. Winner gets confirmed appointment + Maps link
6. Others get "slot taken" message, remain on waitlist
7. 10-minute timeout resets all offers to WAITING

### 4.3 No-Show Prevention (Multi-Step Reminders)

| Timing | Channel | Message |
|---|---|---|
| T-24 hours | WhatsApp | "Reply CONFIRM or CANCEL" |
| T-2 hours | SMS (if no WhatsApp response) | Reminder with address |
| T-30 minutes | WhatsApp | Final reminder + Maps link |
| T+15 minutes | System | Auto-mark NO_SHOW → trigger recovery |

**No-Show Penalty:** Patient reliability score decremented by 10 (min 0).

### 4.4 Receptionist Dashboard

- Today's appointment timeline by doctor
- Live waitlist queue (ranked, filterable)
- Recovery stats: slots filled today, avg recovery time
- Manual override: receptionists can cancel, confirm, or modify any appointment

### 4.5 Recovery Reports

- Monthly slot fill rate (%)
- Revenue recovered (₹)
- Average recovery time
- Per-doctor breakdown

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Fastify + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Job Queue | BullMQ + Redis |
| WhatsApp | Meta Business Cloud API (webhooks) |
| SMS Fallback | MSG91 |
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui |
| Auth | Better Auth (multi-role) |
| Payments | Razorpay |
| Maps | Google Maps Distance Matrix API |

### 5.2 Monorepo Structure

```
clinic-app/
├── apps/
│   ├── api/          → Fastify backend
│   └── web/          → Next.js frontend (future)
├── packages/
│   ├── db/           → Prisma schema + client
│   ├── queue/        → BullMQ job definitions
│   ├── whatsapp/     → WhatsApp API client + webhook types
│   └── scoring/      → Waitlist ranking algorithm
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

### 5.3 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/clinics/:id/appointments` | Create appointment |
| `POST` | `/api/clinics/:id/appointments/:apptId/cancel` | Cancel → trigger recovery |
| `PATCH` | `/api/clinics/:id/appointments/:apptId` | Update status |
| `GET` | `/api/clinics/:id/appointments` | List (by date) |
| `POST` | `/api/clinics/:id/waitlist` | Join waitlist |
| `GET` | `/api/clinics/:id/waitlist` | Ranked queue view |
| `DELETE` | `/api/clinics/:id/waitlist/:entryId` | Remove from waitlist |
| `POST` | `/api/whatsapp/webhook` | Incoming WhatsApp handler |
| `GET` | `/api/whatsapp/webhook` | Meta verification |
| `POST` | `/api/whatsapp/webhook/simulate` | Dev testing endpoint |
| `GET` | `/api/clinics/:id/dashboard` | Today's stats |
| `GET` | `/api/clinics/:id/reports/recovery` | Monthly recovery report |

### 5.4 Key Data Models

- **Clinic** — name, address, phone, city, lat/lng
- **Doctor** — name, specialty, slot duration, working hours
- **Patient** — name, phone, reliability score (0–100), lat/lng
- **Appointment** — doctor, patient, clinic, start/end time, status, type
- **WaitlistEntry** — patient, clinic, doctor (optional), urgency, rank score, status
- **RecoveryEvent** — cancelled appointment, offered patients, filled by, recovery time, revenue
- **AuditLog** — all actions tracked for compliance

---

## 6. Key Constraints

- WhatsApp reply window: 24h (template messages for outbound)
- Slot claim must be atomic (Prisma `$transaction`)
- Max 1 offer per patient per recovery event
- Receptionist can always manually override
- All times stored UTC, displayed IST (Asia/Kolkata)
- Target market: India (INR pricing, WhatsApp-first)

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Avg. recovery time | < 3 minutes |
| Slot fill rate | > 70% of cancellations recovered |
| No-show rate reduction | 40% decrease within 3 months |
| Receptionist time saved | 2+ hours/day on manual calling |

---

## 8. Rollout Plan

| Phase | Scope |
|---|---|
| **Phase 1** (Current) | Backend: schema, APIs, recovery flow, WhatsApp mock |
| **Phase 2** | Frontend: receptionist dashboard, recovery reports |
| **Phase 3** | Auth: Better Auth multi-role (owner, doctor, receptionist) |
| **Phase 4** | SMS fallback (MSG91), Google Maps integration |
| **Phase 5** | Payments: Razorpay subscription billing |
| **Phase 6** | Production: Render deployment, real WhatsApp API |
