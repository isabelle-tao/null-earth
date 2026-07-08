import { locationFromRoundToken, sendStreetViewImage } from "../../_utils.js";

type RequestLike = {
  query: { roundId?: string | string[] };
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  setHeader: (key: string, value: string) => void;
  send: (body: Buffer | string) => void;
  json: (body: unknown) => void;
};

export default async function handler(request: RequestLike, response: ResponseLike) {
  const roundId = Array.isArray(request.query.roundId) ? request.query.roundId[0] : request.query.roundId;
  const location = roundId ? locationFromRoundToken(roundId) : undefined;

  if (!location) {
    response.status(404).json({ error: "Round not found." });
    return;
  }

  await sendStreetViewImage(response, location);
}
