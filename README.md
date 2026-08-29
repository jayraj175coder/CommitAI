# CommitAI

> "AI that remembers what you promised."

CommitAI is an AI-powered commitment intelligence platform designed to discover, track, and reconcile promises hidden across everyday communication channels.

While traditional task managers only track what users remember to manually enter, **CommitAI discovers commitments hidden inside communication** and turns scattered conversations into one continuous, evidence-grounded source of truth.

---

## 1. Problem

Modern professionals make and receive dozens of commitments every day across fragmented channels:
* 📧 **Email threads** where deliverables are promised in conversation replies
* 📅 **Calendar events** and meeting notes with scheduled milestones
* 💬 **Chat conversations and DMs** where informal agreements and deadlines are made
* 📝 **Quick meeting notes** where tasks are forgotten as soon as the call ends

**Task managers track what users remember to enter.** When work moves fast, promises slip through the cracks, deadlines get missed, and relationship trust is damaged because no one remembers who promised what to whom.

---

## 2. Solution

CommitAI bridges the gap between communication and action. It connects to your existing communication tools, extracts explicit promises made by you or owed to you, extracts exact deadlines with temporal reasoning, scores operational risk, and provides verbatim evidence for every single commitment.

* **Who**: Identifies the person who made the promise and who it is owed to (`I promised` vs `They promised`).
* **What**: Pinpoints the deliverable, document, payment, or action item.
* **When**: Normalizes relative date phrases ("tomorrow at 5 PM", "Friday EOD", "next week") into exact ISO timestamps.
* **Evidence**: Links every commitment directly to the original verbatim source text.
* **Risk Radar**: Proactively flags overdue items, approaching deadlines, and contradictory timeline shifts.

---

## 3. How CommitAI Works

```
Communication Sources (Gmail, Google Calendar, etc.)
        ↓
Source Ingestion (Secure OAuth adapters & content normalization)
        ↓
Commitment Engine (LLM extraction & deterministic pattern parser)
        ↓
Commitment Intelligence (Who, What, When, Direction & Reconciliation)
        ↓
Evidence + Risk (Verbatim source snippet + Explainable Risk 0-100)
        ↓
Action / Follow-up (Action plan generation & follow-up drafts)
        ↓
Outcome (Fulfilled commitments & zero dropped promises)
```

1. **Ingestion**: Authorized messages and events are fetched via read-only APIs or manual entry.
2. **Extraction**: The engine analyzes the text for promise patterns, extracting deliverables, dates, and verbatim evidence snippets.
3. **Reconciliation**: If a deadline is updated in a subsequent message (e.g. "Sorry for delay, Friday instead"), CommitAI unifies the messages into one lifecycle history rather than creating duplicate tasks.
4. **Risk Scoring**: Commitments receive a transparent 0–100 Attention and Risk score based on urgency, overdue duration, confidence, and importance.
5. **Action**: One-click follow-up drafts, Google Calendar event creation, and status management.

---

## 4. Core Features

### 🎯 Operations Command Center & Daily Brief
* **Real-time KPI Counters**: Instant visibility into *Critical*, *Due Today*, *Due This Week*, *Waiting On Them*, *Waiting On Me*, *Ambiguous*, and *Conflicts*.
* **Priority Queue**: Highlights the top 5 highest-risk commitments requiring immediate action.
* **Health Score (0–100)**: Evaluates active obligation ratio, overdue penalties, and risk density.

### 🛡️ Predictive Risk Radar
* **Deterministic Risk Scoring (0–100)**: Transparent, formula-based scoring based on deadline proximity, previous date shifts, and importance weights.
* **Explainable "Why At Risk?"**: Provides human-readable breakdown of contributing factors for every high-risk item.

### 🕸️ Commitment Network & Relationship Graph
* **Visual Relationship Chains**: Maps `Person` → `Promise` → `Topic Cluster` → `Due Date` → `Status` → `Evidence`.
* **Network Health**: Evaluates overall active commitment chains (`Network Healthy`, `At Risk`, `Critical`).
* **Why Connected?**: Traces every entity node back to its verbatim source evidence.

### ✉️ Follow-Up Copilot
* **Owed To You Queue**: Isolates commitments where external participants owe an action.
* **Multi-Tone Draft Composer**: Composes grounded follow-up messages in *Professional*, *Friendly*, *Concise*, or *Urgent* tone.
* **Evidence Grounding**: Drafts reference the exact prior communication context so follow-ups are clear and polite.

### 🔍 Ask CommitAI (Natural Language Query)
* Natural language search across your commitments (e.g., *"What do I need to worry about this week?"*, *"Who owes me deliverables?"*).
* Strictly grounded in verified evidence with clickable citations.

### ⏱️ Timeline & Lifecycle Memory
* Complete chronological trail: `CREATE` → `MODIFY / DELAY` → `CANCEL / CONFLICT` → `FULFILL`.
* Conflict detection alerts users when contradictory promises exist for the same deliverable.

---

## 5. Current Integrations

CommitAI integrates with communication tools while maintaining strict read-only least-privilege access:

| Integration | Category | Status | Capabilities |
|:---|:---|:---|:---|
| **Gmail** | Email | **Implemented (Live)** | Read-only scan of recent email threads containing promise keywords; extracts subject, sender, timestamp, and snippet. |
| **Google Calendar** | Calendar | **Implemented (Live)** | Read-only scan of scheduled meetings, descriptions, and milestones; 1-click calendar event generation. |
| **Discord** | Chat | **Implemented (Live)** | Read-only monitoring of authorized server channels and community discussions. |
| **Telegram** | Chat | **Implemented (Live)** | Read-only webhook/bot ingestion for client conversations. |
| **WhatsApp** | Chat | *Future Roadmap* | Planned end-to-end encrypted export and chat sync. |
| **Slack** | Chat | *Future Roadmap* | Planned workspace bot for public and private channels. |
| **Microsoft Teams** | Chat / Meeting | *Future Roadmap* | Planned enterprise chat and channel integration. |
| **Google Meet / Zoom** | Video / Meeting | *Future Roadmap* | Planned meeting transcript ingestion and action item extraction. |

---

## 6. Architecture

CommitAI is built with a modern, high-performance TypeScript stack:

* **Framework**: Next.js 16 (App Router) + React 19
* **Styling**: Tailwind CSS + Lucide Icons
* **Validation & Schemas**: Zod runtime schema validation
* **Extraction Engine**: Hybrid architecture with OpenAI-compatible LLM extraction + deterministic rule-based fallback parser
* **Temporal Engine**: Custom relative date normalizer with `date-fns` integration
* **Client Storage**: Local browser persistent storage (`localStorage`) ensuring privacy

---

## 7. Security

* **Zero Token Leakage**: OAuth access tokens and refresh tokens are stored exclusively in HTTP-only, secure, `SameSite=Lax` cookies. Tokens are never exposed to client-side JavaScript, React state, or local storage.
* **Server-Side Revocation**: Disconnecting an integration triggers a server-side revocation request to the provider's token endpoint before clearing session cookies.
* **CSRF Protection**: All OAuth authorization flows generate cryptographically secure random `state` parameters verified on callback.
* **Local Data Sovereignty**: All extracted commitment records and evidence snippets remain on the user's client browser. No communication data is harvested or stored on external database servers.

---

## 8. SkillPatch Integration

```
SkillPatch skill:
code-reviewer

Contribution:
Used to audit and harden OAuth/API security including CSRF validation, server-side token revocation, audit logging and data-leak prevention.
```

The `code-reviewer` skill audited:
1. CSRF state token generation and verification in `/api/auth/google` and `/api/auth/google/callback`.
2. Secure session serialization with Base64 encoding in HTTP-only cookies.
3. Server-side token revocation in `/api/auth/google/revoke` and `/api/auth/discord/revoke`.
4. Audit logging in `/api/sync/gmail` that sanitizes personal communication data while logging sync metrics.

---

## 9. Local Development Setup

### Prerequisites
* Node.js 18+ or 20+
* npm or yarn

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jayraj175coder/CommitAI.git
   cd CommitAI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Google OAuth credentials (see Section 10).

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 10. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Application Base URL (defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth Credentials (for Gmail & Google Calendar read-only access)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Discord OAuth Credentials (optional)
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

# Telegram Bot Token (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Optional AI API Key (if omitted, CommitAI runs on the built-in deterministic fallback engine)
OPENAI_API_KEY=
```

---

## 11. Testing

Run the automated test suite with Vitest:

```bash
npm test
```

The test suite validates:
* Connection provider registration and data normalization (Gmail, Discord, Calendar)
* Temporal reasoning and relative date normalization (`today`, `tomorrow`, `Friday`, `ASAP`)
* Status calculation engine (`overdue`, `due_today`, `due_soon`, `completed`)
* Conflict detection across multi-channel contradictory promises
* Explainable Attention Score formula computation
* Natural language grounding and evidence verification
* Cross-source commitment reconciliation and timeline history tracking
* Schema validation guardrails and security checks

---

## 12. Production Build

Verify the production build:

```bash
npm run lint
npm run build
```

---

## 13. Future Roadmap

* 📱 **WhatsApp Integration**: Ingestion of exported chat conversations and direct WhatsApp Web automation.
* 💬 **Slack & Microsoft Teams Apps**: Native bot integrations for team workspace channels and direct messages.
* 🎙️ **Live Meeting Audio / Transcript Intelligence**: Real-time promise extraction from Zoom and Google Meet audio streams.
* 🔔 **Multi-Channel Smart Notifications**: Proactive daily briefing digest delivered via Telegram, Slack, or email.
* 🔄 **CRM & Project Management Bi-Directional Sync**: Export verified commitments to Linear, Jira, Notion, and HubSpot.

---

## 📜 License

MIT License — Built for Hackathon Submission.

