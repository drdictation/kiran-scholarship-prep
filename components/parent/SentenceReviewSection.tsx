"use client";

import { useState, useMemo } from "react";
import type { AttemptLog } from "@/types";
import { classifyRetrainingAttemptProvenance } from "@/lib/storage";
import {
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
} from "lucide-react";

interface SentenceReviewSectionProps {
  attempts: AttemptLog[];
}

export const SENTENCE_EXERCISE_TYPES = new Set([
  "sentence_retraining",
  "sentence_sprint",
  "sentence_gym",
  "clear_and_complete",
  "fix_weak_link",
  "sentence_forge",
]);

export function formatExerciseLabel(type: string): string {
  switch (type) {
    case "sentence_retraining":
      return "Sentence Retraining";
    case "sentence_sprint":
      return "Sentence Sprint";
    case "sentence_gym":
      return "Sentence Gym";
    case "clear_and_complete":
      return "Clear & Complete";
    case "fix_weak_link":
      return "Fix Weak Link";
    case "sentence_forge":
      return "Sentence Forge";
    default:
      return type.replace(/_/g, " ");
  }
}

export function SentenceReviewSection({ attempts }: SentenceReviewSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>("ALL");
  const [drillTypeFilter, setDrillTypeFilter] = useState<string>("ALL");
  const [passFilter, setPassFilter] = useState<"ALL" | "PASSED" | "FLAGGED">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter only sentence-related exercises
  const sentenceAttempts = useMemo(() => {
    return attempts.filter((a) => SENTENCE_EXERCISE_TYPES.has(a.exerciseType));
  }, [attempts]);

  // Extract distinct dates (YYYY-MM-DD) sorted newest to oldest
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    sentenceAttempts.forEach((a) => {
      const dateStr = new Date(a.timestamp).toISOString().split("T")[0];
      dates.add(dateStr);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [sentenceAttempts]);

  // Filtered sentence attempts
  const filteredAttempts = useMemo(() => {
    return sentenceAttempts.filter((a) => {
      if (selectedDate !== "ALL") {
        const dateStr = new Date(a.timestamp).toISOString().split("T")[0];
        if (dateStr !== selectedDate) return false;
      }
      if (drillTypeFilter !== "ALL") {
        if (a.exerciseType !== drillTypeFilter) return false;
      }
      if (passFilter === "PASSED") {
        const isPass = Boolean(
          a.details?.firstDraftQualityPass ?? a.details?.passed ?? a.score >= 80
        );
        if (!isPass) return false;
      } else if (passFilter === "FLAGGED") {
        const isPass = Boolean(
          a.details?.firstDraftQualityPass ?? a.details?.passed ?? a.score >= 80
        );
        if (isPass) return false;
      }
      return true;
    });
  }, [sentenceAttempts, selectedDate, drillTypeFilter, passFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Sentence Responses Review
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              ({sentenceAttempts.length} total recorded)
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-2">
            Exact Sentence Responses &amp; Date Review
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect Kiran&apos;s exact sentence submissions across training dates, with full first-draft immutability stats, Stage D corrections, and coach diagnostics.
          </p>
        </div>

        {/* Quick Date Switcher */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="Filter by practice date"
          >
            <option value="ALL">All Dates ({availableDates.length} days active)</option>
            {availableDates.map((d) => {
              const count = sentenceAttempts.filter(
                (a) => new Date(a.timestamp).toISOString().split("T")[0] === d
              ).length;
              const dateLabel = new Date(d + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <option key={d} value={d}>
                  {dateLabel} ({count} {count === 1 ? "sentence" : "sentences"})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Drill Type Filter */}
          <select
            value={drillTypeFilter}
            onChange={(e) => setDrillTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
            aria-label="Filter by drill type"
          >
            <option value="ALL">All Sentence Drills</option>
            <option value="sentence_retraining">Sentence Retraining</option>
            <option value="sentence_sprint">Sentence Sprint</option>
            <option value="sentence_gym">Sentence Gym</option>
            <option value="clear_and_complete">Clear &amp; Complete</option>
            <option value="fix_weak_link">Fix Weak Link</option>
            <option value="sentence_forge">Sentence Forge</option>
          </select>

          {/* Result Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPassFilter("ALL")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                passFilter === "ALL"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({filteredAttempts.length})
            </button>
            <button
              type="button"
              onClick={() => setPassFilter("PASSED")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                passFilter === "PASSED"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Passed
            </button>
            <button
              type="button"
              onClick={() => setPassFilter("FLAGGED")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                passFilter === "FLAGGED"
                  ? "bg-amber-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Needs Work
            </button>
          </div>
        </div>

        {(selectedDate !== "ALL" || drillTypeFilter !== "ALL" || passFilter !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate("ALL");
              setDrillTypeFilter("ALL");
              setPassFilter("ALL");
            }}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        )}
      </div>

      {/* Response List */}
      {filteredAttempts.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
          <p className="font-semibold text-slate-600">No sentence responses match this filter.</p>
          <p className="text-xs text-slate-400">
            {sentenceAttempts.length === 0
              ? "When Kiran completes a sentence drill, his full exact submissions will appear here."
              : "Try switching dates or clearing drill filters above."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAttempts.map((att, idx) => {
            const dateObj = new Date(att.timestamp);
            const dateFormatted = dateObj.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeFormatted = dateObj.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const isPassed = Boolean(
              att.details?.firstDraftQualityPass ?? att.details?.passed ?? att.score >= 80
            );
            const isRetraining = att.exerciseType === "sentence_retraining";
            const attemptStage = att.details?.attemptStage as string | undefined;
            const qualityBand = att.details?.qualityBand as string | undefined;
            const isExpanded = expandedId === att.id;

            return (
              <div
                key={att.id || `att-${idx}`}
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  isPassed
                    ? "bg-white border-slate-200 hover:border-slate-300"
                    : "bg-amber-50/40 border-amber-200/80 hover:border-amber-300"
                }`}
              >
                {/* Header row: drill type, tags, date, score */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                      {formatExerciseLabel(att.exerciseType)}
                    </span>

                    {/* Stage Badge for Sentence Retraining */}
                    {isRetraining && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          attemptStage === "first_draft"
                            ? "bg-indigo-100 text-indigo-800"
                            : attemptStage === "correction"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {attemptStage === "first_draft"
                          ? "Stage C: First Draft"
                          : attemptStage === "correction"
                          ? "Stage D: Correction"
                          : `Attempt #${att.details?.attemptNumber || 1}`}
                      </span>
                    )}

                    {/* Quality Band Badge */}
                    {qualityBand && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          qualityBand === "fluent_first_draft"
                            ? "bg-emerald-100 text-emerald-800"
                            : qualityBand === "high_quality"
                            ? "bg-indigo-100 text-indigo-800"
                            : qualityBand === "developing"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {qualityBand === "fluent_first_draft"
                          ? "Fluent First Draft"
                          : qualityBand === "high_quality"
                          ? "High Quality"
                          : qualityBand === "developing"
                          ? "Developing"
                          : "Not Mastered"}
                      </span>
                    )}

                    {att.domain && (
                      <span className="text-[10px] font-semibold text-slate-500 capitalize bg-white px-2 py-0.5 rounded border border-slate-200">
                        {att.domain.replace(/_/g, " ")}
                      </span>
                    )}

                    {isRetraining && (
                      <span className="text-[10px] font-medium text-slate-500">
                        {classifyRetrainingAttemptProvenance(att) === "verified_ai"
                          ? "✓ Verified AI"
                          : "Historical"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateFormatted} at {timeFormatted}
                    </span>

                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                        isPassed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      {att.score}%
                    </span>
                  </div>
                </div>

                {/* Question / Task Prompt */}
                {att.topic && (
                  <div className="text-xs text-slate-600 pt-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                      Task Prompt / Proposition:
                    </span>
                    <span className="font-medium text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md block border border-slate-200/60">
                      &ldquo;{att.topic}&rdquo;
                    </span>
                  </div>
                )}

                {/* EXACT STUDENT SUBMISSION (PRIMARY EMPHASIS) */}
                <div className="space-y-1 pt-1">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Kiran&apos;s Exact Submitted Response:
                  </span>
                  <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-slate-900 font-semibold text-sm leading-relaxed">
                    {typeof att.input === "string" ? (
                      `“${att.input}”`
                    ) : Array.isArray(att.input) ? (
                      <ol className="list-decimal list-inside space-y-1">
                        {att.input.map((it, i) => (
                          <li key={i}>{String(it)}</li>
                        ))}
                      </ol>
                    ) : (
                      <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(att.input, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Coach Feedback & Problematic Phrase */}
                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-indigo-600">Coach Feedback:</strong>
                    {att.details?.defect && (
                      <span className="text-[10px] font-bold uppercase text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {String(att.details.defect).replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{att.feedback}</p>

                  {att.details?.problematicPhrase && (
                    <p className="text-[11px] text-rose-800 pt-0.5 font-medium">
                      Flagged phrase: <u>&ldquo;{att.details.problematicPhrase}&rdquo;</u>
                    </p>
                  )}
                </div>

                {/* Expandable Details: Timing & Scoring Breakdown */}
                {att.details && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(att.id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Hide Mechanics &amp; Scoring Breakdown
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> View Mechanics &amp; Scoring Breakdown
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        {/* Timing mechanics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Prep Time:</span>
                            <strong className="text-slate-800">
                              {att.details.prepDurationSeconds !== undefined
                                ? `${att.details.prepDurationSeconds}s`
                                : "N/A"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Writing Duration:</span>
                            <strong className="text-slate-800">
                              {att.durationSeconds || att.details.writingDurationSeconds || 0}s
                              {att.details.isOverrun ? " (Overrun)" : ""}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Typing Speed:</span>
                            <strong className="text-slate-800">
                              {att.details.typingWpm ? `${att.details.typingWpm} WPM` : "N/A"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Mode:</span>
                            <strong className="text-slate-800">
                              {att.details.editingMode === "standard_accessible"
                                ? "Accessible"
                                : "Think First"}
                            </strong>
                          </div>
                        </div>

                        {/* Scores dimension breakdown */}
                        {att.details.scores && (
                          <div className="pt-1 border-t border-slate-200/70">
                            <span className="font-bold text-[10px] uppercase text-slate-500 block mb-1">
                              Dimension Scores:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] font-bold">
                              <span className="p-1 rounded bg-white border border-slate-200 text-center">
                                Grammar: {att.details.scores.grammaticalCorrectness ?? att.details.scores.naturalness}/2
                              </span>
                              <span className="p-1 rounded bg-white border border-slate-200 text-center">
                                Natural: {att.details.scores.naturalness}/2
                              </span>
                              <span className="p-1 rounded bg-white border border-slate-200 text-center">
                                Clarity: {att.details.scores.clarity}/2
                              </span>
                              <span className="p-1 rounded bg-white border border-slate-200 text-center">
                                Precision: {att.details.scores.precision}/2
                              </span>
                              <span className="p-1 rounded bg-white border border-slate-200 text-center">
                                Causal: {att.details.scores.causalCompleteness}/2
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
