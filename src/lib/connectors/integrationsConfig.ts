export type IntegrationCategory = "email" | "calendar" | "chat" | "meeting";

export type IntegrationStatus = "connected" | "available" | "coming_soon";

export interface IntegrationConfig {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  iconName: string;
  status: IntegrationStatus;
  accessScopes?: string;
  whyNeeded?: string;
  authUrl?: string;
  isImplemented: boolean;
}

export const INTEGRATION_REGISTRY: IntegrationConfig[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "email",
    description: "Discovers promises, deliverables, and updated deadlines from email threads.",
    iconName: "gmail",
    status: "available",
    accessScopes: "Read-only access to email threads with commitment phrases",
    whyNeeded: "Email is where contracts, deliverables, and formal deadlines live.",
    authUrl: "/api/auth/google",
    isImplemented: true,
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "calendar",
    description: "Identifies promised meetings, presentations, and delivery milestones.",
    iconName: "calendar",
    status: "available",
    accessScopes: "Read-only access to upcoming calendar events and meeting notes",
    whyNeeded: "Calendar events link commitments directly to scheduled time blocks.",
    authUrl: "/api/auth/google",
    isImplemented: true,
  },
  {
    id: "discord",
    name: "Discord",
    category: "chat",
    description: "Tracks commitments made across project channels and community discussions.",
    iconName: "discord",
    status: "available",
    accessScopes: "Read-only access to authorized server channels and mentions",
    whyNeeded: "Captures informal developer agreements and quick team commitments.",
    authUrl: "/api/auth/discord",
    isImplemented: true,
  },
  {
    id: "telegram",
    name: "Telegram",
    category: "chat",
    description: "Captures freelance client agreements and instant group chat commitments.",
    iconName: "telegram",
    status: "available",
    accessScopes: "Read-only access to authorized Telegram group chats",
    whyNeeded: "Instant messaging is where informal agreements are frequently negotiated.",
    authUrl: "/api/auth/telegram",
    isImplemented: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "chat",
    description: "Your everyday conversations shouldn't become forgotten commitments.",
    iconName: "whatsapp",
    status: "coming_soon",
    isImplemented: false,
  },
  {
    id: "slack",
    name: "Slack",
    category: "chat",
    description: "Capture promises and follow-ups from team communication.",
    iconName: "slack",
    status: "coming_soon",
    isImplemented: false,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    category: "chat",
    description: "Connect workplace conversations and meetings.",
    iconName: "teams",
    status: "coming_soon",
    isImplemented: false,
  },
  {
    id: "meet",
    name: "Google Meet",
    category: "meeting",
    description: "Turn meeting conversations into actionable commitments.",
    iconName: "meet",
    status: "coming_soon",
    isImplemented: false,
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "meeting",
    description: "Connect meeting context and follow-ups.",
    iconName: "zoom",
    status: "coming_soon",
    isImplemented: false,
  },
];
