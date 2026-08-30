# CommitAI

### AI that remembers what you promised.

> **CommitAI turns conversations into evidence-backed commitments, identifies what is at risk, and helps you take action before promises fall through the cracks.**

[![BuildSprint 2026](https://img.shields.io/badge/BuildSprint-2026-blue)](#)
[![Built with LatentCode](https://img.shields.io/badge/Built%20with-LatentCode-purple)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

**[Live Demo]((https://commitai-smoky.vercel.app/))** · **[Demo Video]((https://drive.google.com/file/d/13tRIV7tVUJ91y_N4V3VS6Ck_DKk5DAkq/view?usp=sharing))** · **[GitHub](https://github.com/jayraj175coder/CommitAI)**

---

## The Problem

Important commitments rarely arrive as neatly created tasks.

They appear naturally inside the communication we already use:

> "I'll send the revised proposal by Friday."
> "I'll review the document tomorrow."
> "I'll get back to you next week."

The problem is that these promises are usually buried inside emails, meetings, calendars, and conversations.

As communication grows, people lose track of:

- What they promised
- What someone promised them
- Who owes what
- When something is due
- Which commitments are becoming risky
- Where the original promise came from

Traditional task managers solve a different problem:

> **They track what you remember to enter.**

### CommitAI tracks what you actually promised.

---

## What is CommitAI?

**CommitAI is an AI-powered commitment intelligence platform.**

It turns everyday communication into a structured, evidence-backed commitment layer:

```text
Communication
      │
      ▼
Commitment Detection
      │
      ▼
Who + What + When
      │
      ▼
Evidence Verification
      │
      ▼
Risk Detection
      │
      ▼
Recommended Action
      │
      ▼
Completed Commitment
```

Instead of relying on someone to remember to open an app and type "send proposal Friday," CommitAI listens to the communication itself — emails, meeting transcripts, chat messages — and extracts the commitment automatically, along with the proof (the evidence) that it was made.

---

## System Architecture

CommitAI is built as a pipeline: raw communication flows in from multiple sources, gets normalized, passed through an AI extraction layer, stored with its supporting evidence, and continuously monitored for risk. Below is how data moves through the system end to end.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                            INGESTION LAYER                           │
│                                                                        │
│   Email  ──┐                                                          │
│   Chat   ──┤                                                          │
│   Meeting  ├──►  Connectors / Webhooks  ──►  Raw Message Queue        │
│  Transcripts│      (Gmail, Slack, Zoom,        (async, per-source)    │
│   Calendar ─┘       Calendar APIs, etc.)                              │
└──────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        NORMALIZATION LAYER                           │
│   • Strips signatures, threads, boilerplate                          │
│   • Speaker/sender attribution                                       │
│   • Timestamps + timezone normalization                              │
│   • Converts everything into a common "Message" schema               │
└──────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    AI EXTRACTION LAYER (LLM Core)                    │
│                                                                        │
│   1. Commitment Detection   → is a promise being made at all?        │
│   2. Entity Resolution      → WHO is committing, to WHOM              │
│   3. Task Extraction        → WHAT is being promised                  │
│   4. Deadline Resolution    → WHEN ("Friday" → actual date/time)      │
│   5. Confidence Scoring     → how certain is the model?               │
└──────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     EVIDENCE VERIFICATION LAYER                      │
│   • Links every extracted commitment back to its exact source        │
│     (message ID, transcript timestamp, thread link)                  │
│   • Deduplicates repeated mentions of the same promise                │
│   • Flags low-confidence extractions for human review                │
└──────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          COMMITMENT STORE                             │
│           (structured DB: owner, recipient, task, due date,          │
│            status, evidence link, confidence, history)               │
└───────────────┬───────────────────────────────────┬───────────────────┘
                │                                   │
                ▼                                   ▼
┌────────────────────────────────┐   ┌─────────────────────────────────┐
│        RISK ENGINE              │   │        APPLICATION LAYER        │
│  • Approaching/overdue deadlines│   │  • Dashboard (web UI)           │
│  • Silence detection (no update)│   │  • Search & filter commitments  │
│  • Dependency chains at risk    │   │  • Notifications / reminders    │
│  • Priority scoring             │   │  • API for integrations         │
└───────────────┬─────────────────┘   └─────────────────┬───────────────┘
                │                                        │
                ▼                                        ▼
        Recommended Action                     User views / acts on it
        (nudge, reschedule,                   (mark done, renegotiate,
         escalate, reassign)                   delegate, snooze)
                │                                        │
                └───────────────┬────────────────────────┘
                                 ▼
                       Completed Commitment
                    (closes the loop, feeds back
                     into risk-model calibration)
```

### Layer-by-layer breakdown

| Layer | Responsibility | Typical Tech |
|---|---|---|
| **Ingestion** | Pull or receive raw communication from connected sources | REST/webhook connectors, message queue (e.g., SQS/Kafka) |
| **Normalization** | Clean and standardize messages into one schema | Node.js/Python workers |
| **AI Extraction** | Detect commitments, resolve entities, dates, and tasks | LLM (LatentCode / Claude API), prompt pipelines |
| **Evidence Verification** | Trace every commitment to its source and dedupe | Rule-based post-processing + LLM confidence scoring |
| **Commitment Store** | Durable, queryable source of truth | PostgreSQL / MongoDB |
| **Risk Engine** | Continuously scans store for at-risk commitments | Scheduled jobs / event-driven rules engine |
| **Application Layer** | Surface commitments and actions to the user | React/Next.js frontend, REST or GraphQL API |

### Data flow, simplified

1. A message arrives (email, chat, transcript, calendar invite).
2. It's normalized into a common format.
3. The LLM core checks: *is this a commitment?* If yes, it extracts **who, what, when**, and a confidence score.
4. The evidence layer attaches the original source so every commitment is auditable, not guessed.
5. The commitment is saved to the store with status `open`.
6. The risk engine continuously re-evaluates open commitments against deadlines, silence, and dependencies.
7. When risk crosses a threshold, a recommended action is generated (nudge, escalate, reschedule).
8. The user acts on it through the dashboard or API, and the commitment is marked `completed`, `renegotiated`, or `broken` — closing the loop.

---

## Features

- 🔍 **Automatic commitment detection** from emails, chats, and meeting transcripts
- 🧾 **Evidence-backed records** — every commitment links back to its original source
- ⚠️ **Risk detection** for commitments at risk of being missed or forgotten
- ✅ **Actionable recommendations** (nudge, reschedule, escalate, delegate)
- 📊 **Dashboard** to see everything you owe and everything owed to you
- 🔗 **API-first design** for integration with existing tools

---

## Tech Stack

- **Frontend:** React / Next.js
- **Backend:** Node.js (or Python/FastAPI)
- **AI Layer:** LLM-based extraction pipeline (LatentCode / Claude API)
- **Database:** PostgreSQL / MongoDB
- **Messaging/Queue:** Kafka or SQS (for ingestion)
- **Deployment:** Docker + your platform of choice (Vercel, Render, AWS, etc.)

> Update this section to reflect the exact stack you actually used in BuildSprint 2026.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A package manager (npm, yarn, or pnpm)
- API keys for any connected services (email, calendar, LLM provider)

### Installation

```bash
# Clone the repository
git clone https://github.com/jayraj175coder/CommitAI.git
cd CommitAI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# then fill in your API keys and DB connection string

# Run the development server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `LLM_API_KEY` | API key for the AI extraction provider |
| `DATABASE_URL` | Connection string for your database |
| `EMAIL_CLIENT_ID` / `EMAIL_CLIENT_SECRET` | OAuth credentials for email ingestion |
| `CALENDAR_API_KEY` | Credentials for calendar integration |

---

## Usage

1. Connect a communication source (email, chat, or upload a meeting transcript).
2. CommitAI scans incoming messages and extracts commitments automatically.
3. Open the dashboard to see all detected commitments, grouped by owner and due date.
4. Review flagged, at-risk commitments and take the recommended action.
5. Mark commitments as completed, renegotiated, or broken to close the loop.

---

## Project Structure

```text
CommitAI/
├── src/
│   ├── connectors/        # Email, chat, calendar ingestion
│   ├── normalization/      # Message cleaning & schema mapping
│   ├── extraction/         # LLM prompts & commitment parsing
│   ├── evidence/            # Source linking & deduplication
│   ├── risk-engine/         # Risk scoring & recommended actions
│   ├── api/                 # REST/GraphQL endpoints
│   └── frontend/            # Dashboard UI
├── .env.example
├── package.json
└── README.md
```

---

## Roadmap

- [ ] Slack and Microsoft Teams connectors
- [ ] Voice/meeting transcript ingestion (live)
- [ ] Team-level commitment analytics
- [ ] Mobile app for on-the-go nudges
- [ ] Fine-tuned risk model based on user feedback

---

## Contributing

Contributions are welcome. Please open an issue to discuss what you'd like to change before submitting a pull request.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "Add your feature"
git push origin feature/your-feature-name
# open a Pull Request
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

Built for **BuildSprint 2026** using **LatentCode**.
