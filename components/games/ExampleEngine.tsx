"use client";

import { useState } from "react";
import { ExampleEnginePrompt, ExampleEngineEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface ExampleEngineProps {
  prompt: ExampleEnginePrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function ExampleEngine({ prompt, onComplete, onBack }: ExampleEngineProps) {
  const [studentExample, setStudentExample] = useState("");
  const [showTip, setShowTip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExampleEngineEvaluation | null>(null);

  const handleSubmit = async () => {
    if (!studentExample.trim()) {
      alert("Please write a specific example first!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "example_engine",
          payload: {
            topic: prompt.topic,
            argument: prompt.argument,
            studentExample,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: ExampleEngineEvaluation = await res.json();
      setResult(data);

      if (data.isConcrete) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "example_engine",
        topic: prompt.topic,
        domain: prompt.domain,
        input: { studentExample },
        score: (data.score / 5) * 100,
        xpEarned: data.xpAwarded || 30,
        durationSeconds: 30,
        feedback: data.feedback,
        assessmentPrompt: (data as any).assessmentPrompt,
      });
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Attempt recorded.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Example Engine • Concrete Evidence Drill
          </span>
          <h3 className="text-sm font-medium text-slate-500 mt-1">Topic: {prompt.topic}</h3>
        </div>

        <button
          onClick={() => setShowTip(!showTip)}
          className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showTip ? "Hide Tip" : "Pro Tip"}</span>
        </button>
      </div>

      {showTip && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5 animate-fade-in">
          <div className="font-semibold text-rose-700">❌ Avoid circular examples:</div>
          <div>&ldquo;{prompt.weakExample}&rdquo;</div>
          <div className="font-semibold text-emerald-700 pt-1">💡 What examiners look for:</div>
          <div>{prompt.strongExampleTip}</div>
        </div>
      )}

      {/* Target argument */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Argument to Prove:
        </span>
        <p className="text-base font-semibold text-slate-800">&ldquo;{prompt.argument}&rdquo;</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Provide ONE specific, real-world example to illustrate this:
            </label>
            <textarea
              rows={3}
              value={studentExample}
              onChange={(e) => setStudentExample(e.target.value)}
              placeholder="For example, when a family replaces the battery in a 3-year-old smartphone rather than throwing the phone away..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm leading-relaxed"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !studentExample.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? "Testing Specificity..." : "Submit Example"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result */
        <div className="space-y-6 animate-fade-in">
          <div
            className={`p-5 rounded-2xl border ${
              result.isConcrete
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.isConcrete ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  {result.isConcrete ? "Concrete & Specific Example!" : "Needs More Concrete Detail"}
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed">{result.feedback}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onComplete(result.xpAwarded)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
