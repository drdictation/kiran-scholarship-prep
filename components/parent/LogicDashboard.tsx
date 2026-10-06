"use client";

import { useState, useEffect } from "react";
import { LogicDiagnosticProfile, LogicCategory } from "@/types";
import { getLogicAttempts } from "@/lib/storage";
import { computeLogicProfile } from "@/lib/logic-scoring";
import { LOGIC_CATEGORY_META } from "@/lib/content/seed-logic";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Clock,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
} from "lucide-react";

interface LogicDashboardProps {
  onStartTargetedPractice?: (category: LogicCategory) => void;
}

export function LogicDashboard({ onStartTargetedPractice }: LogicDashboardProps) {
  const [profile, setProfile] = useState<LogicDiagnosticProfile | null>(null);

  useEffect(() => {
    const attempts = getLogicAttempts();
    setProfile(computeLogicProfile(attempts));
  }, []);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempted */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Questions</span>
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{profile.totalAttempted}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 13 diagnostic categories</p>
        </div>

        {/* Overall Accuracy */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Accuracy</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{profile.overallAccuracy}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {profile.overallAccuracy >= 80
              ? "Excellently calibrated"
              : profile.overallAccuracy >= 65
              ? "Solid reasoning baseline"
              : "Building logical foundations"}
          </p>
        </div>

        {/* Calibration Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Self-Calibration</span>
            <Compass className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{profile.calibrationScore}%</div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={profile.calibrationNotes}>
            {profile.calibrationNotes}
          </p>
        </div>

        {/* Misconception Risks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Misconception Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {profile.misconceptionRiskCategories.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Wrong + rated Easy (overconfidence)</p>
        </div>
      </div>

      {/* Misconception Alert Banner (if any) */}
      {profile.misconceptionRiskCategories.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-950 text-sm">
              High Diagnostic Weight: Important Misconception Risk Detected
            </h4>
            <p className="text-amber-800 mt-1">
              Questions answered incorrectly but self-rated as &ldquo;Easy&rdquo; indicate an overconfidence bias or an assumed converse rule. Targeted practice is recommended for:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.misconceptionRiskCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onStartTargetedPractice?.(cat)}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-950 font-bold hover:bg-amber-300 transition-colors flex items-center gap-1"
                >
                  <span>{LOGIC_CATEGORY_META[cat]?.name || cat}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Reasoning Domain Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagnostic breakdown across all 13 core scholarship reasoning types
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Domain / Skill</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Attempts</th>
                <th className="py-3 px-3 text-center">Accuracy</th>
                <th className="py-3 px-3 text-center">Median Speed</th>
                <th className="py-3 px-3 text-center">Difficulty Perception</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(profile.categories).map(([catKey, stat]) => {
                const meta = LOGIC_CATEGORY_META[catKey as LogicCategory];
                const cat = catKey as LogicCategory;

                let badgeClass = "bg-slate-100 text-slate-700";
                if (stat.label === "Likely strength") {
                  badgeClass = "bg-emerald-100 text-emerald-800 font-bold";
                } else if (stat.label === "Developing") {
                  badgeClass = "bg-sky-100 text-sky-800 font-bold";
                } else if (stat.label === "Likely weakness") {
                  badgeClass = "bg-rose-100 text-rose-800 font-bold";
                } else if (stat.label === "Misconception risk") {
                  badgeClass = "bg-amber-100 text-amber-900 font-extrabold ring-1 ring-amber-300";
                }

                return (
                  <tr key={catKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{meta?.name || catKey}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {meta?.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${badgeClass}`}>
                        {stat.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {stat.totalAttempts}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold">
                        <span
                          className={
                            stat.accuracy >= 75
                              ? "text-emerald-700"
                              : stat.accuracy >= 60
                              ? "text-slate-800"
                              : "text-rose-600"
                          }
                        >
                          {stat.accuracy}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600 font-medium">
                      {stat.medianResponseTime}s
                    </td>
                    <td className="py-3.5 px-3 text-center text-[11px] text-slate-600">
                      {stat.easyCount} Easy • {stat.mediumCount} Med • {stat.hardCount} Hard
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onStartTargetedPractice?.(cat)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Practice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
