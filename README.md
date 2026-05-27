<h1 align="center">
    <img src="./.github/assets/banner.svg" alt="builder.group (blgc) banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

Open source packages, crates, and templates from [builder.group](https://builder.group) projects.

## Packages

| Package                                                                                                 | Description                                                                                | NPM Package                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [config](https://github.com/builder-group/community/tree/develop/packages/config)                       | Shared TypeScript, ESLint, Prettier, and Vitest configs for Builder Group projects         | [`@blgc/config`](https://www.npmjs.com/package/@blgc/config)           |
| [ecsify](https://github.com/builder-group/community/tree/develop/packages/ecsify)                       | TypeScript ECS with typed plugins, flexible component storage, queries, and tracking       | [`ecsify`](https://www.npmjs.com/package/ecsify)                       |
| [feature-core](https://github.com/builder-group/community/tree/develop/packages/feature-core)           | Typed `.with()` feature composition with dependency checks for TypeScript objects          | [`feature-core`](https://www.npmjs.com/package/feature-core)           |
| [feature-fetch](https://github.com/builder-group/community/tree/develop/packages/feature-fetch)         | Typed fetch client with tuple results and opt-in REST, OpenAPI, GraphQL, retry, cache      | [`feature-fetch`](https://www.npmjs.com/package/feature-fetch)         |
| [feature-form](https://github.com/builder-group/community/tree/develop/packages/feature-form)           | Framework-agnostic reactive form state with Standard Schema validation and triggers        | [`feature-form`](https://www.npmjs.com/package/feature-form)           |
| [feature-logger](https://github.com/builder-group/community/tree/develop/packages/feature-logger)       | Composable console logger with levels, formatting, middleware, and testable output         | [`feature-logger`](https://www.npmjs.com/package/feature-logger)       |
| [feature-react](https://github.com/builder-group/community/tree/develop/packages/feature-react)         | Provider-free React hooks for `feature-state` and `feature-form` subscriptions             | [`feature-react`](https://www.npmjs.com/package/feature-react)         |
| [feature-state](https://github.com/builder-group/community/tree/develop/packages/feature-state)         | Reactive state with computed values and opt-in undo, storage, equality, and queues         | [`feature-state`](https://www.npmjs.com/package/feature-state)         |
| [head-metadata](https://github.com/builder-group/community/tree/develop/packages/head-metadata)         | Typed HTML head metadata extraction for title, meta, link, and custom extractors           | [`head-metadata`](https://www.npmjs.com/package/head-metadata)         |
| [openapi-ts-router](https://github.com/builder-group/community/tree/develop/packages/openapi-ts-router) | Typed Express and Hono routes backed by OpenAPI paths and Standard Schema validation       | [`openapi-ts-router`](https://www.npmjs.com/package/openapi-ts-router) |
| [rollup-presets](https://github.com/builder-group/community/tree/develop/packages/rollup-presets)       | Rollup presets for TypeScript libraries with package export discovery and declarations     | [`rollup-presets`](https://www.npmjs.com/package/rollup-presets)       |
| [tuple-result](https://github.com/builder-group/community/tree/develop/packages/tuple-result)           | Plain TypeScript Result tuples with typed errors, narrowing, helpers, JSON-friendly arrays | [`tuple-result`](https://www.npmjs.com/package/tuple-result)           |
| [validatenv](https://github.com/builder-group/community/tree/develop/packages/validatenv)               | Typed env validation with Standard Schema validators, built-in parsers, error reports      | [`validatenv`](https://www.npmjs.com/package/validatenv)               |
| [xml-tokenizer](https://github.com/builder-group/community/tree/develop/packages/xml-tokenizer)         | Streaming XML, HTML, and SVG tokenizer with typed tokens, selectors, object helpers        | [`xml-tokenizer`](https://www.npmjs.com/package/xml-tokenizer)         |

## Crates

| Crate                                                                       | Description                                                  | Crates.io                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| [mado](https://github.com/builder-group/community/tree/develop/crates/mado) | macOS active app and window monitoring with browser metadata | [`mado`](https://crates.io/crates/mado) |

## Deprecated Packages

> These packages live under `packages/_deprecated`. They remain listed for existing users and historical context, but they are not actively maintained. Prefer the active packages above when starting new work.

| Package                                                                                                                       | Description                                                                  | NPM Package                                                                      | Deprecated Since |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| [@blgc/cli](https://github.com/builder-group/community/tree/develop/packages/_deprecated/cli)                                 | Rollup and esbuild CLI for bundling TypeScript libraries                     | [`@blgc/cli`](https://www.npmjs.com/package/@blgc/cli)                           | March 9, 2026    |
| [@blgc/types](https://github.com/builder-group/community/tree/develop/packages/_deprecated/types)                             | Shared utility, API, and OpenAPI TypeScript types                            | [`@blgc/types`](https://www.npmjs.com/package/@blgc/types)                       | May 26, 2026     |
| [@blgc/utils](https://github.com/builder-group/community/tree/develop/packages/_deprecated/utils)                             | TypeScript utilities for colors, IDs, objects, URLs, and math                | [`@blgc/utils`](https://www.npmjs.com/package/@blgc/utils)                       | May 26, 2026     |
| [elevenlabs-client](https://github.com/builder-group/community/tree/develop/packages/_deprecated/elevenlabs-client)           | ElevenLabs text-to-speech API client                                         | [`elevenlabs-client`](https://www.npmjs.com/package/elevenlabs-client)           | November 6, 2025 |
| [eprel-client](https://github.com/builder-group/community/tree/develop/packages/_deprecated/eprel-client)                     | EU EPREL energy label registry API client                                    | [`eprel-client`](https://www.npmjs.com/package/eprel-client)                     | May 21, 2026     |
| [figma-connect](https://github.com/builder-group/community/tree/develop/packages/_deprecated/figma-connect)                   | Typed message bridge between Figma plugin UI iframes and sandbox code        | [`figma-connect`](https://www.npmjs.com/package/figma-connect)                   | November 6, 2025 |
| [google-webfonts-client](https://github.com/builder-group/community/tree/develop/packages/_deprecated/google-webfonts-client) | Google Web Fonts metadata and font download client                           | [`google-webfonts-client`](https://www.npmjs.com/package/google-webfonts-client) | November 6, 2025 |
| [kleinanzeigen-client](https://github.com/builder-group/community/tree/develop/packages/_deprecated/kleinanzeigen-client)     | Kleinanzeigen scraping and listing extraction client                         | [`kleinanzeigen-client`](https://www.npmjs.com/package/kleinanzeigen-client)     | November 6, 2025 |
| [openapi-express](https://github.com/builder-group/community/tree/develop/packages/_deprecated/openapi-express)               | OpenAPI-typed Express router wrapper with Zod request validation             | [`openapi-express`](https://www.npmjs.com/package/openapi-express)               | January 1, 2025  |
| [split-flap-board](https://github.com/builder-group/community/tree/develop/packages/_deprecated/split-flap-board)             | Web Components for animated split-flap boards                                | [`split-flap-board`](https://www.npmjs.com/package/split-flap-board)             | May 21, 2026     |
| [validation-adapter](https://github.com/builder-group/community/tree/develop/packages/_deprecated/validation-adapter)         | Universal validation abstraction for Zod, Valibot, and Yup                   | [`validation-adapter`](https://www.npmjs.com/package/validation-adapter)         | May 26, 2026     |
| [validation-adapters](https://github.com/builder-group/community/tree/develop/packages/_deprecated/validation-adapters)       | Validator adapter implementations for Zod, Valibot, Yup, and Standard Schema | [`validation-adapters`](https://www.npmjs.com/package/validation-adapters)       | May 26, 2026     |
| [webito](https://github.com/builder-group/community/tree/develop/packages/_deprecated/webito)                                 | ECS-powered visual web editor with plugin-based customization                | [`webito`](https://www.npmjs.com/package/webito)                                 | May 17, 2026     |

## Templates

| Template                                                                                         | Description                                         |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [desktop-tauri](https://github.com/builder-group/community/tree/develop/templates/desktop-tauri) | Tauri desktop app template with React and Specta    |
| [web-tanstack](https://github.com/builder-group/community/tree/develop/templates/web-tanstack)   | TanStack Start web app template with React and Vite |

## Examples

> See [`/examples`](https://github.com/builder-group/community/tree/develop/examples)

### `feature-fetch`

- [`feature-fetch/vanilla/basic`](https://github.com/builder-group/community/tree/develop/examples/feature-fetch/vanilla/basic)

### `feature-form`

- [`feature-form/react/basic`](https://github.com/builder-group/community/tree/develop/examples/feature-form/react/basic)

### `feature-state`

- [`feature-state/react/basic`](https://github.com/builder-group/community/tree/develop/examples/feature-state/react/basic)

### `openapi-ts-router`

- [`openapi-ts-router/hono/petstore`](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/hono/petstore)
- [`openapi-ts-router/express/petstore`](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/express/petstore)

### `xml-tokenizer`

- [`xml-tokenizer/vanilla/playground`](https://github.com/builder-group/community/tree/develop/examples/xml-tokenizer/vanilla/playground)

## FAQ

### What does `blgc` stand for?

`blgc` stands for **B**ui**L**der.**G**roup **C**ommunity, chosen because similar names like `blg`, `bldr` and `bgc` were already taken.

### Why a monorepo?

Keeping all packages in one repository means shared tooling, consistent versioning, and streamlined CI. Cross-package changes are easier to make and keep in sync.

The trade-off is discoverability: individual packages are harder to find through search because they all live under one repo.

### Why two package build modes (`build` vs `build:prod`)?

`pnpm build` (development): includes TypeScript declaration maps so IDE navigation goes to source files instead of compiled definitions, and skips minification for easier debugging.

`pnpm build:prod` (production): smaller output, minification enabled, declaration maps excluded. Declaration maps cause npm publish errors (e.g. `EINVALIDTAGNAME` in GitHub CLI) so they must be stripped from published packages.

### What are features?

A feature is a self-contained extension that adds typed methods or behavior to a host object via `.with()`. The host starts with a base API, and each `.with(feature())` call extends it by adding methods, validating dependencies, and narrowing the TypeScript type. See [`feature-core`](https://www.npmjs.com/package/feature-core) for the underlying primitives.

### Why do libraries use a `.with()` chain instead of a declarative feature array?

The `.with()` chain (powered by [`feature-core`](https://www.npmjs.com/package/feature-core)) gives TypeScript inference per step. Each call narrows the type based on what was installed before it.

```ts
const $count = createState(0).with(undoFeature());

$count.undo(); // typed
$count.missing(); // type error
```

A declarative feature array like `features: [featureA(), featureB()]` cannot validate dependencies or accumulate types left-to-right as reliably.

### Why objects instead of classes?

This [Medium post](https://medium.com/@markmiro/thoughts-on-choosing-between-plain-js-objects-and-classes-6422af8aaad5) explains the key differences well.

Objects compose cleanly with the `.with()` model. Classes make that style of extension harder to type and harder to reuse across packages.
