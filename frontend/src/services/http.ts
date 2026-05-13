import type { AppApiError } from "@/types/api";

type RequestOptions = {
  timeoutMs?: number;
  retries?: number;
};

export class ApiError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

async function parsePayload<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: T | AppApiError | string | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as T | AppApiError;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "detail" in payload
        ? payload.detail || "Request failed."
        : typeof payload === "string" && payload
          ? payload
          : "Request failed.";
    throw new ApiError(
      message,
      response.status,
      [408, 429, 500, 502, 503, 504].includes(response.status),
    );
  }

  return payload as T;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out.", 408, true);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const retries = options.retries ?? 0;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(path, init, timeoutMs);
      return await parsePayload<T>(response);
    } catch (error) {
      if (attempt === retries) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError(
          error instanceof Error ? error.message : "Unable to reach the API.",
          0,
          true,
        );
      }

      if (error instanceof ApiError && !error.retryable) {
        throw error;
      }
    }
  }

  throw new ApiError("Request failed.", 0, true);
}

export async function apiGet<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "GET",
      cache: "no-store",
    },
    { retries: 1, ...options },
  );
}

export async function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
  options?: RequestOptions,
): Promise<TResponse> {
  return request<TResponse>(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    options,
  );
}
