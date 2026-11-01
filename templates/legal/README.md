# Legal templates

Privacy-notice templates for German sole proprietors.

| Template                             | Use for                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| [Offline app](offline-app/README.md) | Installed apps with local content and usage records              |
| [Website](website/README.md)         | Marketing sites, including app landing, help, and legal pages    |
| [Web app](web-app/README.md)         | Services with accounts, server-side processing, or cloud storage |

These drafts are based on [official sources](#resources-and-references) and require adaptation to actual processing and applicable law. They do not replace legal advice.

## Use a template

1. Read the template's guide and copy its `privacy.md` into the product's documentation or website source.
2. Replace every `{{PLACEHOLDER}}`. **Inline** fields take a value or phrase that fits the surrounding sentence, without final punctuation. **Block** fields take complete Markdown paragraphs, lists, or tables. Identity, date, and authority fields are Inline.
3. Follow the omission instructions, removing inapplicable sections and their headings. Add any processing not covered by the template.
4. Verify the completed notice against the app, dependencies, provider settings, and deletion controls. Keep authoring notes out of the published text.

## Gather the facts

For each processing activity, record:

- Purpose, personal data, and source.
- Your role, applicable legal basis, and any legitimate interest pursued.
- Recipients and their roles.
- Retention period or deletion criteria, including logs and backups.
- Processing countries and applicable transfer mechanisms.

Connect each legal basis to its purpose. Retention periods or criteria must let readers understand when deletion occurs, including the starting event and any different backup timing.

## Choose a legal basis

A controller determines processing purposes and essential means. A processor processes data on a controller's behalf and under its instructions. Assess local functionality, hosted services, support, and platform reports separately. Local processing or lack of access alone does not rule out controller responsibility.

Common bases for processing you control include:

| Basis                                      | Conditions                                                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract, Article 6(1)(b) GDPR             | Objectively necessary to perform a contract with the affected person or take pre-contractual steps they request                                                                    |
| Legitimate interests, Article 6(1)(f) GDPR | A specific lawful interest, necessary processing, and a documented assessment showing that the person's interests and rights do not override it. State the interest in the notice. |
| Legal obligation, Article 6(1)(c) GDPR     | Applicable EU or national law requires the processing. Identify the duty.                                                                                                          |
| Consent, Article 6(1)(a) GDPR              | Freely given, specific, informed, unambiguous consent that you can demonstrate. Obtain it before processing and make withdrawal as easy as giving consent.                         |

For consent-based processing, explain the actual consent and withdrawal controls in the relevant section, adding prose beside Inline fields where needed.

Assess device storage and access separately under Section 25 TDDDG, including its consent requirements and exceptions. Operating-system permissions do not automatically satisfy GDPR consent requirements.

## Complete the shared details

- **Identity:** `CONTROLLER_NAME`, `TRADING_NAME`, `CONTROLLER_ADDRESS`, and `CONTACT_EMAIL` identify the operator. Use the sole proprietor's full legal name. Remove the "trading as" phrase if no trading name is used.
- **Date:** `EFFECTIVE_DATE` is the notice's effective date.
- **Contact:** `CONTACT_LEGAL_BASIS_AND_INTEREST` (Inline) gives the legal basis and any legitimate interest. `CONTACT_RECIPIENTS_AND_TRANSFERS` (Block) describes providers, roles, applicable transfers, and how to obtain safeguards. `CONTACT_RETENTION_PERIOD_OR_CRITERIA` (Inline) covers correspondence and backup retention periods or deletion criteria.
- **Transfers:** identify destinations, applicable adequacy decisions or safeguards, and how to obtain their details. Verify provider agreements, subprocessors, backups, and remote access, including when using EEA hosting.
- **Authority:** `AUTHORITY_NAME` and `AUTHORITY_URL` identify the competent supervisory authority. Add data protection officer or representative contact details where applicable.

## Boundaries

Additional assessment and disclosures are needed for children's services, special-category data, employment, direct marketing, and regulated sectors. Implement the required controls, consent mechanisms, and provider agreements alongside the notice.

## Keep notices current

Publish a complete notice at a stable URL for each product, in language the audience understands. Provide information at direct collection. For data obtained from others, follow the [Article 14 guidance](web-app/README.md#inform-people-whose-data-comes-from-others). Explain new purposes before further processing starts.

Review notices when data flows, permissions, dependencies, providers, retention, or the operator change.

## Resources and references

Sources checked on November 1, 2026.

| Source                                                                                                                                                                                            | Relevance                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GDPR, official EUR-Lex text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng/)                                                                                                                 | Principles, legal bases, transparency, rights, processors, and international transfers                                                                |
| [EDPB: lawful processing](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en)                                                                                          | Conditions for the legal bases                                                                                                                        |
| [EDPB: controller and processor guidelines 07/2020](https://www.edpb.europa.eu/documents/guideline/guidelines-072020-on-the-concepts-of-controller-and-processor-in-the-gdpr_en)                  | Roles and responsibilities                                                                                                                            |
| [EDPB: international transfers](https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en)                                                                                      | Transfer criteria and mechanisms                                                                                                                      |
| [EDPB: individuals' rights](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en)                                                                                            | Rights and request handling                                                                                                                           |
| [Article 29 Working Party: transparency guidelines, WP260 rev.01](https://www.datenschutz-berlin.de/fileadmin/user_upload/pdf/publikationen/art29-gruppe/WP260-Guidelines_on_transparency-en.pdf) | Article 13 and 14 disclosures, retention criteria, and presentation of rights                                                                         |
| [Section 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html)                                                                                                                            | German device-storage and access rules                                                                                                                |
| [DSK: digital-service guidance, November 2024](https://www.lfd.niedersachsen.de/dsk-dienste)                                                                                                      | GDPR and TDDDG for apps and websites                                                                                                                  |
| [CNIL: mobile-app recommendations, April 2025](https://www.cnil.fr/sites/cnil/files/2025-05/recommendation-mobiles-app.pdf)                                                                       | Section 3.3 covers local-processing roles. French authority guidance, not a binding German determination. The English text is a courtesy translation. |
| [Apple: App Store privacy details](https://developer.apple.com/app-store/app-privacy-details/)                                                                                                    | App Store collection definitions and third-party code. These definitions differ from GDPR processing.                                                 |
