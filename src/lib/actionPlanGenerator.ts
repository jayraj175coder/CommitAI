import { Commitment } from "@/types/commitment";
import { formatDueDateDisplay } from "./dateNormalizer";

export interface ActionPlan {
  taskTitle: string;
  whatNeedsToBeDone: string;
  suggestedNextStep: string;
  suggestedDeadline?: string;
  peopleInvolved: string[];
  sourceEmailSubject?: string;
  relevantEvidence: string;
  gmailComposeUrl?: string;
  calendarEventUrl?: string;
}

export function generateActionPlan(commitment: Commitment): ActionPlan {
  const isIowe = commitment.direction === "i_owe" || commitment.direction === "owed_by_me";
  const person = commitment.person || "Contact";
  const evidence = commitment.evidence || commitment.commitment;
  
  let subject = commitment.source;
  if (subject.startsWith("Gmail: ")) {
    subject = subject.replace(/^Gmail:\s*/, "");
  }

  const taskTitle = `[Action] ${commitment.commitment}`;

  const whatNeedsToBeDone = isIowe
    ? `You promised ${person}: "${commitment.commitment}"`
    : `${person} promised you: "${commitment.commitment}"`;

  let suggestedNextStep = "";
  const lowerTask = commitment.commitment.toLowerCase();

  if (lowerTask.includes("doc") || lowerTask.includes("report") || lowerTask.includes("spec") || lowerTask.includes("proposal")) {
    suggestedNextStep = isIowe
      ? `Draft or finalize the deliverable and reply to ${person}.`
      : `Send a quick follow-up to ${person} asking for the status of the document.`;
  } else if (lowerTask.includes("review") || lowerTask.includes("pr") || lowerTask.includes("check")) {
    suggestedNextStep = isIowe
      ? `Perform the review and post your feedback or approval.`
      : `Check in with ${person} to see if they've completed the review.`;
  } else if (lowerTask.includes("call") || lowerTask.includes("meet") || lowerTask.includes("sync")) {
    suggestedNextStep = `Confirm the calendar invite or call time with ${person}.`;
  } else if (lowerTask.includes("send") || lowerTask.includes("share") || lowerTask.includes("email")) {
    suggestedNextStep = isIowe
      ? `Attach the requested item and send it over email/chat.`
      : `Remind ${person} to send over the requested files.`;
  } else {
    suggestedNextStep = isIowe
      ? `Execute task and update ${person} upon completion.`
      : `Track progress and follow up with ${person} before the deadline.`;
  }

  const formattedDeadline = formatDueDateDisplay(commitment.dueDate, commitment.originalDateText);

  // Construct explicit Gmail compose URL (Requires user confirmation to click / open)
  const composeSubject = encodeURIComponent(`Re: ${subject || commitment.commitment}`);
  const composeBody = encodeURIComponent(
    `Hi ${person.split(" ")[0]},\n\nFollowing up regarding "${commitment.commitment}" (Reference: ${formattedDeadline}).\n\nBest regards.`
  );
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${composeSubject}&body=${composeBody}`;

  // Construct Calendar event creation URL (Requires explicit user confirmation)
  const eventTitle = encodeURIComponent(`[CommitAI] ${commitment.commitment}`);
  const eventDetails = encodeURIComponent(`Source: ${commitment.source}\nEvidence: ${evidence}`);
  const calendarEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${eventDetails}`;

  return {
    taskTitle,
    whatNeedsToBeDone,
    suggestedNextStep,
    suggestedDeadline: formattedDeadline,
    peopleInvolved: Array.from(new Set([person, "You"])),
    sourceEmailSubject: subject,
    relevantEvidence: evidence,
    gmailComposeUrl,
    calendarEventUrl,
  };
}
