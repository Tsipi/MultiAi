import { useState } from "react";

export function useFollowup() {
  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupInstruction, setFollowupInstruction] = useState("");
  const [followupConstraints, setFollowupConstraints] = useState("");
  const [followupSeed, setFollowupSeed] = useState("");
  const [followupError, setFollowupError] = useState("");

  function clearFollowupState() {
    setFollowupOpen(false);
    setFollowupInstruction("");
    setFollowupConstraints("");
    setFollowupSeed("");
    setFollowupError("");
  }

  return {
    followupOpen,
    setFollowupOpen,
    followupInstruction,
    setFollowupInstruction,
    followupConstraints,
    setFollowupConstraints,
    followupSeed,
    setFollowupSeed,
    followupError,
    setFollowupError,
    clearFollowupState,
  };
}
