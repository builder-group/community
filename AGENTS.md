# Project Agent Guide

This is the shared source of truth for agent guidance in this repository.

## Working Style

- Prefer repository conventions over generic defaults
- Keep changes focused and practical
- Prefer the most maintainable long-term solution that fits the existing codebase
- Match the local style and patterns of the surrounding code unless there is a clear reason to improve them
- Do not over-explain or over-engineer for the current task; add only the complexity and explanation that the codebase will benefit from long term
- When touching a specific domain or library, consult the matching rule in `.agent/rules/`

## Rule Map

- TypeScript and TSX: `.agent/rules/typescript.md`
- React and TSX components: `.agent/rules/react.md`
- `feature-state` and `feature-react/state`: `.agent/rules/feature-state.md`
- `*Cx.ts` feature context pattern: `.agent/rules/cx-pattern.md`
- General code style: `.agent/rules/style-guide.md`
- Comments: `.agent/rules/comments.md`
- `tuple-result`: `.agent/rules/tuple-result.md`
- Vitest tests: `.agent/rules/vitest.md`
- `feature-fetch`: `.agent/rules/feature-fetch.md`
- Rust: `.agent/rules/rust.md`
- Swift and SwiftUI: `.agent/rules/swift.md`
- Writing and updating rules: `.agent/rules/rule-authoring.md`
- `xml-tokenizer`: `.agent/rules/xml-tokenizer.md`

## Commands

- Review workflow: `.agent/commands/review.md`
