import { useEffect, useState } from "react";
import { listSessions } from "@/services/api";
import { ConsultResult, SessionPreview } from "@/types";
import { type CastSelection } from "@/lib/consultHelpers";
import { toPreview } from "@/lib/consultHelpers";

export function useSessionHistory() {
  const [history, setHistory] = useState<SessionPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resultsById, setResultsById] = useState<Record<string, ConsultResult>>({});
  const [castBySession, setCastBySession] = useState<Record<string, CastSelection>>({});
  const [sessionTitles, setSessionTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    listSessions()
      .then((rows) => setHistory(rows.map(toPreview)))
      .catch(() => setHistory([]));
  }, []);

  return {
    history,
    setHistory,
    selectedId,
    setSelectedId,
    resultsById,
    setResultsById,
    castBySession,
    setCastBySession,
    sessionTitles,
    setSessionTitles,
  };
}
