"use client";

import { useState } from "react";
import { SEED_REPEAT_VS_ADD } from "@/lib/content/seed-drills";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

interface RepeatVsAddProps {
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function RepeatVsAdd({ onComplete, onBack }: RepeatVsAddProps) {
  // Occasional diagnostic: Max 3 completely novel questions per session
  const [questions] = useState(() => {
    const profile = getProfile();
    const seenMap = profile.seenQuestions || {};

    // Prioritize unseen items first
    const unseen = SEED_REPEAT_VS_ADD.filter((q) => !seenMap[q.id]);
    const pool = unseen.length >= 3 ? unseen : SEED_REPEAT_VS_ADD;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
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
    const xp = isCorrect ? 3 : 1; // Minimal XP: diagnostic recognition drill
    setTotalXpEarned((prev) => prev + xp);

    if (isCorrect) {
      playSuccessChime();
      setCorrectCount((prev) => prev + 1);
    }

    logAttempt({
      exerciseType: "repeat_vs_add",
      topic: currentQ.topic,
      domain: currentQ.domain,
      questionId: currentQ.id,
      input: { choice, sentence1: currentQ.sentence1, sentence2: currentQ.sentence2 },
      score: isCorrect ? 100 : 0,
      xpEarned: xp,
      durationSeconds: 10,
      feedback: currentQ.explanation,
      assessmentPrompt: "Occasional Diagnostic: Tests recognition of repetition vs genuine causal progression (max 3 questions).",
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (correctCount >= 2) {
        fireConfetti();
      }
    }
  };

  if (isFinished) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Diagnostic Complete
          </span>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">Diagnostic Mini-Check Done</h2>
          <p className="text-xs text-slate-500 mt-1">
            Repeat vs Add is limited to 3 novel items to ensure writing practice focuses on generative development.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase block">Accuracy</span>
            <span className="text-2xl font-bold text-slate-800">{accuracy}%</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase block">XP Awarded</span>
            <span className="text-2xl font-bold text-indigo-600">+{totalXpEarned} XP</span>
          </div>
        </div>

        <button
          onClick={() => onComplete(totalXpEarned)}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all text-sm"
        >
          Return to Lab
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Occasional Diagnostic Mini-Check • Question {currentIndex + 1} of {questions.length}
          </span>
          <h3 className="text-xs font-medium text-slate-500 mt-1.5">
            <strong>Topic:</strong> &ldquo;{currentQ.topic}&rdquo;
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {/* Sentence 1 */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Sentence 1:
          </span>
          <p className="text-sm font-semibold text-slate-800">&ldquo;{currentQ.sentence1}&rdquo;</p>
        </div>

        {/* Sentence 2 */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Sentence 2:
          </span>
          <p className="text-sm font-semibold text-slate-800">&ldquo;{currentQ.sentence2}&rdquo;</p>
        </div>

        {/* Decision prompt */}
        <div className="pt-2 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
            Does Sentence 2 merely repeat the point or add a new causal reason / effect?
          </span>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => handleSelect("REPEAT")}
              disabled={isAnswered}
              className={`p-3.5 rounded-xl font-bold text-sm border transition-all ${
                isAnswered
                  ? currentQ.correctAnswer === "REPEAT"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300"
                    : selectedAnswer === "REPEAT"
                    ? "bg-rose-50 border-rose-300 text-rose-800"
                    : "opacity-40 border-slate-200 text-slate-400"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              REPEAT (Echoes premise)
            </button>

            <button
              type="button"
              onClick={() => handleSelect("ADD")}
              disabled={isAnswered}
              className={`p-3.5 rounded-xl font-bold text-sm border transition-all ${
                isAnswered
                  ? currentQ.correctAnswer === "ADD"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300"
                    : selectedAnswer === "ADD"
                    ? "bg-rose-50 border-rose-300 text-rose-800"
                    : "opacity-40 border-slate-200 text-slate-400"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              ADD (Advances logic)
            </button>
          </div>
        </div>

        {/* Feedback explanation banner */}
        {isAnswered && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs animate-fade-in space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              {selectedAnswer === currentQ.correctAnswer ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Correct!</span>
                </>
              ) : (
                <span className="text-rose-700">Not quite.</span>
              )}
            </div>
            <p className="text-slate-700 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>

          {isAnswered && (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all text-sm flex items-center gap-1.5"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
