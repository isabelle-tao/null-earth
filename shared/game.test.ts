import { describe, expect, it } from "vitest";
import { formatDistance, haversineKm, scoreForDistance } from "./game";

describe("scoreForDistance", () => {
  it("scores exact threshold boundaries", () => {
    expect(scoreForDistance(0)).toBe(50);
    expect(scoreForDistance(0.2)).toBe(50);
    expect(scoreForDistance(1)).toBe(45);
    expect(scoreForDistance(5)).toBe(35);
    expect(scoreForDistance(25)).toBe(25);
    expect(scoreForDistance(100)).toBe(15);
    expect(scoreForDistance(500)).toBe(5);
    expect(scoreForDistance(1000)).toBe(2);
    expect(scoreForDistance(3000)).toBe(1);
  });

  it("scores above threshold boundaries", () => {
    expect(scoreForDistance(0.2001)).toBe(45);
    expect(scoreForDistance(1.0001)).toBe(35);
    expect(scoreForDistance(5.0001)).toBe(25);
    expect(scoreForDistance(25.0001)).toBe(15);
    expect(scoreForDistance(100.0001)).toBe(5);
    expect(scoreForDistance(500.0001)).toBe(2);
    expect(scoreForDistance(1000.0001)).toBe(1);
    expect(scoreForDistance(3000.0001)).toBe(0);
  });
});

describe("haversineKm", () => {
  it("calculates known city distance", () => {
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    expect(haversineKm(london, paris)).toBeCloseTo(343.6, 0);
  });
});

describe("formatDistance", () => {
  it("uses one decimal under 100 km and whole km at 100 or more", () => {
    expect(formatDistance(42.222)).toBe("42.2 km");
    expect(formatDistance(100)).toBe("100 km");
    expect(formatDistance(1234.5)).toBe("1,235 km");
  });
});
