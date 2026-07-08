import { describe, expect, it } from "vitest";
import { pickLocation } from "./_utils";

describe("pickLocation", () => {
  it("rotates through unique locations for a session before repeating", () => {
    const pickedIds = new Set<string>();

    for (let roundIndex = 0; roundIndex < 25; roundIndex += 1) {
      pickedIds.add(pickLocation("rotation-test-session", roundIndex).id);
    }

    expect(pickedIds.size).toBe(25);
  });
});
