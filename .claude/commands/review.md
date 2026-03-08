Review my staged and unstaged changes before committing:

**CRITICAL: NEVER stage changes with `git add` and NEVER commit changes with `git commit`. This is a review-only command.**

1. Run `git diff` and `git diff --staged` to see all changes
2. Read the relevant rules from `.claude/rules/` (e.g., `react.md` for .tsx files, `typescript.md` for .ts files, `rust.md` for .rs files)
3. For each changed file:
   - Summarize what changed
   - Check for potential issues (bugs, security, performance)
   - Verify it follows the rules in `.claude/rules/`
4. Give me a brief summary:
   - What's good
   - Any concerns or suggestions
   - Ready to commit? (yes/no with reason)
5. Suggest a commit message:
   - Extract issue number from branch name (e.g., `3-focuscat-poc` → `#3`)
   - Format: `#<issue> <short description>`
   - Keep it concise (50 chars or less)

Keep the review concise and actionable.
