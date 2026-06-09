import { cn } from "@/lib/utils";
import { ModelProviderIcon } from "../primitives/ModelProviderIcon";

export type RosterFace = { name: string; avatar: string; model: string };

type Props = { faces: RosterFace[]; className?: string };

/**
 * Compact roster for the Final Answer header: small faces with the same
 * colored LLM badges as Advanced setup (ModelProviderIcon).
 */
export function FinalAnswerHeaderRoster({ faces, className }: Props) {
  if (!faces.length) return null;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {faces.map((p, i) => (
        <div
          key={`${p.name}-${i}`}
          className="relative h-7 w-7 shrink-0"
          title={`${p.name} (${p.model})`}
        >
          <img
            src={p.avatar}
            alt=""
            className="h-7 w-7 rounded-full border border-violet-300/45 object-cover shadow-sm ring-2 ring-background dark:border-violet-600/40"
          />
          <span className="absolute -bottom-px -right-px flex leading-none">
            <ModelProviderIcon
              modelId={p.model}
              title={p.model}
              className="!h-[14px] !w-[14px] !min-h-0 !rounded-[4px] !text-[7px]"
            />
          </span>
        </div>
      ))}
    </div>
  );
}
