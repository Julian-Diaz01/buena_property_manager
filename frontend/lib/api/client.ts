const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function getBackendBaseUrl(): string {
  return backendUrl.replace(/\/$/, "");
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type Json = Record<string, unknown>;

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { parseJson?: boolean },
): Promise<T> {
  const url = `${getBackendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const parseJson = init?.parseJson !== false;
  const json = parseJson ? ((await response.json().catch(() => ({}))) as Json) : ({} as Json);

  if (!response.ok) {
    const message =
      typeof json.message === "string" ? json.message : `Request failed (${response.status})`;
    throw new ApiRequestError(message, response.status, json.details);
  }

  if ("data" in json && json.data !== undefined) {
    return json.data as T;
  }

  return json as T;
}
