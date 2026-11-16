Review staged changes before committing. Include unstaged or untracked changes only when explicitly asked.

This is review-only. Do not edit, stage, commit, switch branches, or run any git-mutating command.

1. Inspect `git status --short --branch` and `git diff --staged`. State the scope. If nothing is staged, report that there is nothing in scope rather than silently reviewing unstaged changes.
2. When asked to include the working tree, also inspect `git diff` and read relevant untracked files directly.
3. Read the changed code and enough surrounding implementation, contracts, and applicable rules to assess behavior.
4. Prioritize bugs, regressions, security risks, and material performance or compatibility problems. For public packages, consider exported types, entrypoints, and documented behavior.
5. Lead with findings ordered by severity. Give file/line references, the concrete triggering condition and consequence, and the smallest practical fix. Explain uncertainty rather than presenting speculation as a defect.
6. Report clear rule conflicts and maintainability issues separately from defects.
7. Report verification performed, relevant gaps, and assumptions. Say when there are no actionable findings.
8. Always suggest a concise commit message reflecting the reviewed changes, even when findings remain.

Keep the review concise and focused on risks over praise.
