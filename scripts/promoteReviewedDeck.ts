import fs from "node:fs/promises";
import path from "node:path";
import type { GameLocation } from "../shared/game";

const deckPath = path.resolve(process.cwd(), "server", "data", "locations.generated.json");
const reviewedIds = new Set((process.env.REVIEWED_LOCATION_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean));
const promoteAll = process.env.PROMOTE_ALL_REVIEWED_EMPTY === "true";

async function main() {
  const raw = await fs.readFile(deckPath, "utf8");
  const deck = JSON.parse(raw) as GameLocation[];

  const nextDeck = deck.map((location) => {
    if (!promoteAll && !reviewedIds.has(location.id)) {
      return location;
    }

    return {
      ...location,
      peoplePolicy: "verified-empty" as const,
      status: "active" as const,
    };
  });

  await fs.writeFile(deckPath, `${JSON.stringify(nextDeck, null, 2)}\n`);
  console.log(`Promoted ${nextDeck.filter((location) => location.status === "active").length} active generated locations.`);
}

void main();
