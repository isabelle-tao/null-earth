import { describe, expect, it } from "vitest";
import { pickLocation } from "./_utils";

describe("pickLocation", () => {
  it("rotates through unique locations for a session before repeating", () => {
    const pickedIds = new Set<string>();
    const pickedPlaces = new Set<string>();

    for (let roundIndex = 0; roundIndex < 25; roundIndex += 1) {
      const location = pickLocation("rotation-test-session", roundIndex);
      pickedIds.add(location.id);
      pickedPlaces.add(`${location.country}:${location.label}`);
    }

    expect(pickedIds.size).toBe(25);
    expect(pickedPlaces.size).toBe(25);
  });
});
