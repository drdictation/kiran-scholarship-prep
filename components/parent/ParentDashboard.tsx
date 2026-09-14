"use client";

import { useState, useEffect } from "react";
import { StudentProfile, AttemptLog, SkillId, TopicDomain } from "@/types";
import { getProfile, getAttempts, saveProfile } from "@/lib/storage";
import {
  BarChart3,
  Brain,
  Layers,
  Clock,
  Calendar,
  Sparkles,
  Cpu,
  CheckCircle2,
} from "lucide-react";

export function ParentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("google/gemini-2.5-flash");
  const [customModelInput, setCustomModelInput] = useState<string>("");
  const [modelSaveMsg, setModelSaveMsg] = useState(false);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setAttempts(getAttempts());
    if (p.selectedModel) {
      setSelectedModel(p.selectedModel);
    }
  }, []);

  const handleModelChange = (model: string) => {
    if (!profile) return;
    const updated = { ...profile, selectedModel: model };
    saveProfile(updated);
    setProfile(updated);
    setSelectedModel(model);
    setModelSaveMsg(true);
    setTimeout(() => setModelSaveMsg(false), 3000);
  };

  if (!profile) return null;

  const totalSeconds = attempts.reduce((acc, a) => acc + (a.durationSeconds || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const skillsList: { id: SkillId; label: string; description: string }[] = [
    {
      id: "argument_distinction",
      label: "Argument Distinction",
      description: "Generates genuinely different arguments rather than synonyms",
    },
    {
      id: "repeat_vs_add",
      label: "Avoids Repetition (Repeat vs Add)",
      description: "Detects paraphrasing vs genuine logical progression",
    },
    {
      id: "causal_reasoning",
      label: "Consequence Reasoning",
      description: "Explains 'What happens next' and 'Why does it matter'",
    },
    {
      id: "example_generation",
      label: "Concrete Evidence",
      description: "Provides specific, illustrative real-world examples",
    },
    {
      id: "sentence_combining",
      label: "Sentence Combining & Variety",
      description: "Synthesizes ideas cleanly with logical conjunctions",
    },
    {
      id: "planning_speed",
      label: "Planning Fluency & Speed",
      description: "Rapidly blueprints three-paragraph persuasive essays",
    },
  ];

  // Identify weakest skill to recommend for offline parent coaching (from skills that have attempts, or general)
  let lowestSkill = skillsList[0];
  let lowestScore = 100;
  let hasTrainedSkills = false;

  skillsList.forEach((s) => {
    const score = profile.skillsMastery[s.id] || 0;
    if (score > 0) {
      hasTrainedSkills = true;
      if (score < lowestScore) {
        lowestScore = score;
        lowestSkill = s;
      }
    }
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      {/* Overview header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Parent Insights & Analytics
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Kiran&apos;s Scholarship Writing Trajectory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time deliberate practice data across component persuasive writing skills.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Active Streak: {profile.streakDays} {profile.streakDays === 1 ? "day" : "days"}</span>
          </div>
        </div>

        {/* Top metrics summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
              Total XP
            </span>
            <span className="text-2xl font-black text-indigo-950 mt-1 block">
              {profile.totalXp}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">Level {profile.level}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Practice Time
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalMinutes}m
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Total focus duration</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Drills Done
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {attempts.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Completed exercises</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
              Best Sprint
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {profile.personalBests.fastestIdeaSprintSeconds
                ? `${profile.personalBests.fastestIdeaSprintSeconds}s`
                : "—"}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">3 distinct ideas</span>
          </div>
        </div>
      </div>

      {/* RECOMMENDED PARENT COACHING FOCUS */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <Brain className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          {hasTrainedSkills ? (
            <>
              <h3 className="text-sm font-bold text-amber-950">
                Current Coaching Focus: {lowestSkill.label} ({lowestScore}%)
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                When reviewing writing together, prompt Kiran:{" "}
                <em>
                  &ldquo;What happens because of this? And why does that consequence matter to real
                  people?&rdquo;
                </em>{" "}
                This will prevent repetitive phrasing and deepen his causal reasoning.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-amber-950">
                Ready for Practice!
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Kiran has not completed any drills yet. Once he completes Today&apos;s Quest or an individual exercise, personalized insights on his strengths and areas for improvement will automatically appear here.
              </p>
            </>
          )}
        </div>
      </div>

      {/* AI MODEL CONFIGURATION (OPENROUTER) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" /> OpenRouter AI Model Selection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select which AI model powers Kiran&apos;s live feedback, argument distinction, and essay planning.
            </p>
          </div>
          {modelSaveMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" /> Model updated & active!
            </span>
          )}
        </div>

        {/* Quick Model Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            {
              id: "openai/gpt-5.6-luna",
              name: "GPT-5.6 Luna",
              tag: "OpenAI",
              desc: "Deep reasoning & nuanced writing evaluation",
            },
            {
              id: "deepseek/deepseek-v4.1-flash",
              name: "DeepSeek V4.1 Flash",
              tag: "DeepSeek",
              desc: "High speed, ultra-low latency grading",
            },
            {
              id: "google/gemini-2.5-flash",
              name: "Gemini 2.5 Flash",
              tag: "Google (Default)",
              desc: "Fast, accurate & highly economical",
            },
          ].map((preset) => {
            const isActive = selectedModel === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleModelChange(preset.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  isActive
                    ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isActive ? "Active" : preset.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{preset.desc}</p>
                <span className="text-[10px] font-mono text-slate-400 block mt-2 truncate">
                  {preset.id}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Model Input */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={customModelInput}
            onChange={(e) => setCustomModelInput(e.target.value)}
            placeholder="Or type custom model (e.g. meta-llama/llama-4-scout, anthropic/claude-3.5-sonnet)..."
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              if (customModelInput.trim()) {
                handleModelChange(customModelInput.trim());
                setCustomModelInput("");
              }
            }}
            disabled={!customModelInput.trim()}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
          >
            Apply Model
          </button>
        </div>
        <div className="text-[11px] text-slate-400">
          Currently active model: <strong className="font-mono text-slate-700">{selectedModel}</strong>
        </div>
      </div>

      {/* SKILL MASTERY MAP */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" /> Skill Mastery Map (0–100)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated from actual attempt accuracy, task difficulty, and independent completion.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Target: &ge;75 (Exam Ready)</span>
        </div>

        <div className="space-y-5">
          {skillsList.map((skill) => {
            const score = profile.skillsMastery[skill.id] || 0;
            let statusColor = "bg-slate-200";
            let statusText = "Not started";

            if (score >= 75) {
              statusColor = "bg-emerald-500";
              statusText = "Exam Ready";
            } else if (score >= 60) {
              statusColor = "bg-indigo-500";
              statusText = "Competent";
            } else if (score >= 40) {
              statusColor = "bg-amber-500";
              statusText = "Emerging";
            } else if (score > 0) {
              statusColor = "bg-rose-500";
              statusText = "Developing";
            }

            return (
              <div key={skill.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{skill.label}</span>
                    <span className="text-slate-400 ml-2 hidden sm:inline">
                      • {skill.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">
                      {score > 0 ? `${score}%` : "—"}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {statusText}
                    </span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColor} rounded-full transition-all duration-500`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOPIC DOMAIN TRANSFER BREAKDOWN */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Topic Domain Transfer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Scholarship exams test abstract and unfamiliar prompts. We monitor practice across 10
            domains to ensure Kiran&apos;s reasoning transfers across diverse subjects.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(profile.domainStats).map(([domainKey, stats]) => {
            const formatted = domainKey.replace(/_/g, " ");
            return (
              <div
                key={domainKey}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center space-y-1"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block truncate capitalize">
                  {formatted}
                </span>
                <span className="text-lg font-black text-slate-800 block">
                  {stats.attempts > 0 ? `${stats.avgScore}%` : "—"}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {stats.attempts} {stats.attempts === 1 ? "drill" : "drills"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT ATTEMPTS & AI FEEDBACK AUDIT TRAIL */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" /> Practice Log &amp; Coach Feedback
        </h2>

        {attempts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No completed exercises yet. When Kiran completes a drill, his responses, quality score,
            and coach feedback will appear here in real time.
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.slice(0, 10).map((att) => {
              const timeStr = new Date(att.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={att.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {att.exerciseType.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Score: {att.score}% (+{att.xpEarned} XP)
                      </span>
                      <span className="text-slate-400">{timeStr}</span>
                    </div>
                  </div>

                  {att.topic && (
                    <div className="text-slate-600 font-medium">
                      <strong>Topic:</strong> &ldquo;{att.topic}&rdquo;
                    </div>
                  )}

                  <div className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                    <strong className="text-indigo-600 block mb-0.5">Coach Feedback:</strong>
                    {att.feedback}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
