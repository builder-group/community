# Vitest Conventions

Apply these conventions when adding or changing Vitest tests.

- Place tests beside their source using `.test.ts`, `.test.tsx`, or `.test-d.ts` for type tests
- Use one top-level `describe` for the unit. Nest only for public members or meaningful behavior groups.
- Include the subject kind for concrete units, such as `createForm function` or `listen method`. Omit it for categories such as `validation`.
- Start `it` descriptions with `should` and name the observable behavior
- Cover core contracts, meaningful success/error cases, and regressions. Avoid exhaustive matrices unless the contract warrants them.
- Use Prepare / Act / Assert structure for multi-step tests and `async` / `await` for asynchronous behavior
