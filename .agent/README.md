# Agent Configuration

Root `AGENTS.md` is the repository entry point. It links to shared conventions in `rules/`, reusable prompts in `commands/`, and repository-specific documentation.

The `.claude/` adapters import the root guide and shared review prompt.

## Maintaining Instructions

- Add rules for lasting preferences, recurring conventions, or concrete risks. Discussion alone is not a reason to add a rule.
- Give each reference a clear scope. Distinguish application usage from library implementation and platform-specific integration.
- Keep API contracts in package READMEs or source documentation. Link to them instead of duplicating them, and keep examples only when they clarify a decision.

The rules are ordinary Markdown, read through the root guide. The command prompts are used when requested. Placing them here does not register a slash command or skill.

## Sharing Across Repositories

Community is the canonical source for shared `rules/` and `commands/`. Keep each repository's product context, validation instructions, and documentation references in its own `AGENTS.md`.

When syncing:

1. Compare the destination's shared files and preserve intentional local differences
2. Copy only the rules and workflows the destination uses. Remove superseded files and update references
3. Adapt the destination's library links to documentation matching its installed versions, and include architecture references only where relevant
4. Check formatting, local links, and the diff before considering the sync complete
