import { useEffect, useState } from "react";
import { createDefaultTeam, TeamMember } from "@/data/experts";
import { appendDefaultTeamMember } from "@/lib/teamRoster";
import { AttachmentInput, ConsultPayload } from "@/types";
import { type CastSelection, selectCastFromTeam } from "@/lib/consultHelpers";

const defaults: ConsultPayload = {
  writer: "deepseek/deepseek-chat-v3.2",
  critic_a: "google/gemini-2.5-flash",
  critic_b: "google/gemini-2.5-flash",
  max_rounds: 3,
  consensus_score: 8,
  role: "",
  question: "",
  web_search_mode: "auto",
  answer_mode: "balanced",
};

export function createFreshComposeState() {
  const team = createDefaultTeam("");
  return {
    form: { ...defaults },
    team,
    attachments: [] as AttachmentInput[],
    activeCast: selectCastFromTeam(team),
  };
}

export function useComposeForm(setToast: (msg: string) => void) {
  const [form, setForm] = useState<ConsultPayload>(() => createFreshComposeState().form);
  const [team, setTeam] = useState<TeamMember[]>(() => createFreshComposeState().team);
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [activeCast, setActiveCast] = useState<CastSelection>(() =>
    createFreshComposeState().activeCast
  );

  // Sync team member roles when the shared role field changes
  useEffect(() => {
    setTeam((prev) =>
      prev.map((m) => (m.lockToBaseRole ? { ...m, role: form.role } : m))
    );
  }, [form.role]);

  // Auto-swap Deepseek seats to Gemini Flash when an image attachment is added
  useEffect(() => {
    if (!attachments.some((a) => a.kind === "image")) return;
    setTeam((prev) => {
      const switched = prev.filter(
        (m) => m.model === "deepseek/deepseek-chat-v3.2"
      ).length;
      const next = prev.map((m) =>
        m.model === "deepseek/deepseek-chat-v3.2"
          ? { ...m, model: "google/gemini-2.5-flash" }
          : m
      );
      if (switched > 0)
        setToast(
          `Image detected: switched ${switched} Deepseek seat(s) to Gemini Flash for vision support.`
        );
      return next;
    });
  }, [attachments, setToast]);

  function addTeamMember() {
    setTeam((t) => appendDefaultTeamMember(t, form.role));
  }

  function resetCompose() {
    const fresh = createFreshComposeState();
    setForm(fresh.form);
    setTeam(fresh.team);
    setAttachments(fresh.attachments);
    setActiveCast(fresh.activeCast);
  }

  return {
    form,
    setForm,
    team,
    setTeam,
    attachments,
    setAttachments,
    activeCast,
    setActiveCast,
    addTeamMember,
    resetCompose,
    defaults,
  };
}
