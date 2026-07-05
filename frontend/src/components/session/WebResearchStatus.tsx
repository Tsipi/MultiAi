import { AlertTriangle, ExternalLink, Globe2 } from "lucide-react";
import type { ConsultResult } from "@/types";

type Props = {
  result: ConsultResult;
};

export function WebResearchStatus({ result }: Props) {
  const retrievedAt = formatRetrievedAt(result.web_search_retrieved_at);
  const failed = Boolean(result.web_search_warning && !result.web_search_performed);
  const statusClass = result.web_search_performed
    ? "border-emerald-500/25 bg-emerald-500/[0.06]"
    : failed
      ? "border-amber-500/25 bg-amber-500/[0.06]"
      : "border-violet-500/15 bg-card/50";
  const statusLabel = result.web_search_performed
    ? "Live web research used"
    : failed
      ? "Live web research unavailable"
      : "Web research not used";

  return (
    <section
      className={`grid min-w-0 gap-2 overflow-hidden rounded-xl border p-3 ${statusClass}`}
      aria-label="Web research status"
    >
      <div className="flex items-center gap-2">
        {failed ? (
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <Globe2 className={result.web_search_performed
            ? "h-4 w-4 text-emerald-600 dark:text-emerald-400"
            : "h-4 w-4 text-violet-600 dark:text-violet-300"
          } />
        )}
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-foreground/85">
          {statusLabel}
        </p>
        {retrievedAt && (
          <span className="text-[0.68rem] text-muted-foreground">{retrievedAt}</span>
        )}
      </div>

      {!result.web_search_performed && !failed && (
        <p className="m-0 text-xs leading-snug text-muted-foreground">
          {result.web_search_mode === "off"
            ? "This run was configured not to use live web sources."
            : "Auto mode did not detect a request that required current web sources."}
        </p>
      )}

      {result.web_search_query && (
        <p className="m-0 text-xs leading-snug text-muted-foreground">
          Search query: <span className="font-medium text-foreground/80">{result.web_search_query}</span>
        </p>
      )}

      {result.web_search_warning && (
        <p className="m-0 text-xs leading-snug text-amber-700 dark:text-amber-300">
          {result.web_search_warning}
        </p>
      )}

      {result.web_search_sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.web_search_sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-500/20 bg-card/75 px-2 py-1 text-[0.7rem] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
              title={source.url}
            >
              <span className="truncate">{source.title || source.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function formatRetrievedAt(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
