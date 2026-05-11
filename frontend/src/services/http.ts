import type { AppApiError } from "@/types/api";

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | AppApiError) : null;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "detail" in payload
        ? payload.detail || "Request failed."
        : "Request failed.";
    throw new Error(errorMessage);
  }

  return payload as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
  });

  return parseResponse<T>(response);
}

export async function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse<TResponse>(response);
}
