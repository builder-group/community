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

Open source packages from [builder.group](https://builder.group) projects, shared in case they're useful.

## Packages

| Package                                                                                                 | Description                                                                            | NPM Package                                                            |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [config](https://github.com/builder-group/community/blob/develop/packages/config)                       | Shared ESLint, Prettier, Vite, and TypeScript configuration presets                    | [`@blgc/config`](https://www.npmjs.com/package/@blgc/config)           |
| [ecsify](https://github.com/builder-group/community/blob/develop/packages/ecsify)                       | Typesafe ECS library for building entity-component apps in TypeScript                  | [`ecsify`](https://www.npmjs.com/package/ecsify)                       |
| [feature-core](https://github.com/builder-group/community/blob/develop/packages/feature-core)           | Typesafe `.with()` composition primitives for building extensible TypeScript libraries | [`feature-core`](https://www.npmjs.com/package/feature-core)           |
| [feature-fetch](https://github.com/builder-group/community/blob/develop/packages/feature-fetch)         | Typesafe fetch wrapper with composable middleware and OpenAPI type support             | [`feature-fetch`](https://www.npmjs.com/package/feature-fetch)         |
| [feature-form](https://github.com/builder-group/community/blob/develop/packages/feature-form)           | Lightweight typesafe form library with reactive fields and Standard Schema validation  | [`feature-form`](https://www.npmjs.com/package/feature-form)           |
| [feature-logger](https://github.com/builder-group/community/blob/develop/packages/feature-logger)       | Typesafe logger with composable prefixes, labels, timestamps, and output styles        | [`feature-logger`](https://www.npmjs.com/package/feature-logger)       |
| [feature-react](https://github.com/builder-group/community/blob/develop/packages/feature-react)         | React hooks for reactive state and form subscriptions                                  | [`feature-react`](https://www.npmjs.com/package/feature-react)         |
| [feature-state](https://github.com/builder-group/community/blob/develop/packages/feature-state)         | Lightweight reactive state container with composable feature extensions                | [`feature-state`](https://www.npmjs.com/package/feature-state)         |
| [head-metadata](https://github.com/builder-group/community/blob/develop/packages/head-metadata)         | HTML head metadata extractor for title, meta, and link tags                            | [`head-metadata`](https://www.npmjs.com/package/head-metadata)         |
| [openapi-ts-router](https://github.com/builder-group/community/blob/develop/packages/openapi-ts-router) | OpenAPI-typed router helpers for Express and Hono with runtime validation              | [`openapi-ts-router`](https://www.npmjs.com/package/openapi-ts-router) |
| [rollup-presets](https://github.com/builder-group/community/blob/develop/packages/rollup-presets)       | Rollup presets and plugins for building TypeScript libraries                           | [`rollup-presets`](https://www.npmjs.com/package/rollup-presets)       |
| [tuple-result](https://github.com/builder-group/community/blob/develop/packages/tuple-result)           | Minimal, tree-shakable Result type using plain arrays for easy serialization           | [`tuple-result`](https://www.npmjs.com/package/tuple-result)           |
| [types](https://github.com/builder-group/community/blob/develop/packages/types)                         | Shared utility, API, and OpenAPI TypeScript types for builder.group packages           | [`@blgc/types`](https://www.npmjs.com/package/@blgc/types)             |
| [utils](https://github.com/builder-group/community/blob/develop/packages/utils)                         | Tree-shakable TypeScript utilities for colors, IDs, objects, URLs, and math            | [`@blgc/utils`](https://www.npmjs.com/package/@blgc/utils)             |
| [validatenv](https://github.com/builder-group/community/blob/develop/packages/validatenv)               | Environment variable validation with Zod, Valibot, or Yup                              | [`validatenv`](https://www.npmjs.com/package/validatenv)               |
| [xml-tokenizer](https://github.com/builder-group/community/blob/develop/packages/xml-tokenizer)         | Streaming XML tokenizer with callback-based parsing and object helpers                 | [`xml-tokenizer`](https://www.npmjs.com/package/xml-tokenizer)         |

### Discontinued

> **Note:** These packages are no longer maintained. If you need support or have questions, please [open an issue](https://github.com/builder-group/community/issues). Happy to revisit if there's community interest.

| Package                                                                                                                       | Description                                                                              | NPM Package                                                                      | Discontinued Since |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------ |
| [@blgc/cli](https://github.com/builder-group/community/blob/develop/packages/_deprecated/cli)                                 | Rollup and Esbuild-powered CLI for bundling TypeScript libraries                         | [`@blgc/cli`](https://www.npmjs.com/package/@blgc/cli)                           | March 9, 2026      |
| [elevenlabs-client](https://github.com/builder-group/community/blob/develop/packages/_deprecated/elevenlabs-client)           | Typesafe API client for the ElevenLabs text-to-speech API                                | [`elevenlabs-client`](https://www.npmjs.com/package/elevenlabs-client)           | November 6, 2025   |
| [eprel-client](https://github.com/builder-group/community/blob/develop/packages/eprel-client)                                 | Typesafe API client for the EU EPREL energy label registry                               | [`eprel-client`](https://www.npmjs.com/package/eprel-client)                     | May 21, 2026       |
| [figma-connect](https://github.com/builder-group/community/blob/develop/packages/_deprecated/figma-connect)                   | Typed message bridge between Figma plugin UI iframes and sandbox code                    | [`figma-connect`](https://www.npmjs.com/package/figma-connect)                   | November 6, 2025   |
| [google-webfonts-client](https://github.com/builder-group/community/blob/develop/packages/_deprecated/google-webfonts-client) | Typesafe API client for Google Web Fonts metadata and font downloads                     | [`google-webfonts-client`](https://www.npmjs.com/package/google-webfonts-client) | November 6, 2025   |
| [kleinanzeigen-client](https://github.com/builder-group/community/blob/develop/packages/_deprecated/kleinanzeigen-client)     | Typesafe API client for scraping and extracting Kleinanzeigen listings                   | [`kleinanzeigen-client`](https://www.npmjs.com/package/kleinanzeigen-client)     | November 6, 2025   |
| [openapi-express](https://github.com/builder-group/community/blob/develop/packages/_deprecated/openapi-express)               | OpenAPI-typed Express router wrapper with Zod request validation                         | [`openapi-express`](https://www.npmjs.com/package/openapi-express)               | January 1, 2025    |
| [split-flap-board](https://github.com/builder-group/community/blob/develop/packages/split-flap-board)                         | Web Components for animated split-flap boards with configurable spools and grids         | [`split-flap-board`](https://www.npmjs.com/package/split-flap-board)             | May 21, 2026       |
| [validation-adapter](https://github.com/builder-group/community/blob/develop/packages/validation-adapter)                     | Universal validation abstraction for validators like Zod, Valibot, and Yup               | [`validation-adapter`](https://www.npmjs.com/package/validation-adapter)         | Soon               |
| [validation-adapters](https://github.com/builder-group/community/blob/develop/packages/validation-adapters)                   | Ready-made validation-adapter implementations for Zod, Valibot, Yup, and Standard Schema | [`validation-adapters`](https://www.npmjs.com/package/validation-adapters)       | Soon               |
| [webito](https://github.com/builder-group/community/blob/develop/packages/_deprecated/webito)                                 | ECS-powered web editor experiment for Tailwind-style component editing                   | [`webito`](https://www.npmjs.com/package/webito)                                 | May 17, 2026       |

## Templates

| Template                                                                                         | Description                                         |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [desktop-tauri](https://github.com/builder-group/community/tree/develop/templates/desktop-tauri) | Tauri desktop app template with React and Specta    |
| [web-tanstack](https://github.com/builder-group/community/tree/develop/templates/web-tanstack)   | TanStack Start web app template with React and Vite |

## Examples

> See [`/examples`](https://github.com/builder-group/community/tree/develop/examples)

### `feature-fetch`

- [`feature-fetch/vanilla/open-meteo`](https://github.com/builder-group/community/tree/develop/examples/feature-fetch/vanilla/open-meteo)

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

### Why a Monorepo?

Keeping all packages in one repository means shared tooling, consistent versioning, and streamlined CI/CD with no extra overhead. Cross-package changes are easier to make and stay in sync automatically.

The only trade-off is that individual packages are harder to discover via SEO since they all live under one repo, but that's an acceptable cost.

### Why two package build modes (`build` vs `build:prod`)?

`pnpm build` (development): includes TypeScript declaration maps so IDE navigation goes to source files instead of compiled definitions, and skips minification for easier debugging.

`pnpm build:prod` (production): smaller output, minification enabled, declaration maps excluded. Declaration maps cause npm publish errors (e.g. `EINVALIDTAGNAME` in GitHub CLI) so they must be stripped from published packages.

### Why is `@blgc/types` listed as a dependency instead of a devDependency?

The `@blgc/types` package provides TypeScript type definitions shared across packages in this repo. When listed as a `devDependency`, these types are excluded from the final npm package, causing broken type checks and missing autocompletions for consumers. Listing it as a `dependency` ensures the types are accessible downstream.

### What are features?

A feature is a self-contained extension that adds typed methods or behaviour to a host object via `.with()`. The host starts with a base API, and each `.with(feature())` call extends it by adding methods, validating dependencies, and narrowing the TypeScript type. See [`feature-core`](https://www.npmjs.com/package/feature-core) for the underlying primitives.

### Why do libraries use a `.with()` chain instead of a declarative feature array?

The `.with()` chain (powered by [`feature-core`](https://www.npmjs.com/package/feature-core)) gives full TypeScript inference per step. Each call narrows the type based on what was installed before it, including dependency validation:

```ts
const $count = createState(0).with(undoFeature()).with(storageFeature());

$count.undo(); // typed
$count.missing(); // type error
```

A declarative feature array like `features: [undoFeature(), storageFeature()]` can't validate dependencies or accumulate types left-to-right reliably without losing inference. The chain solves both.

### Why objects instead of classes?

This [Medium post](https://medium.com/@markmiro/thoughts-on-choosing-between-plain-js-objects-and-classes-6422af8aaad5) explains the key differences well.

Objects are more flexible and allow for the kind of extensibility the `.with()` model needs. Achieving the same with classes isn't feasible, so objects were the better choice.
