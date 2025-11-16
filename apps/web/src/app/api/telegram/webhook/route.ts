import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { generateManualPreview } from "@/server/ai/manual-expense";
import { transcribeVoice } from "@/server/ai/voice-expense";
import {
  approvePendingExpense,
  createPendingExpense,
  listCategories,
  rejectPendingExpense,
} from "@/server/mock-db";
import { logServerError } from "@/server/logging";

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
      const [action, pendingId] = callbackData.split(":");
      if (!pendingId) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: "Previzualizare invalidă.",
            show_alert: true,
          }),
        });
        return NextResponse.json({ ok: true });
      }

      if (action === "approve") {
        const saved = await approvePendingExpense({ pendingId });

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

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: "✅ Salvat în baza de date!",
          }),
        });
      } else if (action === "reject") {
        await rejectPendingExpense(pendingId);
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

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: "❌ Anulat",
          }),
        });
      }
    } catch (error) {
      await logServerError("telegram_callback_error", error, {
        callback_data: callbackData,
        chat_id: callbackChatId,
      });
      const detail = error instanceof Error ? error.message : "Eroare la procesare";
      console.error("Callback query error:", error);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: `⚠️ ${detail}`,
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
      if (!preview.data) {
        throw new Error("Nu am putut interpreta mesajul.");
      }
      const pending = await createPendingExpense({
        raw_text: textMessage,
        source: "telegram",
        parsed_data: preview.data,
        metadata: { ai_source: preview.source, raw_response: preview.raw ?? null, chat_id: chatId },
      });

      const previewText = `📝 *Confirmă cheltuiala:*

📌 Vendor: *${preview.data.vendor || "—"}*
💰 Sumă: *${preview.data.amount || 0} ${preview.data.currency || "MDL"}*
📂 Categorie: ${preview.data.category || "Fără categorie"}
📅 Data: ${preview.data.purchase_date || new Date().toISOString().split("T")[0]}
${preview.data.notes ? `📄 Descriere: ${preview.data.notes}` : ""}

✅ Confirmă pentru a salva în baza de date
❌ Anulează pentru a șterge`;

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
                { text: "✅ Confirmă", callback_data: `approve:${pending.id}` },
                { text: "❌ Anulează", callback_data: `reject:${pending.id}` },
              ],
            ],
          },
        }),
      });
    } catch (error) {
      await logServerError("telegram_text_error", error, { chat_id: chatId, text: textMessage });
      const messageText = error instanceof Error ? error.message : "Eroare neașteptată";
      await sendTelegramMessage(chatId, `⚠️ ${messageText}`);
    }

    return NextResponse.json({ ok: true });
  }

  // Handle voice messages - transcribe, correct, and send for approval
  if (voiceMessage) {
    let tempFilePath: string | null = null;

    try {
      await sendTelegramMessage(chatId, "🎤 Procesez mesajul vocal...");

      // Step 1: Download voice file from Telegram
      tempFilePath = await downloadTelegramFile(voiceMessage.file_id);

      // Step 2: Transcribe with Groq Whisper (raw text)
      const transcription = await transcribeVoice(tempFilePath);

      if (!transcription.text) {
        throw new Error("Nu am putut transcrie mesajul vocal.");
      }

      // Step 3: Correct grammar with Groq AI
      const groqClient = new (await import("groq-sdk")).default({
        apiKey: process.env.GROQ_API_KEY,
      });

      const correctionResponse = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You are a grammar correction assistant for Romanian text transcribed from speech.
Your task is to:
1. Correct any spelling or grammar mistakes
2. Fix punctuation
3. Return ONLY the corrected text, nothing else
4. Keep the meaning and intent exactly the same
5. If the text is already correct, return it as-is`,
          },
          {
            role: "user",
            content: `Corectează acest text: "${transcription.text}"`,
          },
        ],
      });

      const correctedText = correctionResponse.choices?.[0]?.message?.content?.trim() || transcription.text;

      const categories = await listCategories();
      const preview = await generateManualPreview(correctedText, { categories });
      if (!preview.data) {
        throw new Error("Nu am putut extrage datele din mesajul vocal.");
      }

      const pending = await createPendingExpense({
        raw_text: transcription.text,
        corrected_text: correctedText,
        source: "voice",
        parsed_data: preview.data,
        metadata: {
          ai_source: preview.source,
          raw_response: preview.raw ?? null,
          chat_id: chatId,
        },
      });

      const previewText = `🎤 *Text din mesaj vocal:*

_${correctedText}_

📌 Vendor: *${preview.data.vendor || "—"}*
💰 Sumă: *${preview.data.amount || 0} ${preview.data.currency || "MDL"}*
📂 Categorie: ${preview.data.category || "Fără categorie"}

✅ Confirmă pentru a salva în baza de date
❌ Anulează pentru a șterge`;

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
                { text: "✅ Confirmă", callback_data: `approve:${pending.id}` },
                { text: "❌ Anulează", callback_data: `reject:${pending.id}` },
              ],
            ],
          },
        }),
      });
    } catch (error) {
      await logServerError("telegram_voice_error", error, { chat_id: chatId, voice_id: voiceMessage.file_id });
      const messageText = error instanceof Error ? error.message : "Eroare neașteptată";
      await sendTelegramMessage(chatId, `⚠️ ${messageText}`);
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        await unlink(tempFilePath).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  }

  // No text or voice message - ignore
  return NextResponse.json({ ok: true });
}
