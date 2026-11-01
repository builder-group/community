# Website privacy template

Use [privacy.md](privacy.md) with the [shared instructions and fields](../README.md) for public informational pages, including app landing, help, and legal pages.

## Website and hosting placeholders

| Placeholder                            | Form   | Fill with                                                                       | Omission                                                                        |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `WEBSITE_NAMES_AND_DOMAINS`            | Inline | Names and domains covered by this notice                                        | Required                                                                        |
| `APP_PRIVACY_INDEX_URL`                | Inline | The page listing the installed-app privacy notices                              | Remove the app-notice sentence if no apps are offered                           |
| `HOSTING_PROVIDER`                     | Inline | The actual hosting provider                                                     | Required                                                                        |
| `HOSTING_PURPOSES`                     | Inline | Additional hosting purposes                                                     | If page delivery is the only purpose, remove the preceding "and" and this field |
| `HOSTING_DATA_AND_SOURCES`             | Inline | Request data processed and its sources                                          | Required                                                                        |
| `HOSTING_LEGAL_BASIS_AND_INTEREST`     | Inline | Purpose-specific legal basis and any legitimate interest                        | Required                                                                        |
| `HOSTING_RECIPIENT_ROLE`               | Inline | Sentence identifying the provider's role                                        | Required                                                                        |
| `HOSTING_RETENTION_PERIOD_OR_CRITERIA` | Inline | Log and other request-data retention periods or criteria                        | Required                                                                        |
| `HOSTING_TRANSFERS_AND_SAFEGUARDS`     | Block  | Destinations, transfer mechanisms, and how to obtain safeguards                 | Remove if no international transfers apply                                      |
| `ADDITIONAL_WEBSITE_PROCESSING`        | Block  | [Processing details](../README.md#gather-the-facts) for each additional service | Remove the section if no additional services are used                           |
| `BROWSER_STORAGE_AND_CONSENT`          | Block  | Storage/access purposes, lifetimes, grounds, and applicable user controls       | Remove if no relevant storage or access needs describing                        |

Include third-party assets, embedded media, analytics, and forms when identifying website processing.
