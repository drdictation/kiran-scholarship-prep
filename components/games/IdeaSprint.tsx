"use client";

import { useState, useEffect } from "react";
import { Topic, IdeaSprintEvaluation } from "@/types";
import { THINKING_LENSES } from "@/lib/content/seed-topics";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Timer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Trophy,
  ShieldAlert,
} from "lucide-react";

interface IdeaSprintProps {
  topic: Topic;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function IdeaSprint({ topic, onComplete, onBack }: IdeaSprintProps) {
  const [arg1, setArg1] = useState("");
  const [arg2, setArg2] = useState("");
  const [arg3, setArg3] = useState("");
  const [selectedLenses, setSelectedLenses] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IdeaSprintEvaluation | null>(null);

  // Timer
  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const toggleLens = (lens: string) => {
    setSelectedLenses((prev) =>
      prev.includes(lens) ? prev.filter((l) => l !== lens) : [...prev, lens]
    );
  };

  const handleSubmit = async () => {
    if (!arg1.trim() || !arg2.trim() || !arg3.trim()) {
      alert("Please write three complete reasons before submitting!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "idea_sprint",
          payload: {
            topic: topic.text,
            args: [arg1, arg2, arg3],
            domain: topic.domain,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: IdeaSprintEvaluation = await res.json();
      setResult(data);

      const totalRaw =
        data.totalRawScore !== undefined
          ? data.totalRawScore
          : data.arguments.reduce((acc, a) => acc + (a.score || 0), 0);
      const scorePct =
        data.scorePercentage !== undefined
          ? data.scorePercentage
          : Math.round((totalRaw / 6) * 100);

      if (scorePct >= 80) {
        playSuccessChime();
        fireConfetti();
      }

      // Log attempt to persistent storage with calibrated score
      logAttempt({
        exerciseType: "idea_sprint",
        topic: topic.text,
        domain: topic.domain,
        questionId: topic.id,
        input: [arg1, arg2, arg3],
        score: scorePct,
        xpEarned: data.xpAwarded || (scorePct >= 80 ? 45 : scorePct >= 50 ? 25 : 10),
        durationSeconds: elapsedSeconds,
        feedback: data.feedback,
        assessmentPrompt: (data as any).assessmentPrompt,
        details: {
          totalRawScore: totalRaw,
          scorePercentage: scorePct,
          distinctCount: data.distinctCount,
          duplicateNotes: data.duplicateNotes,
          argScores: data.arguments.map((a) => a.score),
        },
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong evaluating your ideas. Your attempt is still logged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreBadge = (score?: number) => {
    if (score === 2) {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
          2/2 Complete Argument
        </span>
      );
    }
    if (score === 1) {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
          1/2 Vague Claim
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
        0/2 Label Only / Incomplete
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header & Topic */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Idea Sprint • {topic.domain.replace(/_/g, " ")}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-2">
            &ldquo;{topic.text}&rdquo;
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl font-mono text-sm font-semibold text-slate-700">
          <Timer className="w-4 h-4 text-indigo-500" />
          <span>{secondsLeft}s</span>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Strict Examiner Rule Banner */}
          <div className="flex items-start gap-3 bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Strict Scholarship Examiner Rule:</strong> Category labels like{" "}
              <em>&ldquo;Health&rdquo;</em>, <em>&ldquo;Money&rdquo;</em>, or{" "}
              <em>&ldquo;Environment&rdquo;</em> score <strong>0 marks</strong>. You must state a{" "}
              <strong>complete claim</strong> explaining the specific mechanism.
            </div>
          </div>

          {/* Thinking Lenses Scaffolds */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Thinking Lenses (Click to brainstorm new angles):
            </span>
            <div className="flex flex-wrap gap-2">
              {THINKING_LENSES.map((lens) => {
                const isSelected = selectedLenses.includes(lens);
                return (
                  <button
                    key={lens}
                    type="button"
                    onClick={() => toggleLens(lens)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lens}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Reason 1 (e.g. Health, Environment, or Practicality)
              </label>
              <input
                type="text"
                value={arg1}
                onChange={(e) => setArg1(e.target.value)}
                placeholder="Write a complete claim, not just a category name..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Reason 2 (A completely DIFFERENT angle)
              </label>
              <input
                type="text"
                value={arg2}
                onChange={(e) => setArg2(e.target.value)}
                placeholder="Second distinct reason..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Reason 3 (Another completely DIFFERENT angle)
              </label>
              <input
                type="text"
                value={arg3}
                onChange={(e) => setArg3(e.target.value)}
                placeholder="Third distinct reason..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
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
              {isSubmitting ? (
                <>Checking Argument Quality...</>
              ) : (
                <>
                  Submit Idea Sprint <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-fade-in">
          {(() => {
            const totalRaw =
              result.totalRawScore !== undefined
                ? result.totalRawScore
                : result.arguments.reduce((acc, a) => acc + (a.score || 0), 0);
            const scorePct =
              result.scorePercentage !== undefined
                ? result.scorePercentage
                : Math.round((totalRaw / 6) * 100);

            return (
              <div
                className={`p-5 rounded-2xl border ${
                  scorePct >= 80
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : scorePct >= 50
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-rose-50 border-rose-200 text-rose-950"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {scorePct >= 80 ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    )}
                    <span className="font-bold text-lg">
                      {totalRaw}/6 Raw Marks ({scorePct}%)
                    </span>
                  </div>
                  <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed mb-4">{result.feedback}</p>

                {/* Individual Argument Scores Breakdown */}
                <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-800">
                  <strong className="block text-slate-600 uppercase tracking-wider text-[10px]">
                    Detailed Argument Breakdown:
                  </strong>
                  {result.arguments.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">
                          {idx + 1}. &ldquo;{item.text}&rdquo;
                        </div>
                        {item.feedback && (
                          <div className="text-[11px] text-slate-500">{item.feedback}</div>
                        )}
                      </div>
                      <div className="shrink-0">{getScoreBadge(item.score)}</div>
                    </div>
                  ))}
                </div>

                {result.duplicateNotes && result.duplicateNotes.length > 0 && (
                  <div className="mt-3 text-xs bg-white/70 p-3 rounded-lg border border-amber-300 text-amber-800 space-y-1">
                    <strong>Examiner Note on Overlap:</strong>
                    {result.duplicateNotes.map((note, idx) => (
                      <div key={idx}>{note}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Speed & Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase block">
                Time Taken
              </span>
              <span className="text-2xl font-bold text-slate-800 font-mono">
                {elapsedSeconds}s
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase block">
                  Distinct Arguments
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  {result.distinctCount}/3
                </span>
              </div>
              {result.distinctCount === 3 && <Trophy className="w-7 h-7 text-amber-500" />}
            </div>
          </div>

          {/* Continue button */}
          <div className="flex justify-end gap-3 pt-2">
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
