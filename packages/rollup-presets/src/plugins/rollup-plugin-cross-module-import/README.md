# rollup-plugin-cross-module-import

Rollup plugin that rewrites relative imports between exported package entry points. It helps multi-entry packages keep source imports local while built output imports the published entry path.

- Reads entry points from `package.json` exports
- Rewrites cross-entry imports for ESM and CJS output
- Preserves specific file imports under the target entry
- Marks rewritten cross-entry imports as external

## Example

Input package exports:

```json
{
  "exports": {
    "./module1": {
      "source": "./src/module1/index.ts",
      "import": "./dist/module1/esm/index.js",
      "require": "./dist/module1/cjs/index.js"
    },
    "./module2": {
      "source": "./src/module2/index.ts",
      "import": "./dist/module2/esm/index.js",
      "require": "./dist/module2/cjs/index.js"
    }
  }
}
```

Input source:

```ts
// src/module2/nested/deep.ts
import { something } from '../../module1';
import { internal } from '../../module1/internal';
```

Resolved external ids for ESM output:

```ts
import { something } from '../../../module1/esm';
import { internal } from '../../../module1/esm/internal';
```
