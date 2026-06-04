Review my staged changes before committing. Include unstaged changes only when explicitly asked.

This is review-only. Do not stage, commit, switch branches, or run any other git-mutating command.

1. Run read-only git commands: `git status --short --branch` and `git diff --staged`
2. If explicitly asked to include unstaged changes, also run `git diff` and inspect untracked `??` files from `git status --short --branch` directly; use `git diff --no-index /dev/null <file>` when a diff view helps
3. Read the relevant rules from `.agent/rules/` for the changed files
4. Review for bugs, regressions, security issues, performance issues, missing tests, and rule violations
5. Lead with findings:
   - Order by severity
   - Include file and line references when possible
   - Explain the concrete risk and the smallest practical fix
   - Say clearly when there are no findings
6. Then give brief supporting context:
   - Open questions or assumptions
   - Short change summary
   - Test gaps or verification notes
   - Ready to commit? yes/no with reason
7. If ready, suggest a concise commit message. Include an issue number from the branch name when present, such as `3-focuscat-poc` -> `#3`.

Keep the review concise, actionable, and focused on risks over praise.
