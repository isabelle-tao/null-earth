import type { Coordinates, GuessResult, LocationCategory, RoundPublic } from "../shared/game";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const SESSION_STORAGE_KEY = "null-earth-session-id";
const ROUND_INDEX_STORAGE_KEY = "null-earth-round-index";

function getSessionId() {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function getNextRoundIndex() {
  const current = Number(window.localStorage.getItem(ROUND_INDEX_STORAGE_KEY) ?? "0");
  window.localStorage.setItem(ROUND_INDEX_STORAGE_KEY, String(current + 1));
  return current;
}

export type ClientRound = RoundPublic & {
  category: LocationCategory;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Null-Earth-Session": getSessionId(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function createRound(): Promise<ClientRound> {
  return request<ClientRound>("/api/rounds", {
    method: "POST",
    headers: {
      "X-Null-Earth-Round-Index": String(getNextRoundIndex()),
    },
  });
}

export function submitGuess(roundId: string, guess: Coordinates): Promise<GuessResult> {
  return request<GuessResult>(`/api/guess?roundId=${encodeURIComponent(roundId)}`, {
    method: "POST",
    body: JSON.stringify(guess),
  });
}
