<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/config/.github/banner.svg" alt="@ibg/config banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/@ibg/config">
        <img src="https://img.shields.io/npm/dt/@ibg/config.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://dyn.art/s/discord/?source=builder-group-readme">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

`@ibg/config` is a collection of ESLint, Vite and Typescript configurations.

## 📖 Usage

### [Typescript](https://www.typescriptlang.org/)

`tsconfig.json`
```json
{
	"extends": "@ibg/config/react-library.tsconfig.json",
	"compilerOptions": {
		"outDir": "./dist",
		"rootDir": "./src",
		"declarationDir": "./dist/types",
	},
	"include": ["src"]
}
```

### [ESLint](https://eslint.org/)

`.eslintrc.js`
```js
/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
	root: true,
	extends: [require.resolve('@ibg/config/eslint/react-internal'), 'plugin:storybook/recommended']
};
```

### [Vitest](https://vitest.dev/)

`vitest.config.js`
```js
const { defineConfig, mergeConfig } = require('vitest/config');
const { nodeConfig } = require('@ibg/config/vite/node.config');

module.exports = mergeConfig(nodeConfig, defineConfig({}));
```

## 🙏 Contribution

### Debugging ESLint Configuration

If you are encountering issues or unexpected behavior with ESLint, you can use the following command to output the final configuration. 

```bash
npx eslint --print-config ./some/file/to/test/on.ts
```

## 🔴 Issues

### TypeScript Configurations Location

TypeScript configurations are placed at the root to allow easy referencing from other packages in the monorepo using the `extends` field in `tsconfig.json`, like so:

```json
{
	"extends": "@ibg/config/base.json"
}
```

Node: Extending nested configuration didn't work.

## 🌟 Credits

This configuration is based on the [`turbo-basic`](https://github.com/vercel/turbo/tree/main/examples/basic) starter template and will be kept in sync with it as the Vercel team knows better than me what configurations settings are best for NextJs apps and co. Also [`tsconfig/bases`](https://github.com/tsconfig/bases) was a source of inspiration.
