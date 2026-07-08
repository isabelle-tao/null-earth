import crypto from "node:crypto";
import type { GameLocation } from "../shared/game.js";
import { formatDistance, haversineKm, isValidCoordinate, scoreForDistance } from "../shared/game.js";
import { loadLocations, summarizeLocations } from "../server/locationDeck.js";
import { buildStreetViewUrl } from "../server/roundStore.js";

const locations = loadLocations();

type RoundTokenPayload = {
  locationId: string;
  nonce: string;
};

function signingSecret() {
  return process.env.ROUND_SIGNING_SECRET ?? process.env.GOOGLE_STREETVIEW_SERVER_KEY ?? "null-earth-local";
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function activeLocations() {
  return locations.filter((location) => location.status === "active" && location.peoplePolicy === "verified-empty");
}

function locationUniqueKey(location: GameLocation) {
  const placeKey = `${location.country}:${location.label}`.toLowerCase();
  if (placeKey) return `place:${placeKey}`;
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

function hashInt(value: string) {
  return crypto.createHash("sha256").update(value).digest().readUInt32BE(0);
}

function shuffledForSession(allLocations: GameLocation[], sessionId: string, deckIndex: number) {
  return [...allLocations].sort((first, second) => {
    const firstRank = hashInt(`${sessionId}:${deckIndex}:${first.id}`);
    const secondRank = hashInt(`${sessionId}:${deckIndex}:${second.id}`);
    return firstRank - secondRank;
  });
}

export function deckSummary() {
  return summarizeLocations(locations);
}

export function createRoundToken(locationId: string) {
  const payload = base64Url(JSON.stringify({ locationId, nonce: crypto.randomUUID() } satisfies RoundTokenPayload));
  return `${payload}.${sign(payload)}`;
}

export function locationFromRoundToken(roundId: string): GameLocation | undefined {
  const [payload, signature] = roundId.split(".");
  if (!payload || !signature || sign(payload) !== signature) return undefined;

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as RoundTokenPayload;
  return activeLocations().find((location) => location.id === parsed.locationId);
}

export function pickLocation(sessionId: string, roundIndex = 0) {
  const active = uniqueLocationsByView(activeLocations());
  if (active.length === 0) throw new Error("No active locations are configured.");

  const normalizedRoundIndex = Math.max(0, Math.floor(roundIndex));
  const deckIndex = Math.floor(normalizedRoundIndex / active.length);
  const shuffled = shuffledForSession(active, sessionId, deckIndex);
  return shuffled[normalizedRoundIndex % shuffled.length];
}

export async function sendStreetViewImage(response: { status: (code: number) => unknown; setHeader: (key: string, value: string) => unknown; send: (body: Buffer | string) => unknown }, location: GameLocation) {
  const upstream = await fetch(buildStreetViewUrl(location));
  if (!upstream.ok) {
    response.status(502);
    response.send("Street View image could not be loaded.");
    return;
  }

  response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
  response.setHeader("Cache-Control", "public, max-age=300");
  response.send(Buffer.from(await upstream.arrayBuffer()));
}

export function scoreGuess(roundId: string, body: unknown) {
  const location = locationFromRoundToken(roundId);
  if (!location) {
    throw Object.assign(new Error("Round not found."), { statusCode: 404 });
  }

  if (!isValidCoordinate(body)) {
    throw Object.assign(new Error("Guess must include valid lat and lng values."), { statusCode: 400 });
  }

  const guess = { lat: body.lat, lng: body.lng };
  const actual = { lat: location.lat, lng: location.lng };
  const distanceKm = haversineKm(actual, guess);

  return {
    roundId,
    actual: {
      ...actual,
      country: location.country,
      region: location.region,
      label: location.label,
      category: location.category,
    },
    guess,
    distanceKm,
    displayDistance: formatDistance(distanceKm),
    points: scoreForDistance(distanceKm),
  };
}
