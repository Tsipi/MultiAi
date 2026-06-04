# Version 4.3 — Cleanup and fixing inconsistencies 

1. check the docs\claude_suggestions\AUDIT_MAP.md - ## Inconsistencies and flags and see what should be solved
2. fix repetition of violet an too many styling properties (remove for exmple:
`# colors... inside the html
 border-[#ffffff08] 
 .bubble-writer  { background-color: color-mix(in srgb, #d8f5d4 86%, var(--card)); }
  doc.setTextColor(130, 100, 190);
  `
 3. Check the drawParticipants why is it setting the fonts etc... isn't there a better way to write the exporter.ts
  

