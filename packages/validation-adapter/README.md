<h1 align="center">
    <img src="https://raw.githubusercontent.com/inbeta-group/monorepo/develop/packages/feature-form-validators/.github/banner.svg" alt="feature-form-validators banner">
</h1>

<p align="left">
    <a href="https://github.com/inbeta-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/inbeta-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-form-validators">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-form-validators.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=F0E81A" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-form-validators">
        <img src="https://img.shields.io/npm/dt/feature-form-validators.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://dyn.art/s/discord/?source=inbeta-group-readme">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`feature-form-validators` contains various validators for the `feature-form` library.

```ts
import { zodValidator, valibotValidator } from 'feature-form-validators/zod';
import { valibotValidator } from 'feature-form-validators/valibot';
import * as z from 'zod';
import * as v from 'valibot';

const zodNameValidator = zodValidator(
    z.string().min(2).max(10).regex(/^([^0-9]*)$/)
);

const valibotNameValidator = valibotValidator(
    v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);
```