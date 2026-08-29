import { Commitment } from "@/types/commitment";
import { formatDueDateDisplay } from "./dateNormalizer";
import { calculateAttentionScore } from "./scoringEngine";

export interface GroundedEvidence {
  commitmentId: string;
  person: string;
  commitment: string;
  evidenceSnippet: string;
  source: string;
  dueDateDisplay: string;
  confidence: number;
}

export interface NLQueryResult {
  answerText: string;
  matchedCommitments: Commitment[];
  queryIntent: string;
  hasSufficientEvidence: boolean;
  groundedEvidenceList: GroundedEvidence[];
  suggestedQuestions?: string[];
}

export function executeNaturalLanguageQuery(query: string, commitments: Commitment[]): NLQueryResult {
  const cleanQuery = query.trim().toLowerCase();

  if (cleanQuery === "" || commitments.length === 0) {
    return {
      answerText: "I couldn't find enough evidence in your data to establish that commitment.",
      matchedCommitments: [],
      queryIntent: "Unknown / Empty",
      hasSufficientEvidence: false,
      groundedEvidenceList: [],
    };
  }

  // Filter out commitments with no evidence snippet (Guardrail)
  const validCommitments = commitments.filter((c) => c.evidence && c.evidence.trim().length > 0);

  let matched: Commitment[] = [];
  let intent = "Search";
  let suggestedQuestions: string[] = [];

  // Intent 1: "What do I need to worry about this week?" / "Risk"
  if (
    cleanQuery.includes("worry about") ||
    cleanQuery.includes("at risk") ||
    cleanQuery.includes("priority") ||
    cleanQuery.includes("priorities")
  ) {
    intent = "This Week's High-Risk Priorities";
    matched = validCommitments
      .filter((c) => c.status !== "completed")
      .sort((a, b) => calculateAttentionScore(b).attentionScore - calculateAttentionScore(a).attentionScore);
    suggestedQuestions = [
      "Why is my top commitment at risk?",
      "What should I follow up on today?",
      "Show me my overdue commitments.",
    ];
  } else if (cleanQuery.includes("waiting for") || cleanQuery.includes("waiting on") || cleanQuery.includes("who owes me")) {
    intent = "What I Am Waiting For From Other People";
    matched = validCommitments.filter((c) => c.direction === "they_owe_me" && c.status !== "completed");
    suggestedQuestions = [
      "Draft a follow-up email for the top waiting item",
      "Which deadlines changed recently?",
      "Do I have any calendar conflicts?",
    ];
  } else if (cleanQuery.includes("i owe") || cleanQuery.includes("i promised") || cleanQuery.includes("my commitments")) {
    intent = "Personal Commitments Assigned To Me";
    matched = validCommitments.filter((c) => (c.direction === "i_owe" || c.direction === "owed_by_me") && c.status !== "completed");
    suggestedQuestions = [
      "What is due today?",
      "Show me my high-risk commitments",
      "Which promises were completed?",
    ];
  } else if (cleanQuery.includes("changed") || cleanQuery.includes("delayed") || cleanQuery.includes("shifted")) {
    intent = "Recent Deadline & Timeline Shifts";
    matched = validCommitments.filter((c) => !!c.conflictWithId || (c.history && c.history.length > 1));
    suggestedQuestions = [
      "Show me conflicting deadlines",
      "What is due this week?",
      "What should I follow up on today?",
    ];
  } else if (cleanQuery.includes("overdue") || cleanQuery.includes("late") || cleanQuery.includes("missed")) {
    intent = "Overdue Commitments";
    matched = validCommitments.filter((c) => c.status === "overdue");
    suggestedQuestions = [
      "Draft a follow-up for overdue items",
      "What am I waiting for?",
      "What do I need to worry about this week?",
    ];
  } else if (cleanQuery.includes("conflict") || cleanQuery.includes("conflicts") || cleanQuery.includes("calendar")) {
    intent = "Calendar & Timeline Conflicts";
    matched = validCommitments.filter((c) => !!c.conflictWithId || c.sourceType === "google_calendar");
    suggestedQuestions = [
      "What is due today?",
      "Which deadlines changed recently?",
      "What should I prepare for tomorrow?",
    ];
  } else if (cleanQuery.includes("today") || cleanQuery.includes("follow up")) {
    intent = "Today's Actionable Priorities";
    matched = validCommitments.filter((c) => c.status === "due_today" || c.status === "overdue" || c.status === "due_soon");
    suggestedQuestions = [
      "Show me what I promised to others",
      "What am I waiting for?",
      "Which commitments are at risk?",
    ];
  } else {
    const personMatch = validCommitments.find((c) =>
      cleanQuery.includes(c.person.toLowerCase()) || cleanQuery.includes(c.person.split(" ")[0].toLowerCase())
    );

    if (personMatch) {
      const targetName = personMatch.person.split(" ")[0];
      intent = `Person Specific: ${personMatch.person}`;
      matched = validCommitments.filter((c) => c.person.toLowerCase().includes(targetName.toLowerCase()));
      suggestedQuestions = [
        `What else involves ${targetName}?`,
        "What am I waiting for from other people?",
        "Show me my overdue commitments.",
      ];
    } else {
      const words = cleanQuery.split(" ").filter((w) => w.length > 2);
      matched = validCommitments.filter((c) => {
        return words.some(
          (w) =>
            c.commitment.toLowerCase().includes(w) ||
            c.object.toLowerCase().includes(w) ||
            c.person.toLowerCase().includes(w) ||
            c.evidence.toLowerCase().includes(w)
        );
      });
      intent = "Keyword Evidence Grounded Search";
      suggestedQuestions = [
        "What do I need to worry about this week?",
        "What am I waiting for?",
        "Show me my overdue commitments.",
      ];
    }
  }

  if (matched.length === 0) {
    return {
      answerText: "I couldn't find enough evidence in your data to establish that commitment.",
      matchedCommitments: [],
      queryIntent: intent,
      hasSufficientEvidence: false,
      groundedEvidenceList: [],
    };
  }

  const groundedEvidenceList: GroundedEvidence[] = matched.map((c) => ({
    commitmentId: c.id,
    person: c.person,
    commitment: c.commitment,
    evidenceSnippet: c.evidence,
    source: c.source,
    dueDateDisplay: formatDueDateDisplay(c.dueDate, c.originalDateText),
    confidence: c.confidence,
  }));

  const people = Array.from(new Set(matched.map((c) => c.person))).join(", ");
  const answerText = `Found ${matched.length} evidence-backed commitment(s) involving ${people}:`;

  return {
    answerText,
    matchedCommitments: matched,
    queryIntent: intent,
    hasSufficientEvidence: true,
    groundedEvidenceList,
    suggestedQuestions,
  };
}

export function generateFollowUpMessage(commitment: Commitment): {
  messageText: string;
  disclaimer: string;
} {
  const formattedDate = formatDueDateDisplay(commitment.dueDate, commitment.originalDateText);
  let msg = "";

  if (commitment.status === "overdue") {
    msg = `Hi ${commitment.person.split(" ")[0]}, hope you're well! I wanted to follow up on the ${commitment.object.toLowerCase()} ("${commitment.commitment}") which was due around ${formattedDate}. Based on your previous message ("${commitment.evidence}"), could you let me know when to expect this? Thanks!`;
  } else if (commitment.status === "due_today" || commitment.status === "due_soon") {
    msg = `Hey ${commitment.person.split(" ")[0]}, quick reminder regarding the ${commitment.object.toLowerCase()} ("${commitment.commitment}") scheduled for ${formattedDate}. Let me know if you need any info from my end.`;
  } else {
    msg = `Hi ${commitment.person.split(" ")[0]}, following up on "${commitment.commitment}" mentioned in our communication. Please share an update when available.`;
  }

  return {
    messageText: msg,
    disclaimer: "AI-Generated Follow-up Draft — Derived strictly from verbatim source evidence snippet.",
  };
}
