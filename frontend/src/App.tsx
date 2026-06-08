import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { ConsensusRunsSidebar } from "./components/ConsensusRunsSidebar";
import { AdvancedDrawer } from "./components/AdvancedDrawer";
import { InsightsDrawer } from "./components/InsightsDrawer";
import { CommandBar } from "./components/CommandBar";
import { TopNav } from "./components/TopNav";
import { ChatPanel } from "./components/ChatPanel";
import { mergeTeamIntoPayload, selectCastFromTeam, toPreview, buildRunSignature, type CastSelection } from "./lib/consultHelpers";
import { consultStream, deleteSession, generateTitle, getSession } from "./services/api";
import { ConsultPayload, ConsultResult, SessionPreview } from "./types";
import { MODEL_OPTIONS } from "./data/models";
import { mkMember, type TeamMember } from "./data/experts";
import { type TeamTemplate } from "./data/templates";
import { TemplateDrawer } from "./components/TemplateDrawer";
import { useDarkMode } from "./hooks/useDarkMode";
import { useComposeForm } from "./hooks/useComposeForm";
import { useSessionHistory } from "./hooks/useSessionHistory";
import { useClarification } from "./hooks/useClarification";
import { useFollowup } from "./hooks/useFollowup";
import { useToast } from "./hooks/useToast";
import { usePanelState } from "./hooks/usePanelState";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  const { isLoggedIn, email, logout, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  // True only during resumeWithClarification — used to hide CommandBar without affecting fresh runs
  const [isResuming, setIsResuming] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const mainSessionPanelRef = useRef<HTMLDivElement | null>(null);
  // Stores the last payload sent so clarification Continue can replay the exact same run
  const pendingClarificationRef = useRef<{ payload: ConsultPayload; cast: CastSelection; title: string } | null>(null);

  // Derived values
  const displayResult = selectedId ? resultsById[selectedId] ?? result : result;
  const panelCast = useMemo(() => {
    if (!selectedId) return activeCast;
    if (castBySession[selectedId]) return castBySession[selectedId];
    // For old sessions without a stored cast, rebuild from model IDs in the result
    const res = resultsById[selectedId];
    if (res?.model_critics?.length) {
      const writerModel = res.model_writers?.[0] ?? "";
      const writerMember = team.find((m) => m.duty === "writer" && m.model === writerModel)
        ?? team.find((m) => m.duty === "writer")
        ?? team[0];
      const usedIds = new Set<string>();
      const critics = res.model_critics.map((model, i) => {
        const member = team.find((m) => m.model === model && !usedIds.has(m.id));
        if (member) usedIds.add(member.id);
        const modelLabel = MODEL_OPTIONS.find((o) => o.id === model)?.label
          ?? (model.includes("/") ? model.split("/").pop()! : model);
        const fallbackName = res.critic_names?.[i] || modelLabel || `Critic ${i + 1}`;
        return { name: member?.name ?? fallbackName, avatar: member?.avatar ?? writerMember.avatar, model };
      });
      return { writer: { name: writerMember.name, avatar: writerMember.avatar, model: writerMember.model }, critics };
    }
    return activeCast;
  }, [selectedId, castBySession, activeCast, resultsById, team]);
  const panelActivity = activity;
  const runSignature = useMemo(() => buildRunSignature(team, form), [team, form]);
  const followupChangedSinceOpen = Boolean(followupOpen && followupSeed && followupSeed !== runSignature);

  // Sync state from URL — handles browser back/forward and direct links
  useEffect(() => {
    const runMatch = location.pathname.match(/^\/app\/run\/(.+)$/);
    if (runMatch) {
      void selectSession(runMatch[1]);
    } else if (location.pathname === "/app/new" || location.pathname === "/") {
      setSelectedId(null);
      setResult(null);
      setActivity([]);
      clearFollowupState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // --- Orchestration ---

  const runConsult = async (clarificationTag = "", questionOverride?: string, clarificationQuestion?: string) => {
    const questionText = (questionOverride ?? form.question).trim();
    if (!questionText) return;
    clearFollowupState();
    setAdvancedOpen(false);
    setRunsSidebarOpen(true);
    setLoading(true);
    setResult(null);
    setSelectedId(null);
    navigate("/app/new");
    requestAnimationFrame(() => {
      mainSessionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    setActivity(["Queued request. Your team is assembling the debate..."]);
    clearClarification();
    const cast = selectCastFromTeam(team);
    setActiveCast(cast);
    const payload = mergeTeamIntoPayload({ ...form, question: questionText }, team, attachments, clarificationTag, clarificationQuestion);
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
    // Use the session's cast (panelCast reflects the viewed session's team)
    const cast = panelCast;
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
    // Always anchor to the root question so context doesn't drift across follow-up chains
    const rootQ = source.root_question || source.source_prompt || source.question;
    const followupQuestion = [
      "Original prompt:",
      rootQ,
      "",
      "Previous final answer:",
      source.source_final_answer || source.final_answer,
      "",
      "Follow-up instruction:",
      mergedInstruction,
    ].join("\n");
    // Build base payload from form (role, settings, etc.) then override with session's models/names
    const basePayload = mergeTeamIntoPayload(
      {
        ...form,
        question: followupQuestion,
        is_followup: true,
        parent_session_id: source.session_id,
        thread_id: source.thread_id || source.session_id,
        source_prompt: source.source_prompt || source.question,
        source_final_answer: source.source_final_answer || source.final_answer,
        followup_instruction: mergedInstruction,
        role: source.role || form.role,
      },
      team,
      [],
      ""
    );
    const payload = {
      ...basePayload,
      writers: [cast.writer.model],
      critics: cast.critics.map((c) => c.model),
      writer: cast.writer.model,
      critic_a: cast.critics[0]?.model ?? "",
      critic_b: cast.critics[1]?.model ?? "",
      writer_names: [cast.writer.name],
      critic_names: cast.critics.map((c) => c.name),
      root_question: rootQ,
    };
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
          pendingClarificationRef.current = { payload, cast, title };
          setClarificationPrompt(next.clarification_question);
          setClarificationReason(next.clarification_reason);
          setClarificationOptions(next.clarification_options);
          setClarificationOtherText("");
          chooseClarification(next.clarification_options[0] ?? "");
          setActivity((prev) => [...prev, "Waiting for user clarification"]);
          return;
        }
        pendingClarificationRef.current = null;
        setResult(next);
        setResultsById((prev) => ({ ...prev, [next.session_id]: next }));
        setCastBySession((prev) => ({ ...prev, [next.session_id]: cast }));
        setSelectedId(next.session_id);
        navigate(`/app/run/${next.session_id}`);
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

  async function resumeWithClarification(answer: string) {
    const pending = pendingClarificationRef.current;
    const questionAsked = clarificationPrompt;
    pendingClarificationRef.current = null;
    clearFollowupState();
    // Only suppress the CommandBar for follow-up resumes; fresh-run clarifications should keep it visible
    if (pending?.payload?.is_followup) setIsResuming(true);
    setLoading(true);
    setResult(null);
    setSelectedId(null);
    clearClarification();
    setActivity(["Resuming with your clarification…"]);
    requestAnimationFrame(() => {
      mainSessionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const { payload: basePayload, cast: baseCast, title: baseTitle } = pending ?? {
      payload: mergeTeamIntoPayload({ ...form }, team, attachments, "", ""),
      cast: selectCastFromTeam(team),
      title: form.question,
    };
    const nextPayload: ConsultPayload = { ...basePayload, clarification: answer, clarification_question: questionAsked };
    try {
      await executeConsult(nextPayload, baseCast, baseTitle);
    } catch (error) {
      setActivity((prev) => [...prev, `Stream error: ${String(error)}`]);
    } finally {
      setLoading(false);
      setIsResuming(false);
    }
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
      navigate(fallbackId ? `/app/run/${fallbackId}` : "/app/new");
    }
  };

  function startNewQuestion() {
    navigate("/app/new");
    setSelectedId(null);
    setResult(null);
    setActivity([]);
    clearFollowupState();
  }

  /** Rebuild a TeamMember[] from the session cast so the form/drawer shows the right people. */
  function castToTeam(cast: CastSelection, baseRole: string): TeamMember[] {
    const writer = mkMember(cast.writer.name.toLowerCase(), cast.writer.name, cast.writer.avatar, cast.writer.model, "writer", baseRole);
    const critics = cast.critics.map((c) => mkMember(c.name.toLowerCase(), c.name, c.avatar, c.model, "critic", baseRole));
    return [writer, ...critics];
  }

  /** "New question" — restores the viewed session's team so CommandBar shows the right squad. */
  function startNewQuestionWithSessionTeam() {
    if (selectedId) {
      const baseRole = displayResult?.role || form.role;
      setTeam(castToTeam(panelCast, baseRole));
      if (displayResult?.role) setForm((f) => ({ ...f, role: displayResult.role! }));
    }
    startNewQuestion();
  }

  /** Open Advanced Setup pre-loaded with the viewed session's team. */
  function openAdvancedWithSessionTeam() {
    if (selectedId) {
      const baseRole = displayResult?.role || form.role;
      setTeam(castToTeam(panelCast, baseRole));
      if (displayResult?.role) setForm((f) => ({ ...f, role: displayResult.role! }));
    }
    setAdvancedOpen(true);
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

  function handleSelectTemplate(template: TeamTemplate) {
    setTeam(template.members);
    setActiveTemplateId(template.id);
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
    onSubmitClarification: () => {
      const answer = clarificationChoice === "Other" ? clarificationOtherText.trim() : clarificationChoice;
      void resumeWithClarification(answer);
    },
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
    onStartNewSession: startNewQuestionWithSessionTeam,
    onOpenInsights: () => setInsightsOpen(true),
    onOpenAdvanced: openAdvancedWithSessionTeam,
    followupError,
  };

  // --- Render ---

  if (!isLoggedIn) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  if (location.pathname.startsWith("/shared/")) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Public shared runs are coming in v4.2.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav dark={dark} onToggleDark={toggleDark} onNewRun={startNewQuestion} onOpenTemplates={() => setTemplatesOpen(true)} userEmail={email} onLogout={logout} />

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
          onSelect={(id) => navigate(`/app/run/${id}`)}
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

            {!displayResult && !isResuming && (
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
                activeTemplateId={activeTemplateId}
                onSelectTemplate={handleSelectTemplate}
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
            <TemplateDrawer
              open={templatesOpen}
              onClose={() => setTemplatesOpen(false)}
              activeTemplateId={activeTemplateId}
              onSelect={handleSelectTemplate}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
