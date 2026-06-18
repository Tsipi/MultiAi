import { DEBATE_SYSTEM_AVATAR } from "./DebateActivityPrimitives";

type Props = { label: string; avatar: string; action?: string };

export function TypingRow({ label, avatar, action = "is typing" }: Props) {
  return (
    <div className="flex items-center gap-3 px-1 py-1.5 animate-in fade-in duration-200">
      <img
        src={avatar || DEBATE_SYSTEM_AVATAR}
        alt={label}
        className="h-8 w-8 shrink-0 rounded-full border border-border object-cover"
        onError={(event) => {
          event.currentTarget.src = DEBATE_SYSTEM_AVATAR;
        }}
      />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-medium">{label}</span>
        <span>{action}</span>
        <span className="flex items-center gap-0.5 ml-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
