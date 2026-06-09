import { Dispatch, SetStateAction } from "react";
import { FACE_OPTIONS, TeamMember } from "@/data/experts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { FieldLabelWithTip } from "../primitives/FieldLabelWithTip";
import { TeamMemberDutyModelRow } from "./TeamMemberDutyModelRow";

type Props = {
  draft: TeamMember;
  setDraft: Dispatch<SetStateAction<TeamMember | null>>;
  leadRole: string;
  onCancel: () => void;
  onSave: () => void;
};

export function TeamMemberEditForm({ draft, setDraft, leadRole, onCancel, onSave }: Props) {
  const selectedFace = FACE_OPTIONS.find((f) => f.name === draft.name) ?? FACE_OPTIONS[0];
  const chooseMember = (name: string) => {
    const face = FACE_OPTIONS.find((f) => f.name === name);
    if (!face) return;
    setDraft((d) => (d ? { ...d, name: face.name, avatar: face.avatar, expertiseTag: face.expertiseTag } : d));
  };

  return (
    <>
      <div className="grid gap-3">
        <div className="grid min-w-0 gap-1">
          <FieldLabelWithTip label="Team member" tip="Choose a teammate; avatar updates automatically." />
          <Select value={selectedFace.name} onValueChange={chooseMember}>
            <SelectTrigger className="[&>span]:line-clamp-none">
              <div className="flex min-w-0 items-center gap-2">
                <img src={selectedFace.avatar} alt="" className="h-6 w-6 rounded-full border border-border/60" />
                <span className="truncate">{selectedFace.name}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="z-[140]">
              {FACE_OPTIONS.map((f) => (
                <SelectItem key={f.name} value={f.name}>
                  <span className="flex min-w-0 items-center gap-2">
                    <img src={f.avatar} alt="" className="h-5 w-5 rounded-full border border-border/60" />
                    <span className="truncate">{f.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TeamMemberDutyModelRow member={draft} onUpdate={(next) => setDraft(next)} />
        <div className="grid min-w-0 gap-1">
          <FieldLabelWithTip label="Expert focus (prompt)" tip="Seat-specific instruction for this run." />
          <Input
            value={draft.role}
            placeholder={leadRole || "e.g. You are an expert in ..."}
            onChange={(e) => setDraft({ ...draft, role: e.target.value, lockToBaseRole: false })}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="button" size="sm" className="v2-primary-cta border-0 shadow-none" onClick={onSave}>Save</Button>
      </div>
    </>
  );
}
