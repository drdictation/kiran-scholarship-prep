"use client";

import { useState } from "react";
import { CausalChainPrompt, CausalChainEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";

interface CausalChainProps {
  prompt: CausalChainPrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function CausalChain({ prompt, onComplete, onBack }: CausalChainProps) {
  const [immediateEffect, setImmediateEffect] = useState("");
  const [furtherConsequence, setFurtherConsequence] = useState("");
  const [significance, setSignificance] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CausalChainEvaluation | null>(null);

  const isFormComplete =
    immediateEffect.trim().length > 5 &&
    furtherConsequence.trim().length > 5 &&
    significance.trim().length > 5;

  const handleSubmit = async () => {
    if (!isFormComplete) {
      alert("Please fill in all three steps of your causal chain!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "causal_chain",
          payload: {
            topic: prompt.topic,
            point: prompt.point,
            immediateEffect,
            furtherConsequence,
            significance,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: CausalChainEvaluation = await res.json();
      setResult(data);

      const scorePct =
        data.scorePercentage !== undefined
          ? data.scorePercentage
          : Math.round((data.score / 5) * 100);

      if (data.score >= 4) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "causal_chain",
        topic: prompt.topic,
        domain: prompt.domain,
        questionId: prompt.id,
        input: { immediateEffect, furtherConsequence, significance },
        score: scorePct,
        xpEarned: data.xpAwarded || (data.score >= 4 ? 40 : data.score >= 3 ? 25 : 15),
        durationSeconds: 60,
        feedback: data.feedback,
        assessmentPrompt: (data as any).assessmentPrompt,
        details: {
          score: data.score,
          scorePercentage: scorePct,
          advancement: data.advancement,
          causalConnection: data.causalConnection,
          specificity: data.specificity,
          proportionality: data.proportionality,
          noCircularity: data.noCircularity,
          severityInflationDetected: data.severityInflationDetected,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Your attempt has been logged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <TrendingUp className="w-3.5 h-3.5" /> Causal Chain Drill
          </span>
          <h3 className="text-xs font-medium text-slate-500 mt-1.5">
            <strong>Topic:</strong> &ldquo;{prompt.topic}&rdquo;
          </h3>
        </div>

        {prompt.sampleImmediate && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? "Hide Model" : "See Model Chain"}</span>
          </button>
        )}
      </div>

      {showHint && prompt.sampleImmediate && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1.5 animate-fade-in">
          <strong>Examiner Model Chain:</strong>
          <div>
            1. <strong>Immediate Effect:</strong> &ldquo;{prompt.sampleImmediate}&rdquo;
          </div>
          <div>
            2. <strong>Further Consequence:</strong> &ldquo;{prompt.sampleConsequence}&rdquo;
          </div>
          <div>
            3. <strong>Significance:</strong> &ldquo;{prompt.sampleSignificance}&rdquo;
          </div>
          <div className="text-[11px] text-amber-800 pt-1.5 border-t border-amber-200/60 mt-1">
            ⚖️ <strong>Rule:</strong> Do NOT jump to vague emotional claims like &ldquo;they become
            happier&rdquo; or &ldquo;they become successful&rdquo;. Explain the concrete mechanism.
          </div>
        </div>
      )}

      {/* Starting point card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Starting Point:
        </span>
        <p className="text-sm md:text-base font-semibold text-slate-900">
          &ldquo;{prompt.point}&rdquo;
        </p>
      </div>

      {!result ? (
        <div className="space-y-5">
          {/* Vague words warning */}
          <div className="flex items-start gap-2.5 bg-rose-50/70 border border-rose-200 p-3 rounded-xl text-xs text-rose-950">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Avoid Vague Words:</strong> Penalized if you end with words like{" "}
              <em>happier</em>, <em>successful</em>, <em>wellbeing</em>, <em>better</em>, or{" "}
              <em>affected</em>. Name the specific real-world consequence.
            </div>
          </div>

          {/* Step 1 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[11px] flex items-center justify-center font-bold">
                1
              </span>
              Immediate Effect (What literally happens next?)
            </label>
            <input
              type="text"
              value={immediateEffect}
              onChange={(e) => setImmediateEffect(e.target.value)}
              placeholder="e.g. Students realise that small debts grow much larger over time..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              autoFocus
            />
          </div>

          {/* Step 2 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              Further Consequence (What happens because of that?)
            </label>
            <input
              type="text"
              value={furtherConsequence}
              onChange={(e) => setFurtherConsequence(e.target.value)}
              placeholder="e.g. They borrow more cautiously and avoid taking on unnecessary loans..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            />
          </div>

          {/* Step 3 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[11px] flex items-center justify-center font-bold">
                3
              </span>
              Significance (Why does this matter? Do NOT restate the starting point)
            </label>
            <input
              type="text"
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              placeholder="e.g. This gives them long-term financial security and independence as adults..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
            />
          </div>

          {/* Controls */}
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
              disabled={isSubmitting || !isFormComplete}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              {isSubmitting ? "Testing Causal Chain..." : "Evaluate Chain"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result view */
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
                  Score: {result.score}/5 ({result.scorePercentage || Math.round((result.score / 5) * 100)}%)
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            {/* Diagnostic Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
              <div
                className={`p-2 rounded-lg border font-medium ${
                  result.advancement
                    ? "bg-emerald-100/70 border-emerald-300 text-emerald-800"
                    : "bg-rose-100/70 border-rose-300 text-rose-800"
                }`}
              >
                {result.advancement ? "✓ Genuine Advancement" : "✗ Circular / Repetitive"}
              </div>
              <div
                className={`p-2 rounded-lg border font-medium ${
                  result.causalConnection
                    ? "bg-emerald-100/70 border-emerald-300 text-emerald-800"
                    : "bg-amber-100/70 border-amber-300 text-amber-800"
                }`}
              >
                {result.causalConnection ? "✓ Logical Link" : "✗ Weak Causal Step"}
              </div>
              <div
                className={`p-2 rounded-lg border font-medium ${
                  result.specificity
                    ? "bg-emerald-100/70 border-emerald-300 text-emerald-800"
                    : "bg-rose-100/70 border-rose-300 text-rose-800"
                }`}
              >
                {result.specificity ? "✓ Specific Effect" : "✗ Vague ('happier' etc)"}
              </div>
              <div
                className={`p-2 rounded-lg border font-medium ${
                  result.proportionality
                    ? "bg-emerald-100/70 border-emerald-300 text-emerald-800"
                    : "bg-purple-100/70 border-purple-300 text-purple-800"
                }`}
              >
                {result.proportionality ? "✓ Proportionate" : "✗ Catastrophized Leap"}
              </div>
            </div>

            <p className="text-sm font-medium leading-relaxed">{result.feedback}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Your Complete Causal Chain:
            </span>
            <div className="text-slate-600">
              <strong>Point:</strong> {prompt.point}
            </div>
            <div className="text-slate-800">
              <strong>1. Immediate Effect:</strong> {immediateEffect}
            </div>
            <div className="text-slate-800">
              <strong>2. Further Consequence:</strong> {furtherConsequence}
            </div>
            <div className="text-slate-900 font-semibold">
              <strong>3. Significance:</strong> {significance}
            </div>
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
