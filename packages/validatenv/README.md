<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/validatenv/.github/banner.svg" alt="validatenv banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/validatenv">
        <img src="https://img.shields.io/bundlephobia/minzip/validatenv.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/validatenv">
        <img src="https://img.shields.io/npm/dt/validatenv.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`validatenv` is a typesafe library for validating environment variables.

### 🌟 Motivation

Create a type-safe, straightforward, and lightweight library for validating environment variables using existing validation libraries like [Valibot](https://valibot.dev/) or [Zod](https://zod.dev/).
Additionally, I didn't trust existing libraries, as reading environment variables is a particularly vulnerable task.

### ⚖️ Alternatives

- [envalid](https://github.com/af/envalid)

## 📖 Usage

```ts
import * as v from 'valibot';
import { validateEnv } from 'validatenv';
import { vValidator } from 'validation-adapters/valibot';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';

dotenv.config();

const env = validateEnv(process.env, {
	PORT: {
		validator: vValidator(v.number()), // Validate with Valibot
		defaultValue: devDefault(3000), // Only in development
		middlewares: [numberMiddleware]
	},
	DATABASE_URL: {
		validator: zValidator(z.string()), // Validate with Zod
		defaultValue: localDefault('postgres://localhost:5432/myapp') // Only in local env
	},
	TEST_API_KEY: {
		validator: createValidator<string>([
			{
				key: 'string',
				validate: (cx) => {
					if (typeof cx.value !== 'string') {
						cx.registerError({
							code: 'invalid_type',
							message: 'Must be a string'
						});
					}
				}
			}
		]), // Validate with custom validator
		defaultValue: testDefault('test-key-123') // Only in test env
	}
});
```
