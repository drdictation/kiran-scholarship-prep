"use client";

import { useState, useEffect } from "react";
import { Topic, IdeaSprintEvaluation } from "@/types";
import { THINKING_LENSES } from "@/lib/content/seed-topics";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Timer, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Lightbulb, Trophy } from "lucide-react";

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
      alert("Please write three different reasons before submitting!");
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

      if (data.distinctCount === 3) {
        playSuccessChime();
        fireConfetti();
      }

      // Log attempt to persistent storage
      const score = Math.round((data.distinctCount / 3) * 100);
      logAttempt({
        exerciseType: "idea_sprint",
        topic: topic.text,
        domain: topic.domain,
        input: [arg1, arg2, arg3],
        score,
        xpEarned: data.xpAwarded || 40,
        durationSeconds: elapsedSeconds,
        feedback: data.feedback,
        details: { distinctCount: data.distinctCount, duplicateNotes: data.duplicateNotes },
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong evaluating your ideas. Your attempt is still logged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header & Topic */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Idea Sprint • {topic.domain.replace("_", " ")}
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
          {/* Instructions */}
          <div className="flex items-start gap-3 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl text-sm text-amber-900">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Write <strong>three genuinely different reasons</strong> to support this view.
              Avoid repeating the same point using different words!
            </p>
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
                placeholder="First distinct reason..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
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
                <>Checking your reasoning...</>
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
          <div
            className={`p-5 rounded-2xl border ${
              result.distinctCount === 3
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.distinctCount === 3 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  {result.distinctCount}/3 Distinct Arguments
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed mb-3">{result.feedback}</p>

            {result.duplicateNotes && result.duplicateNotes.length > 0 && (
              <div className="mt-2 text-xs bg-white/70 p-3 rounded-lg border border-amber-300/60 text-amber-800 space-y-1">
                <strong>Coach Note:</strong>
                {result.duplicateNotes.map((note, idx) => (
                  <div key={idx}>{note}</div>
                ))}
              </div>
            )}
          </div>

          {/* Speed & Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase block">Time Taken</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">
                {elapsedSeconds}s
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase block">
                  Quality Score
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  {Math.round((result.distinctCount / 3) * 100)}%
                </span>
              </div>
              {result.distinctCount === 3 && (
                <Trophy className="w-7 h-7 text-amber-500" />
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
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
