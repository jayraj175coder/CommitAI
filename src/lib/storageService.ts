import { Commitment, FilterOptions } from "@/types/commitment";
import { DEMO_COMMITMENTS } from "@/data/demoData";
import { calculateAttentionScore } from "./scoringEngine";
import { detectConflicts } from "./conflictDetector";
import { reconcileCommitments } from "./reconciliationEngine";

const STORAGE_KEY = "commitai_commitments_v1";

export class CommitmentStorage {
  private static isServer(): boolean {
    return typeof window === "undefined";
  }

  static getCommitments(): Commitment[] {
    if (this.isServer()) {
      return [];
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return detectConflicts(parsed);
    } catch (e) {
      console.warn("Error reading commitments from localStorage", e);
      return [];
    }
  }

  static saveCommitments(commitments: Commitment[]): void {
    if (this.isServer()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(commitments));
    } catch (e) {
      console.error("Error saving commitments to localStorage", e);
    }
  }

  static addCommitments(newItems: Commitment[]): Commitment[] {
    const current = this.getCommitments();
    const reconciled = reconcileCommitments(current, newItems);
    const updated = detectConflicts(reconciled);
    this.saveCommitments(updated);
    return updated;
  }

  static updateCommitment(id: string, updates: Partial<Commitment>): Commitment[] {
    const current = this.getCommitments();
    const updated = detectConflicts(
      current.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    this.saveCommitments(updated);
    return updated;
  }

  static deleteCommitment(id: string): Commitment[] {
    const current = this.getCommitments();
    const updated = detectConflicts(current.filter((c) => c.id !== id));
    this.saveCommitments(updated);
    return updated;
  }

  static clearAllData(): void {
    if (this.isServer()) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Error clearing commitments from localStorage", e);
    }
  }

  static resetToDemoData(): Commitment[] {
    const initial = detectConflicts(DEMO_COMMITMENTS);
    this.saveCommitments(initial);
    return initial;
  }

  static filterAndSort(commitments: Commitment[], options: FilterOptions): Commitment[] {
    let result = [...commitments];

    // Filter by status
    if (options.status && options.status !== "all") {
      result = result.filter((c) => c.status === options.status);
    }

    // Filter by person
    if (options.person && options.person.trim() !== "") {
      const personLower = options.person.toLowerCase();
      result = result.filter((c) => c.person.toLowerCase().includes(personLower));
    }

    // Filter by sourceType
    if (options.sourceType && options.sourceType !== "all") {
      result = result.filter((c) => c.sourceType === options.sourceType);
    }

    // Filter by direction
    if (options.direction && options.direction !== "all") {
      result = result.filter((c) => c.direction === options.direction);
    }

    // Search query
    if (options.searchQuery && options.searchQuery.trim() !== "") {
      const query = options.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.person.toLowerCase().includes(query) ||
          c.commitment.toLowerCase().includes(query) ||
          c.object.toLowerCase().includes(query) ||
          c.evidence.toLowerCase().includes(query) ||
          c.source.toLowerCase().includes(query)
      );
    }

    // Sort
    const order = options.sortOrder === "asc" ? 1 : -1;
    const sortBy = options.sortBy || "attentionScore";

    result.sort((a, b) => {
      if (sortBy === "attentionScore") {
        const scoreA = calculateAttentionScore(a).attentionScore;
        const scoreB = calculateAttentionScore(b).attentionScore;
        return (scoreB - scoreA) * order;
      }

      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * order;
      }

      if (sortBy === "confidence") {
        return (b.confidence - a.confidence) * order;
      }

      if (sortBy === "person") {
        return a.person.localeCompare(b.person) * order;
      }

      if (sortBy === "createdAt") {
        return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * order;
      }

      return 0;
    });

    return result;
  }
}
