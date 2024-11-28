<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/config/.github/banner.svg" alt="@blgc/config banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/@blgc/config">
        <img src="https://img.shields.io/npm/dt/@blgc/config.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`@blgc/config` is a collection of configurations for popular linting and styling tools.

The following configs are available, and are designed to be used together.

- [Prettier](#prettier)
- [ESLint](#eslint)
- [TypeScript](#typescript)
- [Vitest](#vitest)

## 📖 Usage

### [Prettier](https://prettier.io/)

> Note: Prettier is a peer-dependency of this package, and should be installed
> at the root of your project.
>
> See: https://prettier.io/docs/en/install.html

To use the shared Prettier config, set the following in `package.json`:

```json
{
	"prettier": "@blgc/config/prettier"
}
```

### [Typescript](https://www.typescriptlang.org/)

> Note: Typescript is a peer-dependency of this package, and should be installed
> at the root of your project.

To use the shared Typescript config, set the following in `tsconfig.json`:

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

### [ESLint](https://eslint.org/)

> Note: ESLint is a peer-dependency of this package, and should be installed
> at the root of your project.
>
> See: https://eslint.org/docs/user-guide/getting-started#installation-and-usage

To use the shared ESLint config, set the following in `eslint.config.js`:

```js
/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = [
	...require('@blgc/config/eslint/library'),
	{
		// Any additional custom rules
	}
];
```

### [Vitest](https://vitest.dev/)

To use the shared Vitest config, set the following in `vitest.config.js`:

```js
const { defineConfig, mergeConfig } = require('vitest/config');
const { nodeConfig } = require('@blgc/config/vite/node');

module.exports = mergeConfig(nodeConfig, defineConfig({}));
```

## 🙏 Contribution

### Debugging ESLint Configuration

If you are encountering issues or unexpected behavior with ESLint, you can use the following command to output the final configuration.

```bash
npx eslint --print-config ./some/file/to/test/on.ts
```

## 🌟 Credits

- [`turbo-basic`](https://github.com/vercel/turbo/tree/main/examples/basic) - Base configuration from Vercel's official starter template for optimal Next.js settings
- [`tsconfig/bases`](https://github.com/tsconfig/bases) - TypeScript configuration best practices and recommendations
