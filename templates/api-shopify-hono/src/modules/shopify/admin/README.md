# Shopify Admin

Authenticated boundary between the application and Shopify Admin API. It assumes an embedded app using Shopify-managed installation and token exchange.

## Responsibilities

- Authenticate requests originating from the embedded Shopify app
- Resolve the shop associated with each request
- Acquire and retain Shopify Admin API access
- Provide a request-scoped Admin API context to application modules
- Normalize Shopify Admin API failures at the integration boundary

## Authentication Flow

1. Shopify App Bridge sends a short-lived session token with the request.
2. The application verifies the token and validates its shop domain.
3. An active offline access token is loaded from the database when available.
4. An expired access token is rotated with its refresh token when possible.
5. Otherwise, the session token is exchanged for a new offline access token.
6. Exchanged tokens create or reactivate the installation transactionally; refreshed tokens rotate only the current active credential.
7. Application behavior receives a request-scoped Admin API context for that shop.

## Token Model

Offline access tokens represent the installed app for a shop rather than one user session. Public apps use expiring offline tokens with rotating refresh tokens.

Stored tokens are reused only while active for the configured scopes. This keeps access aligned with Shopify-managed scope changes.

The database stores access-token expiry, refresh-token, and refresh-token expiry data across processes and deployments. Background processes must refresh expired offline tokens before creating an Admin API context.

## Invalid Session Retries

When a supplied session token cannot be verified, the API signals Shopify App Bridge to retry with a fresh token.
When Shopify rejects a stored Admin API access token, the token is marked for refresh so the next authenticated request rotates it before retrying Admin API access.

## Design Decisions

### Why use token exchange?

Embedded apps receive short-lived session tokens from Shopify App Bridge. Token exchange turns that verified identity into Admin API access without an authorization-code callback flow. Standalone apps require a different authorization boundary.

### Why use offline access tokens?

This boundary represents the installed app's access to a shop and does not model an individual Shopify user's permissions. Operations that must inherit the current user's permissions should use a separate online-session authentication path.

### Why validate the shop domain explicitly?

The signed session token identifies the shop through its `dest` claim. The module validates the extracted hostname before using it for session lookup or Shopify API access.

### Why use a request-scoped Admin API context?

Every request belongs to one shop and access token. A request-scoped context keeps that identity explicit and prevents credentials from being shared across shops.

## References

- [Implement custom authorization](https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript)
- [Exchange a session token for an access token](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange)
- [About session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens)
- [About offline access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens)
- [About online access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/online-access-tokens)
- [Shopify Admin API rate limits](https://shopify.dev/docs/api/usage/limits)
