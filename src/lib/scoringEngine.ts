import { Commitment, AttentionScoreDetails } from "@/types/commitment";
import { parseISO, differenceInHours, isValid } from "date-fns";

export function calculateAttentionScore(
  commitment: Commitment,
  referenceDate: Date = new Date()
): AttentionScoreDetails {
  if (commitment.status === "completed") {
    return {
      commitmentId: commitment.id,
      attentionScore: 0,
      urgencyFactor: 0,
      overdueMultiplier: 1.0,
      confidenceFactor: commitment.confidence,
      importanceFactor: 1.0,
      urgencyLabel: "Low",
      formulaExplanation: "Completed commitment requires zero attention.",
      reasons: ["Completed"],
    };
  }

  // 1. Urgency Factor (0 - 10)
  let urgencyFactor = 2; // upcoming
  switch (commitment.status) {
    case "overdue":
      urgencyFactor = 10;
      break;
    case "due_today":
      urgencyFactor = 8.5;
      break;
    case "due_soon":
      urgencyFactor = 6.5;
      break;
    case "ambiguous":
      urgencyFactor = 4.5;
      break;
    case "upcoming":
      urgencyFactor = 2.5;
      break;
  }

  // 2. Overdue Duration Multiplier (1.0 - 3.0)
  let overdueMultiplier = 1.0;
  const reasons: string[] = [];

  if (commitment.status === "overdue" && commitment.dueDate) {
    const due = parseISO(commitment.dueDate);
    if (isValid(due)) {
      const hoursOverdue = Math.max(0, differenceInHours(referenceDate, due));
      const daysOverdue = Math.floor(hoursOverdue / 24);
      overdueMultiplier = Math.min(3.0, 1.0 + daysOverdue * 0.25);
      reasons.push(`Overdue by ${daysOverdue + 1} day(s) (Multiplier: ${overdueMultiplier.toFixed(2)}x)`);
    }
  }

  // 3. Confidence Factor (0.0 - 1.0)
  const confidenceFactor = Math.max(0.1, Math.min(1.0, commitment.confidence));

  // 4. Importance Factor (1.0 - 2.5)
  let importanceFactor = 1.5;
  switch (commitment.importance) {
    case "critical":
      importanceFactor = 2.5;
      reasons.push("Critical importance weighting");
      break;
    case "high":
      importanceFactor = 2.0;
      reasons.push("High importance weighting");
      break;
    case "medium":
      importanceFactor = 1.5;
      break;
    case "low":
      importanceFactor = 1.0;
      break;
  }

  if (commitment.conflictWithId) {
    reasons.push("Contradictory commitment conflict detected");
    urgencyFactor += 1.5;
  }

  // Deterministic Formula: raw = urgency × overdueDuration × confidence × importance
  const rawScore = urgencyFactor * overdueMultiplier * confidenceFactor * importanceFactor;

  // Max raw possible = 10 * 3.0 * 1.0 * 2.5 = 75
  const normalizedScore = Math.max(0, Math.min(100, Math.round((rawScore / 75) * 100)));

  let urgencyLabel: AttentionScoreDetails["urgencyLabel"] = "Low";
  if (normalizedScore >= 75) {
    urgencyLabel = "Critical";
  } else if (normalizedScore >= 50) {
    urgencyLabel = "High";
  } else if (normalizedScore >= 30) {
    urgencyLabel = "Medium";
  }

  const formulaExplanation = `Attention Score (${normalizedScore}/100) = Urgency (${urgencyFactor}) × Overdue (${overdueMultiplier.toFixed(2)}x) × Confidence (${Math.round(confidenceFactor * 100)}%) × Importance (${importanceFactor}x)`;

  return {
    commitmentId: commitment.id,
    attentionScore: normalizedScore,
    urgencyFactor,
    overdueMultiplier,
    confidenceFactor,
    importanceFactor,
    urgencyLabel,
    formulaExplanation,
    reasons,
  };
}

export function calculateCommitmentHealth(commitments: Commitment[]): {
  healthScore: number;
  healthLabel: "Excellent" | "Good" | "At Risk" | "Critical";
  breakdown: {
    total: number;
    active: number;
    overdue: number;
    atRisk: number;
    due48Hours: number;
    conflicts: number;
    completed: number;
  };
  riskRadar: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
} {
  if (commitments.length === 0) {
    return {
      healthScore: 100,
      healthLabel: "Excellent",
      breakdown: { total: 0, active: 0, overdue: 0, atRisk: 0, due48Hours: 0, conflicts: 0, completed: 0 },
      riskRadar: { critical: 0, high: 0, medium: 0, low: 0 }
    };
  }

  const total = commitments.length;
  const completed = commitments.filter((c) => c.status === "completed").length;
  const activeCommitments = commitments.filter((c) => c.status !== "completed");
  const overdue = activeCommitments.filter((c) => c.status === "overdue").length;
  const dueToday = activeCommitments.filter((c) => c.status === "due_today").length;
  const dueSoon = activeCommitments.filter((c) => c.status === "due_soon").length;
  const conflicts = activeCommitments.filter((c) => !!c.conflictWithId).length;

  const riskRadar = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  activeCommitments.forEach((c) => {
    const score = calculateAttentionScore(c).urgencyLabel;
    if (score === "Critical") riskRadar.critical++;
    else if (score === "High") riskRadar.high++;
    else if (score === "Medium") riskRadar.medium++;
    else riskRadar.low++;
  });

  const atRisk = riskRadar.critical + riskRadar.high;
  const due48Hours = dueToday + dueSoon;

  // Deduct penalty based on overdue, conflicts, and high-risk items
  const overduePenalty = (overdue / Math.max(1, activeCommitments.length)) * 50;
  const conflictPenalty = (conflicts / Math.max(1, activeCommitments.length)) * 30;
  const atRiskPenalty = (atRisk / Math.max(1, activeCommitments.length)) * 20;

  const rawHealth = 100 - (overduePenalty + conflictPenalty + atRiskPenalty);
  const healthScore = Math.max(0, Math.min(100, Math.round(rawHealth)));

  let healthLabel: "Excellent" | "Good" | "At Risk" | "Critical" = "Good";
  if (healthScore >= 85) healthLabel = "Excellent";
  else if (healthScore >= 70) healthLabel = "Good";
  else if (healthScore >= 45) healthLabel = "At Risk";
  else healthLabel = "Critical";

  return {
    healthScore,
    healthLabel,
    breakdown: {
      total,
      active: activeCommitments.length,
      overdue,
      atRisk,
      due48Hours,
      conflicts,
      completed
    },
    riskRadar
  };
}

export function calculateRiskScore(
  commitment: Commitment,
  _referenceDate: Date = new Date()
): {
  riskScore: number;
  riskCategory: "Critical" | "High" | "Medium" | "Low";
  reasons: string[];
  recommendedAction: string;
} {
  if (commitment.status === "completed") {
    return {
      riskScore: 0,
      riskCategory: "Low",
      reasons: ["Obligation completed"],
      recommendedAction: "No action required.",
    };
  }

  let riskScore = 15;
  const reasons: string[] = [];

  if (commitment.status === "overdue") {
    riskScore += 45;
    reasons.push("Deadline has already passed");
  } else if (commitment.status === "due_today") {
    riskScore += 35;
    reasons.push("Deadline is today");
  } else if (commitment.status === "due_soon") {
    riskScore += 20;
    reasons.push("Deadline approaching within 48 hours");
  }

  if (commitment.history && commitment.history.length > 1) {
    const changes = commitment.history.filter((h) => h.event === "deadline_changed").length;
    if (changes > 0) {
      riskScore += changes * 15;
      reasons.push(`Deadline shifted ${changes} time(s) previously`);
    }
  }

  if (commitment.conflictWithId) {
    riskScore += 25;
    reasons.push("Contradictory timeline or conflicting statement detected");
  }

  if (commitment.importance === "critical") {
    riskScore += 20;
    reasons.push("Marked as critical importance");
  } else if (commitment.importance === "high") {
    riskScore += 10;
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let riskCategory: "Critical" | "High" | "Medium" | "Low" = "Low";
  if (riskScore >= 81) riskCategory = "Critical";
  else if (riskScore >= 61) riskCategory = "High";
  else if (riskScore >= 31) riskCategory = "Medium";

  let recommendedAction = "Monitor progress and keep evidence up to date.";
  if (riskCategory === "Critical" || riskCategory === "High") {
    recommendedAction = `Send a quick follow-up to ${commitment.person} or update deadline.`;
  }

  return {
    riskScore,
    riskCategory,
    reasons,
    recommendedAction,
  };
}
