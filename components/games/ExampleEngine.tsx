"use client";

import { useState } from "react";
import { ExampleEnginePrompt, ExampleEngineEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, HelpCircle, Target } from "lucide-react";

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
      alert("Please write an illustrative example first!");
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

      const scorePct = Math.round((data.score / 5) * 100);

      if (data.score >= 4) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "example_engine",
        topic: prompt.topic,
        domain: prompt.domain,
        questionId: prompt.id,
        input: { studentExample },
        score: scorePct,
        xpEarned: data.xpAwarded || (data.score >= 4 ? 35 : data.score >= 3 ? 20 : 10),
        durationSeconds: 40,
        feedback: data.feedback,
        details: {
          score: data.score,
          scorePct,
          failureMode: data.failureMode,
          isRealistic: data.isRealistic,
          isConcise: data.isConcise,
          hasObservableAction: data.hasObservableAction,
        },
        assessmentPrompt: (data as any).assessmentPrompt,
      });
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Attempt recorded.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFailureLabel = (mode?: string) => {
    switch (mode) {
      case "GOOD":
        return { label: "Observable Demonstrative Scenario", color: "text-emerald-700 bg-emerald-100 border-emerald-300" };
      case "REASON_RESTATED":
        return { label: "Reason Disguised as Example", color: "text-rose-700 bg-rose-100 border-rose-300" };
      case "OVERDRAMATIC":
        return { label: "Overdramatic / Exaggerated", color: "text-purple-700 bg-purple-100 border-purple-300" };
      case "TOO_GENERAL":
        return { label: "Too General (Needs Observable Scenario)", color: "text-amber-700 bg-amber-100 border-amber-300" };
      case "UNREALISTIC":
        return { label: "Unrealistic Scenario", color: "text-amber-700 bg-amber-100 border-amber-300" };
      case "OVERCOMPLICATED":
        return { label: "Overcomplicated / Rambling", color: "text-amber-700 bg-amber-100 border-amber-300" };
      default:
        return { label: "Evidence Diagnostic", color: "text-slate-700 bg-slate-100 border-slate-300" };
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Target className="w-3.5 h-3.5" /> Example Engine • Concrete Evidence Drill
          </span>
          <h3 className="text-xs font-medium text-slate-500 mt-1.5">
            <strong>Topic:</strong> &ldquo;{prompt.topic}&rdquo;
          </h3>
        </div>

        <button
          onClick={() => setShowTip(!showTip)}
          className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showTip ? "Hide Tip" : "Examiner Tip"}</span>
        </button>
      </div>

      {showTip && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1.5 animate-fade-in">
          <div className="font-semibold text-rose-700">❌ Avoid empty restatements:</div>
          <div>&ldquo;{prompt.weakExample}&rdquo;</div>
          <div className="font-semibold text-emerald-700 pt-1">💡 What examiners look for:</div>
          <div>{prompt.strongExampleTip}</div>
          <div className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60 mt-1">
            <strong>Key rule:</strong> You do <em>not</em> need to invent a name (like &ldquo;Jack&rdquo;). Instead, describe a specific, observable event that clearly proves the argument.
          </div>
        </div>
      )}

      {/* Target argument */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Argument to Prove:
        </span>
        <p className="text-sm md:text-base font-semibold text-slate-900">
          &ldquo;{prompt.argument}&rdquo;
        </p>
      </div>

      {!result ? (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Describe ONE observable scenario that demonstrates this argument:
              </label>
            </div>
            <textarea
              rows={3}
              value={studentExample}
              onChange={(e) => setStudentExample(e.target.value)}
              placeholder="e.g. A student whose family cannot afford a laptop uses a library computer and internet connection to research and submit an online assignment..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm leading-relaxed"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !studentExample.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              {isSubmitting ? "Testing Scenario..." : "Submit Example"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result */
        <div className="space-y-6 animate-fade-in">
          <div
            className={`p-5 rounded-2xl border ${
              result.score >= 4
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : result.score >= 3
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-rose-50 border-rose-200 text-rose-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.score >= 4 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  Score: {result.score}/5 ({Math.round((result.score / 5) * 100)}%)
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            {/* Diagnostic Badge */}
            <div className="mb-3">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                  getFailureLabel(result.failureMode).color
                }`}
              >
                {getFailureLabel(result.failureMode).label}
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed">{result.feedback}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Your Submitted Scenario:
            </span>
            <p className="text-slate-800 italic">&ldquo;{studentExample}&rdquo;</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onComplete(result.xpAwarded)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
