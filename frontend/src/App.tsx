import { useMemo, useRef, useState } from "react";
import { BarChart3, Settings2 } from "lucide-react";

import { ConsensusRunsSidebar } from "./components/ConsensusRunsSidebar";
import { AdvancedDrawer } from "./components/AdvancedDrawer";
import { InsightsDrawer } from "./components/InsightsDrawer";
import { CommandBar } from "./components/CommandBar";
import { SavedAnswerMarketingCard } from "./components/SavedAnswerMarketingCard";
import { TopNav } from "./components/TopNav";
import { ChatPanel } from "./components/ChatPanel";
import { mergeTeamIntoPayload, selectCastFromTeam, toPreview, buildRunSignature, type CastSelection } from "./lib/consultHelpers";
import { consultStream, deleteSession, generateTitle, getSession, listSessions } from "./services/api";
import { ConsultPayload, ConsultResult, SessionPreview } from "./types";
import { useDarkMode } from "./hooks/useDarkMode";
import { useComposeForm } from "./hooks/useComposeForm";
import { useSessionHistory } from "./hooks/useSessionHistory";
import { useClarification } from "./hooks/useClarification";
import { useFollowup } from "./hooks/useFollowup";
import { useToast } from "./hooks/useToast";
import { usePanelState } from "./hooks/usePanelState";
import { Button } from "@/components/ui/button";

export default function App() {
  const [dark, toggleDark] = useDarkMode();
  const { toast, setToast } = useToast();
  const { form, setForm, team, setTeam, attachments, setAttachments, activeCast, setActiveCast, addTeamMember } = useComposeForm(setToast);
  const { history, setHistory, selectedId, setSelectedId, resultsById, setResultsById, castBySession, setCastBySession, sessionTitles, setSessionTitles } = useSessionHistory();
  const { clarificationPrompt, setClarificationPrompt, clarificationReason, setClarificationReason, clarificationOptions, setClarificationOptions, clarificationChoice, clarificationOtherText, setClarificationOtherText, chooseClarification, clearClarification } = useClarification();
  const { followupOpen, setFollowupOpen, followupInstruction, setFollowupInstruction, followupConstraints, setFollowupConstraints, followupSeed, setFollowupSeed, followupError, setFollowupError, clearFollowupState } = useFollowup();
  const { advancedOpen, setAdvancedOpen, insightsOpen, setInsightsOpen, runsSidebarOpen, setRunsSidebarOpen } = usePanelState();

  // Live debate run state — mutated by executeConsult, kept here as it crosses multiple handlers
  const [result, setResult] = useState<ConsultResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const mainSessionPanelRef = useRef<HTMLDivElement | null>(null);

  // Derived values
  const displayResult = selectedId ? resultsById[selectedId] ?? result : result;
  const panelCast = selectedId ? castBySession[selectedId] ?? activeCast : activeCast;
  const panelActivity = activity;
  const runSignature = useMemo(() => buildRunSignature(team, form), [team, form]);
  const followupChangedSinceOpen = Boolean(followupOpen && followupSeed && followupSeed !== runSignature);

  // --- Orchestration ---

  const runConsult = async (clarificationTag = "", questionOverride?: string) => {
    const questionText = (questionOverride ?? form.question).trim();
    if (!questionText) return;
    clearFollowupState();
    setAdvancedOpen(false);
    setRunsSidebarOpen(true);
    setLoading(true);
    requestAnimationFrame(() => {
      mainSessionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    setActivity(["Queued request. Your team is assembling the debate..."]);
    clearClarification();
    const cast = selectCastFromTeam(team);
    setActiveCast(cast);
    const payload = mergeTeamIntoPayload({ ...form, question: questionText }, team, attachments, clarificationTag);
    try {
      await executeConsult(payload, cast, questionText);
    } catch (error) {
      setActivity((prev) => [...prev, `Stream error: ${String(error)}`]);
    } finally {
      setLoading(false);
    }
  };

  const resendQuestion = async (question: string) => {
    const next = question.trim();
    if (!next) return;
    setForm((f) => ({ ...f, question: next }));
    await runConsult("", next);
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
          setClarificationOtherText("");
          chooseClarification(next.clarification_options[0] ?? "");
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

  function openFollowup() {
    if (!displayResult) return;
    setFollowupOpen(true);
    setFollowupSeed(runSignature);
    if (!followupInstruction) setFollowupInstruction("");
  }

  function adjustFollowupTeam() {
    setAdvancedOpen(true);
  }

  // --- Panel props (assembled once, passed to ChatPanel and sidebar) ---

  const panelProps = {
    result: displayResult,
    showFullDiscussion: true,
    loading,
    activity: panelActivity,
    cast: panelCast,
    team,
    maxRounds: form.max_rounds,
    consensusThreshold: form.consensus_score,
    clarificationPrompt,
    clarificationReason,
    clarificationOptions,
    clarificationChoice,
    clarificationOtherText,
    onClarificationChoice: chooseClarification,
    onClarificationOtherText: setClarificationOtherText,
    onSubmitClarification: () =>
      runConsult(clarificationChoice === "Other" ? clarificationOtherText.trim() : clarificationChoice),
    onResendQuestion: resendQuestion,
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
    isSavedAnswer: Boolean(selectedId),
    onAskFollowup: openFollowup,
    onStartNewSession: startNewQuestion,
    followupError,
  };

  // --- Render ---

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav dark={dark} onToggleDark={toggleDark} onNewRun={startNewQuestion} />

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

            <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {displayResult ? (
                <>
                  <SavedAnswerMarketingCard onStartNewSession={startNewQuestion} />
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/20 bg-[var(--v2-surface)] px-1.5 py-1.5 shadow-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!displayResult}
                      className="h-9 w-9 rounded-xl border border-violet-300/45 bg-violet-50 text-violet-700 hover:border-violet-400/70 hover:bg-violet-100 hover:shadow-[0_2px_10px_rgba(124,58,237,0.16)] disabled:opacity-40"
                      onClick={() => setInsightsOpen(true)}
                      aria-label="Open session insights"
                    >
                      <BarChart3 className="h-4.5 w-4.5" />
                    </Button>
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
                </>
              ) : null}
            </section>

            {!displayResult && (
              <CommandBar
                value={form.question}
                greetingName="Tsipi"
                team={team}
                loading={loading}
                disabled={loading}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                onChange={(question) => setForm((f) => ({ ...f, question }))}
                onSubmit={() => runConsult()}
                onAddTeamMember={addTeamMember}
                onOpenAdvanced={() => setAdvancedOpen(true)}
              />
            )}

            <div
              ref={mainSessionPanelRef}
              className="v2-consensus-shell scroll-mt-24 rounded-2xl border border-violet-500/15 p-3 sm:p-4"
            >
              <ChatPanel {...panelProps} />
            </div>

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

            <InsightsDrawer open={insightsOpen} onOpenChange={setInsightsOpen} result={displayResult} />
          </div>
        </main>
      </div>
    </div>
  );
}
