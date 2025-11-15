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

const fallbackParse = (description: string): ManualPreviewData => {
  const normalized = description.trim();
  const amountMatch = normalized.match(/(\d+[.,]\d+|\d+)/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(",", ".")) : undefined;
  const vendorMatch = normalized.match(/([A-ZĂÂÎȘȚ][\w&-]+)/);
  const vendor = vendorMatch ? vendorMatch[0] : "Cheltuială";
  const currency = normalized.toLowerCase().includes("eur")
    ? "EUR"
    : normalized.toLowerCase().includes("usd")
    ? "USD"
    : normalized.toLowerCase().includes("ron")
    ? "RON"
    : "MDL";
  const today = new Date().toISOString().slice(0, 10);
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
            name: vendor,
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
          content: `You extract structured expense data from Romanian messages. Respond ONLY with JSON that respects this schema: ${JSON.stringify(
            manualSchema.schema
          )}. Match inferred categories to this list: ${categoryContext}. Dates must be ISO (YYYY-MM-DD).`,
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
