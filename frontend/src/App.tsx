import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Components ───────────────────────────────────────────────────────────────
import { ConsensusRunsSidebar } from "./components/layout/ConsensusRunsSidebar";
import { AdvancedDrawer } from "./components/drawers/AdvancedDrawer";
import { InsightsDrawer } from "./components/drawers/InsightsDrawer";
import { CommandBar } from "./components/compose/CommandBar";
import { TopNav } from "./components/layout/TopNav";
import { ChatPanel } from "./components/debate/ChatPanel";
import { TemplateDrawer } from "./components/drawers/TemplateDrawer";

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useDarkMode } from "./hooks/useDarkMode";
import { useComposeForm } from "./hooks/useComposeForm";
import { useSessionHistory } from "./hooks/useSessionHistory";
import { useClarification } from "./hooks/useClarification";
import { useFollowup } from "./hooks/useFollowup";
import { useToast } from "./hooks/useToast";
import { usePanelState } from "./hooks/usePanelState";
import { useAuth } from "./hooks/useAuth";
import { useConsultRun, applyRunResult } from "./hooks/useConsultRun";

// ─── Lib / data ───────────────────────────────────────────────────────────────
import { mergeTeamIntoPayload, selectCastFromTeam, castToTeam, buildRunSignature, type CastSelection } from "./lib/consultHelpers";
import { deleteSession, getSession, shareSession, unshareSession } from "./services/api";
import { MODEL_OPTIONS } from "./data/models";
import { inferTeamTemplateId, TEAM_TEMPLATES, type TeamTemplate } from "./data/templates";
import { createDefaultTeam, findFaceByName } from "./data/experts";
import type { ConsultPayload, ConsultResult } from "./types";

// ─── Pages ────────────────────────────────────────────────────────────────────
import { LoginPage } from "./pages/LoginPage";
import { SharedRunPage } from "./pages/SharedRunPage";

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const { isLoggedIn, email, logout, login, register } = useAuth();

  // Derive a display name from the email local-part (e.g. "tsipi@..." → "Tsipi")
  const greetingName = email
    ? (() => { const local = email.split("@")[0]; return local.charAt(0).toUpperCase() + local.slice(1); })()
    : "there";

  // ─── Routing ───────────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const location = useLocation();

  // ─── UI state ──────────────────────────────────────────────────────────────
  const [dark, toggleDark] = useDarkMode();
  const { toast, setToast } = useToast();
  const { advancedOpen, setAdvancedOpen, insightsOpen, setInsightsOpen, runsSidebarOpen, setRunsSidebarOpen } = usePanelState();
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // ─── Compose / team ────────────────────────────────────────────────────────
  const { form, setForm, team, setTeam, attachments, setAttachments, activeCast, setActiveCast, addTeamMember } = useComposeForm(setToast);

  // ─── Session history ───────────────────────────────────────────────────────
  const { history, setHistory, selectedId, setSelectedId, resultsById, setResultsById, castBySession, setCastBySession, sessionTitles, setSessionTitles } = useSessionHistory(isLoggedIn);

  // ─── Clarification ─────────────────────────────────────────────────────────
  const { clarificationPrompt, setClarificationPrompt, clarificationReason, setClarificationReason, clarificationOptions, setClarificationOptions, clarificationChoice, clarificationOtherText, setClarificationOtherText, chooseClarification, clearClarification } = useClarification();

  // ─── Follow-up ─────────────────────────────────────────────────────────────
  const { followupOpen, setFollowupOpen, followupInstruction, setFollowupInstruction, followupConstraints, setFollowupConstraints, followupSeed, setFollowupSeed, followupError, setFollowupError, clearFollowupState } = useFollowup();

  // ─── Run engine ────────────────────────────────────────────────────────────
  const [result, setResult] = useState<ConsultResult | null>(null);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);
  const pendingClarificationRef = useRef<{ payload: ConsultPayload; cast: CastSelection; title: string } | null>(null);

  const resultSetters = { setResult, setResultsById, setCastBySession, setSelectedId: setSelectedId as (id: string) => void, setHistory, setSessionTitles };

  const { loading, setLoading, activity, setActivity, isResuming, setIsResuming, execute } = useConsultRun({
    onClarificationNeeded: (data, pending) => {
      pendingClarificationRef.current = pending;
      setClarificationPrompt(data.question);
      setClarificationReason(data.reason);
      setClarificationOptions(data.options);
      setClarificationOtherText("");
      chooseClarification(data.options[0] ?? "");
    },
    onRunComplete: (next, cast, title) => {
      applyRunResult(next, cast, title, navigate, resultSetters);
    },
  });

  // ─── Derived values ────────────────────────────────────────────────────────
  const displayResult = selectedId ? resultsById[selectedId] ?? result : result;

  // When viewing a saved session with no explicit template, infer it from the cast names
  const inferredTemplateId = useMemo(() => {
    if (activeTemplateId) return null; // explicit selection wins
    return inferTeamTemplateId({
      writerName: displayResult?.writer_names?.[0],
      criticNames: displayResult?.critic_names,
      writerModel: displayResult?.model_writers?.[0],
      criticModels: displayResult?.model_critics,
    });
  }, [activeTemplateId, displayResult]);

  const resolvedTemplateId = activeTemplateId ?? inferredTemplateId;

  const runSignature = useMemo(() => buildRunSignature(team, form), [team, form]);
  const followupChangedSinceOpen = Boolean(followupOpen && followupSeed && followupSeed !== runSignature);

  const panelCast = useMemo<CastSelection>(() => {
    if (!selectedId) return activeCast;
    if (castBySession[selectedId]) return castBySession[selectedId];
    const res = resultsById[selectedId];
    if (res?.model_critics?.length) {
      const writerModel = res.model_writers?.[0] ?? "";
      const writerName = res.writer_names?.[0] || team.find((m) => m.duty === "writer")?.name || team[0]?.name || "Writer";
      const writer = {
        name: writerName,
        avatar: findFaceByName(writerName).avatar,
        model: writerModel || team.find((m) => m.duty === "writer")?.model || team[0]?.model || "",
      };
      const critics = res.model_critics.map((model, i) => {
        const modelLabel =
          MODEL_OPTIONS.find((o) => o.id === model)?.label ??
          (model.includes("/") ? model.split("/").pop()! : model);
        const name = res.critic_names?.[i] || modelLabel || `Critic ${i + 1}`;
        return { name, avatar: findFaceByName(name).avatar, model };
      });
      return { writer, critics };
    }
    return activeCast;
  }, [selectedId, castBySession, activeCast, resultsById, team]);

  // ─── URL sync (back/forward navigation) ────────────────────────────────────
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

  // ─── Consult orchestration ─────────────────────────────────────────────────

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
    requestAnimationFrame(() => mainPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    setActivity(["Queued request. Your team is assembling the debate..."]);
    clearClarification();
    const cast = selectCastFromTeam(team);
    setActiveCast(cast);
    const payload = mergeTeamIntoPayload({ ...form, question: questionText }, team, attachments, clarificationTag, clarificationQuestion);
    try {
      await execute(payload, cast, questionText);
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
    if (!displayResult || !followupInstruction.trim()) return;
    const cast = panelCast;
    setActiveCast(cast);
    setFollowupError("");
    setAdvancedOpen(false);
    setRunsSidebarOpen(true);
    setLoading(true);
    requestAnimationFrame(() => mainPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    setActivity([`Starting follow-up run from session ${displayResult.session_id}`]);
    if (followupChangedSinceOpen) setActivity((prev) => [...prev, "Using updated team/settings"]);
    const mergedInstruction = [followupInstruction.trim(), followupConstraints.trim()].filter(Boolean).join("\n\n");
    const rootQ = displayResult.root_question || displayResult.source_prompt || displayResult.question;
    const followupQuestion = [
      "Original prompt:", rootQ, "",
      "Previous final answer:", displayResult.source_final_answer || displayResult.final_answer, "",
      "Follow-up instruction:", mergedInstruction,
    ].join("\n");
    const basePayload = mergeTeamIntoPayload(
      { ...form, question: followupQuestion, is_followup: true, parent_session_id: displayResult.session_id, thread_id: displayResult.thread_id || displayResult.session_id, source_prompt: displayResult.source_prompt || displayResult.question, source_final_answer: displayResult.source_final_answer || displayResult.final_answer, followup_instruction: mergedInstruction, role: displayResult.role || form.role },
      team, [], ""
    );
    const payload = { ...basePayload, writers: [cast.writer.model], critics: cast.critics.map((c) => c.model), writer: cast.writer.model, critic_a: cast.critics[0]?.model ?? "", critic_b: cast.critics[1]?.model ?? "", writer_names: [cast.writer.name], critic_names: cast.critics.map((c) => c.name), root_question: rootQ };
    try {
      await execute(payload, cast, mergedInstruction);
      setFollowupOpen(false);
    } catch (error) {
      setFollowupError(String(error));
      setActivity((prev) => [...prev, `Stream error: ${String(error)}`]);
    } finally {
      setLoading(false);
    }
  }

  async function resumeWithClarification(answer: string) {
    const pending = pendingClarificationRef.current;
    const questionAsked = clarificationPrompt;
    pendingClarificationRef.current = null;
    clearFollowupState();
    if (pending?.payload?.is_followup) setIsResuming(true);
    setLoading(true);
    setResult(null);
    setSelectedId(null);
    clearClarification();
    setActivity(["Resuming with your clarification…"]);
    requestAnimationFrame(() => mainPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    const { payload: basePayload, cast: baseCast, title: baseTitle } = pending ?? {
      payload: mergeTeamIntoPayload({ ...form }, team, attachments, "", ""),
      cast: selectCastFromTeam(team),
      title: form.question,
    };
    const nextPayload: ConsultPayload = { ...basePayload, clarification: answer, clarification_question: questionAsked };
    try {
      await execute(nextPayload, baseCast, baseTitle);
    } catch (error) {
      setActivity((prev) => [...prev, `Stream error: ${String(error)}`]);
    } finally {
      setLoading(false);
      setIsResuming(false);
    }
  }

  // ─── Session management ────────────────────────────────────────────────────

  const selectSession = async (id: string) => {
    setSelectedId(id);
    if (!loading) setActivity([]);
    requestAnimationFrame(() => mainPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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

  const handleShareToggle = async () => {
    if (!displayResult) return;
    const id = displayResult.session_id;
    try {
      if (displayResult.visibility === "public") {
        await unshareSession(id);
        applyShareState(id, "private", null);
        setToast("Run is now private.");
      } else {
        const slug = await shareSession(id);
        applyShareState(id, "public", slug);
        const url = `${window.location.origin}/shared/${slug}`;
        await navigator.clipboard.writeText(url);
        setToast("Share link copied to clipboard.");
      }
    } catch {
      setToast("Could not update sharing for this run.");
    }
  };

  function applyShareState(id: string, visibility: "private" | "public", slug: string | null) {
    setResultsById((prev) =>
      prev[id] ? { ...prev, [id]: { ...prev[id], visibility, public_slug: slug } } : prev
    );
    setResult((prev) => (prev?.session_id === id ? { ...prev, visibility, public_slug: slug } : prev));
  }

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
    setResultsById((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setSessionTitles((prev) => { const next = { ...prev }; delete next[id]; return next; });
    if (selectedId === id) {
      setSelectedId(fallbackId);
      setResult(fallbackId ? resultsById[fallbackId] ?? null : null);
      navigate(fallbackId ? `/app/run/${fallbackId}` : "/app/new");
    }
  };

  // ─── Navigation helpers ────────────────────────────────────────────────────

  function startNewQuestion() {
    navigate("/app/new");
    setSelectedId(null);
    setResult(null);
    setActivity([]);
    clearFollowupState();
  }

  function startNewQuestionWithSessionTeam() {
    if (selectedId) {
      const baseRole = displayResult?.role || form.role;
      setTeam(castToTeam(panelCast, baseRole));
      if (displayResult?.role) setForm((f) => ({ ...f, role: displayResult.role! }));
      if (resolvedTemplateId) setActiveTemplateId(resolvedTemplateId);
    }
    startNewQuestion();
  }

  function startFreshNewRun() {
    setTeam(createDefaultTeam(form.role));
    setActiveTemplateId(null);
    startNewQuestion();
  }

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

  function handleSelectTemplate(template: TeamTemplate) {
    setTeam(template.members);
    setActiveTemplateId(template.id);
  }

  // ─── Panel props ───────────────────────────────────────────────────────────

  const teamTemplateName = TEAM_TEMPLATES.find((t) => t.id === resolvedTemplateId)?.name;

  const panelProps = {
    teamTemplateName,
    result: displayResult,
    showFullDiscussion: true,
    loading,
    activity,
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
    onAdjustFollowupTeam: () => setAdvancedOpen(true),
    onSubmitFollowup: runFollowup,
    onRetryFollowup: runFollowup,
    onStartFresh: startNewQuestion,
    isSavedAnswer: Boolean(selectedId),
    onAskFollowup: openFollowup,
    onStartNewSession: startNewQuestionWithSessionTeam,
    onOpenInsights: () => setInsightsOpen(true),
    onOpenAdvanced: openAdvancedWithSessionTeam,
    followupError,
    onShareToggle: handleShareToggle,
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const sharedSlugMatch = location.pathname.match(/^\/shared\/(.+)$/);
  if (sharedSlugMatch) {
    return <SharedRunPage slug={sharedSlugMatch[1]} />;
  }

  if (!isLoggedIn) return <LoginPage onLogin={login} onRegister={register} />;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav dark={dark} onToggleDark={toggleDark} onNewRun={startFreshNewRun} onOpenTemplates={() => setTemplatesOpen(true)} />

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
          userEmail={email}
          onLogout={logout}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-3 py-4 pb-14 sm:gap-6 sm:px-4 sm:py-6 sm:pb-16">

            {toast && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 text-foreground px-3 py-2.5 text-sm" role="status">
                {toast}
              </div>
            )}

            {!displayResult && !isResuming && (
              <CommandBar
                value={form.question}
                greetingName={greetingName}
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

            <div ref={mainPanelRef} className="v2-consensus-shell scroll-mt-24 rounded-2xl border border-violet-500/15 p-3 sm:p-4">
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
