import "./loadEnv";
import cors from "cors";
import express from "express";
import { buildStreetViewUrl, createRound, getDeckSummary, getRound, submitGuess } from "./roundStore";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/deck", (_request, response) => {
  response.json(getDeckSummary());
});

app.post("/api/rounds", (request, response, next) => {
  try {
    const origin = `${request.protocol}://${request.get("host")}`;
    const sessionId = request.get("x-null-earth-session") ?? "anonymous";
    response.json(createRound(origin, sessionId));
  } catch (error) {
    next(error);
  }
});

app.get("/api/round-image", async (request, response, next) => {
  const roundId = typeof request.query.roundId === "string" ? request.query.roundId : undefined;
  const round = roundId ? getRound(roundId) : undefined;
  if (!round) {
    response.status(404).json({ error: "Round not found." });
    return;
  }

  try {
    const upstream = await fetch(buildStreetViewUrl(round.location));
    if (!upstream.ok || !upstream.body) {
      response.status(502).send("Street View image could not be loaded.");
      return;
    }

    response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
    response.setHeader("Cache-Control", "private, max-age=300");

    const image = Buffer.from(await upstream.arrayBuffer());
    response.send(image);
  } catch (error) {
    next(error);
  }
});

app.get("/api/rounds/:roundId/image", async (request, response, next) => {
  const round = getRound(request.params.roundId);
  if (!round) {
    response.status(404).json({ error: "Round not found." });
    return;
  }

  try {
    const upstream = await fetch(buildStreetViewUrl(round.location));
    if (!upstream.ok || !upstream.body) {
      response.status(502).send("Street View image could not be loaded.");
      return;
    }

    response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
    response.setHeader("Cache-Control", "private, max-age=300");

    const image = Buffer.from(await upstream.arrayBuffer());
    response.send(image);
  } catch (error) {
    next(error);
  }
});

app.post("/api/guess", (request, response, next) => {
  const roundId = typeof request.query.roundId === "string" ? request.query.roundId : undefined;
  if (!roundId) {
    response.status(404).json({ error: "Round not found." });
    return;
  }

  try {
    response.json(submitGuess(roundId, request.body));
  } catch (error) {
    next(error);
  }
});

app.post("/api/rounds/:roundId/guess", (request, response, next) => {
  try {
    response.json(submitGuess(request.params.roundId, request.body));
  } catch (error) {
    next(error);
  }
});

app.use((error: Error & { statusCode?: number }, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(error.statusCode ?? 500).json({ error: error.message || "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`Null Earth API listening on http://127.0.0.1:${port}`);
});
