const LOG_ENABLED = String(process.env.TELEGRAM_LOGS_ENABLED || "").toLowerCase() === "true";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const LOG_CHAT_ID = process.env.TELEGRAM_LOG_CHAT_ID;

function formatError(error: unknown) {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack ?? ""}`;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

const MAX_MESSAGE_LENGTH = 3500;

export async function logServerError(
  event: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  if (!LOG_ENABLED || !BOT_TOKEN || !LOG_CHAT_ID) {
    return;
  }

  const contextLines =
    context && Object.keys(context).length
      ? `Context:\n${JSON.stringify(context, null, 2)}`
      : "";
  const payload = `🛑 *[ERROR]* ${event}\n\n${formatError(error)}\n\n${contextLines}`.slice(
    0,
    MAX_MESSAGE_LENGTH
  );

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: LOG_CHAT_ID,
        text: payload,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.warn("[logServerError] failed to push log", err);
  }
}
