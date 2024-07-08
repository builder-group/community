---
'feature-logger': patch
'@ibg/openapi-router': patch
'feature-fetch': patch
'feature-state': patch
'feature-form': patch
---

Listed `@ibg/types` as a dependency to ensure it's automatically installed for consumers, preventing issues like `any` types for `feature-x` packages due to missing `TUnionToIntersection`.

For more details: [Microsoft/types-publisher/issues/81](https://github.com/Microsoft/types-publisher/issues/81).
