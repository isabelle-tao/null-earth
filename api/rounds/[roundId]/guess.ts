import { scoreGuess } from "../../_utils.js";

type RequestLike = {
  method?: string;
  query: { roundId?: string | string[] };
  body?: unknown;
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

  try {
    const roundId = Array.isArray(request.query.roundId) ? request.query.roundId[0] : request.query.roundId;
    if (!roundId) {
      response.status(404).json({ error: "Round not found." });
      return;
    }

    response.status(200).json(scoreGuess(roundId, request.body));
  } catch (error) {
    const typedError = error as Error & { statusCode?: number };
    response.status(typedError.statusCode ?? 500).json({ error: typedError.message });
  }
}
