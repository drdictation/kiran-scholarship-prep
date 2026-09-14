"use client";

import { useState, useEffect } from "react";
import { Topic, ThreeParagraphPlanEvaluation } from "@/types";
import { THINKING_LENSES } from "@/lib/content/seed-topics";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Timer, Sparkles, ArrowRight, ShieldCheck, Trophy, Layers } from "lucide-react";

interface ThreeParagraphPlanProps {
  topic: Topic;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function ThreeParagraphPlan({ topic, onComplete, onBack }: ThreeParagraphPlanProps) {
  const [position, setPosition] = useState<"AGREE" | "DISAGREE">("AGREE");
  const [arg1, setArg1] = useState("");
  const [arg2, setArg2] = useState("");
  const [arg3, setArg3] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ThreeParagraphPlanEvaluation | null>(null);

  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [result]);

  const handleSubmit = async () => {
    if (!arg1.trim() || !arg2.trim() || !arg3.trim()) {
      alert("Please outline all three body paragraph arguments!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "three_paragraph_plan",
          payload: {
            topic: topic.text,
            position,
            arg1,
            arg2,
            arg3,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: ThreeParagraphPlanEvaluation = await res.json();
      setResult(data);

      if (data.score >= 75) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "three_paragraph_plan",
        topic: topic.text,
        domain: topic.domain,
        input: { position, arg1, arg2, arg3 },
        score: data.score,
        xpEarned: data.xpAwarded || 60,
        durationSeconds: elapsed,
        feedback: data.feedback,
      });
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Attempt recorded.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" /> Mini-Boss Battle • 3-Paragraph Plan
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-2">
            &ldquo;{topic.text}&rdquo;
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl font-mono text-sm font-semibold text-slate-700">
          <Timer className="w-4 h-4 text-indigo-500" />
          <span>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Position Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Your Position:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPosition("AGREE")}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm border transition-all ${
                  position === "AGREE"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                👍 AGREE / FOR
              </button>
              <button
                type="button"
                onClick={() => setPosition("DISAGREE")}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm border transition-all ${
                  position === "DISAGREE"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                👎 DISAGREE / AGAINST
              </button>
            </div>
          </div>

          {/* 3 Body Paragraphs */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                Paragraph 1: Core Argument & Evidence
              </span>
              <input
                type="text"
                value={arg1}
                onChange={(e) => setArg1(e.target.value)}
                placeholder="Reason 1 + quick concrete example or consequence..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 bg-white"
                autoFocus
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                Paragraph 2: Second Distinct Argument
              </span>
              <input
                type="text"
                value={arg2}
                onChange={(e) => setArg2(e.target.value)}
                placeholder="Reason 2 (A new thinking lens, e.g. Community or Money)..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 bg-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                Paragraph 3: Strongest Climax / Long-Term Impact
              </span>
              <input
                type="text"
                value={arg3}
                onChange={(e) => setArg3(e.target.value)}
                placeholder="Reason 3 (Long-term impact or broader moral principle)..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              disabled={isSubmitting || !arg1 || !arg2 || !arg3}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? "Scoring Plan..." : "Submit Plan"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-lg">Plan Score: {result.score}/100</span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed mb-2">{result.feedback}</p>
            <div className="text-xs text-indigo-700 font-semibold">
              Planning Quality: {result.argumentsQuality}
            </div>
          </div>

          {/* Visual 3-Paragraph Architecture */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Exam Blueprint:
            </span>
            <div className="text-xs bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-indigo-600">¶ 1:</span> {arg1}
            </div>
            <div className="text-xs bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-indigo-600">¶ 2:</span> {arg2}
            </div>
            <div className="text-xs bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-indigo-600">¶ 3:</span> {arg3}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onComplete(result.xpAwarded)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              Finish Boss Battle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
