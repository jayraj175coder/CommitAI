import { addDays, addWeeks, subDays, format, parseISO, isValid, startOfDay, isBefore, isToday } from "date-fns";
import { CommitmentStatus } from "@/types/commitment";

export function normalizeDateText(
  dateText: string | null | undefined,
  baseDate: Date = new Date()
): { parsedIsoDate: string | null; isAmbiguous: boolean } {
  if (!dateText || typeof dateText !== "string") {
    return { parsedIsoDate: null, isAmbiguous: true };
  }

  const clean = dateText.trim().toLowerCase();

  if (
    clean === "" ||
    clean === "asap" ||
    clean === "soon" ||
    clean === "someday" ||
    clean === "when possible" ||
    clean === "later" ||
    clean === "tbd"
  ) {
    return { parsedIsoDate: null, isAmbiguous: true };
  }

  const base = startOfDay(baseDate);

  // Today / Tonight / EOD
  if (clean.includes("today") || clean.includes("tonight") || clean.includes("by eod")) {
    const d = new Date(base);
    d.setHours(17, 0, 0, 0);
    return { parsedIsoDate: d.toISOString(), isAmbiguous: false };
  }

  // Tomorrow
  if (clean.includes("tomorrow")) {
    const d = addDays(base, 1);
    const timeMatch = clean.match(/tomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : "";
      if (ampm.includes("p") && hours < 12) hours += 12;
      if (ampm.includes("a") && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
    } else {
      d.setHours(17, 0, 0, 0);
    }
    return { parsedIsoDate: d.toISOString(), isAmbiguous: false };
  }

  // Yesterday
  if (clean.includes("yesterday")) {
    const d = subDays(base, 1);
    d.setHours(17, 0, 0, 0);
    return { parsedIsoDate: d.toISOString(), isAmbiguous: false };
  }

  // Day after tomorrow
  if (clean.includes("day after tomorrow")) {
    const d = addDays(base, 2);
    d.setHours(17, 0, 0, 0);
    return { parsedIsoDate: d.toISOString(), isAmbiguous: false };
  }

  // Relative days: e.g. "in 3 days"
  const inDaysMatch = clean.match(/in\s+(\d+)\s+day/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const d = addDays(base, days);
    d.setHours(17, 0, 0, 0);
    return { parsedIsoDate: d.toISOString(), isAmbiguous: false };
  }

  // Next week
  if (clean.includes("next week")) {
    const d = addWeeks(base, 1);
    d.setHours(17, 0, 0, 0);
    return { parsedIsoDate: d.toISOString(), isAmbiguous: false };
  }

  // Days of the week (e.g. "Friday", "next Monday")
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < daysOfWeek.length; i++) {
    const dayName = daysOfWeek[i];
    if (clean.includes(dayName)) {
      const targetDay = i;
      const currentDay = base.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0 || clean.includes("next " + dayName)) {
        diff += 7;
      }
      const d = addDays(base, diff);
      d.setHours(17, 0, 0, 0);
      return { parsedIsoDate: d.toISOString(), isAmbiguous: false };
    }
  }

  // Direct ISO / standard date parsing
  const directDate = new Date(dateText);
  if (isValid(directDate) && !isNaN(directDate.getTime())) {
    return { parsedIsoDate: directDate.toISOString(), isAmbiguous: false };
  }

  return { parsedIsoDate: null, isAmbiguous: true };
}

export function calculateStatus(
  dueDateIso: string | null | undefined,
  isAmbiguous: boolean = false,
  isCompleted: boolean = false,
  referenceDate: Date = new Date()
): CommitmentStatus {
  if (isCompleted) {
    return "completed";
  }

  if (isAmbiguous || !dueDateIso) {
    return "ambiguous";
  }

  const due = new Date(dueDateIso);
  if (!isValid(due)) {
    return "ambiguous";
  }

  const now = startOfDay(referenceDate);
  const dueDay = startOfDay(due);

  if (isBefore(dueDay, now)) {
    return "overdue";
  }

  if (dueDay.getTime() === now.getTime()) {
    return "due_today";
  }

  const threeDaysOut = addDays(now, 3);
  if (isBefore(dueDay, threeDaysOut)) {
    return "due_soon";
  }

  return "upcoming";
}

export function formatDueDateDisplay(dueDateIso: string | null | undefined, originalText?: string): string {
  if (!dueDateIso) {
    return originalText ? `Ambiguous (${originalText})` : "No clear date";
  }

  const due = parseISO(dueDateIso);
  if (!isValid(due)) {
    return originalText || "Unknown date";
  }

  if (isToday(due)) {
    return `Today (${format(due, "h:mm a")})`;
  }

  return format(due, "MMM d, yyyy");
}
