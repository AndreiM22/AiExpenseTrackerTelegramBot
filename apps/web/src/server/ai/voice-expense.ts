import Groq from "groq-sdk";
import { createReadStream } from "fs";

const DEFAULT_WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";
const HAS_GROQ_KEY = Boolean(process.env.GROQ_API_KEY);

const groqClient = HAS_GROQ_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

export type VoiceTranscriptionResult = {
  text: string;
  language?: string;
  duration?: number;
};

/**
 * Transcribe voice audio file using Groq Whisper API
 * @param filePath - Absolute path to the audio file
 * @returns Transcribed text and metadata
 */
export async function transcribeVoice(filePath: string): Promise<VoiceTranscriptionResult> {
  if (!groqClient) {
    throw new Error("Groq API key not configured. Set GROQ_API_KEY environment variable.");
  }

  try {
    const audioFile = createReadStream(filePath);

    const transcription = await groqClient.audio.transcriptions.create({
      file: audioFile,
      model: DEFAULT_WHISPER_MODEL,
      response_format: "verbose_json", // Get language and duration info
      language: "ro", // Romanian language hint (optional, Whisper auto-detects)
    });

    return {
      text: transcription.text.trim(),
      language: transcription.language,
      duration: transcription.duration,
    };
  } catch (error) {
    console.error("Groq Whisper transcription failed:", error);
    throw new Error(`Voice transcription failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fallback: Simple error message for when Groq is unavailable
 */
export function voiceFallbackError(): VoiceTranscriptionResult {
  return {
    text: "[Groq API unavailable - cannot process voice message]",
    language: "unknown",
    duration: 0,
  };
}
