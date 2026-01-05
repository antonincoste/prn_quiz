import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ACTRESS_DB } from './actress';

// Fonction de distance de Levenshtein
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }
  return dp[m][n];
};

// Normalisation du texte
const normalize = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Vérification de la réponse avec tolérance (nom ET prénom requis)
const checkAnswer = (input, actress) => {
  const normalizedInput = normalize(input);
  const firstName = normalize(actress.firstName);
  const lastName = normalize(actress.lastName);
  const fullName = `${firstName} ${lastName}`;
  const fullNameReverse = `${lastName} ${firstName}`;

  const tolerance = 2;

  // Seul le nom complet est accepté (dans les deux ordres possibles)
  const checks = [fullName, fullNameReverse];
  
  return checks.some(check => {
    const distance = levenshteinDistance(normalizedInput, check);
    return distance <= tolerance;
  });
};

// Hook personnalisé pour le timer
const useTimer = (initialTime, onEnd) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onEndRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = () => {
    setTimeLeft(initialTime);
    setIsRunning(true);
  };

  const stop = () => setIsRunning(false);

  return { timeLeft, isRunning, start, stop };
};

// Hook personnalisé pour la logique de jeu
const useGame = () => {
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [currentActress, setCurrentActress] = useState(null);
  const [usedActressIds, setUsedActressIds] = useState([]);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const getRandomActress = (excludeIds = []) => {
    const available = ACTRESS_DB.filter(p => !excludeIds.includes(p.id));
    if (available.length === 0) {
      return ACTRESS_DB[Math.floor(Math.random() * ACTRESS_DB.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const startGame = () => {
    const firstActress = getRandomActress([]);
    setScore(0);
    setUsedActressIds([firstActress.id]);
    setTotalAnswered(0);
    setCurrentActress(firstActress);
    setGameState('playing');
  };

  const endGame = useCallback(() => {
    setGameState('ended');
  }, []);

  const submitAnswer = (input) => {
    if (!currentActress || gameState !== 'playing') return false;
    const isCorrect = checkAnswer(input, currentActress);
    setTotalAnswered((prev) => prev + 1);
    if (!isCorrect) return false;
    setScore((prev) => prev + 1);
    setUsedActressIds((prev) => {
      // 1) Mark current actress as "already seen" (no duplicates)
      const usedSet = new Set(prev);
      usedSet.add(currentActress.id);
      // 2) Si on a tout utilisé, on reset (pour repartir)
      const used = Array.from(usedSet);
      const shouldReset = used.length >= ACTRESS_DB.length;
      const excludeIds = shouldReset ? [] : used;
      // 3) Pick next actress excluding already used ones
      const nextActress = getRandomActress(excludeIds);
      // 4) Update current actress
      setCurrentActress(nextActress);
      // 5) Retourner la nouvelle liste "used"
      return shouldReset ? [nextActress.id] : [...used, nextActress.id];
    });
    return true;
  };

  const skipActress = () => {
    if (!currentActress || gameState !== 'playing') return;
    setTotalAnswered((prev) => prev + 1);
    setUsedActressIds((prev) => {
      const usedSet = new Set(prev);
      usedSet.add(currentActress.id);
      const used = Array.from(usedSet);
      const shouldReset = used.length >= ACTRESS_DB.length;
      const excludeIds = shouldReset ? [] : used;
      const nextActress = getRandomActress(excludeIds);
      setCurrentActress(nextActress);
      return shouldReset ? [nextActress.id] : [...used, nextActress.id];
    });
  };

  return {
    gameState,
    score,
    currentActress,
    totalAnswered,
    startGame,
    endGame,
    submitAnswer,
    skipActress,
  };
};

// Start screen component
const StartScreen = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="relative">
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 mb-2">
          ACTRESS
        </h1>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 -mt-4 md:-mt-8">
          QUIZ
        </h1>
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce" />
        <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-emerald-400 rounded-full animate-pulse" />
      </div>
      
      <p className="text-xl md:text-2xl text-gray-300 mt-8 mb-12 max-w-md font-light">
        Name as many actresses as you can in <span className="text-cyan-400 font-bold">60 seconds</span>
      </p>
      
      <button
        onClick={onStart}
        className="group relative px-12 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold text-xl text-gray-900 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
      >
        <span className="relative z-10">PLAY</span>
        <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
      </button>
      
      <div className="mt-16 flex gap-8 text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
          <span>Full name required</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded-full" />
          <span>Typos allowed</span>
        </div>
      </div>

      {/* Developer note */}
      <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl max-w-md">
        <p className="text-yellow-400 text-sm">
          ⚠️ <strong>Demo mode</strong>: Images are placeholders. 
          Replace URLs in ACTRESS_DB with your own actress images.
        </p>
      </div>
    </div>
  );
};

// Game screen component
const GameScreen = ({ actress, score, timeLeft, onSubmit, onSkip }) => {
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [actress]);

  useEffect(() => {
    setInput('');
  }, [actress]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const correct = onSubmit(input);
    if (correct) {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setInput('');
  };

  const timePercentage = (timeLeft / 60) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className={`min-h-screen flex flex-col p-4 md:p-8 transition-colors duration-300 ${flash ? 'bg-emerald-900/30' : ''}`}>
      {/* Header avec score et timer */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            {score}
          </div>
          <div className="text-gray-500 text-sm font-medium">
            SCORE
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className={`text-4xl md:text-5xl font-black tabular-nums ${isLowTime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}
            <span className="text-lg text-gray-500 ml-1">s</span>
          </div>
          <div className="w-32 md:w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${isLowTime ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actress image */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-2xl transform scale-110" />
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden border-4 border-gray-700 shadow-2xl bg-gray-800">
            {actress && (
              <>
                <img
                  src={actress.image}
                  alt="Who is this actress?"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-6xl bg-gradient-to-br from-gray-700 to-gray-800">
                  ⚽
                </div>
              </>
            )}
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-800 px-4 py-1 rounded-full text-sm text-gray-400 border border-gray-700">
            Who is she?
          </div>
        </div>

        {/* Hint: actress name (for demo mode) */}
        {actress && (
          <div className="mb-4 text-xs text-gray-600">
            [Démo: {actress.firstName} {actress.lastName}]
          </div>
        )}

        {/* Input de réponse */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className={`relative ${shake ? 'animate-shake' : ''}`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type the actress name..."
              className="w-full px-6 py-4 bg-gray-800/80 backdrop-blur border-2 border-gray-700 rounded-2xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-gray-900 hover:opacity-90 transition-opacity"
            >
              OK
            </button>
          </div>
        </form>

        {/* Bouton passer */}
        <button
          onClick={onSkip}
          className="mt-4 text-gray-500 hover:text-gray-300 transition-colors text-sm"
        >
          Skip →
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// Result screen component with newsletter
const ResultScreen = ({ score, totalAnswered, onRestart }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  const getMessage = () => {
    if (score >= 15) return { text: "LEGENDARY! 🏆", color: "from-yellow-400 to-orange-500" };
    if (score >= 10) return { text: "Excellent! ⚡", color: "from-emerald-400 to-cyan-500" };
    if (score >= 5) return { text: "Not bad! 👍", color: "from-blue-400 to-indigo-500" };
    return { text: "You can do better! 💪", color: "from-gray-400 to-gray-500" };
  };

  const message = getMessage();

  const handleSubscribe = (e) => {
    e.preventDefault();
    setError('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email');
      return;
    }

    // Local storage for demo
    const subscribers = JSON.parse(localStorage.getItem('quiz_subscribers') || '[]');
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem('quiz_subscribers', JSON.stringify(subscribers));
    }
    
    console.log('📧 New subscriber:', email);
    console.log('📋 Subscribers list:', subscribers);
    
    setSubscribed(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-8">
        <p className={`text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${message.color} mb-4`}>
          {message.text}
        </p>
        
        <div className="relative inline-block">
          <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500">
            {score}
          </div>
          <div className="text-gray-500 text-xl mt-2">points</div>
        </div>
      </div>

      <div className="flex gap-8 mb-12 text-gray-400">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{totalAnswered}</div>
          <div className="text-sm">attempts</div>
        </div>
        <div className="w-px bg-gray-700" />
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{accuracy}%</div>
          <div className="text-sm">accuracy</div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="group relative px-12 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold text-xl text-gray-900 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 mb-12"
      >
        PLAY AGAIN
      </button>

      {/* Newsletter Section */}
      <div className="w-full max-w-md p-6 bg-gray-800/50 backdrop-blur rounded-3xl border border-gray-700">
        {!subscribed ? (
          <>
            <h3 className="text-lg font-bold text-white mb-2">
              🚀 V2 coming soon!
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              New modes, leaderboards, challenges... Sign up to get notified!
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
              >
                OK
              </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-emerald-400 font-bold">Subscribed!</p>
            <p className="text-gray-400 text-sm">We'll let you know when it's ready</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
export default function ActressQuiz() {
  const {
    gameState,
    score,
    currentActress,
    totalAnswered,
    startGame,
    endGame,
    submitAnswer,
    skipActress,
  } = useGame();

  const { timeLeft, start: startTimer } = useTimer(60, endGame);

  const handleStart = () => {
    startGame();
    startTimer();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      
      {gameState === 'idle' && (
        <StartScreen onStart={handleStart} />
      )}
      
      {gameState === 'playing' && (
        <GameScreen
          actress={currentActress}
          score={score}
          timeLeft={timeLeft}
          onSubmit={submitAnswer}
          onSkip={skipActress}
        />
      )}
      
      {gameState === 'ended' && (
        <ResultScreen
          score={score}
          totalAnswered={totalAnswered}
          onRestart={handleStart}
        />
      )}
    </div>
  );
}