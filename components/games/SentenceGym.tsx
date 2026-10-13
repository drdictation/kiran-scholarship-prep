"use client";

import { useState, useEffect, useRef } from "react";
import {
  GymOperation,
  GymQuestion,
  SEED_GYM_QUESTIONS,
} from "@/lib/content/seed-sentence-gym";
import {
  logAttempt,
  getProfile,
  pickUnseenItem,
  getAttempts,
} from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Clock,
  ArrowRight,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from "lucide-react";

interface AttemptRecord {
  questionId: string;
  type: GymOperation;
  domain: string;
  rating: "Strong" | "Almost" | "Needs work";
  score: number;
  durationSeconds: number;
  text: string;
}

export function SentenceGym({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) {
  // Session setup
  const [selectedDuration, setSelectedDuration] = useState<number>(20 * 60); // default 20m in seconds
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);

  // Time & Queue
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [currentElapsed, setCurrentElapsed] = useState<number>(0);

  // Prefetched questions buffer
  const [queue, setQueue] = useState<GymQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<GymQuestion | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  // Student interaction
  const [inputText, setInputText] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<{
    rating: "Strong" | "Almost" | "Needs work";
    score: number;
    feedback: string;
    improvedSentence?: string;
  } | null>(null);

  // Session rolling stats
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [rollingSkill, setRollingSkill] = useState<number>(60);
  const initialSkillRef = useRef<number>(60);

  // Initialize rolling skill from profile
  useEffect(() => {
    const prof = getProfile();
    const existing = Math.round(
      ((prof.skillsMastery.causal_reasoning || 50) +
        (prof.skillsMastery.causal_progression || 50) +
        (prof.skillsMastery.sentence_combining || 50)) /
        3
    );
    const startScore = existing > 0 ? existing : 58;
    setRollingSkill(startScore);
    initialSkillRef.current = startScore;
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!sessionActive || sessionFinished) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSessionFinished(true);
          return 0;
        }
        return prev - 1;
      });
      setCurrentElapsed(Math.round((Date.now() - questionStartTime) / 1000));
    }, 500);

    return () => clearInterval(interval);
  }, [sessionActive, sessionFinished, questionStartTime]);

  // Dynamic question prefetcher
  const prefetchNextQuestion = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      // 30% builder, 25% bridge, 25% fix_compress, 20% next_sentence
      const rand = Math.random();
      let targetType: GymOperation = "builder";
      if (rand < 0.3) targetType = "builder";
      else if (rand < 0.55) targetType = "bridge";
      else if (rand < 0.8) targetType = "fix_compress";
      else targetType = "next_sentence";

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "generate_sentence_gym",
          payload: { targetType },
        }),
      });

      if (res.ok) {
        const item: GymQuestion = await res.json();
        if (item && item.promptInstruction) {
          setQueue((prev) => [...prev, item]);
        }
      }
    } catch {
      // Fallback silently if background fetch fails
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Keep queue buffered (at least 3 items in reserve)
  useEffect(() => {
    if (sessionActive && queue.length < 3) {
      prefetchNextQuestion();
    }
  }, [sessionActive, queue.length]);

  // Pull next question from queue or seed
  const advanceQuestion = () => {
    setLastFeedback(null);
    setInputText("");
    setQuestionStartTime(Date.now());
    setCurrentElapsed(0);

    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      setCurrentQuestion(next);
    } else {
      // Immediate seed fallback
      const fallback = pickUnseenItem(SEED_GYM_QUESTIONS);
      setCurrentQuestion(fallback);
    }
    // Trigger prefetch to refill buffer
    prefetchNextQuestion();
  };

  const startSession = (durationMinutes: number) => {
    const totalSecs = durationMinutes * 60;
    setSelectedDuration(totalSecs);
    setTimeRemaining(totalSecs);

    // Initial questions pool
    const initialPool = [...SEED_GYM_QUESTIONS].sort(() => 0.5 - Math.random());
    const firstQ = initialPool[0];
    const initialQueue = initialPool.slice(1, 4);

    setCurrentQuestion(firstQ);
    setQueue(initialQueue);
    setAttempts([]);
    setStreak(0);
    setSessionActive(true);
    setSessionFinished(false);
    setQuestionStartTime(Date.now());
    setCurrentElapsed(0);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !inputText.trim() || isEvaluating) return;

    setIsEvaluating(true);
    const durationSeconds = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    const promptCtx = {
      notes: currentQuestion.notes,
      pointA: currentQuestion.pointA,
      conclusionC: currentQuestion.conclusionC,
      weakSentence: currentQuestion.weakSentence,
      sentence1: currentQuestion.sentence1,
      modelAnswer: currentQuestion.modelAnswer,
    };

    let evaluationResult = {
      rating: "Almost" as "Strong" | "Almost" | "Needs work",
      score: 65,
      feedback: "Answer recorded.",
      improvedSentence: currentQuestion.modelAnswer,
    };

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentence_gym",
          payload: {
            gymType: currentQuestion.type,
            promptContext: promptCtx,
            studentText: inputText.trim(),
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rating) {
          evaluationResult = data;
        }
      }
    } catch {
      // Fallback evaluation
      evaluationResult = {
        rating: inputText.split(" ").length >= 6 ? "Strong" : "Almost",
        score: inputText.split(" ").length >= 6 ? 85 : 60,
        feedback: "Clear progression shown.",
        improvedSentence: currentQuestion.modelAnswer,
      };
    } finally {
      setIsEvaluating(false);
    }

    // Update streak
    if (evaluationResult.rating === "Strong") {
      setStreak((s) => s + 1);
      playSuccessChime();
    } else {
      setStreak(0);
    }

    // Responsive rolling skill (down on weak, up on strong, recent attempts weighted)
    setRollingSkill((prev) => {
      const weight = 0.2;
      return Math.round(prev * (1 - weight) + evaluationResult.score * weight);
    });

    const newRecord: AttemptRecord = {
      questionId: currentQuestion.id,
      type: currentQuestion.type,
      domain: currentQuestion.domain,
      rating: evaluationResult.rating,
      score: evaluationResult.score,
      durationSeconds,
      text: inputText.trim(),
    };

    setAttempts((prev) => [...prev, newRecord]);
    setLastFeedback(evaluationResult);

    // Persist attempt to storage
    logAttempt({
      exerciseType: "sentence_gym",
      domain: (currentQuestion.domain as any) || "society",
      questionId: currentQuestion.id,
      input: { prompt: currentQuestion.promptInstruction, text: inputText.trim() },
      score: evaluationResult.score,
      xpEarned: evaluationResult.rating === "Strong" ? 15 : evaluationResult.rating === "Almost" ? 10 : 5,
      durationSeconds,
      feedback: evaluationResult.feedback,
      details: {
        gymType: currentQuestion.type,
        rating: evaluationResult.rating,
      },
      assessmentPrompt: "Sentence Gym: rapid generative 1-sentence drill",
    });
  };

  // Computed metrics during workout
  const recentDurations = attempts.map((a) => a.durationSeconds).slice(-20);
  const currentMedian =
    recentDurations.length > 0
      ? [...recentDurations].sort((a, b) => a - b)[Math.floor(recentDurations.length / 2)]
      : null;

  // Windowed metrics (First 10 vs Last 10) for summary
  const first10 = attempts.slice(0, 10);
  const last10 = attempts.length > 10 ? attempts.slice(-10) : attempts;

  const avgScore = (list: AttemptRecord[]) =>
    list.length ? Math.round(list.reduce((acc, x) => acc + x.score, 0) / list.length) : 0;

  const strongRate = (list: AttemptRecord[]) =>
    list.length ? `${list.filter((x) => x.rating === "Strong").length}/${list.length}` : "0/0";

  const medianTime = (list: AttemptRecord[]) => {
    if (!list.length) return 0;
    const sorted = [...list.map((x) => x.durationSeconds)].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  const first10Quality = avgScore(first10);
  const last10Quality = avgScore(last10);
  const qualityDiff = last10Quality - first10Quality;

  const first10Time = medianTime(first10);
  const last10Time = medianTime(last10);
  const timeDiff = first10Time - last10Time;

  // Operation specific breakdown for summary
  const modeCount: Record<GymOperation, { total: number; strong: number }> = {
    builder: { total: 0, strong: 0 },
    bridge: { total: 0, strong: 0 },
    fix_compress: { total: 0, strong: 0 },
    next_sentence: { total: 0, strong: 0 },
  };
  attempts.forEach((a) => {
    if (modeCount[a.type]) {
      modeCount[a.type].total += 1;
      if (a.rating === "Strong") modeCount[a.type].strong += 1;
    }
  });

  const modeLabels: Record<GymOperation, string> = {
    builder: "Sentence construction",
    bridge: "Causal bridge",
    fix_compress: "Fix & compress",
    next_sentence: "Developing the next sentence",
  };

  const sortedModes = (Object.keys(modeCount) as GymOperation[])
    .filter((k) => modeCount[k].total > 0)
    .sort((a, b) => {
      const rateA = modeCount[a].strong / modeCount[a].total;
      const rateB = modeCount[b].strong / modeCount[b].total;
      return rateB - rateA;
    });

  const bestMode = sortedModes.length > 0 ? modeLabels[sortedModes[0]] : "Sentence construction";
  const weakestMode =
    sortedModes.length > 1
      ? modeLabels[sortedModes[sortedModes.length - 1]]
      : "Developing the next sentence";

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* ============================================================
     1. LOBBY SCREEN (Duration selector)
     ============================================================ */
  if (!sessionActive) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-white rounded-3xl p-8 border-2 border-indigo-500 shadow-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg mb-2">
            <Zap className="w-8 h-8 text-amber-300 fill-amber-300" />
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sentence Gym</h1>
            <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
              Rapid-fire generative sentence drills. Type clean, concise, causal sentences across 4 core operations with instant feedback.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[10, 20, 30, 40].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => startSession(mins)}
                className="py-4 px-3 rounded-2xl border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center group flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <Clock className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-slate-800 text-lg">{mins} min</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  ~{mins * 2} attempts
                </span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              &larr; Back to Dashboard
            </button>
            <span className="text-xs text-indigo-600 font-bold">
              Target: 40–80 high-speed attempts
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     2. END-OF-SESSION RESULT SCREEN
     ============================================================ */
  if (sessionFinished) {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-6">
        <div className="bg-white rounded-3xl p-8 border-2 border-indigo-500 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Workout Complete
            </span>
            <h2 className="text-2xl font-black text-slate-900 pt-2">TODAY</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Sentence quality */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold">Sentence quality</div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {first10Quality} &rarr; {last10Quality}
              </div>
              <div
                className={`text-xs font-bold mt-1 ${
                  qualityDiff >= 0 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {qualityDiff >= 0 ? `+${qualityDiff}` : qualityDiff}
              </div>
            </div>

            {/* First-try strong */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold">First-try strong</div>
              <div className="text-sm font-bold text-slate-600 mt-1">
                First 10: <span className="font-black text-slate-800">{strongRate(first10)}</span>
              </div>
              <div className="text-sm font-bold text-slate-600">
                Last 10: <span className="font-black text-indigo-600">{strongRate(last10)}</span>
              </div>
            </div>

            {/* Median response */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold">Median response</div>
              <div className="text-sm font-bold text-slate-600 mt-1">
                First 10: {first10Time}s
              </div>
              <div className="text-sm font-bold text-slate-600">
                Last 10: {last10Time}s
              </div>
              <div className="text-xs font-bold text-indigo-600 mt-1">
                {timeDiff >= 0 ? `${timeDiff} sec faster` : `${Math.abs(timeDiff)} sec slower`}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Questions completed:</span>
              <span className="font-black text-slate-900">{attempts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Improved most:</span>
              <span className="font-bold text-emerald-700">{bestMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Needs work:</span>
              <span className="font-bold text-amber-700">{weakestMode}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 text-center flex items-center justify-center gap-2"
          >
            Done <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     3. WORKOUT HUD & ACTIVE QUESTION SCREEN
     ============================================================ */
  const operationTitle: Record<GymOperation, string> = {
    builder: "Sentence Builder",
    bridge: "Causal Bridge",
    fix_compress: "Fix & Compress",
    next_sentence: "Next Sentence",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4">
      {/* MINIMAL HUD */}
      <div className="bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-md flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-tight text-indigo-300">Sentence Gym</span>
          <span className="font-bold text-slate-300">
            Sentence Skill:{" "}
            <span className="text-white font-black">{rollingSkill}</span>{" "}
            <span className={rollingSkill >= initialSkillRef.current ? "text-emerald-400" : "text-amber-400"}>
              {rollingSkill >= initialSkillRef.current ? "↑" : "↓"}
            </span>
          </span>
          <span className="font-bold text-slate-300">
            Streak: <span className="text-amber-300 font-black">{streak}</span>
          </span>
          {currentMedian !== null && (
            <span className="text-slate-400 text-xs hidden sm:inline">
              Median: {currentMedian} sec
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-amber-300 bg-amber-950/60 px-2 py-1 rounded-md border border-amber-600/40">
            {formatTime(timeRemaining)}
          </span>
          <button
            type="button"
            onClick={() => setSessionFinished(true)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            Finish
          </button>
        </div>
      </div>

      {/* QUESTION CARD */}
      {currentQuestion && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-indigo-200 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
              {operationTitle[currentQuestion.type]}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Elapsed: {currentElapsed}s
            </span>
          </div>

          {/* Operation Specific Prompts */}
          {currentQuestion.type === "builder" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Notes to combine:
              </p>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.notes?.map((n, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 font-semibold rounded-xl text-sm"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {currentQuestion.promptInstruction}
              </p>
            </div>
          )}

          {currentQuestion.type === "bridge" && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-sm text-slate-800">
                  <span className="font-bold text-indigo-700 mr-2">A:</span>
                  {currentQuestion.pointA}
                </div>
                <div className="text-sm font-bold text-indigo-500 pl-4 py-1 flex items-center gap-1">
                  &darr; [ Missing Mechanism ] &darr;
                </div>
                <div className="text-sm text-slate-800">
                  <span className="font-bold text-indigo-700 mr-2">C:</span>
                  {currentQuestion.conclusionC}
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {currentQuestion.promptInstruction}
              </p>
            </div>
          )}

          {currentQuestion.type === "fix_compress" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Weak sentence to rewrite:
              </p>
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-slate-800 text-sm italic">
                &ldquo;{currentQuestion.weakSentence}&rdquo;
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {currentQuestion.promptInstruction}
              </p>
            </div>
          )}

          {currentQuestion.type === "next_sentence" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sentence 1:
              </p>
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-slate-900 font-medium text-sm">
                &ldquo;{currentQuestion.sentence1}&rdquo;
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {currentQuestion.promptInstruction}
              </p>
            </div>
          )}

          {/* INPUT FORM OR FEEDBACK */}
          {!lastFeedback ? (
            <div className="space-y-3 pt-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isEvaluating}
                placeholder="Type your one clear sentence here... (Press Enter to submit)"
                rows={3}
                autoFocus
                className="w-full p-4 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden font-medium text-slate-900 text-base resize-none transition-all"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isEvaluating}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
                >
                  {isEvaluating ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> Evaluating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Submit <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div
                className={`p-4 rounded-2xl border-2 ${
                  lastFeedback.rating === "Strong"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                    : lastFeedback.rating === "Almost"
                    ? "bg-amber-50 border-amber-500 text-amber-950"
                    : "bg-rose-50 border-rose-500 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm">
                  {lastFeedback.rating === "Strong" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span>{lastFeedback.rating}</span>
                </div>
                <p className="text-sm font-medium mt-1 leading-snug">
                  {lastFeedback.feedback}
                </p>
                {lastFeedback.improvedSentence && lastFeedback.rating !== "Strong" && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-700">
                    <span className="font-bold">Model example: </span>
                    &ldquo;{lastFeedback.improvedSentence}&rdquo;
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={advanceQuestion}
                autoFocus
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 text-base"
              >
                NEXT &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
