import { useEffect, useMemo, useRef, useState } from "react";

import { AnswersPanel } from "./components/AnswersPanel";
import { Composer } from "./components/Composer";
import { SettingsBar } from "./components/SettingsBar";
import { TopNav } from "./components/TopNav";
import { TeamMember, createDefaultTeam } from "./data/experts";
import { consultStream, deleteSession, generateTitle, getSession, listSessions } from "./services/api";
import { AttachmentInput, ConsultPayload, ConsultResult, SessionPreview } from "./types";
import { useDarkMode } from "./hooks/useDarkMode";
import { cn } from "./lib/utils";

const defaults: ConsultPayload = {
  writer: "deepseek/deepseek-chat-v3.2", critic_a: "google/gemini-2.5-flash", critic_b: "google/gemini-2.5-flash",
  max_rounds: 3, consensus_score: 8, role: "", question: ""
};

export default function App() {
  const [dark, toggleDark] = useDarkMode();
  const [form, setForm] = useState<ConsultPayload>(defaults);
  const [team, setTeam] = useState<TeamMember[]>(() => createDefaultTeam(""));
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [toast, setToast] = useState("");
  const [activeCast, setActiveCast] = useState<CastSelection>(() => selectCastFromTeam(createDefaultTeam("")));
  const [castBySession, setCastBySession] = useState<Record<string, CastSelection>>({});
  const [result, setResult] = useState<ConsultResult | null>(null);
  const [resultsById, setResultsById] = useState<Record<string, ConsultResult>>({});
  const [sessionTitles, setSessionTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const [clarificationPrompt, setClarificationPrompt] = useState("");
  const [clarificationReason, setClarificationReason] = useState("");
  const [clarificationOptions, setClarificationOptions] = useState<string[]>([]);
  const [clarificationChoice, setClarificationChoice] = useState("");
  const [clarificationOtherText, setClarificationOtherText] = useState("");
  const [history, setHistory] = useState<SessionPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupInstruction, setFollowupInstruction] = useState("");
  const [followupConstraints, setFollowupConstraints] = useState("");
  const [followupSeed, setFollowupSeed] = useState("");
  const [followupError, setFollowupError] = useState("");
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const answersPanelRef = useRef<HTMLElement | null>(null);

  const displayResult = selectedId ? resultsById[selectedId] ?? result : result;
  const panelCast = selectedId ? castBySession[selectedId] ?? activeCast : activeCast;
  const panelActivity = activity;
  const runSignature = useMemo(() => buildRunSignature(team, form), [team, form]);
  const followupChangedSinceOpen = Boolean(followupOpen && followupSeed && followupSeed !== runSignature);

  const chooseClarification = (value: string) => {
    setClarificationChoice(value);
    if (value !== "Other") setClarificationOtherText("");
  };

  const panelProps = {
    result: displayResult, showFullDiscussion: true, loading, activity: panelActivity,
    cast: panelCast,
    clarificationPrompt, clarificationReason, clarificationOptions, clarificationChoice, clarificationOtherText,
    onClarificationChoice: chooseClarification, onClarificationOtherText: setClarificationOtherText,
    onSubmitClarification: () => runConsult(clarificationChoice === "Other" ? clarificationOtherText.trim() : clarificationChoice),
    followupOpen, followupInstruction, followupConstraints, followupChangedSinceOpen,
    onOpenFollowup: openFollowup,
    onFollowupInstructionChange: setFollowupInstruction,
    onFollowupConstraintsChange: setFollowupConstraints,
    onAdjustFollowupTeam: adjustFollowupTeam,
    onSubmitFollowup: runFollowup,
    onRetryFollowup: runFollowup,
    onStartFresh: startNewQuestion,
    followupError
  };

  useEffect(() => {
    listSessions()
      .then((rows) => setHistory(rows.map(toPreview)))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    setTeam((prev) => prev.map((m) => (m.lockToBaseRole ? { ...m, role: form.role } : m)));
  }, [form.role]);

  useEffect(() => {
    if (!attachments.some((a) => a.kind === "image")) return;
    setTeam((prev) => {
      const switched = prev.filter((m) => m.model === "deepseek/deepseek-chat-v3.2").length;
      const next = prev.map((m) =>
        m.model === "deepseek/deepseek-chat-v3.2" ? { ...m, model: "google/gemini-2.5-flash" } : m
      );
      if (switched > 0) setToast(`Image detected: switched ${switched} Deepseek seat(s) to Gemini Flash for vision support.`);
      return next;
    });
  }, [attachments]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const runConsult = async (clarification = "") => {
    clearFollowupState();
    setLoading(true);
    answersPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActivity(["Queued request. Your team is assembling the debate..."]);
    setClarificationPrompt("");
    setClarificationReason("");
    setClarificationOptions([]);
    setClarificationChoice("");
    setClarificationOtherText("");
    const cast = selectCastFromTeam(team);
    setActiveCast(cast);
    const payload = mergeTeamIntoPayload(form, team, attachments, clarification);
    try {
      await executeConsult(payload, cast, form.question);
    } catch (error) {
      setActivity((prev) => [...prev, `Stream error: ${String(error)}`]);
    } finally {
      setLoading(false);
    }
  };

  async function runFollowup() {
    const source = displayResult;
    if (!source || !followupInstruction.trim()) return;
    const cast = selectCastFromTeam(team);
    setActiveCast(cast);
    setFollowupError("");
    setLoading(true);
    answersPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActivity([`Starting follow-up run from session ${source.session_id}`]);
    if (followupChangedSinceOpen) setActivity((prev) => [...prev, "Using updated team/settings"]);
    const mergedInstruction = [followupInstruction.trim(), followupConstraints.trim()].filter(Boolean).join("\n\n");
    const followupQuestion = [
      "Original prompt:", source.source_prompt || source.question,
      "", "Previous final answer:", source.source_final_answer || source.final_answer,
      "", "Follow-up instruction:", mergedInstruction
    ].join("\n");
    const payload = mergeTeamIntoPayload(
      {
        ...form, question: followupQuestion, is_followup: true,
        parent_session_id: source.session_id, thread_id: source.thread_id || source.session_id,
        source_prompt: source.source_prompt || source.question,
        source_final_answer: source.source_final_answer || source.final_answer,
        followup_instruction: mergedInstruction
      },
      team, [], ""
    );
    try {
      await executeConsult(payload, cast, mergedInstruction);
      setFollowupOpen(false);
    } catch (error) {
      setFollowupError(String(error));
      setActivity((prev) => [...prev, `Stream error: ${String(error)}`]);
    } finally {
      setLoading(false);
    }
  }

  async function executeConsult(payload: ConsultPayload, cast: CastSelection, title: string) {
    await consultStream(payload, {
      onActivity: (message) => setActivity((prev) => [...prev, message]),
      onFinal: (next) => {
        const canClarify = Boolean(next.needs_clarification && next.clarification_question && next.clarification_options.length);
        if (canClarify) {
          setClarificationPrompt(next.clarification_question);
          setClarificationReason(next.clarification_reason);
          setClarificationOptions(next.clarification_options);
          setClarificationChoice(next.clarification_options[0] ?? "");
          setClarificationOtherText("");
          setActivity((prev) => [...prev, "Waiting for user clarification"]);
          return;
        }
        setResult(next);
        setResultsById((prev) => ({ ...prev, [next.session_id]: next }));
        setCastBySession((prev) => ({ ...prev, [next.session_id]: cast }));
        setSelectedId(next.session_id);
        setHistory((prev) => [toPreview({
          session_id: next.session_id, question: next.question || title,
          timestamp: new Date().toISOString(), thread_id: next.thread_id,
          parent_session_id: next.parent_session_id, is_followup: next.is_followup,
          run_title: next.followup_instruction || next.question
        }), ...prev.filter((p) => p.id !== next.session_id)]);

        // Generate concise title asynchronously
        generateTitle(next.question || title, next.role || "").then((generatedTitle) => {
          setSessionTitles((prev) => ({ ...prev, [next.session_id]: generatedTitle }));
        }).catch(() => {});
      }
    });
  }

  const selectSession = async (id: string) => {
    setSelectedId(id);
    if (!loading) setActivity([]);
    if (resultsById[id]) return;
    try {
      const loaded = await getSession(id);
      setResultsById((prev) => ({ ...prev, [id]: loaded }));
      setResult(loaded);
      clearFollowupState();
    } catch {
      setActivity((prev) => [...prev, "Could not load selected session."]);
    }
  };

  const removeSession = async (id: string) => {
    try { await deleteSession(id); } catch { return; }
    let fallbackId: string | null = null;
    setHistory((prev) => {
      const next = prev.filter((x) => x.id !== id);
      fallbackId = next[0]?.id ?? null;
      return next;
    });
    setResultsById((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setSessionTitles((prev) => { const next = { ...prev }; delete next[id]; return next; });
    if (selectedId === id) {
      setSelectedId(fallbackId);
      setResult(fallbackId ? resultsById[fallbackId] ?? null : null);
    }
  };

  function startNewQuestion() {
    setSelectedId(null);
    setResult(null);
    setActivity([]);
    clearFollowupState();
  }

  function clearFollowupState() {
    setFollowupOpen(false);
    setFollowupInstruction("");
    setFollowupConstraints("");
    setFollowupSeed("");
    setFollowupError("");
  }

  function openFollowup() {
    if (!displayResult) return;
    setFollowupOpen(true);
    setFollowupSeed(runSignature);
    if (!followupInstruction) setFollowupInstruction("");
  }

  function adjustFollowupTeam() {
    settingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav
        onNewRun={startNewQuestion}
        dark={dark}
        onToggleDark={toggleDark}
      />

      <main className={cn(
        "flex-1 grid gap-4 p-4 items-start w-full max-w-[1600px] mx-auto",
        "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Left panel: problem input + team config */}
        <div className="grid gap-4">
          {toast && (
            <div className="border border-ring/40 bg-ring/12 text-foreground rounded-md px-3 py-2.5 text-sm shadow-sm">
              {toast}
            </div>
          )}
          <Composer value={form} attachments={attachments} onAttachmentsChange={setAttachments} onChange={setForm} />
          <div ref={settingsRef}>
            <SettingsBar
              value={form}
              team={team}
              loading={loading}
              canSubmit={Boolean(form.question.trim())}
              onChange={setForm}
              onTeamChange={setTeam}
              onSubmit={() => runConsult()}
            />
          </div>
        </div>

        {/* Right panel: collapsible answers accordion */}
        <AnswersPanel
          ref={answersPanelRef}
          sessions={history}
          selectedId={selectedId}
          sessionTitles={sessionTitles}
          resultsById={resultsById}
          castBySession={castBySession}
          chatPanelProps={panelProps}
          onSelect={selectSession}
          onDelete={removeSession}
        />
      </main>
    </div>
  );
}

type CastPerson = { name: string; avatar: string };
type CastSelection = { writer: CastPerson; criticA: CastPerson; criticB: CastPerson };

function selectCastFromTeam(team: TeamMember[]): CastSelection {
  const { writer, criticA, criticB } = selectEngineMembers(team);
  return {
    writer: { name: writer.name, avatar: writer.avatar },
    criticA: { name: criticA.name, avatar: criticA.avatar },
    criticB: { name: criticB.name, avatar: criticB.avatar }
  };
}

function mergeTeamIntoPayload(
  form: ConsultPayload, team: TeamMember[], attachments: AttachmentInput[], clarification: string
): ConsultPayload {
  const { writer, criticA, criticB } = selectEngineMembers(team);
  const imageLoaded = Boolean(attachments.some((a) => a.kind === "image"));
  return {
    ...form,
    writer: withImageFallback(writer.model, imageLoaded),
    critic_a: withImageFallback(criticA.model, imageLoaded),
    critic_b: withImageFallback(criticB.model, imageLoaded),
    role: (writer.role || form.role || "You are an expert in ...").slice(0, 255),
    attachments, clarification
  };
}

function selectEngineMembers(team: TeamMember[]): { writer: TeamMember; criticA: TeamMember; criticB: TeamMember } {
  const writer = team.find((m) => m.duty === "writer") ?? team[0];
  const critics = team.filter((m) => m.duty === "critic");
  const criticA = critics[0] ?? team.find((m) => m.id !== writer.id) ?? writer;
  const criticB = critics[1] ?? team.find((m) => m.id !== writer.id && m.id !== criticA.id) ?? criticA;
  return { writer, criticA, criticB };
}

function withImageFallback(model: string, imageLoaded: boolean): string {
  if (!imageLoaded) return model;
  return model === "deepseek/deepseek-chat-v3.2" ? "google/gemini-2.5-flash" : model;
}

function toPreview(row: {
  session_id: string; question: string; timestamp?: string;
  thread_id?: string; parent_session_id?: string; is_followup?: boolean; run_title?: string;
}): SessionPreview {
  return {
    id: row.session_id, question: row.question, timestamp: row.timestamp,
    thread_id: row.thread_id || row.session_id, parent_session_id: row.parent_session_id || "",
    is_followup: Boolean(row.is_followup), run_title: row.run_title || row.question
  };
}

function buildRunSignature(team: TeamMember[], form: ConsultPayload): string {
  const seats = team.map((m) => `${m.id}:${m.duty}:${m.model}:${m.role}`).join("|");
  return `${seats}:${form.max_rounds}:${form.consensus_score}:${form.role}`;
}
