import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BingoLetter = "B" | "I" | "N" | "G" | "O";
type GameStatus = "idle" | "playing" | "paused";

interface LetterInfo { letter: BingoLetter; color: string }
interface ColumnStyle { bg: string; accent: string; glow: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_NUMBERS = 75;
const DRAW_INTERVAL_MS = 3000;

const COLUMN_COLORS: Record<BingoLetter, ColumnStyle> = {
  B: { bg: "#1a2e50", accent: "#3b82f6", glow: "rgba(59,130,246,0.6)" },
  I: { bg: "#28194a", accent: "#a855f7", glow: "rgba(168,85,247,0.6)" },
  N: { bg: "#3b1c1c", accent: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  G: { bg: "#3b2a0a", accent: "#f59e0b", glow: "rgba(245,158,11,0.6)" },
  O: { bg: "#0d3b2e", accent: "#10b981", glow: "rgba(16,185,129,0.6)" },
};

const COLUMN_START: Record<BingoLetter, number> = {
  B: 1, I: 16, N: 31, G: 46, O: 61,
};

const BINGO_LETTERS: BingoLetter[] = ["B", "I", "N", "G", "O"];
const TICKER_LABELS = ["B 1-15", "I 16-30", "N 31-45", "G 46-60", "O 61-75"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLetterForNumber(n: number): LetterInfo {
  if (n <= 15) return { letter: "B", color: "#3b82f6" };
  if (n <= 30) return { letter: "I", color: "#a855f7" };
  if (n <= 45) return { letter: "N", color: "#ef4444" };
  if (n <= 60) return { letter: "G", color: "#f59e0b" };
  return { letter: "O", color: "#10b981" };
}

function createPool(): number[] {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BingoApp() {
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [animating, setAnimating] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remaining = useRef<number[]>(createPool());

  const drawNext = useCallback((): void => {
    if (remaining.current.length === 0) {
      setStatus("idle");
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const idx = Math.floor(Math.random() * remaining.current.length);
    const num = remaining.current.splice(idx, 1)[0];
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    setCurrentNumber(num);
    setDrawnNumbers(prev => [...prev, num]);
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
    remaining.current = createPool();
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const currentInfo = currentNumber ? getLetterForNumber(currentNumber) : null;
  const progress = ((TOTAL_NUMBERS - remaining.current.length) / TOTAL_NUMBERS) * 100;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

        /* No scroll anywhere */
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }

        @keyframes popIn {
          0%   { transform: scale(0.3) rotate(-10deg); opacity: 0 }
          60%  { transform: scale(1.15) rotate(3deg) }
          100% { transform: scale(1) rotate(0deg); opacity: 1 }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.8 }
          100% { transform: scale(1.6); opacity: 0 }
        }
        @keyframes ticker {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
        @keyframes shimmer {
          from { background-position: -200% center }
          to   { background-position:  200% center }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0) }
          50%      { transform: translateY(-5px) }
        }

        .anim-pop    { animation: popIn      0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards }
        .anim-ring   { animation: pulse-ring 1.2s ease-out infinite }
        .anim-float  { animation: floatUp    3s   ease-in-out infinite }
        .anim-ticker { animation: ticker     30s  linear infinite }

        .shimmer-text {
          background: linear-gradient(90deg,#fbbf24,#f97316,#ef4444,#f97316,#fbbf24);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .scanline {
          background: repeating-linear-gradient(
            0deg, transparent 0px, transparent 2px,
            rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px
          );
        }

        .num-cell {
          transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
          font-family: 'DM Mono', monospace;
          min-height: 0;
        }

        /*
          Board grid: 5 number columns + 1 letter-sidebar column on the right.
          15 equal rows (1fr each) fill all available height — zero scroll.
          Each BINGO letter spans exactly 3 rows (3 rows × 5 letters = 15 rows).
        */
        .board-grid {
          display: grid;
          grid-template-columns: clamp(24px, 3vw, 44px) repeat(5, 1fr);
          grid-template-rows: repeat(15, 1fr);
          gap: 4px;
          flex: 1;
          min-height: 0;
        }
      `}</style>

      {/* ── Root shell ── */}
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-neutral-950 text-white relative">

        {/* Scanline overlay */}
        <div className="scanline fixed inset-0 z-10 pointer-events-none" />

        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 70% at 18% 50%, rgba(245,158,11,0.055) 0%, transparent 70%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 70% at 82% 50%, rgba(16,185,129,0.045) 0%, transparent 70%)" }} />
        </div>

        {/* ── Ticker bar ── */}
        <div className="overflow-hidden whitespace-nowrap border-b border-neutral-800 bg-neutral-950/95 py-1.5 shrink-0 relative z-20">
          <div className="inline-flex anim-ticker">
            {[...Array(5)].map((_, rep) =>
              TICKER_LABELS.map((label, i) => {
                const c = COLUMN_COLORS[BINGO_LETTERS[i]];
                return (
                  <span
                    key={`${rep}-${i}`}
                    className="mr-12 text-xs tracking-widest"
                    style={{ color: c.accent, fontFamily: "'DM Mono', monospace" }}
                  >
                    ◆ {label}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* ── Main content row ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">

          {/* ════ LEFT PANEL ════ */}
          <aside className="shrink-0 flex flex-col items-center justify-evenly overflow-hidden
                            border-r border-neutral-800 bg-neutral-950/70 backdrop-blur-md
                            px-4 py-3 w-56 xl:w-96">

            {/* Title */}
            <div className="text-center leading-none shrink-0">
              <p className="text-neutral-600 tracking-[0.4em]" style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem" }}>
                ◆ SORTEO ◆
              </p>
              <h1 className="shimmer-text text-4xl xl:text-5xl tracking-wide">BINGO</h1>
              <p className="text-neutral-600 tracking-[0.4em]" style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem" }}>
                PROMO X
              </p>
            </div>

            {/* ── Number ball ── */}
            <div className="relative flex items-center justify-center shrink-0">
              {/* Pulse rings — only while playing */}
              {status === "playing" && (<>
                <div
                  className="anim-ring absolute rounded-full border-2"
                  style={{ width: 120, height: 120, borderColor: currentInfo?.color ?? "#f59e0b", opacity: 0.4 }}
                />
                <div
                  className="anim-ring absolute rounded-full border-2"
                  style={{ width: 120, height: 120, borderColor: currentInfo?.color ?? "#f59e0b", opacity: 0.4, animationDelay: "0.4s" }}
                />
              </>)}

              {/* Ball */}
              <div
                className="anim-float flex flex-col items-center justify-center rounded-full"
                style={{
                  width: 120, height: 120,
                  background: currentInfo
                    ? `radial-gradient(circle at 35% 35%, ${currentInfo.color}30, #0a0a0a)`
                    : "radial-gradient(circle at 35% 35%, #1a1a1a, #0a0a0a)",
                  border: `3px solid ${currentInfo?.color ?? "#262626"}`,
                  boxShadow: currentInfo
                    ? `0 0 30px ${currentInfo.color}45, 0 0 60px ${currentInfo.color}18, inset 0 0 20px ${currentInfo.color}12`
                    : "0 0 15px rgba(0,0,0,0.7)",
                  transition: "border-color 0.5s, box-shadow 0.5s",
                }}
              >
                {currentNumber !== null ? (
                  <div
                    key={currentNumber}
                    className={animating ? "anim-pop text-center leading-none" : "text-center leading-none"}
                  >
                    <div
                      className="tracking-[0.3em] font-medium"
                      style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: currentInfo?.color }}
                    >
                      {currentInfo?.letter}
                    </div>
                    <div className="text-4xl xl:text-5xl" style={{ lineHeight: 0.9, letterSpacing: "-0.02em" }}>
                      {String(currentNumber).padStart(2, "0")}
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl text-neutral-800">--</div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full shrink-0">
              <div className="flex justify-between mb-1" style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.5rem", letterSpacing: "0.13em" }}>
                <span className="text-neutral-600">EXTRAÍDOS</span>
                <span className="text-neutral-500">{drawnNumbers.length} / {TOTAL_NUMBERS}</span>
              </div>
              <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg,#f59e0b,#ef4444)",
                    boxShadow: "0 0 6px rgba(245,158,11,0.5)",
                  }}
                />
              </div>
            </div>

            {/* Last drawn badges */}
            {drawnNumbers.length > 1 && (
              <div className="w-full shrink-0">
                <p className="text-neutral-600 mb-1" style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.5rem", letterSpacing: "0.13em" }}>
                  ÚLTIMOS
                </p>
                <div className="flex flex-wrap gap-1">
                  {[...drawnNumbers].reverse().slice(1, 9).map(n => {
                    const { letter, color } = getLetterForNumber(n);
                    return (
                      <span
                        key={n}
                        className="rounded px-1.5 py-0.5 text-xs"
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.55rem",
                          color,
                          border: `1px solid ${color}50`,
                          background: `${color}10`,
                        }}
                      >
                        {letter}{String(n).padStart(2, "0")}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex flex-col gap-1.5 w-full shrink-0">

              {/* Play */}
              <button
                onClick={handlePlay}
                disabled={status === "playing"}
                className="w-full py-2 rounded-lg text-sm tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  background: status === "playing" ? "#111" : "linear-gradient(135deg,#059669,#10b981)",
                  color: status === "playing" ? "#333" : "#fff",
                  border: `1px solid ${status === "playing" ? "#1f1f1f" : "#10b981"}`,
                  boxShadow: status === "playing" ? "none" : "0 0 18px rgba(16,185,129,0.28)",
                }}
              >
                ▶ INICIAR
              </button>

              {/* Pause + Reset */}
              <div className="flex gap-1.5">
                <button
                  onClick={handlePause}
                  disabled={status !== "playing"}
                  className="flex-1 py-2 rounded-lg text-sm tracking-wider transition-all active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    background: status !== "playing" ? "#111" : "linear-gradient(135deg,#d97706,#f59e0b)",
                    color: status !== "playing" ? "#333" : "#000",
                    border: `1px solid ${status !== "playing" ? "#1f1f1f" : "#f59e0b"}`,
                    boxShadow: status !== "playing" ? "none" : "0 0 14px rgba(245,158,11,0.28)",
                  }}
                >
                  ⏸ PAUSA
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 py-2 rounded-lg text-sm tracking-wider transition-all active:scale-95"
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    background: "linear-gradient(135deg,#9f1239,#e11d48)",
                    color: "#fff",
                    border: "1px solid #e11d48",
                    boxShadow: "0 0 14px rgba(225,29,72,0.22)",
                  }}
                >
                  ■ RESET
                </button>
              </div>
            </div>

            {/* Status indicator */}
            <div
              className="flex items-center gap-1.5 shrink-0 tracking-[0.18em]"
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.5rem",
                color: status === "playing" ? "#10b981" : status === "paused" ? "#f59e0b" : "#4b5563",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: status === "playing" ? "#10b981" : status === "paused" ? "#f59e0b" : "#262626",
                  boxShadow: status === "playing" ? "0 0 5px #10b981" : "none",
                }}
              />
              {status === "playing" ? "EN CURSO" : status === "paused" ? "EN PAUSA" : "ESPERANDO"}
            </div>

          </aside>

          {/* ════ RIGHT: BOARD ════ */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden p-2">
            {/*
              board-grid CSS class (defined above in <style>):
                grid-template-columns: repeat(5, 1fr)
                grid-template-rows: auto repeat(15, 1fr)   ← key to no-scroll
                flex: 1 / min-height: 0
            */}
            <div className="board-grid">

              {/*
                Letter sidebar — column 6, one cell per letter spanning 3 rows.
                B → rows 1-3, I → rows 4-6, N → rows 7-9, G → rows 10-12, O → rows 13-15
              */}
              {BINGO_LETTERS.map((letter, idx) => {
                const c = COLUMN_COLORS[letter];
                return (
                  <div
                    key={`sidebar-${letter}`}
                    className="flex items-center justify-center rounded-lg font-bold"
                    style={{
                      gridColumn: 1,
                      gridRow: `${idx * 3 + 1} / span 3`,
                      background: `${c.accent}15`,
                      border: `1px solid ${c.accent}40`,
                      color: c.accent,
                      fontSize: "clamp(0.9rem,1.6vw,1.6rem)",
                      textShadow: `0 0 14px ${c.glow}`,
                      letterSpacing: "0.05em",
                      writingMode: "vertical-rl",
                      textOrientation: "upright",
                    }}
                  >
                    {letter}
                  </div>
                );
              })}

              {/*
                Numbers: 5 columns × 15 rows.
                Rendered column-by-column so each letter's numbers are grouped together,
                naturally filling rows 1-3 (B), 4-6 (I), 7-9 (N), 10-12 (G), 13-15 (O).
              */}
              {BINGO_LETTERS.map(letter => {
                const c = COLUMN_COLORS[letter];
                const start = COLUMN_START[letter];

                return Array.from({ length: 15 }, (_, i) => {
                  const n = start + i;
                  const isDrawn = drawnNumbers.includes(n);
                  const isCurrent = n === currentNumber;

                  const dynamicStyle: React.CSSProperties = isCurrent
                    ? {
                      background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)`,
                      color: "#000",
                      boxShadow: `0 0 16px ${c.glow}, 0 0 32px ${c.glow}`,
                      transform: "scale(1.06)",
                      border: `2px solid ${c.accent}`,
                      zIndex: 2,
                    }
                    : isDrawn
                      ? {
                        background: c.bg,
                        color: c.accent,
                        border: `1px solid ${c.accent}45`,
                        boxShadow: `inset 0 0 8px ${c.accent}12`,
                      }
                      : {
                        background: "#0d0d0d",
                        color: "#1e2836",
                        border: "1px solid #151515",
                      };

                  return (
                    <div
                      key={n}
                      className="num-cell flex items-center justify-center rounded-lg font-medium cursor-default select-none"
                      style={{ fontSize: "clamp(0.55rem,1.1vw,1.05rem)", ...dynamicStyle }}
                    >
                      {n}
                    </div>
                  );
                });
              })}

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}