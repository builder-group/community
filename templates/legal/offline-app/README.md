# Offline-app privacy template

Use [privacy.md](privacy.md) with the [shared instructions and fields](../README.md). [Examples](examples.md) cover SelfieMirror, Kairos, and Tapling.

## Scope

Use for apps whose content and usage records remain on the device, with no developer-operated accounts, remote content processing, advertising, cross-app tracking, or developer analytics service.

## App placeholders

| Placeholder                                    | Form   | Fill with                                                                                      | Omission                                                      |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `APP_NAME`, `APP_PLATFORMS`                    | Inline | Public name and supported platforms, including mobile or desktop                               | Required                                                      |
| `WEBSITE_PRIVACY_URL`                          | Inline | The website notice covering visits to the app's landing, support, and legal pages              | Required for the separate website scope used by this template |
| `APP_LOCAL_DATA_AND_FUNCTIONS`                 | Block  | Local data, functions, usage records, and temporary exports                                    | Required                                                      |
| `APP_PROCESSING_LEGAL_BASES_AND_DEVICE_ACCESS` | Block  | Role in local processing, applicable controller legal bases, and device storage/access grounds | Required                                                      |
| `APP_PERMISSIONS_AND_CHOICES`                  | Block  | Permissions, purposes, optionality, and user controls                                          | Remove if no permissions or choices need explaining           |
| `LOCAL_RETENTION_AND_DELETION`                 | Block  | Retention, deletion/reset controls, and their limits                                           | Required                                                      |
| `PLATFORM_SERVICES_AND_BACKUPS`                | Block  | Platform services, backups, and any platform-provided diagnostics or usage reports received    | Remove if none apply                                          |
| `SUPPORT_DIAGNOSTIC_DETAILS`                   | Block  | Data added to support drafts or attachments and available choices                              | Remove if none are added                                      |

Check SDK diagnostics, licence checks, and runtime downloads when verifying network behaviour. For iOS, consider App Store reports, iCloud Photos downloads, and device backups.
