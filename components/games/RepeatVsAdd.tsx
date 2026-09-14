"use client";

import { useState } from "react";
import { SEED_REPEAT_VS_ADD } from "@/lib/content/seed-drills";
import { logAttempt } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, CheckCircle2, XCircle, ArrowRight, RotateCcw, Flame } from "lucide-react";

interface RepeatVsAddProps {
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function RepeatVsAdd({ onComplete, onBack }: RepeatVsAddProps) {
  // Take a set of 5-8 questions for this session
  const [questions] = useState(() => {
    return [...SEED_REPEAT_VS_ADD].sort(() => Math.random() - 0.5).slice(0, 6);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"REPEAT" | "ADD" | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSelect = (choice: "REPEAT" | "ADD") => {
    if (isAnswered) return;
    setSelectedAnswer(choice);
    setIsAnswered(true);

    const isCorrect = choice === currentQ.correctAnswer;
    if (isCorrect) {
      playSuccessChime();
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setCorrectCount((prev) => prev + 1);

      const xp = 15 + Math.min(newStreak * 2, 10);
      setTotalXpEarned((prev) => prev + xp);

      // Log attempt
      logAttempt({
        exerciseType: "repeat_vs_add",
        topic: currentQ.topic,
        domain: currentQ.domain,
        input: { choice, sentence1: currentQ.sentence1, sentence2: currentQ.sentence2 },
        score: 100,
        xpEarned: xp,
        durationSeconds: 10,
        feedback: currentQ.explanation,
      });
    } else {
      setCurrentStreak(0);
      logAttempt({
        exerciseType: "repeat_vs_add",
        topic: currentQ.topic,
        domain: currentQ.domain,
        input: { choice, sentence1: currentQ.sentence1, sentence2: currentQ.sentence2 },
        score: 0,
        xpEarned: 5, // small effort XP
        durationSeconds: 10,
        feedback: currentQ.explanation,
        misconception: "Treated repetition as progression or vice-versa",
      });
      setTotalXpEarned((prev) => prev + 5);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (correctCount >= 4) {
        fireConfetti();
      }
    }
  };

  if (isFinished) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Sprint Complete!</h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase block">Accuracy</span>
            <span className="text-2xl font-bold text-slate-800">{accuracy}%</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase block">XP Earned</span>
            <span className="text-2xl font-bold text-indigo-600">+{totalXpEarned} XP</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {accuracy >= 80
            ? "Outstanding eye for reasoning! You consistently spot the difference between genuine progression and paraphrased echoes."
            : "Good workout! Remember: if the second sentence only uses synonyms without introducing a new consequence or reason, it's a REPEAT."}
        </p>

        <button
          onClick={() => onComplete(totalXpEarned)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all"
        >
          Finish & Return
        </button>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQ.correctAnswer;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <h3 className="text-sm font-medium text-slate-500 mt-1">Topic: {currentQ.topic}</h3>
        </div>

        <div className="flex items-center gap-3">
          {currentStreak > 1 && (
            <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{currentStreak} Streak!</span>
            </div>
          )}
          <span className="font-mono text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            +{totalXpEarned} XP
          </span>
        </div>
      </div>

      {/* Sentences */}
      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Sentence 1 (Opening Idea)
          </span>
          <p className="text-base font-medium text-slate-800 leading-relaxed">
            &ldquo;{currentQ.sentence1}&rdquo;
          </p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-1">
            Sentence 2 (Next Sentence)
          </span>
          <p className="text-base font-semibold text-slate-900 leading-relaxed">
            &ldquo;{currentQ.sentence2}&rdquo;
          </p>
        </div>
      </div>

      {/* Decision prompt */}
      <p className="text-center text-sm font-bold text-slate-700 mb-4">
        Did Sentence 2 merely <span className="text-amber-600 underline">REPEAT</span> the first idea, or did it{" "}
        <span className="text-emerald-600 underline">ADD</span> new reasoning?
      </p>

      {/* Buttons */}
      {!isAnswered ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSelect("REPEAT")}
            className="py-4 px-6 rounded-2xl border-2 border-amber-200 bg-amber-50/40 hover:bg-amber-100 hover:border-amber-400 text-amber-900 font-bold text-lg transition-all shadow-sm active:scale-95"
          >
            🔄 REPEAT (Just echoes it)
          </button>
          <button
            type="button"
            onClick={() => handleSelect("ADD")}
            className="py-4 px-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100 hover:border-emerald-400 text-emerald-900 font-bold text-lg transition-all shadow-sm active:scale-95"
          >
            ➕ ADD (Advances reasoning)
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isCorrect
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm mb-1">
                {isCorrect ? "Correct!" : `Incorrect — The answer was ${currentQ.correctAnswer}`}
              </div>
              <p className="text-xs leading-relaxed opacity-90">{currentQ.explanation}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Back button */}
      {!isAnswered && (
        <div className="pt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Exit Game
          </button>
        </div>
      )}
    </div>
  );
}
