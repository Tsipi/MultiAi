import { useEffect, useState } from "react";
import { listSessions } from "@/services/api";
import { ConsultResult, SessionPreview } from "@/types";
import { type CastSelection, toPreview } from "@/lib/consultHelpers";

const CAST_STORAGE_KEY = "multiAi_castBySession";

function loadCastFromStorage(): Record<string, CastSelection> {
  try {
    const raw = localStorage.getItem(CAST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useSessionHistory(isLoggedIn: boolean) {
  const [history, setHistory] = useState<SessionPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resultsById, setResultsById] = useState<Record<string, ConsultResult>>({});
  const [castBySession, setCastBySession] = useState<Record<string, CastSelection>>(loadCastFromStorage);
  const [sessionTitles, setSessionTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      localStorage.setItem(CAST_STORAGE_KEY, JSON.stringify(castBySession));
    } catch {}
  }, [castBySession]);

  useEffect(() => {
    if (!isLoggedIn) {
      setHistory([]);
      return;
    }
    listSessions()
      .then((rows) => setHistory(rows.map(toPreview)))
      .catch(() => setHistory([]));
  }, [isLoggedIn]);

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
