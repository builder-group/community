# Web-app privacy template

Use [privacy.md](privacy.md) with the [shared instructions and fields](../README.md) for a hosted service with accounts, server-side processing, or cloud storage.

If including marketing pages in the same notice, cover their processing too.

## Service placeholders

| Placeholder                                      | Form   | Fill with                                                                                                                                                                 | Omission                                                                                       |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `SERVICE_NAME`                                   | Inline | The service's public name                                                                                                                                                 | Required                                                                                       |
| `SERVICE_SCOPE_AND_URLS`                         | Inline | The product, domains, and service pages covered                                                                                                                           | Required                                                                                       |
| `WEBSITE_PRIVACY_URL`                            | Inline | The separate marketing-site notice                                                                                                                                        | Remove the separate-site sentence if this notice covers both scopes or no separate site exists |
| `CONTROLLER_AND_PROCESSOR_ROLES`                 | Block  | Your controller activities and customer-controlled processing, with controller contacts and request routes                                                                | Remove if the operator is the controller for all covered processing                            |
| `SERVICE_DATA_AND_SOURCES`                       | Block  | Data categories and sources, including accounts, content, hosting, and logs                                                                                               | Required                                                                                       |
| `SERVICE_PURPOSES_LEGAL_BASES_AND_REQUIRED_DATA` | Block  | Each purpose, basis and interest, whether data is required by law or contract or needed to enter a contract, and consequences of withholding it                           | Required                                                                                       |
| `CONTENT_ACCESS_AND_SHARING`                     | Block  | Access to private, collaborative, or public content and user sharing controls                                                                                             | Remove the section if there is no user content to describe                                     |
| `OPTIONAL_SERVICE_PROCESSING_AND_CONSENT`        | Block  | [Processing details](../README.md#gather-the-facts) for additional features such as billing, analytics, integrations, and device access, with applicable consent controls | Remove if no storage/access or additional processing applies                                   |
| `PROVIDERS_AND_TRANSFERS`                        | Block  | Providers, roles, applicable transfer destinations and mechanisms, and how to obtain safeguards                                                                           | Required                                                                                       |
| `RETENTION_DELETION_AND_BACKUPS`                 | Block  | Retention, deletion controls, backup deletion, and statutory retention                                                                                                    | Required                                                                                       |
| `AUTOMATED_DECISIONS`                            | Block  | Solely automated decisions with legal or similarly significant effects, how they work, consequences, and rights                                                           | Remove if none exist                                                                           |

For customer-controlled content, adapt "Who is responsible" and "Requests and complaints" to identify the controller, the request route, and any forwarding or assistance you provide under the agreement.

## Inform people whose data comes from others

For processing you control, Article 14 applies to data obtained from others. Include its categories and specific source, including whether it is public, alongside the other processing details.

Provide the information within a reasonable period, at most one month after obtaining the data. If earlier, provide it by the first communication with the person or the first planned disclosure to another recipient. Ensure it reaches affected people, including non-users.

Assess and document any Article 14 exception before relying on it.
