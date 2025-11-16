import Groq from "groq-sdk";
import { ManualPreviewData } from "./types";

const DEFAULT_MODEL = process.env.GROQ_MANUAL_MODEL || "llama-3.3-70b-versatile";
const HAS_GROQ_KEY = Boolean(process.env.GROQ_API_KEY);

const groqClient = HAS_GROQ_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const FALLBACK_CATEGORIES = ["Groceries", "Transport", "Restaurant", "Health", "Entertainment"];

type ManualPreviewOptions = {
  categories?: Array<{ name: string }>;
};

const manualSchema = {
  name: "ExpensePreview",
  schema: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          amount: { type: "number" },
          currency: { type: "string" },
          vendor: { type: "string" },
          purchase_date: { type: "string" },
          category: { type: "string" },
          notes: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                qty: { type: ["number", "string"] },
                price: { type: ["number", "string"] },
                total: { type: ["number", "string"] },
              },
            },
          },
        },
        required: ["amount", "currency", "vendor"],
      },
    },
    required: ["data"],
  },
  strict: false,
} as const;

const BANNED_VENDOR_WORDS = new Set(["am", "în", "pe", "la"]);
const CURRENCY_PATTERN = /\b(mdl|lei|ron|eur|usd|gbp)\b/i;
const VENDOR_PATTERNS = [
  /cump(?:ă|a)rat\s+(?:pe|la|pentru|de la)?\s*([^0-9\n]+)/i,
  /luat\s+(?:pe|la|pentru|de la)?\s*([^0-9\n]+)/i,
  /pl(?:ă|a)tit\s+(?:pe|la|pentru|de la)?\s*([^0-9\n]+)/i,
  /achitat\s+(?:pe|la|pentru|de la)?\s*([^0-9\n]+)/i,
  /cheltuit\s+(?:pe|la|pentru|de la)?\s*([^0-9\n]+)/i,
  /fost\s+la\s+([^0-9\n]+)/i,
  /de la\s+([^0-9\n]+)/i,
];

const formatVendorCandidate = (value: string) => {
  if (!value) return "";
  let candidate = value.replace(/[,:;#]/g, " ").replace(/\s+/g, " ").trim();
  if (!candidate) return "";
  candidate = candidate.replace(CURRENCY_PATTERN, "").trim();
  candidate = candidate.replace(/\d+/g, "").trim();
  candidate = candidate.replace(/\b(cu|pentru|pe|la|de la)\s*$/i, "").trim();
  candidate = candidate.replace(/^(o|un|niște|niste)\s+/i, "").trim();
  if (!candidate) return "";
  const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
  return limited.charAt(0).toUpperCase() + limited.slice(1);
};

const detectVendorFromText = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  for (const pattern of VENDOR_PATTERNS) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const candidate = formatVendorCandidate(match[1]);
      if (candidate && !BANNED_VENDOR_WORDS.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }
  const amountMatch = normalized.match(/(\d+[.,]?\d*)\s*(mdl|lei|ron|eur|usd|gbp)?/i);
  if (amountMatch?.index) {
    const before = normalized.slice(0, amountMatch.index).trim();
    const tokens = before.split(/\s+/);
    if (tokens.length) {
      const candidate = formatVendorCandidate(tokens.slice(-3).join(" "));
      if (candidate && !BANNED_VENDOR_WORDS.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }
  return "";
};

const fallbackParse = (description: string): ManualPreviewData => {
  const normalized = description.trim();
  const amountMatch = normalized.match(/(\d+[.,]\d+|\d+)/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(",", ".")) : undefined;
  const vendorMatch =
    normalized.match(/(?:de la|la)\s+([A-ZĂÂÎȘȚ][\w&-]+)/i) ||
    normalized.match(/([A-ZĂÂÎȘȚ][\w&-]+)/);
  const vendorRaw = vendorMatch ? vendorMatch[1] || vendorMatch[0] : null;
  const vendorFromHeuristics = detectVendorFromText(normalized);
  const vendorCandidate =
    vendorFromHeuristics ||
    (vendorRaw && !BANNED_VENDOR_WORDS.has(vendorRaw.toLowerCase())
      ? formatVendorCandidate(vendorRaw)
      : "");
  const vendor = vendorCandidate || "Cheltuială manuală";
  const currency = normalized.toLowerCase().includes("eur")
    ? "EUR"
    : normalized.toLowerCase().includes("usd")
    ? "USD"
    : normalized.toLowerCase().includes("ron")
    ? "RON"
    : "MDL";
  const today = new Date().toISOString().slice(0, 10);
  const resolvedItemName = vendor !== "Cheltuială manuală" ? vendor : "Cheltuială";
  return {
    amount,
    currency,
    vendor,
    purchase_date: today,
    category: undefined,
    notes: normalized,
    items: amount
      ? [
          {
            name: resolvedItemName,
            qty: 1,
            price: Number(amount.toFixed(2)),
            total: Number(amount.toFixed(2)),
          },
        ]
      : undefined,
  };
};

const extractJson = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

export async function generateManualPreview(
  description: string,
  options?: ManualPreviewOptions
): Promise<{ data: ManualPreviewData; source: "groq" | "heuristic"; raw?: unknown }> {
  if (!groqClient) {
    return { data: fallbackParse(description), source: "heuristic" };
  }

  const categories = options?.categories?.map((category) => category.name).filter(Boolean);
  const categoryContext = categories?.length
    ? categories.join(", ")
    : FALLBACK_CATEGORIES.join(", ");

  try {
    const completion = await groqClient.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are an AI that extracts structured expense data from Romanian messages.

CRITICAL RULES FOR "vendor" FIELD:
1. Extract the ACTUAL ITEM/PRODUCT or STORE NAME - be specific and descriptive
2. Examples of CORRECT vendor extraction:
   - "Am cumpărat pâine 15 lei" → vendor: "Pâine" (the product)
   - "Am fost la Linella 50 lei" → vendor: "Linella" (the store)
   - "Cafea de la Starbucks 25 lei" → vendor: "Starbucks - Cafea" (store + product)
   - "Am cheltuit 15 lei pentru o cafea" → vendor: "Cafea" (the product)
   - "Taxi 30 lei" → vendor: "Taxi" (the service)
3. NEVER use Romanian verbs as vendor: "Am cumpărat", "Am fost", "Am cheltuit", "Plătit" are WRONG
4. Make vendor clear and meaningful - what was actually purchased/paid for

CATEGORY MATCHING - REQUIRED:
Available categories: ${categoryContext}
- You MUST pick the most appropriate category from the list above
- Match based on the type of expense:
  * Food items (pâine, lapte, fructe) → "Groceries" or similar food category
  * Store names (Linella, Cora, Kaufland) → "Groceries"
  * Coffee shops, restaurants → "Restaurant" or dining category
  * Transportation (taxi, benzină, autobuz) → "Transport"
  * Health (medicamente, doctor, clinică) → "Health"
- ALWAYS provide a category - use your best judgment based on the context
- If truly uncertain, use the most general applicable category

OUTPUT FORMAT:
Respond ONLY with JSON that follows this schema: ${JSON.stringify(manualSchema.schema)}
Dates must be in ISO format (YYYY-MM-DD). If no date is mentioned, use today's date.`,
        },
        { role: "user", content: description },
      ],
    });

    const text = completion.choices?.[0]?.message?.content;
    const parsed = extractJson(text);
    const data: ManualPreviewData | undefined = parsed?.data ?? parsed;
    if (data) {
      return { data, source: "groq", raw: parsed };
    }
  } catch (error) {
    console.warn("Groq manual parser fallback:", error);
  }

  return { data: fallbackParse(description), source: "heuristic" };
}
