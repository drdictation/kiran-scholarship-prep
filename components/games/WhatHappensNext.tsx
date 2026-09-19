"use client";

import { useState } from "react";
import { WhatHappensNextPrompt, WhatHappensNextEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface WhatHappensNextProps {
  prompt: WhatHappensNextPrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function WhatHappensNext({ prompt, onComplete, onBack }: WhatHappensNextProps) {
  const [consequence, setConsequence] = useState("");
  const [significance, setSignificance] = useState("");
  const [stage, setStage] = useState<1 | 2>(1);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WhatHappensNextEvaluation | null>(null);

  const handleNextStage = () => {
    if (!consequence.trim()) {
      alert("Please write what happens as a result first!");
      return;
    }
    setStage(2);
  };

  const handleSubmit = async () => {
    if (!significance.trim()) {
      alert("Please explain why this consequence matters!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "what_happens_next",
          payload: {
            topic: prompt.topic,
            point: prompt.point,
            studentConsequence: consequence,
            studentSignificance: significance,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: WhatHappensNextEvaluation = await res.json();
      setResult(data);

      if (data.advancesReasoning && !data.repeatsPreviousIdea) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "what_happens_next",
        topic: prompt.topic,
        domain: prompt.domain,
        input: { consequence, significance },
        score: (data.score / 5) * 100,
        xpEarned: data.xpAwarded || 35,
        durationSeconds: 45,
        feedback: data.feedback,
        assessmentPrompt: (data as any).assessmentPrompt,
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
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            What Happens Next? • Consequence Chain
          </span>
          <h3 className="text-sm font-medium text-slate-500 mt-1">Topic: {prompt.topic}</h3>
        </div>

        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHint ? "Hide Model" : "See Example"}</span>
        </button>
      </div>

      {showHint && prompt.sampleNext && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1 animate-fade-in">
          <strong>Model Consequence Chain:</strong>
          <div>Next: &ldquo;{prompt.sampleNext}&rdquo;</div>
          <div>Why it matters: &ldquo;{prompt.sampleMatter}&rdquo;</div>
        </div>
      )}

      {/* Starting point card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Starting Point (Cause):
        </span>
        <p className="text-base font-semibold text-slate-800">&ldquo;{prompt.point}&rdquo;</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Stage 1: Consequence */}
          <div>
            <label className="block text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">
                1
              </span>
              Step 1: What happens because of this? (Direct Effect)
            </label>
            <input
              type="text"
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
              placeholder="e.g. Streets stay much cooler on scorching hot afternoons..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
              autoFocus
            />
          </div>

          {/* Stage 2: Significance */}
          {stage === 2 && (
            <div className="animate-fade-in">
              <label className="block text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">
                  2
                </span>
                Step 2: Why does THAT matter? (Significance / Impact)
              </label>
              <input
                type="text"
                value={significance}
                onChange={(e) => setSignificance(e.target.value)}
                placeholder="e.g. Elderly residents and families can walk outside safely without heat exhaustion..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
                autoFocus
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Back
            </button>

            {stage === 1 ? (
              <button
                type="button"
                onClick={handleNextStage}
                disabled={!consequence.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all"
              >
                Next Step: Why it Matters <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !significance.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all"
              >
                {isSubmitting ? "Checking Logic..." : "Evaluate Chain"} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Result view */
        <div className="space-y-6 animate-fade-in">
          <div
            className={`p-5 rounded-2xl border ${
              result.advancesReasoning && !result.repeatsPreviousIdea
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.advancesReasoning ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  {result.advancesReasoning ? "Strong Causal Chain!" : "Reasoning Echo Detected"}
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed">{result.feedback}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Your Complete Argument Chain:
            </span>
            <div className="text-xs text-slate-600">
              <strong>Point:</strong> {prompt.point}
            </div>
            <div className="text-xs text-slate-700">
              <strong>Consequence:</strong> {consequence}
            </div>
            <div className="text-xs text-slate-900 font-medium">
              <strong>Significance:</strong> {significance}
            </div>
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
