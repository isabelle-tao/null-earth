import { useCallback, useEffect, useMemo, useState } from "react";
import { createRound, submitGuess, type ClientRound } from "./api";
import { GoogleGuessMap } from "./GoogleGuessMap";
import type { Coordinates, GuessResult } from "../shared/game";

type RoundHistoryItem = {
  roundId: string;
  points: number;
  distance: string;
  label: string;
};

export function App() {
  const [round, setRound] = useState<ClientRound | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<Coordinates | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [history, setHistory] = useState<RoundHistoryItem[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalScore = useMemo(() => history.reduce((sum, item) => sum + item.points, 0), [history]);
  const bestScore = useMemo(() => history.reduce((best, item) => Math.max(best, item.points), 0), [history]);

  const loadRound = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedGuess(null);
    setResult(null);
    setImageZoom(1);

    try {
      const nextRound = await createRound();
      setRound(nextRound);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the next round.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  const handleSubmit = async () => {
    if (!round || !selectedGuess || result) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const nextResult = await submitGuess(round.roundId, selectedGuess);
      setResult(nextResult);
      setHistory((items) => [
        {
          roundId: nextResult.roundId,
          points: nextResult.points,
          distance: nextResult.displayDistance,
          label: nextResult.actual.label,
        },
        ...items,
      ]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit this guess.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="shell">
      <section className="topbar" aria-label="Session status">
        <div>
          <p className="mono-label">NULL EARTH</p>
          <h1>Unknown terrestrial frame</h1>
        </div>
        <div className="score-strip">
          <Stat label="Score" value={totalScore} />
          <Stat label="Best" value={bestScore} />
          <Stat label="Rounds" value={history.length} />
        </div>
      </section>

      <section className={`game-grid ${isFullscreen ? "image-fullscreen" : ""}`}>
        <div className="viewer-panel">
          <div className="panel-header">
            <div>
              <p className="mono-label">STREET VIEW FRAME</p>
              <span>{round?.category ?? "Scanning"}</span>
            </div>
            <div className="icon-controls">
              <button type="button" title="Zoom out" onClick={() => setImageZoom((zoom) => Math.max(1, zoom - 0.15))}>
                -
              </button>
              <button type="button" title="Zoom in" onClick={() => setImageZoom((zoom) => Math.min(2.2, zoom + 0.15))}>
                +
              </button>
              <button type="button" title="Fullscreen" onClick={() => setIsFullscreen((value) => !value)}>
                {isFullscreen ? "x" : "[]"}
              </button>
            </div>
          </div>

          <div className="image-stage">
            {round && !isLoading ? (
              <img
                src={round.imageUrl}
                alt="Mystery street view location"
                style={{ transform: `scale(${imageZoom})` }}
              />
            ) : (
              <div className="loading-frame">ACQUIRING SIGNAL</div>
            )}
          </div>
        </div>

        <aside className="control-panel">
          <div className="panel-header">
            <div>
              <p className="mono-label">GUESS INTERFACE</p>
              <span>{selectedGuess ? "Marker armed" : "Place a marker"}</span>
            </div>
          </div>

          <GoogleGuessMap
            selectedGuess={selectedGuess}
            result={result}
            disabled={Boolean(result)}
            onGuessChange={setSelectedGuess}
          />

          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={!selectedGuess || Boolean(result) || isSubmitting || isLoading}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Transmitting" : "Submit Guess"}
            </button>
            <button type="button" disabled={isLoading || !result} onClick={() => void loadRound()}>
              Next
            </button>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {result ? (
            <section className="result-panel" aria-label="Result">
              <p className="mono-label">RESULT</p>
              <h2>{result.points} points</h2>
              <dl>
                <div>
                  <dt>Actual Location</dt>
                  <dd>
                    {result.actual.label}, {result.actual.country}
                  </dd>
                </div>
                <div>
                  <dt>Your Guess</dt>
                  <dd>{result.displayDistance} away</dd>
                </div>
              </dl>
            </section>
          ) : (
            <section className="hint-panel">
              <p className="mono-label">SESSION NOTE</p>
              <p>Inspect the frame. Place one marker. No timer. No metadata.</p>
            </section>
          )}
        </aside>
      </section>

      <section className="history-band" aria-label="Round history">
        {history.slice(0, 6).map((item) => (
          <article key={item.roundId} className="history-item">
            <span>{item.points} pts</span>
            <strong>{item.distance}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
