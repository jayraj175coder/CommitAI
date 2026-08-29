import { Commitment, CommitmentHistoryEvent } from "@/types/commitment";

/**
 * Normalizes person names and deliverable texts for comparison
 */
function normalizeText(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-0\s]/g, "").trim();
}

/**
 * Calculates similarity between two strings (0 - 1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;

  const words1 = new Set(norm1.split(/\s+/));
  const words2 = new Set(norm2.split(/\s+/));
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function reconcileCommitments(
  existingCommitments: Commitment[],
  incomingCommitments: Commitment[]
): Commitment[] {
  const resultList = [...existingCommitments];

  for (const incoming of incomingCommitments) {
    let matchedIndex = -1;
    let highestScore = 0;

    for (let i = 0; i < resultList.length; i++) {
      const existing = resultList[i];

      // Exact sourceId match (e.g. same Gmail message ID) + similar commitment text
      if (existing.sourceId && incoming.sourceId && existing.sourceId === incoming.sourceId) {
        const textScore = calculateSimilarity(existing.commitment, incoming.commitment);
        if (textScore >= 0.6) {
          matchedIndex = i;
          highestScore = 1.0;
          break;
        }
      }

      // Person name match
      const personScore = calculateSimilarity(existing.person, incoming.person);
      if (personScore < 0.5) continue;

      // Deliverable or commitment similarity match
      const objectScore = calculateSimilarity(existing.object, incoming.object);
      const textScore = calculateSimilarity(existing.commitment, incoming.commitment);
      const contentScore = Math.max(objectScore, textScore);

      const combinedScore = personScore * 0.4 + contentScore * 0.6;

      if (combinedScore > highestScore && combinedScore >= 0.55) {
        highestScore = combinedScore;
        matchedIndex = i;
      }
    }

    if (matchedIndex !== -1) {
      // Reconcile with existing commitment
      const existing = resultList[matchedIndex];
      const existingHistory: CommitmentHistoryEvent[] = existing.history || [
        {
          id: `${existing.id}_h0`,
          timestamp: existing.createdAt,
          event: "created",
          oldDueDate: existing.dueDate,
          newDueDate: existing.dueDate,
          evidence: existing.evidence,
          source: existing.source,
          sourceType: existing.sourceType,
        },
      ];

      // Check if deadline changed
      if (incoming.dueDate && incoming.dueDate !== existing.dueDate) {
        const changeEvent: CommitmentHistoryEvent = {
          id: `${existing.id}_h${existingHistory.length + 1}`,
          timestamp: incoming.sourceTimestamp || new Date().toISOString(),
          event: "deadline_changed",
          oldDueDate: existing.dueDate,
          newDueDate: incoming.dueDate,
          evidence: incoming.evidence,
          source: incoming.source,
          sourceType: incoming.sourceType,
        };

        resultList[matchedIndex] = {
          ...existing,
          dueDate: incoming.dueDate,
          originalDateText: incoming.originalDateText || existing.originalDateText,
          status: "due_soon",
          evidence: `${existing.evidence} | Updated (${incoming.source}): "${incoming.evidence}"`,
          source: `${existing.source} → ${incoming.source}`,
          sourceType: incoming.sourceType,
          updatedAt: new Date().toISOString(),
          history: [...existingHistory, changeEvent],
        };
      } else {
        // Same commitment re-stated or reinforced
        resultList[matchedIndex] = {
          ...existing,
          confidence: Math.max(existing.confidence, incoming.confidence),
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      // Brand new commitment
      const createdEvent: CommitmentHistoryEvent = {
        id: `${incoming.id}_h0`,
        timestamp: incoming.createdAt || new Date().toISOString(),
        event: "created",
        oldDueDate: null,
        newDueDate: incoming.dueDate,
        evidence: incoming.evidence,
        source: incoming.source,
        sourceType: incoming.sourceType,
      };

      const newCommitment: Commitment = {
        ...incoming,
        history: [createdEvent],
      };

      resultList.push(newCommitment);
    }
  }

  return resultList;
}
