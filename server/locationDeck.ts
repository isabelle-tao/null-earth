import fs from "node:fs";
import path from "node:path";
import type { GameLocation } from "../shared/game.js";
import { locations as starterLocations } from "./locations.js";

const deckPath = path.resolve(process.cwd(), "server", "data", "locations.generated.json");

function isGameLocation(value: unknown): value is GameLocation {
  const location = value as Partial<GameLocation>;
  return (
    typeof location?.id === "string" &&
    typeof location.lat === "number" &&
    typeof location.lng === "number" &&
    typeof location.country === "string" &&
    typeof location.region === "string" &&
    typeof location.label === "string" &&
    typeof location.category === "string" &&
    typeof location.sceneProfile === "string" &&
    typeof location.clueDensity === "string" &&
    typeof location.peoplePolicy === "string" &&
    typeof location.status === "string" &&
    typeof location.streetView?.heading === "number" &&
    typeof location.streetView.pitch === "number" &&
    typeof location.streetView.fov === "number"
  );
}

export function loadLocations(): GameLocation[] {
  if (!fs.existsSync(deckPath)) {
    return starterLocations;
  }

  const parsed = JSON.parse(fs.readFileSync(deckPath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Generated location deck must be a JSON array.");
  }

  const generated = parsed.filter(isGameLocation);
  return [...starterLocations, ...generated];
}

export function summarizeLocations(allLocations: GameLocation[]) {
  const activeVerified = allLocations.filter(
    (location) => location.status === "active" && location.peoplePolicy === "verified-empty",
  );
  const countries = [...new Set(activeVerified.map((location) => location.country))].sort();

  return {
    total: allLocations.length,
    activeVerified: activeVerified.length,
    needsReview: allLocations.filter((location) => location.peoplePolicy === "needs-review").length,
    claustrophobic: allLocations.filter((location) => location.sceneProfile === "claustrophobic").length,
    wideOpen: allLocations.filter((location) => location.sceneProfile === "wide-open").length,
    countryCount: countries.length,
    countries,
  };
}
