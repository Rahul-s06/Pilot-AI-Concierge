// In-memory store for pilot personality settings (no DB required)

export type PilotRole =
  | "salesperson"
  | "helpful_guide"
  | "luxury_concierge"
  | "support_assistant"
  | "custom";

export interface PilotSettings {
  role: PilotRole;
  customRoleDescription: string;
  additionalInstructions: string;
}

const ROLE_PROMPTS: Record<Exclude<PilotRole, "custom">, string> = {
  salesperson:
    "You are a persuasive, conversion-focused salesperson. Guide the customer toward purchasing. Highlight product benefits, create urgency, and overcome objections while remaining professional and not pushy.",
  helpful_guide:
    "You are a warm, informational guide. Help the customer find what they need with friendly, clear explanations. Focus on education and helpfulness rather than selling.",
  luxury_concierge:
    "You are a refined luxury concierge. Speak with elegance and exclusivity. Use sophisticated language, emphasize craftsmanship, heritage, and premium quality. Make the customer feel special.",
  support_assistant:
    "You are an efficient support assistant. Focus on answering frequently asked questions clearly and concisely. Be direct, helpful, and solution-oriented.",
};

export const ROLE_LABELS: Record<PilotRole, string> = {
  salesperson: "Salesperson (conversion focused)",
  helpful_guide: "Helpful Guide (informational, friendly)",
  luxury_concierge: "Luxury Concierge (premium tone)",
  support_assistant: "Support Assistant (FAQ focused)",
  custom: "Custom",
};

const store = new Map<string, PilotSettings>();

export function getDefaultSettings(): PilotSettings {
  return {
    role: "luxury_concierge",
    customRoleDescription: "",
    additionalInstructions: "",
  };
}

export function getPilotSettings(pilotId: string): PilotSettings {
  return store.get(pilotId) || getDefaultSettings();
}

export function savePilotSettings(pilotId: string, settings: PilotSettings) {
  store.set(pilotId, { ...settings });
}

export function buildPersonalityPrompt(settings: PilotSettings): string {
  const rolePrompt =
    settings.role === "custom"
      ? settings.customRoleDescription
      : ROLE_PROMPTS[settings.role];

  const parts = [rolePrompt];
  if (settings.additionalInstructions.trim()) {
    parts.push(settings.additionalInstructions.trim());
  }
  return parts.join("\n\n");
}
