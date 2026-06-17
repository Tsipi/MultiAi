import AgentStudioAssistant from "../../../avatars/AgentStudioAssistant.png";
import { Button } from "@/components/ui/button";

type Props = {
  onStartNewSession: () => void;
};

export function SavedAnswerMarketingCard({ onStartNewSession }: Props) {
  return (
    <div className="flex w-full max-w-[880px] items-center gap-4 rounded-[28px] border border-violet-200/85 bg-white shadow-sm shadow-violet-100/40 px-5 py-4">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl">
        <img
          src={AgentStudioAssistant}
          alt="AI assistant"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-violet-700">
          Create a new AI team question
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
          Launch a fresh team run, align your AI experts, and get a faster consensus answer with one click.
        </p>
      </div>
      <Button
        type="button"
        className="primary-cta font-display h-11 rounded-xl border-0 px-6 font-semibold shadow-none"
        onClick={onStartNewSession}
      >
        Start new session
      </Button>
    </div>
  );
}
