# Technical Debt

## ESLint v9 Lock-In

We pin ESLint to v9 and exclude it from `update:latest` because the React lint stack is not fully ready for ESLint 10 yet.

### Current state

- Pinned: `eslint@^9.39.2`, `@eslint/js@^9.39.2`
- Excluded from `update:latest` in:
  - [package.json](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/package.json)
  - [packages/config/package.json](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/packages/config/package.json)
- Current blockers:
  - `eslint-plugin-react` does not officially support ESLint 10 yet
  - `eslint-plugin-react-hooks` does not officially support ESLint 10 yet

### When to revisit

- When `eslint-plugin-react` and `eslint-plugin-react-hooks` support ESLint 10

## OpenAPI TypeScript Peer Warning

[packages/eprel-client/package.json](/Users/benno/Documents/workspace/projects/builder-group/b_product-development/code/community/packages/eprel-client/package.json) still gets an `openapi-typescript` peer warning for TypeScript 6.

### Current state

- Build passes
- Install still warns because `openapi-typescript` declares a TypeScript 5 peer range

### When to revisit

- When `openapi-typescript` officially supports TypeScript 6
