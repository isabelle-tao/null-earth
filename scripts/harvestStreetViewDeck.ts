import fs from "node:fs/promises";
import path from "node:path";
import type { GameLocation, LocationCategory, SceneProfile } from "../shared/game";
import "../server/loadEnv";

type HarvestZone = {
  id: string;
  country: string;
  region: string;
  category: LocationCategory;
  sceneProfile: SceneProfile;
  clueDensity: GameLocation["clueDensity"];
  label: string;
  center: { lat: number; lng: number };
  radiusKm: number;
};

type StreetViewMetadata = {
  status: string;
  pano_id?: string;
  location?: { lat: number; lng: number };
};

const outputPath = path.resolve(process.cwd(), "server", "data", "locations.generated.json");
const targetCount = Number(process.env.HARVEST_TARGET_COUNT ?? 2500);
const concurrency = Number(process.env.HARVEST_CONCURRENCY ?? 12);
const autoActivate = process.env.HARVEST_AUTO_ACTIVATE === "true";
const streetViewKey = process.env.GOOGLE_STREETVIEW_SERVER_KEY;

const zones: HarvestZone[] = [
  {
    id: "antarctica-mcmurdo",
    country: "Antarctica",
    region: "Ross Island",
    category: "Horror",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Antarctic Station Ice Road",
    center: { lat: -77.8429, lng: 166.6885 },
    radiusKm: 8,
  },
  {
    id: "antarctica-deception",
    country: "Antarctica",
    region: "South Shetland Islands",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Volcanic Antarctic Shore",
    center: { lat: -62.9789, lng: -60.569 },
    radiusKm: 8,
  },
  {
    id: "greenland-ice-town",
    country: "Greenland",
    region: "Qeqertalik",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "high",
    label: "Arctic Settlement Edge",
    center: { lat: 69.2163, lng: -51.1007 },
    radiusKm: 18,
  },
  {
    id: "svalbard-industrial",
    country: "Norway",
    region: "Svalbard",
    category: "Industrial",
    sceneProfile: "wide-open",
    clueDensity: "high",
    label: "Polar Mining Settlement Road",
    center: { lat: 78.223, lng: 15.6461 },
    radiusKm: 14,
  },
  {
    id: "iceland-lava",
    country: "Iceland",
    region: "Capital Region",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Empty Lava Field Road",
    center: { lat: 64.1462, lng: -21.9431 },
    radiusKm: 45,
  },
  {
    id: "faroe-empty",
    country: "Faroe Islands",
    region: "Streymoy",
    category: "Horror",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "North Atlantic Empty Road",
    center: { lat: 62.1079, lng: -7.0311 },
    radiusKm: 30,
  },
  {
    id: "patagonia-plain",
    country: "Argentina",
    region: "Santa Cruz",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Patagonian Plain Road",
    center: { lat: -51.6243, lng: -69.2185 },
    radiusKm: 70,
  },
  {
    id: "kazakhstan-steppe",
    country: "Kazakhstan",
    region: "Almaty Region",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "high",
    label: "Steppe Road With Cyrillic Clues",
    center: { lat: 43.225, lng: 76.932 },
    radiusKm: 60,
  },
  {
    id: "mongolia-outskirts",
    country: "Mongolia",
    region: "Ulaanbaatar",
    category: "Urban",
    sceneProfile: "wide-open",
    clueDensity: "high",
    label: "Mongolian City Edge",
    center: { lat: 47.918, lng: 106.917 },
    radiusKm: 35,
  },
  {
    id: "namibia-desert",
    country: "Namibia",
    region: "Khomas",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Desert Road Outside Town",
    center: { lat: -22.562, lng: 17.0812 },
    radiusKm: 80,
  },
  {
    id: "australia-outback",
    country: "Australia",
    region: "Northern Territory",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Outback Road",
    center: { lat: -23.698, lng: 133.88 },
    radiusKm: 90,
  },
  {
    id: "new-zealand-plain",
    country: "New Zealand",
    region: "Canterbury",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Empty South Island Road",
    center: { lat: -43.595, lng: 170.141 },
    radiusKm: 75,
  },
  {
    id: "south-africa-karoo",
    country: "South Africa",
    region: "Northern Cape",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Karoo Roadside",
    center: { lat: -30.559, lng: 22.937 },
    radiusKm: 100,
  },
  {
    id: "chile-atacama",
    country: "Chile",
    region: "Antofagasta",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Atacama Desert Road",
    center: { lat: -23.65, lng: -70.4 },
    radiusKm: 90,
  },
  {
    id: "peru-altiplano",
    country: "Peru",
    region: "Puno",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "high",
    label: "High Plain Road With Spanish Signs",
    center: { lat: -15.84, lng: -70.02 },
    radiusKm: 80,
  },
  {
    id: "canada-yukon",
    country: "Canada",
    region: "Yukon",
    category: "Nature",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Northern Highway Pullout",
    center: { lat: 60.721, lng: -135.056 },
    radiusKm: 80,
  },
  {
    id: "us-salton",
    country: "United States",
    region: "California",
    category: "Horror",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Empty Desert Settlement Road",
    center: { lat: 33.3507, lng: -115.729 },
    radiusKm: 18,
  },
  {
    id: "us-nevada-empty",
    country: "United States",
    region: "Nevada",
    category: "Horror",
    sceneProfile: "wide-open",
    clueDensity: "medium",
    label: "Desert Industrial Edge",
    center: { lat: 36.1694, lng: -115.1397 },
    radiusKm: 55,
  },
  {
    id: "claustrophobic-hong-kong",
    country: "Hong Kong",
    region: "Central",
    category: "Liminal",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Compressed Signage Backstreet",
    center: { lat: 22.2821, lng: 114.153 },
    radiusKm: 4,
  },
  {
    id: "claustrophobic-seoul",
    country: "South Korea",
    region: "Seoul",
    category: "Urban",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Industrial Lettered Alley",
    center: { lat: 37.566, lng: 126.9921 },
    radiusKm: 6,
  },
  {
    id: "claustrophobic-tokyo",
    country: "Japan",
    region: "Tokyo",
    category: "Urban",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Narrow Japanese Sign Alley",
    center: { lat: 35.6938, lng: 139.7005 },
    radiusKm: 5,
  },
  {
    id: "claustrophobic-toronto-service",
    country: "Canada",
    region: "Ontario",
    category: "Liminal",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Downtown Service Passage",
    center: { lat: 43.6449, lng: -79.3821 },
    radiusKm: 5,
  },
  {
    id: "claustrophobic-london-underpass",
    country: "United Kingdom",
    region: "London",
    category: "Liminal",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Concrete Underpass Walkway",
    center: { lat: 51.5074, lng: -0.1278 },
    radiusKm: 7,
  },
  {
    id: "claustrophobic-paris-peripheral",
    country: "France",
    region: "Ile-de-France",
    category: "Liminal",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Urban Edge Underpass",
    center: { lat: 48.8566, lng: 2.3522 },
    radiusKm: 8,
  },
  {
    id: "claustrophobic-berlin-industrial",
    country: "Germany",
    region: "Berlin",
    category: "Industrial",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Concrete Industrial Access Road",
    center: { lat: 52.52, lng: 13.405 },
    radiusKm: 10,
  },
  {
    id: "claustrophobic-mexico-city",
    country: "Mexico",
    region: "Mexico City",
    category: "Urban",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Spanish-Language Concrete Corridor",
    center: { lat: 19.4326, lng: -99.1332 },
    radiusKm: 12,
  },
  {
    id: "claustrophobic-sao-paulo",
    country: "Brazil",
    region: "Sao Paulo",
    category: "Urban",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Portuguese-Language Underpass Edge",
    center: { lat: -23.55, lng: -46.633 },
    radiusKm: 12,
  },
  {
    id: "claustrophobic-cape-town",
    country: "South Africa",
    region: "Western Cape",
    category: "Urban",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "Empty Concrete Urban Edge",
    center: { lat: -33.9249, lng: 18.4241 },
    radiusKm: 12,
  },
  {
    id: "ruins-france",
    country: "France",
    region: "Nouvelle-Aquitaine",
    category: "Horror",
    sceneProfile: "landmark",
    clueDensity: "high",
    label: "Ruined Village Lane",
    center: { lat: 45.9309, lng: 1.0315 },
    radiusKm: 4,
  },
  {
    id: "industrial-georgia",
    country: "Georgia",
    region: "Imereti",
    category: "Industrial",
    sceneProfile: "landmark",
    clueDensity: "high",
    label: "Post-Industrial Mountain Town",
    center: { lat: 42.2887, lng: 43.2815 },
    radiusKm: 12,
  },
  {
    id: "industrial-germany-ruhr",
    country: "Germany",
    region: "North Rhine-Westphalia",
    category: "Industrial",
    sceneProfile: "claustrophobic",
    clueDensity: "high",
    label: "German Industrial Estate",
    center: { lat: 51.4982, lng: 6.7653 },
    radiusKm: 18,
  },
  {
    id: "post-soviet-estonia",
    country: "Estonia",
    region: "Tallinn",
    category: "Liminal",
    sceneProfile: "landmark",
    clueDensity: "high",
    label: "Concrete Baltic Megastructure",
    center: { lat: 59.4458, lng: 24.753 },
    radiusKm: 7,
  },
];

function pointNear(center: HarvestZone["center"], radiusKm: number, index: number) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const distance = radiusKm * Math.sqrt(((index * 37) % 997) / 997);
  const angle = index * goldenAngle;
  const latOffset = (distance / 111) * Math.cos(angle);
  const lngOffset = (distance / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset,
  };
}

async function metadataFor(lat: number, lng: number): Promise<StreetViewMetadata> {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: "300",
    source: "outdoor",
    key: streetViewKey ?? "",
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?${params.toString()}`);
  return (await response.json()) as StreetViewMetadata;
}

function createLocation(zone: HarvestZone, metadata: Required<Pick<StreetViewMetadata, "pano_id" | "location">>, sequence: number, heading: number): GameLocation {
  return {
    id: `${zone.id}-${sequence}`,
    lat: metadata.location.lat,
    lng: metadata.location.lng,
    country: zone.country,
    region: zone.region,
    label: zone.label,
    category: zone.category,
    sceneProfile: zone.sceneProfile,
    clueDensity: zone.clueDensity,
    peoplePolicy: autoActivate ? "verified-empty" : "needs-review",
    status: autoActivate ? "active" : "inactive",
    streetView: {
      heading,
      pitch: 0,
      fov: zone.sceneProfile === "claustrophobic" ? 74 : 84,
      panoId: metadata.pano_id,
    },
  };
}

async function main() {
  if (!streetViewKey) {
    throw new Error("GOOGLE_STREETVIEW_SERVER_KEY is required.");
  }

  const deck = new Map<string, GameLocation>();
  const zoneTarget = Math.ceil(targetCount / zones.length);
  const headingSteps = [0, 45, 90, 135, 180, 225, 270, 315];

  async function harvestZone(zone: HarvestZone, quota: number, offset: number) {
    let attempts = 0;
    const maxAttempts = quota * 18;
    let zoneCount = 0;

    while (zoneCount < quota && attempts < maxAttempts && deck.size < targetCount) {
      const batch = Array.from({ length: concurrency }, (_, batchOffset) => {
        const index = offset + attempts + batchOffset;
        const point = pointNear(zone.center, zone.radiusKm, index);
        return { index, point };
      });

      attempts += batch.length;
      const results = await Promise.allSettled(
        batch.map(async (candidate) => ({
          ...candidate,
          metadata: await metadataFor(candidate.point.lat, candidate.point.lng),
        })),
      );

      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const { index, metadata } = result.value;
        if (metadata.status !== "OK" || !metadata.pano_id || !metadata.location) continue;

        for (const baseHeading of headingSteps) {
          if (zoneCount >= quota || deck.size >= targetCount) break;
          const heading = (baseHeading + index * 17) % 360;
          const key = `${metadata.pano_id}:${heading}`;
          if (deck.has(key)) continue;
          deck.set(
            key,
            createLocation(
              zone,
              metadata as Required<Pick<StreetViewMetadata, "pano_id" | "location">>,
              deck.size + 1,
              heading,
            ),
          );
          zoneCount += 1;
        }
      }
    }
  }

  for (const [zoneIndex, zone] of zones.entries()) {
    await harvestZone(zone, zoneTarget, zoneIndex * 10000);
  }

  let fillIndex = 0;
  while (deck.size < targetCount) {
    await harvestZone(zones[fillIndex % zones.length], targetCount - deck.size, fillIndex * 20000);
    fillIndex += 1;
    if (fillIndex > zones.length * 3) break;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify([...deck.values()], null, 2)}\n`);
  console.log(`Wrote ${deck.size} candidate locations to ${outputPath}`);
  console.log(autoActivate ? "Candidates were auto-activated by request." : "Candidates are inactive and needs-review until checked for people.");
}

void main();
