import { Commitment, ExtractionResponseSchema, SourceType } from "@/types/commitment";
import { normalizeDateText, calculateStatus } from "./dateNormalizer";
import { decodeHtmlEntities, cleanEmailBody } from "./textUtils";

export interface AIProvider {
  extractCommitments(
    inputText: string,
    sourceName: string,
    sourceType: SourceType,
    referenceDateIso?: string
  ): Promise<Commitment[]>;
}

export interface ExtractionOptions {
  apiKey?: string;
  sourceName?: string;
  sourceType?: SourceType;
  referenceDate?: Date;
}

export class FallbackExtractionProvider implements AIProvider {
  async extractCommitments(
    inputText: string,
    sourceName: string,
    sourceType: SourceType = "text",
    referenceDateIso?: string
  ): Promise<Commitment[]> {
    const refDate = referenceDateIso ? new Date(referenceDateIso) : new Date();
    const commitments: Commitment[] = [];
    const cleanedText = cleanEmailBody(inputText);
    const lines = cleanedText.split("\n").filter((l) => l.trim().length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = decodeHtmlEntities(lines[i].trim());

      // Ignore subject lines, greetings, or email headers
      if (/^(subject:|from:|to:|re:|fwd:|hi|hello|dear|thanks|thank you|regards|best|cheers)/i.test(line)) {
        continue;
      }

      // Quick keyword match for commitments
      if (
        /send|share|call|deliver|review|finish|pay|invoice|document|draft|meeting|update|submit|check|promise|will|i'll|please|can you|get back|complete|follow up/i.test(
          line
        )
      ) {
        // Extract person name from sourceName if formatted as "... (from Sender)"
        let extractedPerson = "Sender";
        const fromMatch = sourceName.match(/\(from ([^)]+)\)/);
        if (fromMatch && fromMatch[1]) {
          extractedPerson = decodeHtmlEntities(fromMatch[1].trim());
        }

        let extractedTask = line;
        let extractedDateText: string | null = null;

        // Try extracting person name if explicitly prefixed like "John:"
        const nameMatch = line.match(/^([A-Z][a-z]+):/);
        if (nameMatch) {
          extractedPerson = nameMatch[1];
          extractedTask = line.substring(nameMatch[0].length).trim();
        }

        // Extract date phrases (e.g. "tomorrow at 6 PM", "Friday", "next week", "by EOD")
        const dateMatch = line.match(/(tomorrow(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\.?))?|today(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\.?))?|tonight|next week|by eod|by \d{1,2} [ap]m|Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday|asap|soon)/i);
        if (dateMatch) {
          extractedDateText = dateMatch[1];
        }

        const { parsedIsoDate } = normalizeDateText(extractedDateText, refDate);
        const status = calculateStatus(parsedIsoDate, false, false, refDate);

        commitments.push({
          id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          person: extractedPerson,
          commitment: extractedTask.length > 120 ? extractedTask.substring(0, 120) + "..." : extractedTask,
          object: determineObjectFromTask(extractedTask),
          dueDate: parsedIsoDate,
          originalDateText: extractedDateText || undefined,
          status,
          confidence: extractedDateText ? 0.92 : 0.75,
          source: decodeHtmlEntities(sourceName),
          sourceType,
          evidence: line,
          direction: extractedPerson === "Self" || extractedPerson === "You" ? "i_owe" : "they_owe_me",
          importance: line.toLowerCase().includes("urgent") || line.toLowerCase().includes("asap") || status === "overdue" ? "high" : "medium",
          createdAt: new Date().toISOString(),
          sourceTimestamp: refDate.toISOString(),
        });
      }
    }

    return commitments;
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  private apiKey: string;
  private apiBase: string;

  constructor(apiKey: string, apiBase: string = "https://api.openai.com/v1") {
    this.apiKey = apiKey;
    this.apiBase = apiBase;
  }

  async extractCommitments(
    inputText: string,
    sourceName: string,
    sourceType: SourceType = "text",
    referenceDateIso?: string
  ): Promise<Commitment[]> {
    const systemPrompt = `You are an expert AI Commitment Extraction Engine for "CommitAI".
Your job is to analyze unstructured text (emails, chat logs, meeting notes) and extract explicit commitments or promises made by people.

RULES:
1. ONLY extract clear promises/commitments (e.g. "I will send X", "Rahul agreed to review Y", "Will share document by Friday").
2. DO NOT invent or hallucinate facts not present in the input.
3. Every commitment MUST have exact line/snippet as "evidence". If no evidence, DO NOT extract it.
4. Extract the exact date expression as "dueDateText" (e.g. "tomorrow", "Friday at 5 PM", "next week", "ASAP").
5. Indicate direction: "they_owe_me" (someone owes user), "i_owe" (user owes someone), or "internal".
6. Assign confidence score (0.0 to 1.0).
7. If the date phrase is vague (e.g. "soon", "later", "someday"), set "isAmbiguous": true.

Return strictly valid JSON with this exact schema:
{
  "commitments": [
    {
      "person": "Name of person who promised",
      "commitment": "Concise summary of action promised",
      "object": "Object or deliverable (e.g. Invoice, API Specs, Deck)",
      "dueDateText": "raw date phrase or null",
      "evidence": "Exact string from input text",
      "direction": "they_owe_me" | "i_owe" | "internal",
      "confidence": 0.95,
      "isAmbiguous": false,
      "importance": "low" | "medium" | "high" | "critical"
    }
  ]
}`;

    const userPrompt = `Input Text Source: ${sourceName} (${sourceType})
Reference Date: ${referenceDateIso || new Date().toISOString()}

Input Text:
"""
${inputText}
"""`;

    let responseText = "";
    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const json = await response.json();
      responseText = json.choices?.[0]?.message?.content || "";
    } catch (err) {
      console.warn("AI API request failed, falling back to deterministic extractor", err);
      const fallback = new FallbackExtractionProvider();
      return fallback.extractCommitments(inputText, sourceName, sourceType, referenceDateIso);
    }

    try {
      const parsedRaw = JSON.parse(responseText);
      const validated = ExtractionResponseSchema.parse(parsedRaw);
      const refDate = referenceDateIso ? new Date(referenceDateIso) : new Date();

      return validated.commitments
        .filter((c) => c.confidence >= 0.5) // Filter out ultra low confidence
        .map((c, index) => {
          const { parsedIsoDate, isAmbiguous } = normalizeDateText(c.dueDateText, refDate);
          const finalAmbiguous = c.isAmbiguous || isAmbiguous;
          const status = calculateStatus(parsedIsoDate, finalAmbiguous, false, refDate);

          return {
            id: `ext_${Date.now()}_${index}`,
            person: c.person,
            commitment: c.commitment,
            object: c.object || "General",
            dueDate: parsedIsoDate,
            originalDateText: c.dueDateText || undefined,
            status,
            confidence: c.confidence,
            source: sourceName,
            sourceType,
            evidence: c.evidence,
            direction: c.direction,
            importance: c.importance,
            createdAt: new Date().toISOString(),
            sourceTimestamp: refDate.toISOString(),
          };
        });
    } catch (err) {
      console.error("Failed to parse or validate AI response JSON, falling back", err);
      const fallback = new FallbackExtractionProvider();
      return fallback.extractCommitments(inputText, sourceName, sourceType, referenceDateIso);
    }
  }
}

function determineObjectFromTask(task: string): string {
  const lower = task.toLowerCase();
  if (lower.includes("invoice") || lower.includes("bill") || lower.includes("payment")) return "Invoice";
  if (lower.includes("doc") || lower.includes("spec") || lower.includes("report")) return "Document";
  if (lower.includes("code") || lower.includes("pr") || lower.includes("repo")) return "Code PR";
  if (lower.includes("slide") || lower.includes("deck") || lower.includes("presentation")) return "Deck";
  if (lower.includes("meeting") || lower.includes("call")) return "Meeting";
  if (lower.includes("email") || lower.includes("message")) return "Email Response";
  return "Deliverable";
}

export async function processInputExtraction(
  inputText: string,
  sourceName: string = "Direct Input",
  sourceType: SourceType = "text",
  apiKey?: string,
  referenceDateIso?: string
): Promise<Commitment[]> {
  if (apiKey && apiKey.trim().length > 5) {
    const provider = new OpenAICompatibleProvider(apiKey);
    return provider.extractCommitments(inputText, sourceName, sourceType, referenceDateIso);
  } else {
    const provider = new FallbackExtractionProvider();
    return provider.extractCommitments(inputText, sourceName, sourceType, referenceDateIso);
  }
}
