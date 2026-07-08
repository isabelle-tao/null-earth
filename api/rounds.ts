import { activeLocations, createRoundToken, pickLocation } from "./_utils.js";

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
};

export default function handler(request: RequestLike, response: ResponseLike) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  const sessionHeader = request.headers["x-null-earth-session"];
  const roundIndexHeader = request.headers["x-null-earth-round-index"];
  const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader ?? "anonymous";
  const rawRoundIndex = Array.isArray(roundIndexHeader) ? roundIndexHeader[0] : roundIndexHeader;
  const roundIndex = Number(rawRoundIndex ?? "0");
  const location = pickLocation(sessionId, Number.isFinite(roundIndex) ? roundIndex : 0);
  const roundId = createRoundToken(location.id);

  response.status(200).json({
    roundId,
    imageUrl: `/api/rounds/${encodeURIComponent(roundId)}/image`,
    category: location.category,
    deckSize: activeLocations().length,
  });
}
