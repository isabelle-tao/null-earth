import crypto from "node:crypto";
import type { GameLocation, GuessResult, RoundPublic } from "../shared/game.js";
import { formatDistance, haversineKm, isValidCoordinate, scoreForDistance } from "../shared/game.js";
import { loadLocations, summarizeLocations } from "./locationDeck.js";

const locations = loadLocations();

export function getDeckSummary() {
  return summarizeLocations(locations);
}

type StoredRound = {
  id: string;
  location: GameLocation;
  result?: GuessResult;
};

type DeckState = {
  ids: string[];
  lastLocationId?: string;
  signature: string;
};

const rounds = new Map<string, StoredRound>();
const sessionDecks = new Map<string, DeckState>();

function locationUniqueKey(location: GameLocation) {
  if (location.streetView.panoId) return `pano:${location.streetView.panoId}`;
  return `coords:${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
}

function uniqueLocationsByView(allLocations: GameLocation[]) {
  const seen = new Set<string>();
  return allLocations.filter((location) => {
    const key = locationUniqueKey(location);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function refillDeck(active: GameLocation[], deck: DeckState) {
  deck.ids = shuffle(active.map((location) => location.id));

  if (deck.ids.length > 1 && deck.ids[0] === deck.lastLocationId) {
    [deck.ids[0], deck.ids[1]] = [deck.ids[1], deck.ids[0]];
  }
}

export function selectRandomLocation(allLocations: GameLocation[] = locations, sessionId = "default"): GameLocation {
  const active = uniqueLocationsByView(
    allLocations.filter((location) => location.status === "active" && location.peoplePolicy === "verified-empty"),
  );
  if (active.length === 0) {
    throw new Error("No active locations are configured.");
  }

  const signature = active.map((location) => location.id).sort().join("|");
  const deck = sessionDecks.get(sessionId) ?? { ids: [], signature };
  sessionDecks.set(sessionId, deck);

  if (signature !== deck.signature) {
    deck.ids = [];
    deck.signature = signature;
  }

  if (deck.ids.length === 0) {
    refillDeck(active, deck);
  }

  const selectedId = deck.ids.shift();
  const selected = active.find((location) => location.id === selectedId) ?? active[0];
  deck.lastLocationId = selected.id;
  return selected;
}

export function buildStreetViewUrl(location: GameLocation): string {
  const params = new URLSearchParams({
    size: "1280x720",
    fov: String(location.streetView.fov),
    heading: String(location.streetView.heading),
    pitch: String(location.streetView.pitch),
  });

  if (location.streetView.panoId) {
    params.set("pano", location.streetView.panoId);
  } else {
    params.set("location", `${location.lat},${location.lng}`);
  }

  const serverKey = process.env.GOOGLE_STREETVIEW_SERVER_KEY;
  if (serverKey) {
    params.set("key", serverKey);
  }

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

export function createRound(origin = "", sessionId = "default"): RoundPublic {
  const location = selectRandomLocation(locations, sessionId);
  const id = crypto.randomUUID();
  rounds.set(id, { id, location });

  return {
    roundId: id,
    imageUrl: `${origin}/api/round-image?roundId=${encodeURIComponent(id)}`,
    category: location.category,
  };
}

export function getRound(id: string): StoredRound | undefined {
  return rounds.get(id);
}

export function submitGuess(roundId: string, body: unknown): GuessResult {
  const round = rounds.get(roundId);
  if (!round) {
    throw Object.assign(new Error("Round not found."), { statusCode: 404 });
  }

  if (round.result) {
    return round.result;
  }

  if (!isValidCoordinate(body)) {
    throw Object.assign(new Error("Guess must include valid lat and lng values."), { statusCode: 400 });
  }

  const guess = { lat: body.lat, lng: body.lng };
  const actual = { lat: round.location.lat, lng: round.location.lng };
  const distanceKm = haversineKm(actual, guess);
  const result: GuessResult = {
    roundId,
    actual: {
      ...actual,
      country: round.location.country,
      region: round.location.region,
      label: round.location.label,
      category: round.location.category,
    },
    guess,
    distanceKm,
    displayDistance: formatDistance(distanceKm),
    points: scoreForDistance(distanceKm),
  };

  round.result = result;
  return result;
}

export function resetRoundsForTests() {
  rounds.clear();
  sessionDecks.clear();
}
