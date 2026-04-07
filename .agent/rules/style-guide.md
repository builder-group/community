# Style Guide

This file covers repo-wide coding preferences. Keep it high-level; language-specific detail belongs in other rules.

## Enforce

- Prefer the simplest solution that preserves clarity and correctness
- Keep files and modules focused on one responsibility
- Keep related code close together
- Group nearby lines into small local clusters by domain or concern
- Keep each cluster contiguous; do not interleave unrelated concerns
- Keep the main logic near the top of the file and place supporting types, helpers, and config as close below the source as practical
- Use predictable names and directory structures
- Prefer explicit code over clever code
- Prefer named conditions over comments when a boolean is non-obvious
- Use guard clauses to reduce nesting
- Keep comments rare and useful

## Naming

- Use descriptive names that communicate purpose
- Use singular names for domains like `auth/` or `user/`
- Use plural names for collections like `components/`, `hooks/`, or `utils/`
- Use kebab-case for regular files and directories unless the codebase has a stronger convention

## Avoid

- Do not introduce deep nesting without a clear reason
- Do not spread one concern across many files when one file would stay readable
- Do not split one small flow across distant parts of a function when it can stay together
- Do not interleave fetching, validation, transformation, and side effects without a reason
- Do not front-load files with long blocks of types, constants, or helpers before the main logic
- Do not encode temporary migration detail into the final structure
- Do not add boilerplate abstractions before they are needed

## Examples

### Good

```ts
export function buildSummary(input: TSummaryInput): string {
	const value = normalizeValue(input.value);
	if (value == null) {
		return '';
	}

	return formatSummary(value, input.label);
}

interface TSummaryInput {
	value: string | null;
	label: string;
}

function normalizeValue(value: string | null): string | null {
	return value == null ? null : value.trim();
}

function formatSummary(value: string, label: string): string {
	return `${label}: ${value}`;
}
```

### Avoid

```ts
interface TSummaryInput {
	value: string | null;
	label: string;
}

const SUMMARY_SEPARATOR = ': ';

function normalizeValue(value: string | null): string | null {
	return value == null ? null : value.trim();
}

export function buildSummary(input: TSummaryInput): string {
	if (input.value == null) {
		return '';
	}

	return `${input.label}${SUMMARY_SEPARATOR}${normalizeValue(input.value)}`;
}
```
