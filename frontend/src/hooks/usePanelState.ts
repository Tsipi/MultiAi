import { useEffect, useState } from "react";
import { RUNS_SIDEBAR_STORAGE_KEY } from "@/components/layout/ConsensusRunsSidebar";

export function usePanelState() {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [runsSidebarOpen, setRunsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(RUNS_SIDEBAR_STORAGE_KEY) !== "0";
  });

  useEffect(() => {
    localStorage.setItem(RUNS_SIDEBAR_STORAGE_KEY, runsSidebarOpen ? "1" : "0");
  }, [runsSidebarOpen]);

  return {
    advancedOpen,
    setAdvancedOpen,
    insightsOpen,
    setInsightsOpen,
    runsSidebarOpen,
    setRunsSidebarOpen,
  };
}
