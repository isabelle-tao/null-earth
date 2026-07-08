import { describe, expect, it, beforeEach } from "vitest";
import type { GameLocation } from "../shared/game";
import { createRound, resetRoundsForTests, selectRandomLocation, submitGuess } from "./roundStore";

const sampleLocations: GameLocation[] = [
  {
    id: "a",
    lat: 0,
    lng: 0,
    country: "A",
    region: "A",
    label: "A",
    category: "Liminal",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    peoplePolicy: "verified-empty",
    status: "active",
    streetView: { heading: 0, pitch: 0, fov: 80 },
  },
  {
    id: "b",
    lat: 1,
    lng: 1,
    country: "B",
    region: "B",
    label: "B",
    category: "Horror",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    peoplePolicy: "verified-empty",
    status: "active",
    streetView: { heading: 0, pitch: 0, fov: 80 },
  },
];

beforeEach(() => {
  resetRoundsForTests();
});

describe("selectRandomLocation", () => {
  it("avoids immediate repeats when multiple locations exist", () => {
    const first = selectRandomLocation(sampleLocations);
    const second = selectRandomLocation(sampleLocations);
    expect(second.id).not.toBe(first.id);
  });

  it("deals every active location before repeating", () => {
    const seen = new Set<string>();
    for (let index = 0; index < sampleLocations.length; index += 1) {
      seen.add(selectRandomLocation(sampleLocations, "session-a").id);
    }

    expect(seen).toEqual(new Set(["a", "b"]));
  });

  it("keeps independent decks per session", () => {
    const firstSessionLocation = selectRandomLocation(sampleLocations, "session-a");
    const secondSessionLocation = selectRandomLocation(sampleLocations, "session-b");

    expect(sampleLocations.map((location) => location.id)).toContain(firstSessionLocation.id);
    expect(sampleLocations.map((location) => location.id)).toContain(secondSessionLocation.id);
    expect(selectRandomLocation(sampleLocations, "session-a").id).not.toBe(firstSessionLocation.id);
    expect(selectRandomLocation(sampleLocations, "session-b").id).not.toBe(secondSessionLocation.id);
  });
});

describe("round APIs", () => {
  it("does not expose coordinates in public round payload", () => {
    const round = createRound("http://localhost:8787");
    expect(round).toEqual({
      roundId: expect.any(String),
      imageUrl: expect.stringContaining("/api/rounds/"),
      category: expect.any(String),
    });
    expect(JSON.stringify(round)).not.toMatch(/lat|lng|country|region/);
  });

  it("rejects malformed guesses", () => {
    const round = createRound();
    expect(() => submitGuess(round.roundId, { lat: 999, lng: 0 })).toThrow("Guess must include valid lat and lng values.");
  });

  it("returns a stable duplicate result", () => {
    const round = createRound();
    const result = submitGuess(round.roundId, { lat: 10, lng: 10 });
    const duplicate = submitGuess(round.roundId, { lat: -10, lng: -10 });
    expect(duplicate).toEqual(result);
  });
});
