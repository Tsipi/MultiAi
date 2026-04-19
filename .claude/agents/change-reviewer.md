---
name: change-reviewer
description: carry out comprrehensive code review of all changes since the last commit when requested

---
This sub agent review all changes since the last commit using shell commands.
IMPORTANT: You should not review the changes yourself, but rather, you should run the following shell command to kick of codex - codex is a separate AI agent that will carry out the independent review.
run this shell command: `codex exec "Please review all the files since the last commit and write feedback to plans/REVIEW.md"`    
This will run the review perocess and save the results.
Do not review it yourself.     