"use client";

import { useState } from "react";
import { OneStepOnlyPrompt, OneStepOnlyOption } from "@/types";
import { logAttempt } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Footprints,
  HelpCircle,
} from "lucide-react";

interface OneStepOnlyProps {
  prompt: OneStepOnlyPrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function OneStepOnly({ prompt, onComplete, onBack }: OneStepOnlyProps) {
  const [selectedOption, setSelectedOption] = useState<OneStepOnlyOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (opt: OneStepOnlyOption) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const score = opt.isCorrect ? 100 : 30;
    const xp = opt.isCorrect ? 25 : 10;

    if (opt.isCorrect) {
      playSuccessChime();
      fireConfetti();
    }

    logAttempt({
      exerciseType: "one_step_only",
      domain: prompt.domain,
      questionId: prompt.id,
      input: { statement: prompt.statement, chosen: opt.text },
      score,
      xpEarned: xp,
      durationSeconds: 20,
      feedback: opt.reason,
      details: {
        isCorrect: opt.isCorrect,
        chosenText: opt.text,
      },
      assessmentPrompt: "Grade 5 Scholarship Causal Proximity Drill: Evaluates immediate next step vs vague/inflated leaps.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Footprints className="w-3.5 h-3.5" /> High-Impact Fast Drill • One Step Only
          </span>
          <h3 className="text-xs font-medium text-slate-500 mt-1.5">
            Causal Proximity: What is the <em>most immediate</em> next consequence?
          </h3>
        </div>
      </div>

      {/* Starting statement */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Cause Statement:
        </span>
        <p className="text-base font-semibold text-slate-900">
          &ldquo;{prompt.statement}&rdquo;
        </p>
      </div>

      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          Select the most immediate direct result:
        </span>

        {/* Options */}
        <div className="space-y-2.5">
          {prompt.options.map((opt, idx) => {
            let btnStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-800";
            if (isAnswered) {
              if (opt.isCorrect) {
                btnStyle = "border-emerald-500 bg-emerald-50/90 text-emerald-950 font-semibold ring-2 ring-emerald-400/30";
              } else if (selectedOption === opt) {
                btnStyle = "border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-300";
              } else {
                btnStyle = "border-slate-200 bg-slate-50/50 text-slate-400 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(opt)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col gap-1 ${btnStyle}`}
              >
                <div className="flex items-start justify-between gap-2 text-sm leading-relaxed">
                  <span>{opt.text}</span>
                  {isAnswered && (
                    <span className="shrink-0 text-xs font-bold">
                      {opt.isCorrect ? "✓ Correct" : "✗"}
                    </span>
                  )}
                </div>

                {isAnswered && (
                  <div
                    className={`text-xs mt-1 pt-1.5 border-t ${
                      opt.isCorrect
                        ? "border-emerald-200 text-emerald-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <strong>Why:</strong> {opt.reason}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-3">
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
              onClick={() => onComplete(selectedOption?.isCorrect ? 25 : 10)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all text-sm flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
