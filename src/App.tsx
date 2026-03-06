import { useState, useEffect, useCallback, useRef } from 'react';
// Tipos para el estado del juego
type GameStatus = 'idle' | 'playing' | 'paused';
const TOTAL_NUMBERS = 90;

// Algoritmo para barajar un array (Fisher-Yates Shuffle)
const shuffle = (array: number[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

function App() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');

  // Usamos un ref para que el intervalo SIEMPRE vea el estado más actual
  const stateRef = useRef({ numbers, status });
  stateRef.current = { numbers, status };

  // Función para sacar un número (Lógica pura)
  const drawNumber = useCallback(() => {
    const { numbers: currentPool, status: currentStatus } = stateRef.current;

    if (currentStatus !== 'playing') return;

    if (currentPool.length === 0) {
      setStatus('idle');
      return;
    }

    // Al estar barajado, simplemente tomamos el ÚLTIMO
    const newPool = [...currentPool];
    const selected = newPool.pop()!; // Sacamos el último elemento

    // Actualizamos todo de golpe
    setCurrentNumber(selected);
    setDrawnNumbers(prev => [selected, ...prev]);
    setNumbers(newPool);
  }, []);

  // CONTROL DEL INTERVALO: Esta es la parte clave para evitar el error
  useEffect(() => {
    let intervalId: number | undefined;

    if (status === 'playing') {
      intervalId = window.setInterval(drawNumber, 2000);
    }

    return () => clearInterval(intervalId);
  }, [status, drawNumber]);

  // Handlers de botones
  const handlePlay = () => {
    if (status === 'idle' && numbers.length === 0) {
      // Creamos y barajamos el mazo solo al iniciar
      const initialPool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
      setNumbers(shuffle(initialPool));
    }
    setStatus('playing');
  };

  const handlePause = () => setStatus('paused');

  const handleStop = () => {
    setStatus('idle');
    setNumbers([]);
    setDrawnNumbers([]);
    setCurrentNumber(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 flex flex-col items-center justify-center font-sans overflow-hidden">
      <div className="w-full max-w-6xl h-full flex flex-row-reverse items-center justify-center gap-16">
        <div className="flex flex-col items-center gap-6">
          <div className='flex items-center justify-center gap-2 w-full max-w-md'>
            <picture>
              <img src="logo.png" alt="Bingo Logo" className="w-24 h-24" />
            </picture>
            <h1 className="text-4xl font-black bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent ">
              BINGO PROMO
            </h1>
          </div>

          {/* Pantalla del Número */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-yellow-500 to-orange-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-48 h-48 bg-neutral-900 rounded-full flex items-center justify-center border-4 border-neutral-800 shadow-2xl">
              <span className="text-6xl font-bold tracking-tighter">
                {currentNumber || '00'}
              </span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-6">
            <button
              onClick={handlePlay}
              className={`px-10 py-4 rounded-2xl font-black transition-all transform active:scale-95 ${status === 'playing' ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}
            >
              PLAY
            </button>
            <button
              onClick={handlePause}
              className={`px-10 py-4 rounded-2xl font-black transition-all transform active:scale-95 ${status !== 'playing' ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }`}
            >
              PAUSE
            </button>
            <button
              onClick={handleStop}
              className="px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black transition-all transform active:scale-95 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              STOP
            </button>
          </div>

          <h2 className="text-4xl font-black bg-linear-to-r from-slate-700 to-purple-500 bg-clip-text text-transparent">Promo X</h2>
        </div>

        {/* Tablero de Números */}
        <div className="w-full max-w-5xl h-full grid grid-cols-10 gap-3 p-8 bg-neutral-900/50 rounded-3xl border border-neutral-800">
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`aspect-square flex items-center justify-center rounded-xl text-md font-bold transition-all duration-500 ${drawnNumbers.includes(n)
                ? n === currentNumber
                  ? 'bg-yellow-400 text-black scale-110 shadow-lg ring-4 ring-yellow-400/20'
                  : 'bg-green-700 text-neutral-300'
                : 'bg-neutral-800/40 text-neutral-600 border border-neutral-800'
                }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;