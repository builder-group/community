# Shopify Admin

Authenticated boundary between the application and Shopify Admin API. It assumes an embedded app using Shopify-managed installation and token exchange.

## Responsibilities

- Authenticate requests originating from the embedded Shopify app
- Resolve the shop associated with each request
- Acquire and retain installation- and user-scoped Shopify Admin API access
- Provide request-scoped installation and user contexts to application modules
- Normalize Shopify Admin API failures at the integration boundary

## Context Model

### Installation context

`ShopifyInstallationCx` represents the installed app's authority for one shop. It uses an offline
access token and supports work that does not depend on the current Shopify user, including
background processing.

### User context

`ShopifyUserCx` represents the current Shopify user's authority for one shop. It uses an online
access token, carries the associated user profile and scopes, and lets Shopify enforce that user's
permissions.

## Authentication Flows

Both flows begin at the same trust boundary:

1. Shopify App Bridge sends a short-lived session token with the request.
2. The application verifies the token and validates its shop domain.

### Installation-scoped access

1. Load an active offline access token for the shop when one exists.
2. Rotate an expired access token with its refresh token when possible.
3. Otherwise, exchange the verified session token for a new offline access token.
4. Create or reactivate the installation when storing an exchanged credential.
5. Provide `ShopifyInstallationCx` to the application behavior.

### User-scoped access

1. Resolve the installation's offline credential to establish the installation and its background access.
2. Load a reusable online access token for the current Shopify user when one exists.
3. Otherwise, exchange the verified session token for a new online access token.
4. Store the online credential and associated Shopify user separately from the installation credential.
5. Provide `ShopifyUserCx` to the application behavior.

## Token Model

Offline access tokens represent the installed app for a shop rather than one user session. Public
apps use expiring offline tokens with rotating refresh tokens.

Online access tokens represent one Shopify user and inherit that user's permissions. They are
short-lived and can only be reacquired from an active embedded session.

Stored credentials are reused only while active for the required scopes. Offline and online
credentials remain separate because they represent different authorization scopes and lifecycles.

## Invalid Session Retries

When a supplied session token cannot be verified, the API signals Shopify App Bridge to retry with a fresh token.
When Shopify rejects a stored Admin API access token, the relevant offline or online token is marked
for renewal before App Bridge retries the request with a fresh session token.

## Design Decisions

### Why use token exchange?

Embedded apps receive short-lived session tokens from Shopify App Bridge. Token exchange turns that verified identity into Admin API access without an authorization-code callback flow. Standalone apps require a different authorization boundary.

### Why maintain offline and online access separately?

Offline access supports installation-scoped and background work. Online access preserves the
current Shopify user's identity and permissions. Separate contexts prevent an operation from
silently receiving broader authority than intended.

### Why validate the shop domain explicitly?

The signed session token identifies the shop through its `dest` claim. The module validates the extracted hostname before using it for session lookup or Shopify API access.

### Why use request-scoped contexts?

Every request belongs to one shop and access token. Installation and user contexts keep that
authorization scope explicit and prevent credentials from being shared across shops or users.

## References

- [Implement custom authorization](https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript)
- [Exchange a session token for an access token](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange)
- [About session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens)
- [About offline access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens)
- [About online access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/online-access-tokens)
- [Shopify Admin API rate limits](https://shopify.dev/docs/api/usage/limits)
