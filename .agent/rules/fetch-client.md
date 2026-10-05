# Fetch Client Usage

Use these conventions for HTTP clients in application code. Consult the [feature-fetch README](https://github.com/builder-group/community/blob/develop/packages/feature-fetch/README.md) for API details.

- Use `feature-fetch` as the default HTTP client and reuse established clients. Raw `fetch` is fine for isolated requests where a client adds little value or direct response control is needed.
- Create clients in their owning environment or module rather than inside components
