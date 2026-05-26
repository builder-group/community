# Package README Rules

Use these rules for READMEs that document reusable packages, libraries, framework adapters, or tools that users integrate into software.

Apply this together with `.agent/rules/writing.md`.

## Enforce

- Lead with value: explain what the package does, why it matters, and what problem it solves or removes before listing APIs
- Keep the above-the-fold section strong: one clear description, concrete bullets, and one compact example that shows the core workflow
- Make bullets outcome-driven: focus on what users can build, avoid, catch, or simplify
- Make the above-the-fold example a small proof of value: simple enough to scan, but specific enough to show the package differentiator
- Show real usage early with imports, setup, and the first successful call, handler, or result
- Put installation after the value section unless the package cannot be understood without setup context
- Structure larger READMEs around user goals before API reference: `Install`, `Usage`, concept sections, API details, examples, FAQ
- Treat `Usage` as the fast path to get started, not as the full reference
- Use a short chooser in `Usage` when the package has multiple primary entry points, adapters, or workflows
- Use API reference sections to answer detailed questions after the reader understands the mental model
- Match README depth to package scope: tiny utilities can stay short, broad libraries need concept and FAQ sections
- Keep example READMEs shorter than package READMEs: description, compact bullets, run command, and only non-obvious setup notes
- Add FAQ entries for tradeoffs, comparisons, limitations, and common confusion that would interrupt the main flow
- Stay humble and concrete when comparing alternatives: explain fit and tradeoffs without dismissing other tools

## Avoid

- Do not start by rattling through every API method before the user understands why the package exists
- Do not write vague audience claims like "for teams that want serious behavior" when a concrete outcome would be clearer
- Do not use a generic hello-world example above the fold when a small differentiator example would be clearer
- Do not turn the above-the-fold example into a full feature tour
- Do not overpromise runtime guarantees when TypeScript only checks compile-time shape
- Do not blur compile-time checks, runtime validation, and runtime behavior in the same claim
- Do not duplicate full API docs in the quick-start section
- Do not force every package README into the same length or exact section order
- Do not add long example walkthroughs to small example READMEs unless setup is genuinely non-obvious
- Do not keep generic maturity notices in README prose when the package version already communicates maturity. Keep warnings only when they change user behavior or setup

## Examples

### Good

````md
`typed-router` turns generated OpenAPI paths into typed Express route methods. You keep native handlers and middleware, while OpenAPI controls which paths compile, which schemas are required, and what JSON success bodies handlers can return.

- Catch wrong paths, missing schemas, and wrong success bodies in TypeScript
- Validate params, query, and JSON bodies at runtime
- Read validated values from `req.valid`

```ts
router.get('/users/{userId}', {
	pathSchema: z.object({ userId: z.number() }),
	handler: (req, res) => {
		res.json({ id: req.valid.path.userId });
	}
});
```
````

### Avoid

```
`typed-router` exports `createRouter`, `createMethod`, `parseParams`, `formatPath`, `RouterOptions`, `RouteConfig`, and `ValidationError`.

## API

### `createRouter(options)`

Creates a router.
```
