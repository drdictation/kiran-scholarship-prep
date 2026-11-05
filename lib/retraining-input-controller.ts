import type {
  RetrainingConfig,
  RetrainingEditingMode,
  RetrainingQualityBand,
  SentenceRetrainingDrillType,
  SentenceRetrainingEvaluation,
} from "@/types";

export const DEFAULT_RETRAINING_CONFIG: RetrainingConfig = {
  prepDurationSeconds: 12, // 10–15s mental preparation window
  writingTargetSeconds: 45, // 45s default first-draft writing target
  developingThreshold: 80, // 80–89% developing competence
  highQualityThreshold: 90, // 90%+ high-quality first draft
};

export function getWritingTargetForDrill(
  drillType: SentenceRetrainingDrillType,
  config: RetrainingConfig = DEFAULT_RETRAINING_CONFIG
): number {
  if (config.writingTargetSeconds !== DEFAULT_RETRAINING_CONFIG.writingTargetSeconds) {
    return config.writingTargetSeconds;
  }
  switch (drillType) {
    case "rebuild":
    case "constrained":
    case "independent":
    default:
      return 45;
  }
}

export interface FirstDraftInputState {
  committedText: string;
  displayText: string;
  isComposing: boolean;
  compositionBaseText: string;
  editingMode: RetrainingEditingMode;
  isLocked: boolean;
  blockedEditCount: number;
  lastBlockedReason: string | null;
  firstKeystrokeAt: number | null;
  submittedAt: number | null;
}

export function createFirstDraftInputState(
  editingMode: RetrainingEditingMode = "think_first_write_once"
): FirstDraftInputState {
  return {
    committedText: "",
    displayText: "",
    isComposing: false,
    compositionBaseText: "",
    editingMode,
    isLocked: false,
    blockedEditCount: 0,
    lastBlockedReason: null,
    firstKeystrokeAt: null,
    submittedAt: null,
  };
}

const BLOCKED_KEYS = new Set([
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const BLOCKED_INPUT_TYPES = new Set([
  "deleteContentBackward",
  "deleteContentForward",
  "deleteWordBackward",
  "deleteWordForward",
  "deleteSoftLineBackward",
  "deleteSoftLineForward",
  "deleteHardLineBackward",
  "deleteHardLineForward",
  "deleteByCut",
  "deleteByDrag",
  "historyUndo",
  "historyRedo",
  "insertFromPaste",
  "insertFromDrop",
  "insertReplacementText",
]);

export interface KeyDownInspectResult {
  preventDefault: boolean;
  state: FirstDraftInputState;
}

/**
 * Inspect a keydown event during Stage B.
 * In "think_first_write_once" mode, blocks Backspace, Delete, cursor navigation,
 * Undo/Redo, Cut, and Paste shortcuts, while allowing IME composition and normal typing.
 */
export function handleFirstDraftKeyDown(
  state: FirstDraftInputState,
  event: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    isComposing?: boolean;
  }
): KeyDownInspectResult {
  if (state.isLocked) {
    return {
      preventDefault: true,
      state: {
        ...state,
        blockedEditCount: state.blockedEditCount + 1,
        lastBlockedReason: "locked",
      },
    };
  }

  // Never interfere with active IME composition events
  if (state.isComposing || event.isComposing || event.key === "Process") {
    return { preventDefault: false, state };
  }

  // Accessible mode allows normal editing
  if (state.editingMode === "standard_accessible") {
    return { preventDefault: false, state };
  }

  // Block Ctrl/Cmd + Z, Y, X, V, A (Undo, Redo, Cut, Paste, Select All)
  if (event.ctrlKey || event.metaKey) {
    const lowerKey = (event.key || "").toLowerCase();
    if (["z", "y", "x", "v", "a"].includes(lowerKey)) {
      return {
        preventDefault: true,
        state: {
          ...state,
          blockedEditCount: state.blockedEditCount + 1,
          lastBlockedReason: `shortcut_${lowerKey}`,
        },
      };
    }
  }

  if (BLOCKED_KEYS.has(event.key)) {
    return {
      preventDefault: true,
      state: {
        ...state,
        blockedEditCount: state.blockedEditCount + 1,
        lastBlockedReason: `key_${event.key}`,
      },
    };
  }

  return { preventDefault: false, state };
}

export function handleCompositionStart(
  state: FirstDraftInputState,
  nowMs: number = Date.now()
): FirstDraftInputState {
  if (state.isLocked) return state;
  return {
    ...state,
    isComposing: true,
    compositionBaseText: state.committedText,
    firstKeystrokeAt: state.firstKeystrokeAt ?? nowMs,
  };
}

export function handleCompositionUpdate(
  state: FirstDraftInputState,
  proposedValue: string,
  nowMs: number = Date.now()
): FirstDraftInputState {
  if (state.isLocked) return state;
  if (state.editingMode === "standard_accessible") {
    return {
      ...state,
      isComposing: true,
      displayText: proposedValue,
      firstKeystrokeAt: state.firstKeystrokeAt ?? nowMs,
    };
  }

  // In strict mode, the prefix before composition started must remain intact
  const base = state.compositionBaseText;
  if (!proposedValue.startsWith(base)) {
    return {
      ...state,
      blockedEditCount: state.blockedEditCount + 1,
      lastBlockedReason: "composition_prefix_modified",
    };
  }

  return {
    ...state,
    isComposing: true,
    displayText: proposedValue,
    firstKeystrokeAt: state.firstKeystrokeAt ?? nowMs,
  };
}

export function handleCompositionEnd(
  state: FirstDraftInputState,
  finalValue: string,
  nowMs: number = Date.now()
): FirstDraftInputState {
  if (state.isLocked) return state;

  if (state.editingMode === "standard_accessible") {
    return {
      ...state,
      isComposing: false,
      committedText: finalValue,
      displayText: finalValue,
      compositionBaseText: finalValue,
      firstKeystrokeAt:
        finalValue.length > 0 ? (state.firstKeystrokeAt ?? nowMs) : state.firstKeystrokeAt,
    };
  }

  const base = state.compositionBaseText;
  if (!finalValue.startsWith(base)) {
    // Reject modification of pre-composition committed prefix
    return {
      ...state,
      isComposing: false,
      displayText: state.committedText,
      compositionBaseText: state.committedText,
      blockedEditCount: state.blockedEditCount + 1,
      lastBlockedReason: "composition_end_prefix_mismatch",
    };
  }

  return {
    ...state,
    isComposing: false,
    committedText: finalValue,
    displayText: finalValue,
    compositionBaseText: finalValue,
    firstKeystrokeAt:
      finalValue.length > 0 ? (state.firstKeystrokeAt ?? nowMs) : state.firstKeystrokeAt,
  };
}

/**
 * Enforce append-only input immutability on change/input events.
 * Allows normal insertion of characters, spaces, and punctuation at the end of committedText.
 * Rejects deletions, mid-sentence insertions, selection replacements, paste, cut, and undo.
 */
export function applyFirstDraftChange(
  state: FirstDraftInputState,
  proposedValue: string,
  options: {
    inputType?: string;
    nowMs?: number;
  } = {}
): FirstDraftInputState {
  const nowMs = options.nowMs ?? Date.now();
  const inputType = options.inputType || "";

  if (state.isLocked) {
    return {
      ...state,
      blockedEditCount: state.blockedEditCount + 1,
      lastBlockedReason: "locked",
    };
  }

  // If currently in an IME composition session, delegate to composition update
  if (state.isComposing || inputType === "insertCompositionText") {
    return handleCompositionUpdate(state, proposedValue, nowMs);
  }

  // Standard accessible mode allows unrestricted editing
  if (state.editingMode === "standard_accessible") {
    return {
      ...state,
      committedText: proposedValue,
      displayText: proposedValue,
      compositionBaseText: proposedValue,
      firstKeystrokeAt:
        proposedValue.length > 0 ? (state.firstKeystrokeAt ?? nowMs) : state.firstKeystrokeAt,
    };
  }

  // Strict "Think First, Write Once" immutability checks:
  // 1. Reject explicitly blocked inputTypes (paste, cut, delete, undo/redo, drag/drop)
  if (inputType && BLOCKED_INPUT_TYPES.has(inputType)) {
    return {
      ...state,
      displayText: state.committedText,
      blockedEditCount: state.blockedEditCount + 1,
      lastBlockedReason: `inputType_${inputType}`,
    };
  }

  // 2. Reject any reduction in length or modification of existing committed prefix
  if (
    proposedValue.length < state.committedText.length ||
    !proposedValue.startsWith(state.committedText)
  ) {
    return {
      ...state,
      displayText: state.committedText,
      blockedEditCount: state.blockedEditCount + 1,
      lastBlockedReason:
        proposedValue.length < state.committedText.length
          ? "deletion_blocked"
          : "prefix_modification_blocked",
    };
  }

  // 3. Reject multi-character paste bursts disguised as insertText (> 2 chars at once outside composition)
  const delta = proposedValue.slice(state.committedText.length);
  if (delta.length > 2 && inputType === "insertFromPaste") {
    return {
      ...state,
      displayText: state.committedText,
      blockedEditCount: state.blockedEditCount + 1,
      lastBlockedReason: "paste_blocked",
    };
  }

  // Valid append at the end of the sentence
  return {
    ...state,
    committedText: proposedValue,
    displayText: proposedValue,
    compositionBaseText: proposedValue,
    firstKeystrokeAt:
      proposedValue.length > 0 ? (state.firstKeystrokeAt ?? nowMs) : state.firstKeystrokeAt,
  };
}

/**
 * Force cursor/selection to remain at the end of committedText in strict mode.
 */
export function getEnforcedCursorPosition(
  state: FirstDraftInputState,
  selectionStart: number | null,
  selectionEnd: number | null
): { start: number; end: number; wasRepositioned: boolean } {
  const len = state.displayText.length;
  if (state.editingMode === "standard_accessible" || state.isComposing) {
    return {
      start: selectionStart ?? len,
      end: selectionEnd ?? len,
      wasRepositioned: false,
    };
  }
  const wasRepositioned = selectionStart !== len || selectionEnd !== len;
  return {
    start: len,
    end: len,
    wasRepositioned,
  };
}

export function lockFirstDraftState(
  state: FirstDraftInputState,
  nowMs: number = Date.now()
): FirstDraftInputState {
  return {
    ...state,
    isLocked: true,
    isComposing: false,
    displayText: state.committedText,
    submittedAt: state.submittedAt ?? nowMs,
  };
}

export interface RetrainingTimingMetrics {
  prepDurationSeconds: number;
  writingDurationSeconds: number;
  overrunSeconds: number;
  isOverrun: boolean;
  wordCount: number;
  typingWpm: number;
}

/**
 * Compute separate preparation time, writing time (first keystroke to submission),
 * overrun beyond target, and typing speed (WPM) so typing mechanics are separated from writing quality.
 */
export function computeRetrainingTimingMetrics(params: {
  promptDisplayedAtMs: number;
  inputUnlockedAtMs: number;
  firstKeystrokeAtMs: number | null;
  submittedAtMs: number;
  writingTargetSeconds: number;
  studentText: string;
}): RetrainingTimingMetrics {
  const {
    promptDisplayedAtMs,
    inputUnlockedAtMs,
    firstKeystrokeAtMs,
    submittedAtMs,
    writingTargetSeconds,
    studentText,
  } = params;

  const unlockTime = Math.max(promptDisplayedAtMs, inputUnlockedAtMs);
  const prepDurationSeconds = Math.max(
    0,
    Math.round((unlockTime - promptDisplayedAtMs) / 1000)
  );

  const effectiveStart = firstKeystrokeAtMs ?? unlockTime;
  const writingDurationSeconds = Math.max(
    1,
    Math.round((Math.max(submittedAtMs, effectiveStart) - effectiveStart) / 1000)
  );

  const overrunSeconds = Math.max(0, writingDurationSeconds - writingTargetSeconds);
  const isOverrun = overrunSeconds > 0;

  const wordCount = (studentText || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const typingWpm =
    writingDurationSeconds > 0
      ? Math.round((wordCount / writingDurationSeconds) * 60)
      : 0;

  return {
    prepDurationSeconds,
    writingDurationSeconds,
    overrunSeconds,
    isOverrun,
    wordCount,
    typingWpm,
  };
}

/**
 * Quality-first scoring hierarchy:
 * - Below 80%: Not mastered
 * - 80–89%: Developing competence
 * - 90%+: High-quality first draft
 * - 90%+ within target time (and in strict Think First, Write Once mode): Fluent first-draft success
 */
export function classifyFirstDraftQualityBand(
  evaluation: Pick<
    SentenceRetrainingEvaluation,
    "qualityScore" | "firstDraftQualityPass" | "highQualityFirstDraft"
  >,
  writingDurationSeconds: number,
  editingMode: RetrainingEditingMode = "think_first_write_once",
  config: RetrainingConfig = DEFAULT_RETRAINING_CONFIG
): RetrainingQualityBand {
  if (
    !evaluation.firstDraftQualityPass ||
    evaluation.qualityScore < config.developingThreshold
  ) {
    return "not_mastered";
  }

  if (
    evaluation.qualityScore >= config.highQualityThreshold &&
    evaluation.highQualityFirstDraft
  ) {
    if (
      editingMode === "think_first_write_once" &&
      writingDurationSeconds <= config.writingTargetSeconds
    ) {
      return "fluent_first_draft";
    }
    return "high_quality";
  }

  return "developing";
}
