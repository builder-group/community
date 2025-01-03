<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/validation-adapter/.github/banner.svg" alt="validation-adapter banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/validation-adapter">
        <img src="https://img.shields.io/bundlephobia/minzip/validation-adapter.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/validation-adapter">
        <img src="https://img.shields.io/npm/dt/validation-adapter.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`validation-adapter` is a universal validation adapter that integrates different validators like Zod, Valibot, Yup, and more.

- **Universal Integration**: Combine multiple validation libraries seamlessly
- **Flexible**: Easily append and extend validation rules
- **Typesafe**: Build with TypeScript for strong type safety

### 🌟 Motivation

Create a universal validation adapter that generalizes different validation libraries like Zod, Valibot, etc. for use in libraries & applications requiring diverse validation strategies like [`feature-form`](https://github.com/builder-group/community/tree/develop/packages/feature-form).

## 📖 Usage

```ts
import * as v from 'valibot';
import { createValidator } from 'validation-adapter';
import { vValidator } from 'validation-adapters/valibot';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';

const zodNameValidator = zValidator(
	z
		.string()
		.min(2)
		.max(10)
		.regex(/^([^0-9]*)$/)
);

const valibotNameValidator = vValidator(
	v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);

const customValidator = createValidator([
	{
		key: 'custom',
		validate: (cx) => {
			if (cx.value !== 'CustomValue') {
				cx.registerError({
					code: 'custom-error',
					message: 'Value must be CustomValue.'
				});
			}
		}
	}
]);

const combinedValidator = valibotNameValidator.clone().append(customValidator);
```
