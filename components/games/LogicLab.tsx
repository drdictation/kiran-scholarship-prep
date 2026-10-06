"use client";

import { useState, useEffect } from "react";
import {
  LogicQuestion,
  PerceivedDifficulty,
  LogicCategory,
  LogicDiagnosticProfile,
} from "@/types";
import { SEED_LOGIC_QUESTIONS, LOGIC_CATEGORY_META } from "@/lib/content/seed-logic";
import {
  getLogicAttempts,
  logLogicAttempt,
  getProfile,
  markQuestionSeen,
} from "@/lib/storage";
import { computeLogicProfile, selectNextLogicCategory } from "@/lib/logic-scoring";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Brain,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Flame,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from "lucide-react";

interface LogicLabProps {
  onBack: () => void;
  onRefreshProfile?: () => void;
  initialMode?: "DIAGNOSTIC" | "TARGETED";
  targetCategoryProp?: LogicCategory;
}

export function LogicLab({
  onBack,
  onRefreshProfile,
  initialMode = "DIAGNOSTIC",
  targetCategoryProp,
}: LogicLabProps) {
  const [mode, setMode] = useState<"DIAGNOSTIC" | "TARGETED">(initialMode);
  const [selectedTargetCat, setSelectedTargetCat] = useState<LogicCategory | undefined>(
    targetCategoryProp
  );

  // Profile and question state
  const [profile, setProfile] = useState<LogicDiagnosticProfile | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<LogicQuestion | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const sessionTarget = mode === "DIAGNOSTIC" ? 12 : 6;

  // Interaction state
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<PerceivedDifficulty | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedbackRecord, setFeedbackRecord] = useState<{
    isCorrect: boolean;
    explanation: string;
    errorDiagnosis?: string;
    xpEarned: number;
    calibrationFeedback?: string;
  } | null>(null);

  // Timer ticker
  useEffect(() => {
    if (isAnswerSubmitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(1, Math.round((Date.now() - startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isAnswerSubmitted]);

  // Load profile and first question on mount
  useEffect(() => {
    const attempts = getLogicAttempts();
    const p = computeLogicProfile(attempts);
    setProfile(p);
    loadNextQuestion(p, selectedTargetCat);
  }, []);

  const loadNextQuestion = (
    currentProf: LogicDiagnosticProfile,
    targetCat?: LogicCategory
  ) => {
    setSelectedAnswer(null);
    setPerceivedDifficulty(null);
    setIsAnswerSubmitted(null as any);
    setFeedbackRecord(null);
    setStartTime(Date.now());
    setElapsedSeconds(0);

    const chosenCategory = selectNextLogicCategory(currentProf, targetCat);

    // Pick question from bank matching category
    const studentProfile = getProfile();
    const seenMap = studentProfile.seenQuestions || {};

    const available = SEED_LOGIC_QUESTIONS.filter(
      (q) => q.category === chosenCategory
    );

    let chosenQ: LogicQuestion;
    if (available.length > 0) {
      // Prioritize unseen
      const unseen = available.filter((q) => !seenMap[q.id]);
      if (unseen.length > 0) {
        chosenQ = unseen[Math.floor(Math.random() * unseen.length)];
      } else {
        // Least seen
        chosenQ = [...available].sort(
          (a, b) => (seenMap[a.id] || 0) - (seenMap[b.id] || 0)
        )[0];
      }
    } else {
      // Fallback across all
      chosenQ = SEED_LOGIC_QUESTIONS[Math.floor(Math.random() * SEED_LOGIC_QUESTIONS.length)];
    }

    setCurrentQuestion(chosenQ);
    markQuestionSeen(chosenQ.id);
  };

  const handleSelectOption = (optId: "A" | "B" | "C" | "D") => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(optId);
  };

  const handleSubmit = (rating: PerceivedDifficulty) => {
    if (!currentQuestion || !selectedAnswer || isAnswerSubmitted) return;

    setPerceivedDifficulty(rating);
    setIsAnswerSubmitted(true);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const responseSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Gamification: Correctness dominates (20 XP)
    // Small calibration bonus (5 XP) if rating matches:
    // Easy + Correct, or Hard + Wrong (aware of challenge)
    let xp = isCorrect ? 20 : 5;
    let calibrationFeedback = "";

    if (isCorrect && rating === "EASY") {
      xp += 5; // Secure mastery bonus
      calibrationFeedback = "Secure skill: Quick and accurate!";
    } else if (isCorrect && rating === "HARD") {
      xp += 5; // Effortful success bonus
      calibrationFeedback = "Capable but effortful: Great perseverance on a tough puzzle!";
    } else if (!isCorrect && rating === "EASY") {
      // Important diagnostic: Overconfidence / misconception risk
      calibrationFeedback = "Misconception alert: You rated this Easy, but double-check the underlying condition!";
    } else if (!isCorrect && rating === "HARD") {
      calibrationFeedback = "Good self-awareness: You recognised this was challenging.";
    }

    if (isCorrect) {
      playSuccessChime();
      if (sessionCount + 1 >= sessionTarget) {
        fireConfetti();
      }
    }

    const errorDiag = !isCorrect
      ? currentQuestion.commonErrorFeedback?.[selectedAnswer] || "Check the premises carefully."
      : undefined;

    setFeedbackRecord({
      isCorrect,
      explanation: currentQuestion.explanation,
      errorDiagnosis: errorDiag,
      xpEarned: xp,
      calibrationFeedback,
    });

    // Record attempt in storage
    logLogicAttempt({
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      subSkill: currentQuestion.subSkill,
      difficultyLevel: currentQuestion.difficulty,
      correctAnswer: currentQuestion.correctAnswer,
      studentAnswer: selectedAnswer,
      isCorrect,
      perceivedDifficulty: rating,
      responseTimeSeconds: responseSeconds,
      dateAttempted: new Date().toISOString(),
      feedback: currentQuestion.explanation,
      errorDiagnosis: errorDiag,
      xpEarned: xp,
    });

    // Update session tally and profile
    const nextCount = sessionCount + 1;
    setSessionCount(nextCount);

    const updatedAttempts = getLogicAttempts();
    const updatedProf = computeLogicProfile(updatedAttempts);
    setProfile(updatedProf);

    if (onRefreshProfile) {
      onRefreshProfile();
    }
  };

  const handleNext = () => {
    if (profile) {
      loadNextQuestion(profile, selectedTargetCat);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200">
        <Brain className="w-10 h-10 text-indigo-600 mx-auto animate-pulse mb-3" />
        <p className="text-slate-600 font-medium">Loading logic question...</p>
      </div>
    );
  }

  const categoryMeta = LOGIC_CATEGORY_META[currentQuestion.category];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Header / Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            &larr; Exit
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> Logic Reasoning
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Question {sessionCount + 1} of {sessionTarget}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">
              {categoryMeta?.name || currentQuestion.category}
            </h2>
          </div>
        </div>

        {/* Mode Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => {
              setMode("DIAGNOSTIC");
              setSelectedTargetCat(undefined);
              if (profile) loadNextQuestion(profile, undefined);
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              mode === "DIAGNOSTIC"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Diagnostic Mode (Broad)
          </button>
          <button
            onClick={() => {
              setMode("TARGETED");
              const weak = profile?.weakCategories[0] || "conditional_logic";
              setSelectedTargetCat(weak);
              if (profile) loadNextQuestion(profile, weak);
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              mode === "TARGETED"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Targeted Mode
          </button>
        </div>
      </div>

      {/* Target Category Selector in Targeted Mode */}
      {mode === "TARGETED" && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Targeting weakness:</span>
          </div>
          <select
            value={selectedTargetCat || currentQuestion.category}
            onChange={(e) => {
              const cat = e.target.value as LogicCategory;
              setSelectedTargetCat(cat);
              if (profile) loadNextQuestion(profile, cat);
            }}
            className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
          >
            {Object.entries(LOGIC_CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Sub-skill badge & Response timer */}
        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
          <span className="font-semibold text-slate-500">
            Sub-skill: <strong className="text-slate-700">{currentQuestion.subSkill}</strong>
          </span>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedSeconds}s</span>
          </div>
        </div>

        {/* Premises Box */}
        <div className="p-4 md:p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Scenario / Premises:
          </span>
          <p className="text-sm md:text-base font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
            {currentQuestion.premises}
          </p>
        </div>

        {/* Question Prompt */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
            Question:
          </span>
          <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Options (A, B, C, D) */}
        <div className="space-y-3">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedAnswer === opt.id;
            let cardStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-800";

            if (isAnswerSubmitted) {
              if (opt.id === currentQuestion.correctAnswer) {
                cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-400/30";
              } else if (isSelected) {
                cardStyle = "border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-300";
              } else {
                cardStyle = "border-slate-200 bg-slate-50/50 text-slate-400 opacity-60";
              }
            } else if (isSelected) {
              cardStyle = "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-400/40 font-semibold";
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${cardStyle}`}
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                  {opt.id}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Difficulty Rating Step (Revealed when answer option selected, before submitting) */}
        {selectedAnswer && !isAnswerSubmitted && (
          <div className="pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              How difficult did you find this question?
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSubmit("EASY")}
                className="py-3 px-4 rounded-xl border-2 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-900 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span>😊 Easy</span>
                <span className="text-[10px] font-normal text-emerald-700">Immediate answer</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("MEDIUM")}
                className="py-3 px-4 rounded-xl border-2 border-sky-300 hover:border-sky-500 hover:bg-sky-50 text-sky-900 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span>🤔 Medium</span>
                <span className="text-[10px] font-normal text-sky-700">Required reasoning</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("HARD")}
                className="py-3 px-4 rounded-xl border-2 border-amber-300 hover:border-amber-500 hover:bg-amber-50 text-amber-900 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span>🔥 Hard</span>
                <span className="text-[10px] font-normal text-amber-700">Challenging / uncertain</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Clicking your perceived difficulty records your answer and diagnostic calibration.
            </p>
          </div>
        )}

        {/* Feedback & Error Diagnosis Area */}
        {isAnswerSubmitted && feedbackRecord && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
            <div
              className={`p-4 rounded-2xl border ${
                feedbackRecord.isCorrect
                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                  : "bg-rose-50/80 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {feedbackRecord.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span>Incorrect</span>
                    </>
                  )}
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white/80">
                  +{feedbackRecord.xpEarned} XP
                </span>
              </div>

              {/* Likely reasoning error diagnosis if incorrect */}
              {feedbackRecord.errorDiagnosis && (
                <div className="mb-2 p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-xs font-medium text-rose-900">
                  <strong>Likely Reasoning Error:</strong> {feedbackRecord.errorDiagnosis}
                </div>
              )}

              {/* Explanation of method */}
              <p className="text-xs leading-relaxed text-slate-800">
                <strong>Method:</strong> {feedbackRecord.explanation}
              </p>

              {/* Calibration badge note */}
              {feedbackRecord.calibrationFeedback && (
                <div className="mt-2 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{feedbackRecord.calibrationFeedback}</span>
                </div>
              )}
            </div>

            {/* Next Question Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              Next Question <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
