const normalizeBase = (value?: string | null) => {
  if (!value) {
    return "http://localhost:8000";
  }
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const SERVER_API_BASE = normalizeBase(
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
);

export const PUBLIC_API_BASE = normalizeBase(
  process.env.NEXT_PUBLIC_API_URL
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
