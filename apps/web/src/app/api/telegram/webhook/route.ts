import { NextResponse } from "next/server";
import { generateManualPreview } from "@/server/ai/manual-expense";
import { confirmManualExpense, listCategories } from "@/server/mock-db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const BOT_ENABLED = String(process.env.ENABLE_TELEGRAM_BOT).toLowerCase() === "true";

export const dynamic = "force-dynamic";

async function sendTelegramMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch((error) => {
    console.warn("Failed to send Telegram response", error);
  });
}

export async function POST(request: Request) {
  if (!BOT_ENABLED) {
    return NextResponse.json({ detail: "Telegram bot disabled" }, { status: 503 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ detail: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
  }

  if (WEBHOOK_SECRET) {
    const received = request.headers.get("x-telegram-bot-api-secret-token");
    if (received !== WEBHOOK_SECRET) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }
  }

  const update = await request.json().catch(() => null);
  if (!update) {
    return NextResponse.json({ detail: "Invalid payload" }, { status: 400 });
  }

  const message = update.message || update.edited_message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim();

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  try {
    const categories = await listCategories();
    const preview = await generateManualPreview(text, { categories });
    const saved = await confirmManualExpense({
      source: "telegram",
      parsed_data: preview.data,
    });

    const summary = `✅ *Cheltuială salvată*
Vendor: *${saved.vendor}*
Sumă: *${Number(saved.amount ?? 0).toFixed(2)} ${saved.currency ?? "MDL"}*
Categorie: ${saved.category_name ?? "Fără categorie"}`;

    await sendTelegramMessage(chatId, summary);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Eroare neașteptată";
    await sendTelegramMessage(chatId, `⚠️ ${messageText}`);
  }

  return NextResponse.json({ ok: true });
}
