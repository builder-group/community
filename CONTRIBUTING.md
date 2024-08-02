# Contributing to builder.group (blgc)

We are open and grateful for any contribution made by the community. If you're interested in contributing to builder.group, this document might make the process for you easier.

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals,
communities, and companies who want to learn how to run and contribute to an open-source project.
Contributors and people new to open source will find the following guides especially useful:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)

## 👊 [Code of Conduct](https://code.fb.com/codeofconduct)

Please read [the full text](https://code.fb.com/codeofconduct), so that you are able to understand what interpersonal actions will and will not be tolerated.

## 🌟 Style Guide

### `package.json` structure

The structure of the `package.json` file in this project should adhere to a specific format, as illustrated by the example structure below. This structure is based on the [npm documentation for creating a `package.json` file](https://docs.npmjs.com/creating-a-package-json-file).

```json
{
	"name": "@blgc/template",
	"description": "Description of the package",
	"version": "0.0.1",
	"private": true, // Or false if package should be published to NPM
	"scripts": {
		"build": "shx rm -rf dist && ../../scripts/cli.sh bundle",
		"start:dev": "tsc -w",
		"lint": "eslint --ext .js,.ts src/",
		"clean": "shx rm -rf dist && shx rm -rf node_modules && shx rm -rf .turbo",
		"install:clean": "pnpm run clean && pnpm install",
		"test": "echo \"Error: no test specified\" && exit 1"
	},
	"repository": {
		"type": "git",
		"url": "https://github.com/builder-group/monorepo.git"
	},
	"keywords": [],
	"author": "@bennobuilder",
	"license": "MIT",
	"bugs": {
		"url": "https://github.com/builder-group/monorepo/issues"
	},
	"homepage": "https://builder.group/?source=github",
	"dependencies": {
		// Project dependencies here
	},
	"peerDependencies": {
		// Project peerDependencies here
	},
	"devDependencies": {
		// Project devDependencies here
	}
}
```

For specific packages, additional fields should be included as shown below. Note that the fields `source`, `main`, `module`, `types`, and `files` are usually required in packages:

```json
{
	// ..
	// "scripts": ..,
	"source": "./src/index.ts", // Entry file (source code)
	"main": "./dist/cjs/index.js", // Entry point (CommonJS)
	"module": "./dist/esm/index.js", // Entry point (ES Module)
	"types": "./dist/types/index.d.ts", // Type definitions
	// ..
	// "devDependencies": {},
	"files": [
		// List of files to be included in your package
	]
}
```

## Q and A

### Why is `@blgc/types` listed as a dependency in some packages?

`@blgc/types` is listed as a dependency to ensure it's automatically installed for consumers, preventing issues like `any` types for `feature-x` packages due to missing `TUnionToIntersection`.

For more details: [Microsoft/types-publisher/issues/81](https://github.com/Microsoft/types-publisher/issues/81).

Alternatives:
- Move `TUnionToIntersection` into each package
- Enforce `@blgc/types` as a `peerDependency`

## 📄 License

By contributing to builder.group, you agree that your contributions will be licensed under the license defined in [`LICENSE.md`](./LICENSE.md).

## 🎉 Credits

- [Docusaurus `CONTRIBUTING.md`](https://github.com/facebook/docusaurus/blob/master/CONTRIBUTING.md)
