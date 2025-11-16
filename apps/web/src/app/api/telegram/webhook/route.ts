import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { generateManualPreview } from "@/server/ai/manual-expense";
import { transcribeVoice } from "@/server/ai/voice-expense";
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

  const message = update.message || update.edited_message;
  const chatId = message?.chat?.id;

  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  const textMessage = message?.text?.trim();
  const voiceMessage = message?.voice;

  // Handle text messages
  if (textMessage) {
    try {
      const categories = await listCategories();
      const preview = await generateManualPreview(textMessage, { categories });
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
