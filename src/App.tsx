import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BingoLetter = "B" | "I" | "N" | "G" | "O";
type GameStatus = "idle" | "playing" | "paused";

interface LetterInfo {
  letter: BingoLetter;
  color: string;
}

interface ColumnStyle {
  bg: string;
  accent: string;
  glow: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_NUMBERS = 75;
const DRAW_INTERVAL_MS = 3000;

const COLUMN_COLORS: Record<BingoLetter, ColumnStyle> = {
  B: { bg: "#1d3461", accent: "#3b82f6", glow: "rgba(59,130,246,0.6)" },
  I: { bg: "#2d1b4e", accent: "#a855f7", glow: "rgba(168,85,247,0.6)" },
  N: { bg: "#3b1c1c", accent: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  G: { bg: "#3b2a0a", accent: "#f59e0b", glow: "rgba(245,158,11,0.6)" },
  O: { bg: "#0d3b2e", accent: "#10b981", glow: "rgba(16,185,129,0.6)" },
};

const COLUMN_START: Record<BingoLetter, number> = {
  B: 1,
  I: 16,
  N: 31,
  G: 46,
  O: 61,
};

const BINGO_LETTERS: BingoLetter[] = ["B", "I", "N", "G", "O"];

const TICKER_COLUMNS = ["B 1-15", "I 16-30", "N 31-45", "G 46-60", "O 61-75"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLetterForNumber(n: number): LetterInfo {
  if (n <= 15) return { letter: "B", color: "#3b82f6" };
  if (n <= 30) return { letter: "I", color: "#a855f7" };
  if (n <= 45) return { letter: "N", color: "#ef4444" };
  if (n <= 60) return { letter: "G", color: "#f59e0b" };
  return { letter: "O", color: "#10b981" };
}

function createRemainingNumbers(): number[] {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [animating, setAnimating] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remaining = useRef<number[]>(createRemainingNumbers());

  const drawNext = useCallback((): void => {
    if (remaining.current.length === 0) {
      setStatus("idle");
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const idx = Math.floor(Math.random() * remaining.current.length);
    const num = remaining.current[idx];
    remaining.current.splice(idx, 1);

    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    setCurrentNumber(num);
    setDrawnNumbers((prev) => [...prev, num]);
  }, []);

  const handlePlay = (): void => {
    if (status === "playing") return;
    setStatus("playing");
    drawNext();
    intervalRef.current = setInterval(drawNext, DRAW_INTERVAL_MS);
  };

  const handlePause = (): void => {
    if (status !== "playing") return;
    setStatus("paused");
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleStop = (): void => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("idle");
    setDrawnNumbers([]);
    setCurrentNumber(null);
    remaining.current = createRemainingNumbers();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentInfo: LetterInfo | null = currentNumber
    ? getLetterForNumber(currentNumber)
    : null;

  const progress =
    ((TOTAL_NUMBERS - remaining.current.length) / TOTAL_NUMBERS) * 100;

  return (
    <div
      style={{ fontFamily: "'Bebas Neue', 'Anton', sans-serif" }}
      className="lg:max-h-screen bg-neutral-950 text-white overflow-hidden relative flex flex-col"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

        @keyframes popIn {
          0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .pop-in      { animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .pulse-ring  { animation: pulse-ring 1.2s ease-out infinite; }
        .float       { animation: floatUp 3s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(90deg, #fbbf24, #f97316, #ef4444, #f97316, #fbbf24);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .num-cell {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: 'DM Mono', monospace;
        }
        .ticker-wrap  { overflow: hidden; white-space: nowrap; }
        .ticker-inner { display: inline-flex; animation: ticker 30s linear infinite; }
        .scanline {
          background: repeating-linear-gradient(
            0deg,
            transparent, transparent 2px,
            rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px
          );
          pointer-events: none;
        }
      `}</style>

      {/* Scanline overlay */}
      <div className="scanline fixed inset-0 z-10 pointer-events-none" />

      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 20% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)",
          }}
          className="absolute inset-0"
        />
        <div
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 80% 50%, rgba(16,185,129,0.05) 0%, transparent 70%)",
          }}
          className="absolute inset-0"
        />
      </div>

      {/* Main layout */}
      <div className="flex-1 relative z-20">
        {/* Top ticker */}
        <div className="ticker-wrap border-b border-neutral-800 bg-neutral-900/80 py-2 z-20">
          <div className="ticker-inner gap-12">
            {[...Array(4)].map((_, rep) =>
              TICKER_COLUMNS.map((col, i) => {
                const c = COLUMN_COLORS[BINGO_LETTERS[i]];
                return (
                  <span
                    key={`${rep}-${i}`}
                    style={{
                      color: c.accent,
                      marginRight: "3rem",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ◆ {col}
                  </span>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 ">
          {/* ── LEFT: Controls panel ── */}
          <div className="lg:w-4xl lg:mx-auto flex flex-col items-center justify-center gap-8 p-8 border-r border-neutral-800/60 bg-neutral-900/40 backdrop-blur-sm">

            {/* Title */}
            <div className="text-center">
              <div
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.4em",
                  color: "#6b7280",
                  fontFamily: "'DM Mono', monospace",
                }}
                className="mb-1"
              >
                ◆ SORTEO ◆
              </div>
              <h1
                className="shimmer-text"
                style={{ fontSize: "3.5rem", lineHeight: 1, letterSpacing: "0.05em" }}
              >
                BINGO
              </h1>
              <div
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.4em",
                  color: "#6b7280",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                PROMO X
              </div>
            </div>

            {/* Current number display */}
            <div className="relative flex items-center justify-center">
              {status === "playing" && (
                <>
                  <div
                    className="pulse-ring absolute w-48 h-48 rounded-full border-2"
                    style={{ borderColor: currentInfo?.color ?? "#f59e0b", opacity: 0.4 }}
                  />
                  <div
                    className="pulse-ring absolute w-48 h-48 rounded-full border-2"
                    style={{
                      borderColor: currentInfo?.color ?? "#f59e0b",
                      animationDelay: "0.4s",
                      opacity: 0.4,
                    }}
                  />
                </>
              )}

              <div
                className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center float"
                style={{
                  background: currentInfo
                    ? `radial-gradient(circle at 35% 35%, ${currentInfo.color}33, #111)`
                    : "radial-gradient(circle at 35% 35%, #222, #111)",
                  border: `3px solid ${currentInfo?.color ?? "#404040"}`,
                  boxShadow: currentInfo
                    ? `0 0 40px ${currentInfo.color}50, 0 0 80px ${currentInfo.color}20, inset 0 0 30px ${currentInfo.color}15`
                    : "0 0 20px rgba(0,0,0,0.5)",
                  transition: "border-color 0.5s, box-shadow 0.5s",
                }}
              >
                {currentNumber !== null ? (
                  <div
                    key={currentNumber}
                    className={animating ? "pop-in" : ""}
                    style={{ textAlign: "center", lineHeight: 1 }}
                  >
                    <div
                      style={{
                        fontSize: "1rem",
                        color: currentInfo?.color,
                        letterSpacing: "0.3em",
                        fontFamily: "'DM Mono', monospace",
                        fontWeight: 500,
                      }}
                    >
                      {currentInfo?.letter}
                    </div>
                    <div style={{ fontSize: "4.5rem", lineHeight: 0.9, letterSpacing: "-0.02em" }}>
                      {String(currentNumber).padStart(2, "0")}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "3rem", color: "#404040", letterSpacing: "0.05em" }}>
                    --
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  color: "#6b7280",
                  letterSpacing: "0.15em",
                  marginBottom: "0.5rem",
                }}
                className="flex justify-between"
              >
                <span>EXTRAÍDOS</span>
                <span style={{ color: "#d1d5db" }}>
                  {drawnNumbers.length} / {TOTAL_NUMBERS}
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                    boxShadow: "0 0 8px rgba(245,158,11,0.5)",
                  }}
                />
              </div>
            </div>

            {/* Last drawn numbers */}
            {drawnNumbers.length > 1 && (
              <div className="w-full">
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.65rem",
                    color: "#6b7280",
                    letterSpacing: "0.15em",
                    marginBottom: "0.75rem",
                  }}
                >
                  ÚLTIMOS NÚMEROS
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...drawnNumbers]
                    .reverse()
                    .slice(1, 8)
                    .map((n) => {
                      const { letter, color } = getLetterForNumber(n);
                      return (
                        <div
                          key={n}
                          style={{
                            border: `1px solid ${color}60`,
                            color,
                            background: `${color}12`,
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {letter}
                          {String(n).padStart(2, "0")}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handlePlay}
                disabled={status === "playing"}
                style={{
                  background:
                    status === "playing"
                      ? "#1a1a1a"
                      : "linear-gradient(135deg, #059669, #10b981)",
                  color: status === "playing" ? "#404040" : "#fff",
                  boxShadow:
                    status === "playing" ? "none" : "0 0 25px rgba(16,185,129,0.35)",
                  border: `1px solid ${status === "playing" ? "#2a2a2a" : "#10b981"}`,
                  padding: "0.875rem",
                  borderRadius: "0.5rem",
                  cursor: status === "playing" ? "not-allowed" : "pointer",
                  fontSize: "1.1rem",
                  letterSpacing: "0.15em",
                  transition: "all 0.2s",
                  width: "100%",
                }}
              >
                ▶ INICIAR
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handlePause}
                  disabled={status !== "playing"}
                  style={{
                    flex: 1,
                    background:
                      status !== "playing"
                        ? "#1a1a1a"
                        : "linear-gradient(135deg, #d97706, #f59e0b)",
                    color: status !== "playing" ? "#404040" : "#000",
                    boxShadow:
                      status !== "playing" ? "none" : "0 0 20px rgba(245,158,11,0.35)",
                    border: `1px solid ${status !== "playing" ? "#2a2a2a" : "#f59e0b"}`,
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    cursor: status !== "playing" ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    letterSpacing: "0.1em",
                    transition: "all 0.2s",
                  }}
                >
                  ⏸ PAUSA
                </button>

                <button
                  onClick={handleStop}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #9f1239, #e11d48)",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(225,29,72,0.25)",
                    border: "1px solid #e11d48",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "1rem",
                    letterSpacing: "0.1em",
                    transition: "all 0.2s",
                  }}
                >
                  ■ REINICIAR
                </button>
              </div>
            </div>

            {/* Status badge */}
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color:
                  status === "playing"
                    ? "#10b981"
                    : status === "paused"
                      ? "#f59e0b"
                      : "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background:
                    status === "playing"
                      ? "#10b981"
                      : status === "paused"
                        ? "#f59e0b"
                        : "#404040",
                  boxShadow: status === "playing" ? "0 0 6px #10b981" : "none",
                }}
              />
              {status === "playing"
                ? "EN CURSO"
                : status === "paused"
                  ? "EN PAUSA"
                  : "ESPERANDO"}
            </div>
          </div>

          {/* ── RIGHT: Bingo board ── */}
          <div className="flex-1 flex flex-col lg:max-h-[calc(100vh-41px)] lg:overflow-auto p-6 gap-4">

            {/* Column headers */}
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {BINGO_LETTERS.map((letter) => {
                const c = COLUMN_COLORS[letter];
                return (
                  <div
                    key={letter}
                    className="text-center py-2 rounded-lg"
                    style={{
                      background: `${c.accent}18`,
                      border: `1px solid ${c.accent}40`,
                      color: c.accent,
                      fontSize: "1.8rem",
                      letterSpacing: "0.1em",
                      textShadow: `0 0 15px ${c.glow}`,
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>

            {/* Number grid — 5 columns × 15 rows */}
            <div
              className="grid gap-2 flex-1"
              style={{
                gridTemplateColumns: "repeat(5, 1fr)",
              }}
            >
              {BINGO_LETTERS.map((letter) => {
                const colStart = COLUMN_START[letter];
                const c = COLUMN_COLORS[letter];

                return Array.from({ length: 15 }, (_, i) => {
                  const n = colStart + i;
                  const isDrawn = drawnNumbers.includes(n);
                  const isCurrent = n === currentNumber;

                  return (
                    <div
                      key={n}
                      className="num-cell flex items-center justify-center rounded-lg"
                      style={{
                        aspectRatio: "1",
                        fontSize: "clamp(0.6rem, 1.2vw, 1rem)",
                        fontWeight: 500,
                        cursor: "default",
                        ...(isCurrent
                          ? {
                            background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)`,
                            color: "#000",
                            boxShadow: `0 0 20px ${c.glow}, 0 0 40px ${c.glow}`,
                            transform: "scale(1.12)",
                            border: `2px solid ${c.accent}`,
                            zIndex: 2,
                          }
                          : isDrawn
                            ? {
                              background: c.bg,
                              color: c.accent,
                              border: `1px solid ${c.accent}50`,
                              boxShadow: `inset 0 0 10px ${c.accent}15`,
                            }
                            : {
                              background: "#111",
                              color: "#374151",
                              border: "1px solid #1f2937",
                            }),
                      }}
                    >
                      {n}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}