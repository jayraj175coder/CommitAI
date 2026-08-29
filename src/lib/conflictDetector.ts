import { Commitment } from "@/types/commitment";

export interface CommitmentConflict {
  commitmentA: Commitment;
  commitmentB: Commitment;
  reason: string;
}

export function detectConflicts(commitments: Commitment[]): Commitment[] {
  const updatedCommitments = [...commitments];
  const conflictsMap = new Map<string, { conflictId: string; reason: string }>();

  for (let i = 0; i < updatedCommitments.length; i++) {
    for (let j = i + 1; j < updatedCommitments.length; j++) {
      const a = updatedCommitments[i];
      const b = updatedCommitments[j];

      // Check if both commitments involve the same person and object/topic
      const samePerson = a.person.toLowerCase().trim() === b.person.toLowerCase().trim();
      const sameObject =
        a.object.toLowerCase().trim() === b.object.toLowerCase().trim() ||
        a.commitment.toLowerCase().includes(b.object.toLowerCase()) ||
        b.commitment.toLowerCase().includes(a.object.toLowerCase());

      if (samePerson && sameObject && a.status !== "completed" && b.status !== "completed") {
        // Contradictory due dates
        if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
          const reason = `Contradictory due date between "${a.originalDateText || a.dueDate}" and "${b.originalDateText || b.dueDate}" for deliverable "${a.object}"`;
          conflictsMap.set(a.id, { conflictId: b.id, reason });
          conflictsMap.set(b.id, { conflictId: a.id, reason });
        }
      }
    }
  }

  return updatedCommitments.map((c) => {
    const conflict = conflictsMap.get(c.id);
    if (conflict) {
      return {
        ...c,
        conflictWithId: conflict.conflictId,
        conflictReason: conflict.reason,
      };
    }
    return c;
  });
}
