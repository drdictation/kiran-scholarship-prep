"use client";

import { useEffect, useRef, useState } from "react";
import { SentenceSprintPrompt, SentenceSprintEvaluation, SprintLevel } from "@/types";
import { SEED_SENTENCE_SPRINT } from "@/lib/content/seed-sentence-sprint";
import {
  logAttempt,
  pickUnseenItem,
  getProfile,
  getSprintState,
  saveSprintState,
  getSprintMedianSeconds,
} from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";

const LEVELS: { level: SprintLevel; label: string }[] = [
  { level: 1, label: "Notes → 1 sentence" },
  { level: 2, label: "Argument → explanation" },
  { level: 3, label: "Notes → 2 connected sentences" },
  { level: 4, label: "Paragraph idea → 3 sentences" },
  { level: 5, label: "3 arguments → 3 core sentences" },
];

const DIMS = ["complete", "clear", "controlled", "efficient"] as const;
const isClear = (e: SentenceSprintEvaluation) => DIMS.every((d) => e[d] >= 4);

type Phase = "pick" | "write" | "marked" | "repair" | "done";

export function SentenceSprint({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [level, setLevel] = useState<SprintLevel>(1);
  const [prompt, setPrompt] = useState<SentenceSprintPrompt | null>(null);
  const [ownSentence, setOwnSentence] = useState(false);
  const [text, setText] = useState("");
  const [firstText, setFirstText] = useState("");
  const [ev, setEv] = useState<SentenceSprintEvaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [xp, setXp] = useState(0);
  const [note, setNote] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [median, setMedian] = useState<number | null>(null);
  const start = useRef(0);
  const repairStart = useRef(0);

  useEffect(() => setMedian(getSprintMedianSeconds()), []);

  useEffect(() => {
    if (phase !== "write" && phase !== "repair") return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - start.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase]);

  const begin = (lv: SprintLevel) => {
    const queue = getSprintState().queue;
    let p: SentenceSprintPrompt;
    const own = queue.length > 0 && Math.random() < 0.3;
    if (own) {
      const s = queue[Math.floor(Math.random() * queue.length)];
      p = {
        id: `own-${s.date}`, level: lv, kind: "fix", domain: "society", sentencesRequired: 1, timeLimitSeconds: 45,
        task: "Repair your own sentence. Say the same thing, clearly, in one sentence.", weakSentence: s.text,
      };
    } else {
      p = pickUnseenItem(SEED_SENTENCE_SPRINT.filter((x) => x.level === lv));
    }
    setOwnSentence(own);
    setLevel(lv);
    setPrompt(p);
    setText("");
    setFirstText("");
    setEv(null);
    setNote("");
    setElapsed(0);
    start.current = Date.now();
    setPhase("write");
  };

  const finish = (earned: number, score: number, firstClearSeconds: number | undefined, feedback: string, finalText: string) => {
    if (!prompt) return;
    const state = getSprintState();
    // Streak of 5 clear-first-time sentences doubles that item's XP
    let total = earned;
    if (firstClearSeconds !== undefined && earned >= 15) {
      state.streak += 1;
      if (state.streak >= 5) {
        total *= 2;
        state.streak = 0;
        setNote("5 clear in a row! Double XP!");
      }
    } else if (prompt.kind !== "stop") {
      state.streak = 0;
    }
    saveSprintState(state);
    setXp(total);
    logAttempt({
      exerciseType: "sentence_sprint",
      domain: prompt.domain,
      questionId: ownSentence ? undefined : prompt.id,
      input: { task: prompt.task, text: finalText },
      score,
      xpEarned: total,
      durationSeconds: Math.round((Date.now() - start.current) / 1000),
      feedback,
      details: { level: prompt.level, kind: prompt.kind, firstClearSeconds },
      assessmentPrompt: "Sentence Sprint: Complete / Clear / Controlled / Efficient, no adult-prose rewriting.",
    });
    if (score >= 80) {
      playSuccessChime();
      fireConfetti();
    }
    setMedian(getSprintMedianSeconds());
    setPhase("done");
  };

  const mark = async (isRepair: boolean) => {
    if (!prompt || !text.trim()) return;
    setBusy(true);
    let result: SentenceSprintEvaluation | null = null;
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentence_sprint",
          payload: { ...prompt, studentText: text, selectedModel: getProfile().selectedModel },
        }),
      });
      const data = await res.json();
      if (data.valid && data.complete) result = data;
    } catch {}
    setBusy(false);
    setEv(result);

    const secs = Math.round((Date.now() - start.current) / 1000);
    if (!result) return finish(5, 0, undefined, "Not marked (AI unavailable).", text);

    const clear = isClear(result);
    const flagText = isRepair ? firstText : text;
    if (!isRepair && clear) {
      // Clear Sentence +10, First-Time Clear +5
      return finish(15, 100, secs, result.feedback, text);
    }
    if (isRepair && clear) {
      removeFlag(firstText);
      return finish(10, 80, secs, result.feedback, text);
    }
    if (!isRepair) {
      addFlag(flagText, result.diagnosis || "UNCLEAR");
      setFirstText(text);
      setPhase("marked");
      return;
    }
    finish(3, 40, undefined, result.feedback, text);
  };

  const addFlag = (t: string, diagnosis: string) => {
    const s = getSprintState();
    if (!ownSentence) s.queue.unshift({ text: t, diagnosis, date: Date.now() });
    s.streak = 0;
    saveSprintState(s);
  };

  const removeFlag = (t: string) => {
    const s = getSprintState();
    s.queue = s.queue.filter((q) => q.text !== (prompt?.weakSentence ?? t) && q.text !== t);
    saveSprintState(s);
  };

  const startRepair = () => {
    setText("");
    start.current = Date.now();
    repairStart.current = Date.now();
    setElapsed(0);
    setPhase("repair");
  };

  const tapStop = (i: number) => {
    if (!prompt || phase === "done") return;
    const ok = i === prompt.stopIndex;
    setEv(null);
    finish(ok ? 15 : 3, ok ? 100 : 30, ok ? Math.round((Date.now() - start.current) / 1000) : undefined,
      prompt.stopWhy || "", prompt.steps?.[i] || "");
    setText(String(i));
  };

  /* ---------------- UI ---------------- */
  const card = "max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4";
  const btn = "px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm";

  if (phase === "pick") {
    return (
      <div className={card}>
        <h2 className="text-xl font-black text-slate-900">Sentence Sprint</h2>
        <p className="text-sm text-slate-600">Turn a good thought into one clear, complete sentence. Quality first, then speed.</p>
        {median !== null && (
          <p className="text-xs font-semibold text-indigo-700">Median seconds to first clear sentence: {median}s</p>
        )}
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <button key={l.level} type="button" onClick={() => begin(l.level)}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-sm font-semibold text-slate-800">
              Level {l.level} · {l.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800">Back</button>
      </div>
    );
  }

  if (!prompt) return null;
  const limit = phase === "repair" ? 30 : prompt.timeLimitSeconds;
  const stopDone = prompt.kind === "stop" && phase === "done";

  return (
    <div className={card}>
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
        <span>Level {prompt.level} · {ownSentence ? "Repair your own" : prompt.kind}</span>
        {(phase === "write" || phase === "repair") && (
          <span className={elapsed > limit ? "text-rose-600" : ""}>{elapsed}s / {limit}s</span>
        )}
      </div>

      <p className="font-semibold text-slate-900">{prompt.task}</p>

      {prompt.notes && (
        <ul className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 list-disc list-inside">
          {prompt.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
      {prompt.argument && (
        <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold">&ldquo;{prompt.argument}&rdquo;</p>
      )}
      {prompt.weakSentence && (
        <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">&ldquo;{prompt.weakSentence}&rdquo;</p>
      )}

      {prompt.kind === "stop" && (
        <div className="space-y-2">
          {prompt.steps!.map((s, i) => {
            const picked = stopDone && String(i) === text;
            const correct = stopDone && i === prompt.stopIndex;
            return (
              <button key={i} type="button" disabled={phase === "done"} onClick={() => tapStop(i)}
                className={`w-full text-left p-3 rounded-xl border text-sm ${
                  correct ? "border-emerald-500 bg-emerald-50" : picked ? "border-rose-400 bg-rose-50" : "border-slate-200 hover:bg-slate-50"}`}>
                {i + 1}. {s}{correct && " ← STOP"}
              </button>
            );
          })}
        </div>
      )}

      {prompt.kind !== "stop" && (phase === "write" || phase === "repair") && (
        <>
          {phase === "repair" && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Your First Sentence:
                </span>
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                  {ev?.diagnosis || "Needs Polish"}
                </span>
              </div>
              <p className="text-sm italic text-slate-800 bg-white/70 p-2 rounded-lg border border-amber-200">
                &ldquo;{firstText}&rdquo;
              </p>
              {ev && (
                <div className="text-xs text-amber-950 font-medium pt-1">
                  <strong>Why it was flagged:</strong> {ev.feedback}
                </div>
              )}
              <p className="text-xs text-amber-800 font-semibold pt-1 border-t border-amber-200">
                👉 Fix it now: Same idea, but keep the logic clean. Stop once proved. ({prompt.sentencesRequired === 1 ? "1 sentence" : `${prompt.sentencesRequired} sentences`})
              </p>
            </div>
          )}
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={prompt.sentencesRequired > 1 ? 4 : 3} autoFocus
            className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" placeholder="Write clean sentence here..." />
          <button type="button" disabled={busy || !text.trim()} onClick={() => mark(phase === "repair")} className={btn}>
            {busy ? "Evaluating sentence..." : phase === "repair" ? "Check Repair" : "Mark it"}
          </button>
        </>
      )}

      {ev && (phase === "marked" || phase === "done") && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {DIMS.map((d) => (
              <span key={d} className={`flex items-center gap-1.5 p-1.5 rounded-lg ${ev[d] >= 4 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
                <span>{ev[d] >= 4 ? "✓" : "✗"}</span>
                <span className="capitalize">{d}</span>
                <span className="ml-auto opacity-70">({ev[d]}/5)</span>
              </span>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-200 text-slate-700 text-xs leading-relaxed">
            <strong className="text-slate-900">Diagnostic Feedback:</strong> {ev.feedback}
          </div>
        </div>
      )}

      {phase === "marked" && (
        <button type="button" onClick={startRepair} className={btn}>Repair (30s)</button>
      )}

      {phase === "done" && (
        <div className="space-y-3">
          {stopDone && <p className="text-sm text-slate-700">{prompt.stopWhy}</p>}
          <p className="font-bold text-emerald-700">+{xp} XP {note}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => begin(level)} className={btn}>Next</button>
            <button type="button" onClick={onComplete} className="text-sm text-slate-500 hover:text-slate-800">Finish</button>
          </div>
        </div>
      )}

      {phase !== "done" && phase !== "marked" && (
        <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
      )}
    </div>
  );
}
