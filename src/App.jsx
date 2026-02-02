import React, { useState, useEffect, useCallback, useRef } from 'react';
import { track } from '@vercel/analytics';

// Events tracking helpers
const analytics = {
  gameStarted: (nsfw) => track('game_started', { nsfw_mode: nsfw }),
  gameEnded: (score, totalAnswered, duration) => track('game_ended', { 
    score, 
    total_answered: totalAnswered,
    accuracy: totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0,
    duration_seconds: duration
  }),
  gameStopped: (score, totalAnswered, timeLeft) => track('game_stopped', { 
    score, 
    total_answered: totalAnswered,
    time_remaining: timeLeft
  }),
  correctAnswer: (actressId) => track('correct_answer', { actress_id: actressId }),
  skipUsed: (actressId) => track('skip_used', { actress_id: actressId }),
  newsletterSubscribed: () => track('newsletter_subscribed'),
  socialLinkClicked: (platform, actressId) => track('social_link_clicked', { 
    platform, 
    actress_id: actressId 
  }),
};

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

// Fonction pour envoyer les stats
const updateStats = async (actressId, guessed) => {
  try {
    await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actressId, guessed }),
    });
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
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
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [actresses, setActresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]); // Historique des réponses
  
  // Utiliser useRef pour tracker les IDs de manière synchrone (évite les problèmes de state async)
  const usedActressIdsRef = useRef(new Set());
  const nextActressRef = useRef(null);

  // Précharger une image
  const preloadImage = (url) => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  };

  // Charger les actrices depuis l'API au démarrage
  useEffect(() => {
    const fetchActresses = async () => {
      try {
        const response = await fetch('/api/actresses');
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        // Filtrer : garder seulement les actrices avec une image
        const actressesWithImages = data.actresses.filter(a => a.image && a.image.trim() !== '');
        setActresses(actressesWithImages);
        setIsLoading(false);
      } catch (err) {
        // Fallback: import local en dev
        console.log('API not available, using local data');
        try {
          const { ACTRESS_DB } = await import('./actress.js');
          const actressesWithImages = ACTRESS_DB.filter(a => a.image && a.image.trim() !== '');
          setActresses(actressesWithImages);
          setIsLoading(false);
        } catch (importErr) {
          console.error('Error loading local data:', importErr);
          setError('Failed to load data. Please refresh.');
          setIsLoading(false);
        }
      }
    };
    fetchActresses();
  }, []);

  const getNextActress = () => {
    const available = actresses.filter(a => !usedActressIdsRef.current.has(a.id));
    
    // Si toutes les actrices ont été vues, reset
    if (available.length === 0) {
      usedActressIdsRef.current = new Set();
      return actresses[Math.floor(Math.random() * actresses.length)];
    }
    
    return available[Math.floor(Math.random() * available.length)];
  };

  // Préparer la prochaine actrice (pour le préchargement)
  const prepareNextActress = () => {
    const next = getNextActress();
    nextActressRef.current = next;
    preloadImage(next.image);
  };

  const startGame = () => {
    if (actresses.length === 0) return;
    usedActressIdsRef.current = new Set();
    const firstActress = getNextActress();
    usedActressIdsRef.current.add(firstActress.id);
    setScore(0);
    setTotalAnswered(0);
    setAnswers([]); // Reset l'historique
    setCurrentActress(firstActress);
    setGameState('playing');
    
    // Précharger la prochaine
    prepareNextActress();
  };

  const endGame = useCallback(() => {
    setGameState('ended');
  }, []);

  const goToNextActress = () => {
    // Utiliser l'actrice préchargée si disponible
    let nextActress = nextActressRef.current;
    
    // Si pas de préchargée ou déjà utilisée, en chercher une nouvelle
    if (!nextActress || usedActressIdsRef.current.has(nextActress.id)) {
      nextActress = getNextActress();
    }
    
    usedActressIdsRef.current.add(nextActress.id);
    setCurrentActress(nextActress);
    
    // Précharger la suivante
    nextActressRef.current = null;
    prepareNextActress();
  };

  const submitAnswer = (input) => {
    if (!currentActress || gameState !== 'playing') return false;
    const isCorrect = checkAnswer(input, currentActress);
    
    if (!isCorrect) {
      // Mauvaise réponse : ne pas changer d'actrice, laisser réessayer
      return false;
    }
    
    // Bonne réponse : comptabiliser et passer à la suivante
    const actressId = currentActress.id;
    setTotalAnswered((prev) => prev + 1);
    setScore((prev) => prev + 1);
    
    // Ajouter à l'historique
    setAnswers((prev) => [...prev, { actress: currentActress, correct: true }]);
    
    // Envoyer les stats
    updateStats(actressId, true);
    
    // Tracking
    analytics.correctAnswer(actressId);
    
    // Passer à l'actrice suivante
    goToNextActress();
    
    return true;
  };

  const skipActress = () => {
    if (!currentActress || gameState !== 'playing') return;
    const actressId = currentActress.id;
    
    setTotalAnswered((prev) => prev + 1);
    
    // Ajouter à l'historique
    setAnswers((prev) => [...prev, { actress: currentActress, correct: false }]);
    
    // Envoyer les stats (skip = pas trouvé)
    updateStats(actressId, false);
    
    // Tracking
    analytics.skipUsed(actressId);
    
    // Passer à l'actrice suivante
    goToNextActress();
  };

  return {
    gameState,
    score,
    currentActress,
    totalAnswered,
    actresses,
    isLoading,
    error,
    answers,
    startGame,
    endGame,
    submitAnswer,
    skipActress,
  };
};

// Start screen component
const StartScreen = ({ onStart, isLoading, error, nsfw, setNsfw }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2">
            THE P0RN
          </h1>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-stone-800 -mt-4 md:-mt-6">
            QUIZ
          </h1>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-pink-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(244,114,182,0.6)]" />
          <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-pink-300 rounded-full animate-pulse shadow-[0_0_20px_rgba(249,168,212,0.6)]" />
        </div>
        
        <p className="text-xl md:text-2xl text-stone-600 mt-8 mb-8 max-w-md font-light text-center">
          Name as many actresses as you can in <span className="text-pink-500 font-bold">60 seconds</span>
        </p>

        {/* NSFW Toggle */}
        <div className="mb-8 flex items-center gap-3">
          <span className={`text-sm font-medium ${nsfw ? 'text-stone-400' : 'text-stone-600'}`}>SFW</span>
          <button
            onClick={() => setNsfw(!nsfw)}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${nsfw ? 'bg-pink-500' : 'bg-stone-300'}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${nsfw ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
          <span className={`text-sm font-medium ${nsfw ? 'text-pink-500' : 'text-stone-400'}`}>NSFW 🔞</span>
        </div>

        {error ? (
          <div className="p-4 bg-red-100 border border-red-300 rounded-xl mb-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="px-12 py-5 text-xl text-stone-400">
            Loading...
          </div>
        ) : (
          <button
            onClick={onStart}
            className="group relative px-12 py-5 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl font-bold text-xl text-white transform hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(244,114,182,0.4)] hover:shadow-[0_0_50px_rgba(244,114,182,0.6)]"
          >
            <span className="relative z-10">PLAY</span>
            <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        )}
        
        <div className="mt-16 flex justify-center gap-8 text-stone-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-400 rounded-full shadow-[0_0_10px_rgba(244,114,182,0.6)]" />
            <span>Full name required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-300 rounded-full shadow-[0_0_10px_rgba(249,168,212,0.6)]" />
            <span>Typos allowed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Game screen component
const GameScreen = ({ actress, score, timeLeft, onSubmit, onSkip, onStop, nsfw }) => {
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef(null);

  // Choisir l'image selon le mode NSFW
  const imageUrl = nsfw && actress?.image2 ? actress.image2 : actress?.image;

  useEffect(() => {
    inputRef.current?.focus();
  }, [actress]);

  useEffect(() => {
    setInput('');
    setImageError(false);
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
    <div className={`min-h-screen flex flex-col p-4 md:p-8 transition-colors duration-300 relative overflow-hidden ${flash ? 'bg-pink-100' : ''}`}>
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header with score and timer */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">
            {score}
          </div>
          <div className="text-stone-500 text-sm font-medium">
            SCORE
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stop button */}
          <button
            onClick={onStop}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-stone-600 font-medium text-sm transition-colors"
          >
            Stop
          </button>
          
          <div className="flex flex-col items-end gap-2">
            <div className={`text-4xl md:text-5xl font-black tabular-nums ${isLowTime ? 'text-red-500 animate-pulse' : 'text-stone-800'}`}>
              {timeLeft}
              <span className="text-lg text-stone-400 ml-1">s</span>
            </div>
            <div className="w-32 md:w-48 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${isLowTime ? 'bg-red-500' : 'bg-gradient-to-r from-pink-400 to-pink-500'}`}
                style={{ width: `${timePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actress image */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-pink-300/30 rounded-3xl blur-2xl transform scale-110" />
          <div className="relative w-64 h-[358px] md:w-72 md:h-[403px] lg:w-80 lg:h-[448px] rounded-3xl overflow-hidden border-2 border-pink-300 shadow-[0_0_30px_rgba(244,114,182,0.2)] bg-stone-100">
            {actress && !imageError && imageUrl ? (
              <img
                src={imageUrl}
                alt="Who is this actress?"
                className="w-full h-full object-cover object-center"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-stone-100">
                💋
              </div>
            )}
            {/* Blur overlay to hide watermarks */}
            <div className="absolute bottom-0 left-0 right-0 h-4 backdrop-blur-[3px] bg-gradient-to-t from-stone-100/80 to-transparent pointer-events-none" />
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full text-sm text-pink-500 border border-pink-300 shadow-sm">
            Who is she?
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className={`relative ${shake ? 'animate-shake' : ''}`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type the actress name..."
              className="w-full px-6 py-4 bg-white border-2 border-stone-200 rounded-2xl text-stone-800 text-lg placeholder-stone-400 focus:outline-none focus:border-pink-400 focus:shadow-[0_0_20px_rgba(244,114,182,0.2)] transition-all"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-pink-400 to-pink-500 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
            >
              OK
            </button>
          </div>
        </form>

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="mt-4 text-stone-400 hover:text-pink-500 transition-colors text-sm"
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
const ResultScreen = ({ score, totalAnswered, onRestart, answers, nsfw }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  const getMessage = () => {
    if (score >= 15) return { text: "LEGENDARY! 🔥", color: "from-pink-500 to-rose-500" };
    if (score >= 10) return { text: "Hot stuff! 💋", color: "from-pink-400 to-pink-500" };
    if (score >= 5) return { text: "Not bad! 👀", color: "from-pink-300 to-pink-400" };
    return { text: "Try again! 💪", color: "from-stone-400 to-stone-500" };
  };

  const message = getMessage();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setSubscribed(true);
      analytics.newsletterSubscribed();
    } catch (err) {
      setError('Something went wrong. Try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg pt-8">
        {/* Score Section */}
        <div className="mb-6 text-center">
          <p className={`text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${message.color} mb-2`}>
            {message.text}
          </p>
          
          <div className="relative inline-block">
            <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-pink-500">
              {score}
            </div>
            <div className="text-stone-500 text-lg">points</div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mb-6 text-stone-500">
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-800">{totalAnswered}</div>
            <div className="text-sm">attempts</div>
          </div>
          <div className="w-px bg-stone-300" />
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-800">{accuracy}%</div>
            <div className="text-sm">accuracy</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="group relative px-10 py-4 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl font-bold text-lg text-white transform hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(244,114,182,0.4)] hover:shadow-[0_0_50px_rgba(244,114,182,0.6)] mb-6"
        >
          PLAY AGAIN
        </button>

        {/* Answers Recap */}
        {answers && answers.length > 0 && (
          <div className="w-full mb-6">
            <h3 className="text-lg font-bold text-stone-800 mb-3 text-center">Your answers</h3>
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-pink-200 shadow-[0_0_20px_rgba(244,114,182,0.1)] max-h-80 overflow-y-auto">
              {answers.map((answer, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 ${index !== answers.length - 1 ? 'border-b border-stone-100' : ''}`}
                >
                  {/* Photo - format 5:7 comme le quiz */}
                  <div className="w-14 h-[78px] rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                    <img 
                      src={nsfw && answer.actress.image2 ? answer.actress.image2 : answer.actress.image} 
                      alt=""
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  
                  {/* Name + Social Links */}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-stone-800">
                      {answer.actress.firstName} {answer.actress.lastName}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {answer.actress.onlyfans && (
                        <a 
                          href={answer.actress.onlyfans} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-0.5 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 transition-colors"
                          onClick={() => analytics.socialLinkClicked('onlyfans', answer.actress.id)}
                        >
                          OF
                        </a>
                      )}
                      {answer.actress.instagram && (
                        <a 
                          href={answer.actress.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                          onClick={() => analytics.socialLinkClicked('instagram', answer.actress.id)}
                        >
                          IG
                        </a>
                      )}
                      {answer.actress.twitter && (
                        <a 
                          href={answer.actress.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors"
                          onClick={() => analytics.socialLinkClicked('twitter', answer.actress.id)}
                        >
                          X
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Result */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${answer.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {answer.correct ? '✓' : '✗'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter Section */}
        <div className="w-full p-5 bg-white/80 backdrop-blur rounded-2xl border border-pink-200 shadow-[0_0_30px_rgba(244,114,182,0.1)]">
          {!subscribed ? (
            <>
              <h3 className="text-lg font-bold text-stone-800 mb-2">
                🔥 V2 coming soon!
              </h3>
              <p className="text-stone-500 text-sm mb-4">
                New modes, leaderboards, challenges... Sign up to get notified!
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-pink-400 focus:shadow-[0_0_15px_rgba(244,114,182,0.2)] transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 rounded-xl font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? '...' : 'OK'}
                </button>
              </form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">💋</div>
              <p className="text-pink-500 font-bold">Subscribed!</p>
              <p className="text-stone-500 text-sm">We'll let you know when it's ready</p>
            </div>
          )}
        </div>
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
    actresses,
    isLoading,
    error,
    answers,
    startGame,
    endGame,
    submitAnswer,
    skipActress,
  } = useGame();

  const { timeLeft, start: startTimer, stop: stopTimer } = useTimer(60, endGame);
  const [nsfw, setNsfw] = useState(false);
  const gameStartTimeRef = useRef(null);
  const hasTrackedEndRef = useRef(false);

  // Track game ended (quand le timer arrive à 0)
  useEffect(() => {
    if (gameState === 'ended' && gameStartTimeRef.current && !hasTrackedEndRef.current) {
      const duration = Math.round((Date.now() - gameStartTimeRef.current) / 1000);
      analytics.gameEnded(score, totalAnswered, duration);
      hasTrackedEndRef.current = true;
    }
    if (gameState === 'idle') {
      hasTrackedEndRef.current = false;
    }
  }, [gameState, score, totalAnswered]);

  const handleStart = () => {
    startGame();
    startTimer();
    gameStartTimeRef.current = Date.now();
    analytics.gameStarted(nsfw);
  };

  const handleStop = () => {
    stopTimer();
    analytics.gameStopped(score, totalAnswered, timeLeft);
    hasTrackedEndRef.current = true; // Éviter le double tracking
    endGame();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      
      <div className="flex-1">
        {gameState === 'idle' && (
          <StartScreen 
            onStart={handleStart} 
            isLoading={isLoading} 
            error={error}
            nsfw={nsfw}
            setNsfw={setNsfw}
          />
        )}
        
        {gameState === 'playing' && (
          <GameScreen
            actress={currentActress}
            score={score}
            timeLeft={timeLeft}
            onSubmit={submitAnswer}
            onSkip={skipActress}
            onStop={handleStop}
            nsfw={nsfw}
          />
        )}
        
        {gameState === 'ended' && (
          <ResultScreen
            score={score}
            totalAnswered={totalAnswered}
            onRestart={handleStart}
            answers={answers}
            nsfw={nsfw}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-stone-400 text-sm">
        <p>The Porn Quiz - 2026</p>
        <a href="mailto:contact@pornquiz.com" className="hover:text-pink-500 transition-colors">
          contact@pornquiz.com
        </a>
      </footer>
    </div>
  );
}