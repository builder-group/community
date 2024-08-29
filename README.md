<h1 align="center">
    <img src="./.github/assets/banner.svg" alt="builder.group (blgc) banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

A collection of open source libraries maintained by [builder.group](https://builder.group). Let's build together.

## 📦 Packages

| Package                                                                                                          | Description                                                                                                                                                                    | NPM Package                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [cli](https://github.com/builder-group/monorepo/blob/develop/packages/cli)                                       | Straightforward CLI to bundle Typescript libraries with presets, powered by Rollup and Esbuild                                                                                 | [`@blgc/cli`](https://www.npmjs.com/package/@blgc/cli)                           |
| [config](https://github.com/builder-group/monorepo/blob/develop/packages/cli)                                    | Collection of ESLint, Vite, and Typescript configurations                                                                                                                      | [`@blgc/config`](https://www.npmjs.com/package/@blgc/config)                     |
| [eprel-client](https://github.com/builder-group/monorepo/blob/develop/packages/eprel-client)                     | Typesafe and straightforward fetch client for interacting with the European Product Registry for Energy Labelling (EPREL) API using feature-fetch                              | [`eprel-client`](https://www.npmjs.com/package/eprel-client)                     |
| [feature-fetch](https://github.com/builder-group/monorepo/blob/develop/packages/feature-fetch)                   | Straightforward, typesafe, and feature-based fetch wrapper supporting OpenAPI types                                                                                            | [`feature-fetch`](https://www.npmjs.com/package/feature-fetch)                   |
| [feature-form](https://github.com/builder-group/monorepo/blob/develop/packages/feature-form)                     | Straightforward, typesafe, and feature-based form library                                                                                                                      | [`feature-form`](https://www.npmjs.com/package/feature-form)                     |
| [feature-logger](https://github.com/builder-group/monorepo/blob/develop/packages/feature-logger)                 | Straightforward, typesafe, and feature-based logging library                                                                                                                   | [`feature-logger`](https://www.npmjs.com/package/feature-logger)                 |
| [feature-react](https://github.com/builder-group/monorepo/blob/develop/packages/feature-react)                   | ReactJs extension for the feature-state and feature-form library, providing hooks and features for ReactJs                                                                     | [`feature-state-react`](https://www.npmjs.com/package/feature-state-react)       |
| [feature-state](https://github.com/builder-group/monorepo/blob/develop/packages/feature-state)                   | Straightforward, typesafe, and feature-based state management library for ReactJs                                                                                              | [`feature-state`](https://www.npmjs.com/package/feature-state)                   |
| [figma-connect](https://github.com/builder-group/monorepo/blob/develop/packages/figma-connect)                   | Straightforward and typesafe wrapper around the communication between the app/ui (iframe) and plugin (sandbox) part of a Figma Plugin                                          | [`figma-connect`](https://www.npmjs.com/package/figma-connect)                   |
| [google-webfonts-client](https://github.com/builder-group/monorepo/blob/develop/packages/google-webfonts-client) | Typesafe and straightforward fetch client for interacting with the Google Web Fonts API using feature-fetch                                                                    | [`google-webfonts-client`](https://www.npmjs.com/package/google-webfonts-client) |
| [openapi-router](https://github.com/builder-group/monorepo/blob/develop/packages/openapi-router)                 | Thin wrapper around the router of web frameworks like Express and Hono, offering OpenAPI typesafety and seamless integration with validation libraries such as Valibot and Zod | [`@blgc/openapi-router`](https://www.npmjs.com/package/@blgc/openapi-router)     |
| [utils](https://github.com/builder-group/monorepo/blob/develop/packages/utils)                                   | Straightforward, typesafe, and tree-shakable collection of utility functions                                                                                                   | [`@blgc/utils`](https://www.npmjs.com/package/@blgc/utils)                       |
| [validation-adapter](https://github.com/builder-group/monorepo/blob/develop/packages/validation-adapter)         | Universal validation adapter that integrates various validation libraries like Zod, Valibot, and Yup                                                                           | [`validation-adapter`](https://www.npmjs.com/package/validation-adapter)         |
| [validation-adapters](https://github.com/builder-group/monorepo/blob/develop/packages/validation-adapters)       | Pre-made validation adapters for the validation-adapter library, including adapters for Zod and Valibot                                                                        | [`validation-adapters`](https://www.npmjs.com/package/validation-adapters)       |
| [xml-tokenizer](https://github.com/builder-group/monorepo/blob/develop/packages/xml-tokenizer)                   | Straightforward and typesafe XML tokenizer that streams tokens through a callback mechanism                                                                                    | [`xml-tokenizer`](https://www.npmjs.com/package/xml-tokenizer)                   |

### 📚 Examples

> See [`/examples`](https://github.com/builder-group/monorepo/tree/develop/examples)

### `feature-fetch`

- [`feature-fetch/vanilla/open-meteo`](https://github.com/builder-group/monorepo/tree/develop/examples/feature-fetch/vanilla/open-meteo)

### `feature-form`

- [`feature-form/react/basic`](https://github.com/builder-group/monorepo/tree/develop/examples/feature-form/react/basic)

### `feature-state`

- [`feature-state/react/counter`](https://github.com/builder-group/monorepo/tree/develop/examples/feature-state/react/counter)

### `openapi-router`

- [`openapi-router/hono/petstore`](https://github.com/builder-group/monorepo/tree/develop/examples/openapi-router/hono/petstore)
- [`openapi-router/express/petstore`](https://github.com/builder-group/monorepo/tree/develop/examples/openapi-router/express/petstore)

### `xml-tokenizer`

- [`xml-tokenizer/vanilla/profiler`](https://github.com/builder-group/monorepo/tree/develop/examples/xml-tokenizer/vanilla/profiler)

## ❓ FAQ

### What does `blgc` stand for?

`blgc` stands for **B**ui**L**der.**G**roup **C**ommunity, chosen because similar names like `blg`, `bldr` and `bgc` were already taken.
