import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardPaste, Settings2, Upload } from "lucide-react";

import { ConsensusRunsSidebar, RUNS_SIDEBAR_STORAGE_KEY } from "./components/ConsensusRunsSidebar";
import { AdvancedDrawer } from "./components/AdvancedDrawer";
import { AgentStrip } from "./components/AgentStrip";
import { AgentTileGrid } from "./components/AgentTileGrid";
import { CommandBar } from "./components/CommandBar";
import { ComposerAttachmentPanel } from "./components/ComposerAttachmentPanel";
import { LeadRoleField } from "./components/LeadRoleField";
import { TopNav } from "./components/TopNav";
import { ChatPanel } from "./components/ChatPanel";
import { TeamMember, createDefaultTeam } from "./data/experts";
import { ROUND_OPTIONS, SCORE_OPTIONS } from "./data/models";
import {
  buildRunSignature,
  mergeTeamIntoPayload,
  selectCastFromTeam,
  toPreview,
  type CastSelection,
} from "./lib/consultHelpers";
import { consultStream, deleteSession, generateTitle, getSession, listSessions } from "./services/api";
import { readAttachments, readClipboardFromBrowser, supportedUploadTypes } from "./services/attachments";
import { AttachmentInput, ConsultPayload, ConsultResult, SessionPreview } from "./types";
import { useDarkMode } from "./hooks/useDarkMode";
import { cn } from "./lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaults: ConsultPayload = {
  writer: "deepseek/deepseek-chat-v3.2",
  critic_a: "google/gemini-2.5-flash",
  critic_b: "google/gemini-2.5-flash",
  max_rounds: 3,
  consensus_score: 8,
  role: "",
  question: "",
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
  const mainSessionPanelRef = useRef<HTMLDivElement | null>(null);
  const toolbarFileInputRef = useRef<HTMLInputElement | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [runsSidebarOpen, setRunsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(RUNS_SIDEBAR_STORAGE_KEY) !== "0";
  });
  const [userDisplayName] = useState(() => {
    if (typeof window === "undefined") return "there";
    return localStorage.getItem("multiai_display_name")?.trim() || "there";
  });

  const displayResult = selectedId ? resultsById[selectedId] ?? result : result;
  const panelCast = selectedId ? castBySession[selectedId] ?? activeCast : activeCast;
  const panelActivity = activity;
  const runSignature = useMemo(() => buildRunSignature(team, form), [team, form]);
  const followupChangedSinceOpen = Boolean(followupOpen && followupSeed && followupSeed !== runSignature);

  const chooseClarification = (value: string) => {
    setClarificationChoice(value);
    if (value !== "Other") setClarificationOtherText("");
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

  useEffect(() => {
    localStorage.setItem(RUNS_SIDEBAR_STORAGE_KEY, runsSidebarOpen ? "1" : "0");
  }, [runsSidebarOpen]);

  const runConsult = async (clarificationTag = "") => {
    clearFollowupState();
    setAdvancedOpen(false);
    setRunsSidebarOpen(true);
    setLoading(true);
    requestAnimationFrame(() => {
      mainSessionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    setActivity(["Queued request. Your team is assembling the debate..."]);
    setClarificationPrompt("");
    setClarificationReason("");
    setClarificationOptions([]);
    setClarificationChoice("");
    setClarificationOtherText("");
    const cast = selectCastFromTeam(team);
    setActiveCast(cast);
    const payload = mergeTeamIntoPayload(form, team, attachments, clarificationTag);
    try {
      await executeConsult(payload, cast, form.question);
    } catch (error) {
      setActivity((prev) => [...prev, `Stream error: ${String(error)}`]);
    } finally {
      setLoading(false);
    }
  };

  const addFilesFromToolbar = async (files: FileList | null) => {
    const next = await readAttachments(files);
    if (!next.length) return;
    setAttachments((prev) => [...prev, ...next]);
  };

  const pasteFromToolbar = async () => {
    try {
      const next = await readClipboardFromBrowser();
      if (!next.length) {
        setToast("Nothing pasteable found in clipboard.");
        return;
      }
      setAttachments((prev) => [...prev, ...next]);
      setToast(`Added ${next.length} context item(s) from clipboard.`);
    } catch {
      setToast("Clipboard access blocked. Use Ctrl+V in Add context files area.");
    }
  };

  async function runFollowup() {
    const source = displayResult;
    if (!source || !followupInstruction.trim()) return;
    const cast = selectCastFromTeam(team);
    setActiveCast(cast);
    setFollowupError("");
    setAdvancedOpen(false);
    setRunsSidebarOpen(true);
    setLoading(true);
    requestAnimationFrame(() => {
      mainSessionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    setActivity([`Starting follow-up run from session ${source.session_id}`]);
    if (followupChangedSinceOpen) setActivity((prev) => [...prev, "Using updated team/settings"]);
    const mergedInstruction = [followupInstruction.trim(), followupConstraints.trim()].filter(Boolean).join("\n\n");
    const followupQuestion = [
      "Original prompt:",
      source.source_prompt || source.question,
      "",
      "Previous final answer:",
      source.source_final_answer || source.final_answer,
      "",
      "Follow-up instruction:",
      mergedInstruction,
    ].join("\n");
    const payload = mergeTeamIntoPayload(
      {
        ...form,
        question: followupQuestion,
        is_followup: true,
        parent_session_id: source.session_id,
        thread_id: source.thread_id || source.session_id,
        source_prompt: source.source_prompt || source.question,
        source_final_answer: source.source_final_answer || source.final_answer,
        followup_instruction: mergedInstruction,
      },
      team,
      [],
      ""
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
        const canClarify = Boolean(
          next.needs_clarification && next.clarification_question && next.clarification_options.length
        );
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
        setHistory((prev) => [
          toPreview({
            session_id: next.session_id,
            question: next.question || title,
            timestamp: new Date().toISOString(),
            thread_id: next.thread_id,
            parent_session_id: next.parent_session_id,
            is_followup: next.is_followup,
            run_title: next.followup_instruction || next.question,
          }),
          ...prev.filter((p) => p.id !== next.session_id),
        ]);
        generateTitle(next.question || title, next.role || "")
          .then((generatedTitle) => setSessionTitles((prev) => ({ ...prev, [next.session_id]: generatedTitle })))
          .catch(() => {});
      },
    });
  }

  const selectSession = async (id: string) => {
    setSelectedId(id);
    if (!loading) setActivity([]);
    requestAnimationFrame(() => {
      mainSessionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
    try {
      await deleteSession(id);
    } catch {
      return;
    }
    let fallbackId: string | null = null;
    setHistory((prev) => {
      const next = prev.filter((x) => x.id !== id);
      fallbackId = next[0]?.id ?? null;
      return next;
    });
    setResultsById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSessionTitles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
    setAdvancedOpen(true);
  }

  const panelProps = {
    result: displayResult,
    showFullDiscussion: true,
    loading,
    activity: panelActivity,
    cast: panelCast,
    clarificationPrompt,
    clarificationReason,
    clarificationOptions,
    clarificationChoice,
    clarificationOtherText,
    onClarificationChoice: chooseClarification,
    onClarificationOtherText: setClarificationOtherText,
    onSubmitClarification: () =>
      runConsult(clarificationChoice === "Other" ? clarificationOtherText.trim() : clarificationChoice),
    followupOpen,
    followupInstruction,
    followupConstraints,
    followupChangedSinceOpen,
    onOpenFollowup: openFollowup,
    onFollowupInstructionChange: setFollowupInstruction,
    onFollowupConstraintsChange: setFollowupConstraints,
    onAdjustFollowupTeam: adjustFollowupTeam,
    onSubmitFollowup: runFollowup,
    onRetryFollowup: runFollowup,
    onStartFresh: startNewQuestion,
    followupError,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav dark={dark} onToggleDark={toggleDark} />

      <div className="flex min-h-0 flex-1 w-full flex-col md:flex-row">
        <ConsensusRunsSidebar
          open={runsSidebarOpen}
          onOpenChange={setRunsSidebarOpen}
          sessions={history}
          selectedId={selectedId}
          sessionTitles={sessionTitles}
          resultsById={resultsById}
          castBySession={castBySession}
          chatPanelProps={panelProps}
          onSelect={selectSession}
          onDelete={removeSession}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-3 py-4 pb-14 sm:gap-6 sm:px-4 sm:py-6 sm:pb-16">
            {toast && (
              <div
                className="rounded-xl border border-violet-500/30 bg-violet-500/10 text-foreground px-3 py-2.5 text-sm"
                role="status"
              >
                {toast}
              </div>
            )}

            <section className="flex justify-end">
              <input
                ref={toolbarFileInputRef}
                className="hidden"
                type="file"
                multiple
                accept={supportedUploadTypes()}
                onChange={(e) => void addFilesFromToolbar(e.target.files)}
              />
              <div className="flex w-full max-w-[760px] flex-wrap items-end justify-end gap-2 rounded-2xl border border-violet-500/20 bg-[var(--v2-surface)] px-2.5 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl border border-violet-300/45 bg-violet-50 text-violet-700 hover:border-violet-400/70 hover:bg-violet-100 hover:shadow-[0_2px_10px_rgba(124,58,237,0.16)]"
                  onClick={() => toolbarFileInputRef.current?.click()}
                  aria-label="Upload context files"
                >
                  <Upload className="h-4.5 w-4.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl border border-violet-300/45 bg-violet-50 text-violet-700 hover:border-violet-400/70 hover:bg-violet-100 hover:shadow-[0_2px_10px_rgba(124,58,237,0.16)]"
                  onClick={() => void pasteFromToolbar()}
                  aria-label="Paste context from clipboard"
                >
                  <ClipboardPaste className="h-4.5 w-4.5" />
                </Button>
                <div className="mx-1 hidden h-7 w-px bg-violet-400/25 sm:block" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl border border-violet-300/45 bg-violet-50 text-violet-700 hover:border-violet-400/70 hover:bg-violet-100 hover:shadow-[0_2px_10px_rgba(124,58,237,0.16)]"
                  onClick={() => setAdvancedOpen(true)}
                  aria-label="Open advanced setup"
                >
                  <Settings2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            </section>

            <AgentStrip
              team={team}
              onTeamChange={setTeam}
              leadRole={form.role}
              loading={loading}
              lastActivityLine={activity[activity.length - 1]}
            />

            <LeadRoleField
              value={form.role}
              disabled={loading}
              onChange={(role) => setForm((f) => ({ ...f, role }))}
            />

            <CommandBar
              value={form.question}
              userDisplayName={userDisplayName}
              loading={loading}
              disabled={loading}
              onChange={(question) => setForm((f) => ({ ...f, question }))}
              onSubmit={() => runConsult()}
            />

            <section className="grid gap-2 sm:grid-cols-2">
              <label className="grid min-w-[170px] gap-1 rounded-xl bg-white px-2.5 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Debate passes</span>
                <Select
                  value={String(form.max_rounds)}
                  onValueChange={(v) => setForm((f) => ({ ...f, max_rounds: Number(v) }))}
                >
                  <SelectTrigger className="h-8 w-full border border-violet-300/60 bg-white px-2.5 text-sm shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUND_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid min-w-[170px] gap-1 rounded-xl bg-white px-2.5 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Agreement score</span>
                <Select
                  value={String(form.consensus_score)}
                  onValueChange={(v) => setForm((f) => ({ ...f, consensus_score: Number(v) }))}
                >
                  <SelectTrigger className="h-8 w-full border border-violet-300/60 bg-white px-2.5 text-sm shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCORE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </section>

            <ComposerAttachmentPanel attachments={attachments} onAttachmentsChange={setAttachments} />

            <div
              ref={mainSessionPanelRef}
              className="v2-consensus-shell scroll-mt-24 rounded-2xl border border-violet-500/15 p-3 sm:p-4"
            >
              <ChatPanel {...panelProps} />
            </div>

            <AgentTileGrid team={team} loading={loading} activity={activity} result={displayResult} />

            <AdvancedDrawer
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              form={form}
              team={team}
              attachments={attachments}
              loading={loading}
              canSubmit={Boolean(form.question.trim())}
              onFormChange={setForm}
              onTeamChange={setTeam}
              onAttachmentsChange={setAttachments}
              onSubmit={() => runConsult()}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
