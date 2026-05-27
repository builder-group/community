<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/config/.github/banner.svg" alt="@blgc/config banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/@blgc/config">
        <img src="https://img.shields.io/npm/dt/@blgc/config.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`@blgc/config` is Builder Group's shared config package for TypeScript projects. It keeps formatting, linting, type checking, and Node test defaults in one versioned dependency, so packages can share strict tool behavior without copying config files.

- Format code, Markdown, imports, CSS declarations, Tailwind classes, and package manifests with one Prettier config
- Pick flat ESLint presets for libraries, React, Next.js, and TanStack projects
- Extend TypeScript presets for bundled libraries, DOM libraries, Node 20, React, Next.js, and TanStack
- Reuse a Vitest node preset with TypeScript path resolution and coverage reporters

```js
// eslint.config.js
module.exports = [...require('@blgc/config/eslint/library')];
```

```jsonc
// tsconfig.json
{
  "extends": "@blgc/config/typescript/library",
  "include": ["src"]
}
```

```json
{
  "prettier": "@blgc/config/prettier"
}
```

Migrating from `0.0.x`? See [MIGRATION.md](./MIGRATION.md).

## Install

Install the config package:

```sh
npm install -D @blgc/config
```

Install the tool packages for the entrypoints your project uses:

```sh
# ESLint presets
npm install -D eslint typescript

# Prettier config
npm install -D prettier

# TypeScript configs
npm install -D typescript

# Vitest config
npm install -D vitest
```

The shared plugin dependencies resolve from `@blgc/config`, so projects only need to install the tool packages they run directly.

## Usage

Use the entrypoint that matches the tool or project type:

| Entrypoint                            | Use for                                     |
| ------------------------------------- | ------------------------------------------- |
| `@blgc/config/prettier`               | Shared formatting and sorting rules         |
| `@blgc/config/eslint/base`            | Shared ESLint foundation for custom presets |
| `@blgc/config/eslint/library`         | TypeScript libraries                        |
| `@blgc/config/eslint/react`           | React packages and Vite apps                |
| `@blgc/config/eslint/next`            | Next.js apps                                |
| `@blgc/config/eslint/tanstack`        | TanStack Router or TanStack Start apps      |
| `@blgc/config/typescript/base`        | Shared strict TypeScript defaults           |
| `@blgc/config/typescript/library`     | Bundled libraries without DOM globals       |
| `@blgc/config/typescript/library-dom` | Bundled libraries that use DOM globals      |
| `@blgc/config/typescript/node20`      | Node 20 packages and tools                  |
| `@blgc/config/typescript/react`       | React packages and Vite apps                |
| `@blgc/config/typescript/next`        | Next.js apps                                |
| `@blgc/config/typescript/tanstack`    | TanStack apps                               |
| `@blgc/config/vitest/node`            | Node test environments                      |

## Prettier

Reference the shared config from `package.json`:

```json
{
  "prettier": "@blgc/config/prettier"
}
```

The config includes:

- LF line endings, tabs for code files, two-space Markdown indentation, single quotes, semicolons, and `printWidth: 100`
- import sorting through `@ianvs/prettier-plugin-sort-imports`
- CSS declaration ordering through `prettier-plugin-css-order`
- package.json ordering through `prettier-plugin-packagejson`
- Tailwind class sorting through `prettier-plugin-tailwindcss`

The Prettier plugins resolve from `@blgc/config`, so consuming packages do not need to install those plugins directly.

Projects that need a Tailwind v4 stylesheet path or Tailwind v3 config path can extend the config locally:

```js
module.exports = {
  ...require('@blgc/config/prettier'),
  tailwindStylesheet: './src/styles.css'
};
```

## ESLint

Use flat config from `eslint.config.js`:

```js
// CommonJS
module.exports = [
  ...require('@blgc/config/eslint/library'),
  {
    rules: {
      // local overrides
    }
  }
];
```

```js
// ESM
import libraryConfig from '@blgc/config/eslint/library';

export default [
  ...libraryConfig,
  {
    rules: {
      // local overrides
    }
  }
];
```

Choose the preset by project type:

| Preset                         | Adds                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `@blgc/config/eslint/base`     | JavaScript, TypeScript, Turbo, warning mode, Prettier, ignores  |
| `@blgc/config/eslint/library`  | The base config for TypeScript package code                     |
| `@blgc/config/eslint/react`    | Browser globals, JSX parsing, ESLint React, React Hooks         |
| `@blgc/config/eslint/next`     | React config, Next.js Core Web Vitals, Next.js build ignores    |
| `@blgc/config/eslint/tanstack` | React config, TanStack build ignores, Vite env-var allowlisting |

The base preset uses `@eslint/js` recommended rules, `typescript-eslint` strict rules, Turbo env-var warnings, generated/build artifact ignores, Node globals for config files, and Prettier compatibility. Shared rule findings report as warnings through `eslint-plugin-only-warn`; use `eslint --max-warnings=0` in CI when a project is ready to enforce a clean result.

## TypeScript

Extend the closest TypeScript config:

```json
{
  "extends": "@blgc/config/typescript/library",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declarationDir": "./dist/types"
  },
  "include": ["src"]
}
```

Available configs:

| Config                                | Use for                            |
| ------------------------------------- | ---------------------------------- |
| `@blgc/config/typescript/base`        | Shared strict base settings        |
| `@blgc/config/typescript/library`     | Bundled libraries without DOM APIs |
| `@blgc/config/typescript/library-dom` | Libraries that use DOM globals     |
| `@blgc/config/typescript/node20`      | Node 20 packages and tools         |
| `@blgc/config/typescript/react`       | React packages and Vite apps       |
| `@blgc/config/typescript/next`        | Next.js apps                       |
| `@blgc/config/typescript/tanstack`    | TanStack apps                      |

Defaults to know: the base config uses ES2022, `module: preserve`, bundler module resolution, forced module detection, declaration output, declaration maps, `skipLibCheck`, and strict type checking. TypeScript unused checks stay off because ESLint owns unused diagnostics.

Use `@blgc/config/typescript/library` when a package emits JavaScript through a bundler and uses TypeScript for declaration emit. Use `@blgc/config/typescript/node20` for Node packages or tools that emit JavaScript with `tsc`.

## Vitest

Merge the shared Vitest node config when you want the default test setup:

```js
import { nodeConfig } from '@blgc/config/vitest/node';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nodeConfig,
  defineConfig({
    test: {
      // project-specific test options
    }
  })
);
```

The node config sets the Node test environment, enables TypeScript path resolution, and uses text, JSON, and HTML coverage reporters.

## FAQ

### Do I need every peer tool installed?

No. Install the tools your project runs. For example, a package that only extends TypeScript config does not need ESLint, Prettier, or Vitest installed.

### Can I override rules?

Yes. Add another config object after the shared config in `eslint.config.js`, add `compilerOptions` in `tsconfig.json`, or pass project-specific options to `mergeConfig` for Vitest.

### Why does ESLint report warnings instead of failing?

The shared ESLint config is a guideline first. Rule findings report as warnings so humans and agents can see what to improve without blocking local work.

Use `eslint --max-warnings=0` in CI or a package script when a project is ready to enforce a clean lint result.

### Why are the shared config files CommonJS?

CommonJS keeps the config package usable from both CommonJS and ESM project configs. ESM projects can import CommonJS presets, but CommonJS projects cannot synchronously `require()` ESM presets.

### Why does the React ESLint config use jiti?

`@eslint-react/eslint-plugin` is ESM-only. `jiti` lets the CommonJS ESLint presets load that plugin without forcing every consumer to migrate its `eslint.config.js` to ESM.

### Why does the library TypeScript config use module preserve?

Most Builder Group packages let Rollup or esbuild emit JavaScript and let TypeScript emit declarations. `module: preserve` keeps TypeScript's import resolution closer to what those bundlers see. Node packages that emit JavaScript with `tsc` should use the Node preset or override `compilerOptions.module`.

### Why not enable every strict TypeScript flag?

Flags like `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, and `erasableSyntaxOnly` are useful migration targets, but they require source-level cleanup or disallow current enum patterns. Enable them locally once a project is ready for that stricter contract.

### Why keep these configs in a package?

A package keeps defaults versioned, reviewable, and reusable. Projects can update one dependency instead of copying config changes by hand.

## Credits

- [`turbo-basic`](https://github.com/vercel/turbo/tree/main/examples/basic): base configuration patterns from Vercel's starter template
- [`tsconfig/bases`](https://github.com/tsconfig/bases): TypeScript configuration references
