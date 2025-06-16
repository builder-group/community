# @rollup-plugin-cross-module-import

A Rollup plugin for handling cross-module imports within a monorepo package.

**Key Features**:

- Preserves specific file imports while transforming module paths
- Handles both ESM and CJS formats
- Marks cross-module imports as external

## How it works

The plugin transforms cross-module imports based on package.json exports configuration:

1. **Source Code Structure**:

   ```
   src/
     module1/
       index.ts         # Exports main module1 functionality
       internal.ts      # Internal module1 file
     module2/
       index.ts        # Imports from module1
       nested/
         deep.ts       # Imports from module1 and its internal files
   ```

2. **Package.json Exports**:

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

3. **Import Examples**:

   ```typescript
   // In src/module2/nested/deep.ts

   // Main module import - transforms to build path
   import { something } from '../../module1';
   // ↓
   import { something } from '../../../module1/esm';

   // Specific file import - preserves file path
   import { internal } from '../../module1/internal';
   // ↓
   import { internal } from '../../../module1/esm/internal';
   ```
