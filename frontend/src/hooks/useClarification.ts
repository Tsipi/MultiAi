import { useState } from "react";

export function useClarification() {
  const [clarificationPrompt, setClarificationPrompt] = useState("");
  const [clarificationReason, setClarificationReason] = useState("");
  const [clarificationOptions, setClarificationOptions] = useState<string[]>([]);
  const [clarificationChoice, setClarificationChoice] = useState("");
  const [clarificationOtherText, setClarificationOtherText] = useState("");

  function chooseClarification(value: string) {
    setClarificationChoice(value);
    if (value !== "Other") setClarificationOtherText("");
  }

  function clearClarification() {
    setClarificationPrompt("");
    setClarificationReason("");
    setClarificationOptions([]);
    setClarificationChoice("");
    setClarificationOtherText("");
  }

  return {
    clarificationPrompt,
    setClarificationPrompt,
    clarificationReason,
    setClarificationReason,
    clarificationOptions,
    setClarificationOptions,
    clarificationChoice,
    setClarificationChoice,
    clarificationOtherText,
    setClarificationOtherText,
    chooseClarification,
    clearClarification,
  };
}
