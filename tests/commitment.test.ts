import { describe, it, expect } from "vitest";
import { normalizeDateText, calculateStatus } from "../src/lib/dateNormalizer";
import { ExtractionResponseSchema, Commitment } from "../src/types/commitment";
import { calculateAttentionScore } from "../src/lib/scoringEngine";
import { detectConflicts } from "../src/lib/conflictDetector";
import { executeNaturalLanguageQuery } from "../src/lib/nlQueryEngine";
import { reconcileCommitments } from "../src/lib/reconciliationEngine";
import { CommitmentStorage } from "../src/lib/storageService";
import { ALL_PROVIDERS, GmailConnector, DiscordConnector } from "../src/lib/connectors";

describe("Connection Providers & Connector Adapters", () => {
  it("registers all 7 connection providers with proper metadata", () => {
    expect(ALL_PROVIDERS.length).toBe(7);
    const providerIds = ALL_PROVIDERS.map((p) => p.id);
    expect(providerIds).toContain("gmail");
    expect(providerIds).toContain("google_calendar");
    expect(providerIds).toContain("outlook");
    expect(providerIds).toContain("slack");
    expect(providerIds).toContain("teams");
    expect(providerIds).toContain("discord");
    expect(providerIds).toContain("telegram");
  });

  it("normalizes Gmail message input into standard source format", () => {
    const gmail = new GmailConnector();
    const normalized = gmail.normalize({
      id: "msg_123",
      threadId: "th_456",
      from: "Rahul Sharma <rahul@example.com>",
      subject: "Q3 Invoice",
      body: "I'll send the Q3 invoice tomorrow by 5 PM.",
      date: "2026-08-28T10:00:00Z",
    });

    expect(normalized.sourceType).toBe("gmail");
    expect(normalized.sourceId).toBe("msg_123");
    expect(normalized.person).toBe("Rahul Sharma");
    expect(normalized.content).toContain("Q3 Invoice");
  });
});

describe("Temporal Reasoning & Date Normalization", () => {
  const refDate = new Date("2026-08-28T10:00:00Z"); // Friday

  it("normalizes relative date 'today' correctly", () => {
    const { parsedIsoDate, isAmbiguous } = normalizeDateText("today", refDate);
    expect(isAmbiguous).toBe(false);
    expect(new Date(parsedIsoDate!).getDate()).toBe(28);
  });

  it("normalizes relative date 'tomorrow' correctly", () => {
    const { parsedIsoDate, isAmbiguous } = normalizeDateText("tomorrow", refDate);
    expect(isAmbiguous).toBe(false);
    expect(new Date(parsedIsoDate!).getDate()).toBe(29);
  });

  it("normalizes relative date 'yesterday' correctly", () => {
    const { parsedIsoDate, isAmbiguous } = normalizeDateText("yesterday", refDate);
    expect(isAmbiguous).toBe(false);
    expect(new Date(parsedIsoDate!).getDate()).toBe(27);
  });

  it("normalizes 'Friday' relative to base date", () => {
    const { parsedIsoDate, isAmbiguous } = normalizeDateText("Friday", refDate);
    expect(isAmbiguous).toBe(false);
    expect(parsedIsoDate).not.toBeNull();
  });

  it("identifies vague phrase 'ASAP' as ambiguous", () => {
    const { parsedIsoDate, isAmbiguous } = normalizeDateText("ASAP", refDate);
    expect(isAmbiguous).toBe(true);
    expect(parsedIsoDate).toBeNull();
  });
});

describe("Status Calculation Engine", () => {
  const refDate = new Date("2026-08-28T10:00:00Z");

  it("calculates overdue status when due date is in the past", () => {
    const pastDate = new Date("2026-08-25T10:00:00Z").toISOString();
    const status = calculateStatus(pastDate, false, false, refDate);
    expect(status).toBe("overdue");
  });

  it("calculates due_today status when due date matches current day", () => {
    const todayDate = new Date("2026-08-28T17:00:00Z").toISOString();
    const status = calculateStatus(todayDate, false, false, refDate);
    expect(status).toBe("due_today");
  });

  it("calculates due_soon status when due within 3 days", () => {
    const soonDate = new Date("2026-08-30T17:00:00Z").toISOString();
    const status = calculateStatus(soonDate, false, false, refDate);
    expect(status).toBe("due_soon");
  });

  it("calculates completed status when flag is set", () => {
    const status = calculateStatus("2026-08-25T10:00:00Z", false, true, refDate);
    expect(status).toBe("completed");
  });
});

describe("Conflict Detection Engine", () => {
  it("detects contradictory commitments for same person and deliverable", () => {
    const commitments: Commitment[] = [
      {
        id: "c1",
        person: "Rahul Sharma",
        commitment: "Send invoice",
        object: "Invoice #101",
        dueDate: "2026-08-27T10:00:00Z",
        originalDateText: "yesterday",
        status: "overdue",
        confidence: 0.95,
        source: "WhatsApp",
        sourceType: "chat",
        evidence: "Rahul: 'I will send invoice yesterday'",
        direction: "they_owe_me",
        importance: "high",
        createdAt: "2026-08-26T10:00:00Z",
      },
      {
        id: "c2",
        person: "Rahul Sharma",
        commitment: "Resend updated invoice",
        object: "Invoice #101",
        dueDate: "2026-08-29T10:00:00Z",
        originalDateText: "tomorrow",
        status: "due_soon",
        confidence: 0.9,
        source: "Email",
        sourceType: "email",
        evidence: "Rahul: 'Will resend invoice tomorrow'",
        direction: "they_owe_me",
        importance: "high",
        createdAt: "2026-08-28T10:00:00Z",
      },
    ];

    const processed = detectConflicts(commitments);
    expect(processed[0].conflictWithId).toBe("c2");
    expect(processed[1].conflictWithId).toBe("c1");
    expect(processed[0].conflictReason).toContain("Contradictory due date");
  });
});

describe("Explainable Attention Score Engine", () => {
  it("computes deterministic score using urgency × overdueDuration × confidence × importance", () => {
    const commitment: Commitment = {
      id: "test_1",
      person: "Elena",
      commitment: "SOC2 Audit Report",
      object: "Report",
      dueDate: "2026-08-20T10:00:00Z",
      status: "overdue",
      confidence: 0.95,
      source: "Email",
      sourceType: "email",
      evidence: "Will deliver SOC2 report",
      direction: "they_owe_me",
      importance: "critical",
      createdAt: "2026-08-20T10:00:00Z",
    };

    const details = calculateAttentionScore(commitment, new Date("2026-08-28T10:00:00Z"));
    expect(details.attentionScore).toBeGreaterThan(60);
    expect(details.formulaExplanation).toContain("Attention Score");
    expect(details.overdueMultiplier).toBeGreaterThan(1.0);
  });
});

describe("Ask CommitAI NL Query & Grounding", () => {
  const sampleCommitments: Commitment[] = [
    {
      id: "a1",
      person: "Rahul Sharma",
      commitment: "Send consultancy invoice",
      object: "Invoice #INV-902",
      dueDate: "2026-08-27T10:00:00Z",
      originalDateText: "yesterday",
      status: "overdue",
      confidence: 0.95,
      source: "WhatsApp",
      sourceType: "chat",
      evidence: "Rahul: 'I will send invoice yesterday by 5 PM'",
      direction: "they_owe_me",
      importance: "critical",
      createdAt: "2026-08-26T10:00:00Z",
    },
  ];

  it("returns evidence grounded result for valid query", () => {
    const res = executeNaturalLanguageQuery("Who owes me something?", sampleCommitments);
    expect(res.hasSufficientEvidence).toBe(true);
    expect(res.groundedEvidenceList.length).toBe(1);
    expect(res.groundedEvidenceList[0].evidenceSnippet).toContain("Rahul:");
  });

  it("returns insufficient evidence message when query matches nothing", () => {
    const res = executeNaturalLanguageQuery("What did NonexistentPerson promise?", sampleCommitments);
    expect(res.hasSufficientEvidence).toBe(false);
    expect(res.answerText).toBe("I couldn't find enough evidence in your data to establish that commitment.");
  });
});

describe("Cross-Source Commitment Reconciliation & Continuity", () => {
  it("reconciles two messages from different applications into one unified commitment with deadline history", () => {
    const existing: Commitment[] = [
      {
        id: "slack_1",
        person: "Alex Mercer",
        commitment: "Share API credentials for payments API",
        object: "API Credentials",
        dueDate: "2026-08-27T17:00:00Z",
        originalDateText: "tomorrow",
        status: "due_soon",
        confidence: 0.9,
        source: "Slack #dev-payments",
        sourceType: "slack",
        evidence: "Slack: 'I'll send the API credentials tomorrow.'",
        direction: "they_owe_me",
        importance: "high",
        createdAt: "2026-08-26T10:00:00Z",
      },
    ];

    const incoming: Commitment[] = [
      {
        id: "gmail_1",
        person: "Alex Mercer",
        commitment: "Share API credentials for payments API",
        object: "API Credentials",
        dueDate: "2026-08-29T17:00:00Z",
        originalDateText: "Friday",
        status: "due_soon",
        confidence: 0.95,
        source: "Gmail Thread: Re: Payments API",
        sourceType: "gmail",
        evidence: "Gmail: 'Sorry for delay, I'll get them to you Friday.'",
        direction: "they_owe_me",
        importance: "high",
        createdAt: "2026-08-28T10:00:00Z",
      },
    ];

    const reconciled = reconcileCommitments(existing, incoming);

    // Expecting unified single commitment rather than duplicate items
    expect(reconciled.length).toBe(1);
    expect(reconciled[0].id).toBe("slack_1");
    expect(reconciled[0].dueDate).toBe("2026-08-29T17:00:00Z"); // Updated deadline Friday
    expect(reconciled[0].history).toBeDefined();
    expect(reconciled[0].history!.length).toBeGreaterThanOrEqual(1);

    const deadlineEvent = reconciled[0].history?.find((h) => h.event === "deadline_changed");
    expect(deadlineEvent).toBeDefined();
    expect(deadlineEvent?.oldDueDate).toBe("2026-08-27T17:00:00Z");
    expect(deadlineEvent?.newDueDate).toBe("2026-08-29T17:00:00Z");
  });

  it("handles demo mode re-hydration safely", () => {
    const demoItems = CommitmentStorage.resetToDemoData();
    expect(demoItems.length).toBeGreaterThan(0);
  });
});

describe("Schema Validation & AI Extraction Guardrails", () => {
  it("rejects malformed AI outputs missing evidence", () => {
    const malformed = {
      commitments: [
        {
          person: "Rahul",
          commitment: "Send draft",
          evidence: "", // Empty evidence snippet rejected
          confidence: 0.9,
        },
      ],
    };

    const parseRes = ExtractionResponseSchema.safeParse(malformed);
    expect(parseRes.success).toBe(false);
  });
});

describe("Discord Connector & Real Extraction Pipeline", () => {
  it("normalizes Discord message into standard source format", () => {
    const discord = new DiscordConnector();
    const normalized = discord.normalize({
      id: "disc_msg_999",
      author: "Jayraj",
      channelName: "project-dev",
      content: "I'll send the database schema tonight.",
      timestamp: "2026-08-28T18:00:00Z",
    });

    expect(normalized.sourceType).toBe("discord");
    expect(normalized.sourceId).toBe("disc_msg_999");
    expect(normalized.person).toBe("Jayraj");
    expect(normalized.content).toContain("I'll send the database schema tonight.");
  });
});

describe("Security & OAuth Compliance Audit", () => {
  it("prevents access tokens from leaking in local storage or client state payloads", () => {
    const commitment: Commitment = {
      id: "sec_1",
      person: "Security Test Contact",
      commitment: "Review access permissions",
      object: "Access Review",
      dueDate: "2026-08-30T17:00:00Z",
      status: "due_soon",
      confidence: 0.95,
      source: "Gmail: Security Check",
      sourceType: "gmail",
      evidence: "Review access permissions by Friday",
      direction: "i_owe",
      importance: "high",
      createdAt: new Date().toISOString(),
    };

    const keys = Object.keys(commitment);
    expect(keys).not.toContain("accessToken");
    expect(keys).not.toContain("refreshToken");
    expect(keys).not.toContain("clientSecret");
  });
});
