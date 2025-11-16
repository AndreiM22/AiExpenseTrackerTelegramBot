import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { generateManualPreview } from "@/server/ai/manual-expense";
import { transcribeVoice } from "@/server/ai/voice-expense";
import { confirmManualExpense, listCategories } from "@/server/mock-db";
import type { ManualPreviewData } from "@/server/ai/types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const BOT_ENABLED = String(process.env.ENABLE_TELEGRAM_BOT).toLowerCase() === "true";

export const dynamic = "force-dynamic";

// Global storage for pending approvals (in production, use Redis or database)
declare global {
  var telegramPreviews: Map<string, {
    chatId: number;
    source: string;
    parsed_data: ManualPreviewData;
    timestamp: number;
  }> | undefined;
}

if (!global.telegramPreviews) {
  global.telegramPreviews = new Map();
}

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

async function downloadTelegramFile(fileId: string): Promise<string> {
  if (!BOT_TOKEN) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  // Get file path from Telegram
  const fileInfoResponse = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const fileInfo = await fileInfoResponse.json();

  if (!fileInfo.ok || !fileInfo.result?.file_path) {
    throw new Error("Failed to get file info from Telegram");
  }

  // Download file
  const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`;
  const fileResponse = await fetch(fileUrl);

  if (!fileResponse.ok) {
    throw new Error("Failed to download file from Telegram");
  }

  // Save to temp file
  const buffer = Buffer.from(await fileResponse.arrayBuffer());
  const tempFilePath = join(tmpdir(), `telegram_voice_${Date.now()}.ogg`);
  await writeFile(tempFilePath, buffer);

  return tempFilePath;
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

  // Handle callback queries (button clicks)
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const callbackChatId = callbackQuery.message?.chat?.id;
    const callbackData = callbackQuery.data;
    const messageId = callbackQuery.message?.message_id;

    if (!callbackChatId || !callbackData) {
      return NextResponse.json({ ok: true });
    }

    try {
      // Parse callback data: "approve_preview_123" or "reject_preview_123"
      const [action, ...previewIdParts] = callbackData.split("_");
      const previewId = previewIdParts.join("_");

      const previewData = global.telegramPreviews!.get(previewId);

      if (!previewData) {
        // Preview expired or not found
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: "⚠️ Preview expirat. Trimite din nou mesajul.",
            show_alert: true,
          }),
        });
        return NextResponse.json({ ok: true });
      }

      if (action === "approve") {
        // Save expense to database
        const saved = await confirmManualExpense({
          source: previewData.source,
          parsed_data: previewData.parsed_data,
        });

        // Update message to show confirmation
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: callbackChatId,
            message_id: messageId,
            text: `✅ *Cheltuială salvată!*

📌 Vendor: *${saved.vendor}*
💰 Sumă: *${Number(saved.amount ?? 0).toFixed(2)} ${saved.currency ?? "MDL"}*
📂 Categorie: ${saved.category_name ?? "Fără categorie"}
📅 Data: ${saved.purchase_date}`,
            parse_mode: "Markdown",
          }),
        });

        // Answer callback query
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: "✅ Salvat în baza de date!",
          }),
        });

        // Clean up preview
        global.telegramPreviews!.delete(previewId);
      } else if (action === "reject") {
        // Delete/update message to show rejection
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: callbackChatId,
            message_id: messageId,
            text: "❌ *Cheltuiala anulată*\n\nNu s-a salvat nimic în baza de date.",
            parse_mode: "Markdown",
          }),
        });

        // Answer callback query
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: "❌ Anulat",
          }),
        });

        // Clean up preview
        global.telegramPreviews!.delete(previewId);
      }
    } catch (error) {
      console.error("Callback query error:", error);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: "⚠️ Eroare la procesare",
          show_alert: true,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  }

  const message = update.message || update.edited_message;
  const chatId = message?.chat?.id;

  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  const textMessage = message?.text?.trim();
  const voiceMessage = message?.voice;

  // Handle text messages - send preview for approval
  if (textMessage) {
    try {
      const categories = await listCategories();
      const preview = await generateManualPreview(textMessage, { categories });

      // Create preview message with inline keyboard
      const previewText = `📝 *Confirmă cheltuiala:*

📌 Vendor: *${preview.data.vendor || "—"}*
💰 Sumă: *${preview.data.amount || 0} ${preview.data.currency || "MDL"}*
📂 Categorie: ${preview.data.category || "Fără categorie"}
📅 Data: ${preview.data.purchase_date || new Date().toISOString().split("T")[0]}
${preview.data.notes ? `📄 Descriere: ${preview.data.notes}` : ""}

✅ Confirmă pentru a salva în baza de date
❌ Anulează pentru a șterge`;

      // Store preview data temporarily (we'll use callback_data to identify it)
      const previewId = `preview_${Date.now()}`;

      // Send message with inline keyboard
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: previewText,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Confirmă", callback_data: `approve_${previewId}` },
                { text: "❌ Anulează", callback_data: `reject_${previewId}` },
              ],
            ],
          },
        }),
      });

      // Store preview data for later approval
      global.telegramPreviews!.set(previewId, {
        chatId,
        source: "telegram",
        parsed_data: preview.data,
        timestamp: Date.now(),
      });

      // Clean up old previews (older than 10 minutes)
      for (const [id, data] of global.telegramPreviews!.entries()) {
        if (Date.now() - data.timestamp > 10 * 60 * 1000) {
          global.telegramPreviews!.delete(id);
        }
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Eroare neașteptată";
      await sendTelegramMessage(chatId, `⚠️ ${messageText}`);
    }

    return NextResponse.json({ ok: true });
  }

  // Handle voice messages
  if (voiceMessage) {
    let tempFilePath: string | null = null;

    try {
      await sendTelegramMessage(chatId, "🎤 Procesez mesajul vocal...");

      // Download voice file from Telegram
      tempFilePath = await downloadTelegramFile(voiceMessage.file_id);

      // Transcribe with Groq Whisper
      const transcription = await transcribeVoice(tempFilePath);

      if (!transcription.text) {
        throw new Error("Nu am putut transcrie mesajul vocal.");
      }

      // Process transcribed text through Groq AI
      const categories = await listCategories();
      const preview = await generateManualPreview(transcription.text, { categories });
      const saved = await confirmManualExpense({
        source: "voice",
        parsed_data: preview.data,
      });

      const summary = `✅ *Cheltuială salvată din mesaj vocal*
Transcris: "${transcription.text}"
Vendor: *${saved.vendor}*
Sumă: *${Number(saved.amount ?? 0).toFixed(2)} ${saved.currency ?? "MDL"}*
Categorie: ${saved.category_name ?? "Fără categorie"}`;

      await sendTelegramMessage(chatId, summary);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Eroare neașteptată";
      await sendTelegramMessage(chatId, `⚠️ ${messageText}`);
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        await unlink(tempFilePath).catch(() => {
          // Ignore cleanup errors
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  // No text or voice message - ignore
  return NextResponse.json({ ok: true });
}
