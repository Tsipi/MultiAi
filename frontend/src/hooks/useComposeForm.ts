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
};

export function useComposeForm(setToast: (msg: string) => void) {
  const [form, setForm] = useState<ConsultPayload>(defaults);
  const [team, setTeam] = useState<TeamMember[]>(() => createDefaultTeam(""));
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [activeCast, setActiveCast] = useState<CastSelection>(() =>
    selectCastFromTeam(createDefaultTeam(""))
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
    defaults,
  };
}
