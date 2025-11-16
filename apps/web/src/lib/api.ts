const trimTrailingSlash = (value: string) =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const stripApiSuffix = (value: string) =>
  value.toLowerCase().endsWith("/api") ? value.slice(0, -4) : value;

const normalizeBase = (value?: string | null, fallback?: string) => {
  const source = value && value.trim().length > 0 ? value.trim() : fallback ?? "";
  return trimTrailingSlash(stripApiSuffix(source));
};

// Use relative paths for client-side (browser will use current domain)
// Use environment variable only on server-side
export const PUBLIC_API_BASE = typeof window === "undefined"
  ? normalizeBase(process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL)
  : "";

export const SERVER_API_BASE = normalizeBase(
  process.env.API_BASE_URL,
  PUBLIC_API_BASE
);

export async function serverFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(`${SERVER_API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Failed to fetch ${path}:`, error);
    return null;
  }
}
