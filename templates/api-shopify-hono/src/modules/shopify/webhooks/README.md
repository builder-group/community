# Shopify Webhooks

Authenticated boundary for lifecycle and compliance events delivered by Shopify.

## Responsibilities

- Verify every delivery against the exact raw request body
- Validate the shop domain and expected topic before processing
- Keep stored Shopify installations aligned with app lifecycle and scope changes
- Provide the mandatory privacy compliance endpoints for App Store distribution

## Delivery Model

Webhook subscriptions belong in `shopify.app.toml` as app-specific subscriptions. Each endpoint accepts only its configured topic, even when another Shopify webhook has a valid signature.

Handlers must remain idempotent because Shopify can deliver the same webhook more than once. Use the Shopify webhook ID for deduplication when an operation cannot be naturally idempotent.

## Lifecycle Events

`app/uninstalled` marks the installation as uninstalled and removes its credentials and Shopify users. `app/scopes_update` records the installation's current granted scopes.

Lifecycle handlers compare Shopify's event time with the installation time so a delayed webhook cannot mutate a newer reinstallation.

## Compliance Events

The base template stores no customer data and no shop-owned application data beyond the Shopify installation, users, and credentials. Customer compliance events therefore require no application cleanup, while `shop/redact` removes the remaining Shopify installation data.

Extend these handlers when introducing persistent customer or shop data.

## Operational Constraints

Shopify expects webhook endpoints to acknowledge deliveries quickly. Move expensive processing to durable background work when handlers grow beyond small idempotent updates.

## References

- [Verify webhook deliveries](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)
- [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Configure app-specific subscriptions](https://shopify.dev/docs/apps/build/webhooks/subscribe/get-started)
