import { z } from "zod";

export type CommitmentStatus = "overdue" | "due_today" | "due_soon" | "upcoming" | "completed" | "ambiguous";

export type CommitmentDirection = "i_owe" | "they_owe_me" | "internal" | "owed_by_me" | "owed_to_me";

export type SourceType = "text" | "email" | "chat" | "meeting_notes" | "document" | "whatsapp" | "sms" | "slack" | "meeting" | "note" | "screenshot" | "voice" | "manual" | "gmail" | "google_calendar" | "outlook" | "teams" | "discord" | "telegram";

export interface CommitmentHistoryEvent {
  id: string;
  timestamp: string;
  event: "created" | "deadline_changed" | "fulfilled" | "cancelled" | "contradiction_detected";
  oldDueDate?: string | null;
  newDueDate?: string | null;
  evidence: string;
  source: string;
  sourceType: SourceType;
}

export const CommitmentSchema = z.object({
  id: z.string().optional(),
  person: z.string().min(1, "Person name is required"),
  commitment: z.string().min(3, "Commitment description is required"),
  object: z.string().default("General"),
  dueDate: z.string().nullable().optional(),
  originalDateText: z.string().optional(),
  status: z.enum(["overdue", "due_today", "due_soon", "upcoming", "completed", "ambiguous"]),
  confidence: z.number().min(0).max(1),
  source: z.string(),
  sourceType: z.enum(["text", "email", "chat", "meeting_notes", "document", "whatsapp", "sms", "slack", "meeting", "note", "screenshot", "voice", "manual", "gmail", "google_calendar", "outlook", "teams", "discord", "telegram"]).default("text"),
  sourceId: z.string().optional(),
  sourceUrl: z.string().optional(),
  evidence: z.string().min(1, "Evidence snippet is required"),
  direction: z.enum(["i_owe", "they_owe_me", "internal", "owed_by_me", "owed_to_me"]).default("they_owe_me"),
  importance: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  sourceTimestamp: z.string().optional(),
  conflictWithId: z.string().optional(),
  conflictReason: z.string().optional(),
  relatedCommitmentId: z.string().optional(),
  notes: z.string().optional(),
  snoozedUntil: z.string().optional(),
  actionPlan: z.object({
    whatNeedsToBeDone: z.string(),
    suggestedNextStep: z.string(),
    suggestedDeadline: z.string().optional(),
    peopleInvolved: z.array(z.string()),
    sourceEmailSubject: z.string().optional(),
    relevantEvidence: z.string()
  }).optional(),
  history: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      event: z.enum(["created", "deadline_changed", "fulfilled", "cancelled", "contradiction_detected"]),
      oldDueDate: z.string().nullable().optional(),
      newDueDate: z.string().nullable().optional(),
      evidence: z.string(),
      source: z.string(),
      sourceType: z.enum(["text", "email", "chat", "meeting_notes", "document", "whatsapp", "sms", "slack", "meeting", "note", "screenshot", "voice", "manual", "gmail", "google_calendar", "outlook", "teams", "discord", "telegram"])
    })
  ).optional()
});

export type Commitment = z.infer<typeof CommitmentSchema> & { id: string };

export const ExtractionResponseSchema = z.object({
  commitments: z.array(
    z.object({
      person: z.string(),
      commitment: z.string(),
      object: z.string().optional().default("General"),
      dueDateText: z.string().nullable().optional(),
      evidence: z.string().min(1, "Evidence required"),
      direction: z.enum(["i_owe", "they_owe_me", "internal"]).optional().default("they_owe_me"),
      confidence: z.number().min(0).max(1),
      isAmbiguous: z.boolean().optional().default(false),
      importance: z.enum(["low", "medium", "high", "critical"]).optional().default("medium")
    })
  )
});

export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

export interface FilterOptions {
  status?: CommitmentStatus | "all";
  person?: string;
  sourceType?: SourceType | "all";
  direction?: CommitmentDirection | "all";
  searchQuery?: string;
  sortBy?: "attentionScore" | "dueDate" | "confidence" | "person" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface AttentionScoreDetails {
  commitmentId: string;
  attentionScore: number; // 0 - 100
  urgencyFactor: number; // 0 - 10
  overdueMultiplier: number; // 1 - 3
  confidenceFactor: number; // 0 - 1
  importanceFactor: number; // 1 - 4
  urgencyLabel: "Critical" | "High" | "Medium" | "Low";
  formulaExplanation: string;
  reasons: string[];
}
