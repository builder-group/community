# Migration Guide

## 0.0.x to 0.1.0

`@blgc/config` keeps the same goal: one shared package for TypeScript, ESLint, Prettier, and Vitest defaults. The 0.1.0 release changes some entrypoints and tightens several tool defaults, so projects may see lint, typecheck, or formatting diffs after upgrading.

### Upgrade ESLint

`@blgc/config` now targets ESLint 10.

If your project pins ESLint 9, upgrade ESLint before updating this package:

```bash
npm install -D eslint@^10
```

Also update local ESLint plugins that are pinned to ESLint 9-only peer ranges.

### Rename React Entrypoints

The old internal React entrypoints were renamed to public React entrypoints.

Update ESLint imports:

```js
// old
module.exports = [...require('@blgc/config/eslint/react-internal')];

// new
module.exports = [...require('@blgc/config/eslint/react')];
```

Update TypeScript extends:

```jsonc
// old
{
  "extends": "@blgc/config/typescript/react-internal"
}

// new
{
  "extends": "@blgc/config/typescript/react"
}
```

TanStack configs now extend the renamed React config internally. Projects that imported `react-internal` directly should switch to `react`.

### Rename The Vitest Entrypoint

The Vitest node config moved from the old `vite` namespace to `vitest`.

```js
// old
import { nodeConfig } from '@blgc/config/vite/node';
// new
import { nodeConfig } from '@blgc/config/vitest/node';
```

The new module also has a default export:

```js
import nodeConfig from '@blgc/config/vitest/node';
```

The node preset now explicitly sets `test.environment` to `node`.

### Review React ESLint Overrides

The React and Next presets now use `@eslint-react/eslint-plugin` for JSX and React rules. The presets still use `eslint-plugin-react-hooks` for Hooks diagnostics.

If your project overrides old `react/*` rules, migrate those overrides to matching `@eslint-react/*` rules where needed:

```js
// old
{
  rules: {
    'react/no-array-index-key': 'off'
  }
}

// new
{
  rules: {
    '@eslint-react/no-array-index-key': 'off'
  }
}
```

`react-hooks/*` overrides can stay as they are.

React browser globals are still included. Service worker globals are no longer included by default, so add them locally for service worker files:

```js
const globals = require('globals');

module.exports = [
  ...require('@blgc/config/eslint/react'),
  {
    files: ['src/service-worker.ts'],
    languageOptions: {
      globals: globals.serviceworker
    }
  }
];
```

### Review ESLint Output

Warning mode remains active through `eslint-plugin-only-warn`. Shared rule findings still report as warnings unless your project runs ESLint with stricter CLI options such as `--max-warnings=0`.

Other ESLint behavior changed:

- `eqeqeq` is enabled, with `null` checks allowed.
- Unused variables and arguments that start with `_` are ignored.
- Unused rest siblings are ignored.
- Unused disable directives and inline config comments report warnings.
- Tooling config files now match `*.config.{js,cjs,mjs,ts,cts,mts}` instead of only `*.config.js` and `*.config.cjs`.
- Config files are linted instead of being globally ignored.
- Generated file ignores now cover `*.gen.*` and `*.generated.*` JavaScript and TypeScript files.
- Coverage folders are ignored by default.

If a config file starts reporting new issues, fix the file or add a local override after the shared config.

### Review Framework Ignores

Next.js presets now ignore `.next`, `out`, `build`, and `next-env.d.ts`.

TanStack presets now ignore `.output` and `.tanstack` folders at any depth.

If your project already had local ignores for those folders, you can usually remove the duplicates.

### Review TypeScript Defaults

The TypeScript configs changed in a few important ways:

- The base config now targets `es2022` instead of `esnext`.
- The base config uses `module: preserve`.
- The base config enables `moduleDetection: force`.
- The base config enables `noImplicitOverride`, `allowUnusedLabels: false`, and `allowUnreachableCode: false`.
- Library configs no longer enable `allowJs`.
- The library config no longer sets `module: commonjs`.
- `library-dom` now includes `dom.iterable`.
- The React config moved from `react-internal` to `react` and targets `es2022`.

If your package compiles JavaScript files, add `allowJs: true` locally:

```jsonc
{
  "extends": "@blgc/config/typescript/library",
  "compilerOptions": {
    "allowJs": true
  }
}
```

If your package emits JavaScript with `tsc` and needs Node-style module output, use `@blgc/config/typescript/node20` or override `compilerOptions.module` locally.

### Expect Markdown Formatting Churn

Prettier now formats Markdown and MDX with spaces and `tabWidth: 2`. Code files still use tabs.

The Tailwind Prettier plugin is also loaded last so it composes correctly with the other Prettier plugins.

Run your formatter once after upgrading:

```bash
npm run format
```

Review the diff before committing, because documentation files may get indentation-only changes.
