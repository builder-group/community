# Shopify Webhooks

Authenticated boundary for lifecycle and compliance events delivered by Shopify.

## Responsibilities

- Verify every delivery against the exact raw request body
- Validate the shop domain and expected topic before processing
- Keep stored Shopify sessions aligned with app lifecycle and scope changes
- Provide the mandatory privacy compliance endpoints for App Store distribution

## Delivery Model

Webhook subscriptions belong in `shopify.app.toml` as app-specific subscriptions. Each endpoint accepts only its configured topic, even when another Shopify webhook has a valid signature.

Handlers must remain idempotent because Shopify can deliver the same webhook more than once. Use the Shopify webhook ID for deduplication when an operation cannot be naturally idempotent.

## Lifecycle Events

`app/uninstalled` removes every stored session for the shop. `app/scopes_update` updates stored session scopes so later Admin API authentication can detect missing configured access.

## Compliance Events

The base template stores no customer data and no shop-owned application data beyond Shopify sessions. Customer compliance events therefore require no application cleanup, while `shop/redact` removes any remaining sessions.

Extend these handlers when introducing persistent customer or shop data.

## Operational Constraints

Shopify expects webhook endpoints to acknowledge deliveries quickly. Move expensive processing to durable background work when handlers grow beyond small idempotent updates.

## References

- [Verify webhook deliveries](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)
- [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Configure app-specific subscriptions](https://shopify.dev/docs/apps/build/webhooks/subscribe/get-started)
