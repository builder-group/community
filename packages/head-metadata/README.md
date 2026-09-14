<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/head-metadata/.github/banner.svg" alt="head-metadata banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/head-metadata">
        <img src="https://img.shields.io/bundlephobia/minzip/head-metadata.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/head-metadata">
        <img src="https://img.shields.io/npm/dt/head-metadata.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`head-metadata` extracts typed values from the first `<head>` element in an HTML
document. Choose an output field and extractor for each value you need. Single
extractors keep one value, while collection extractors preserve repeated values in
document order.

- Extract titles, base URLs, meta tags, and links without building a full-page DOM
- Preserve repeated Open Graph images, icons, alternates, and other metadata
- Infer result fields and value types from the extractor config
- Decode character references in attributes and ordinary text
- Add custom extractors for project-specific head elements

```ts
import { extractHeadMetadata, linkExtractor, metaExtractor, titleExtractor } from 'head-metadata';

const metadata = extractHeadMetadata(
  `<head>
    <title>Example</title>
    <meta property="og:image" content="/first.png">
    <meta property="og:image" content="/second.png">
    <link rel="icon" sizes="48x48" href="/favicon.png">
  </head>`,
  {
    title: titleExtractor,
    meta: metaExtractor,
    links: linkExtractor
  }
);

metadata.title; // 'Example' | undefined
metadata.meta; // both og:image entries, in document order
metadata.links; // [{ rel: ['icon'], sizes: ['48x48'], href: '/favicon.png' }]
```

Migrating from `0.0.x`? See [MIGRATION.md](./MIGRATION.md).

## Install

```bash
npm install head-metadata
```

## Usage

Pass the HTML string and an extractor config to `extractHeadMetadata()`:

```ts
import {
  baseExtractor,
  extractHeadMetadata,
  linkExtractor,
  metaExtractor,
  titleExtractor
} from 'head-metadata';

const metadata = extractHeadMetadata(html, {
  title: titleExtractor,
  baseHref: baseExtractor,
  meta: metaExtractor,
  links: linkExtractor
});
```

Config keys name the output fields. Each extractor's `tag` selects the HTML element
it receives. Multiple extractors can select the same tag and produce different
fields.

The extractor kind determines whether an output field is optional or always present:

| Extractor kind | Result                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| `single`       | First non-null result. The field is omitted when nothing produces one. |
| `collection`   | All non-null results in document order. An empty array when unmatched. |

## API

### `extractHeadMetadata(html, extractors)`

Extracts configured values from the first `<head>` element.

```ts
const metadata = extractHeadMetadata(html, {
  pageTitle: titleExtractor,
  meta: metaExtractor
});

metadata.pageTitle; // string | undefined
metadata.meta; // TMetaMetadata[]
```

The function stops parsing after the first selected head. Tokenizer errors and
extractor callback errors propagate to the caller.

Extractor callbacks receive a `TXmlNode`:

| Field        | Description                                 |
| ------------ | ------------------------------------------- |
| `local`      | Lowercase local element name                |
| `prefix`     | Lowercase namespace prefix, when present    |
| `attributes` | Attributes with decoded values              |
| `content`    | Child nodes and non-whitespace text content |

Character references are decoded in ordinary text and attribute values. Script,
style, and CDATA content remain literal. URLs are not resolved or otherwise changed.

## Built-In Extractors

### `titleExtractor`

Selects `<title>` and returns its trimmed text. Configure it as a single field:

```ts
const metadata = extractHeadMetadata(html, {
  title: titleExtractor
});
```

The first title that produces text wins. `metadata.title` is `undefined` when no
title produces text.

### `baseExtractor`

Selects `<base>` and returns its `href` without resolving it:

```ts
const metadata = extractHeadMetadata(html, {
  baseHref: baseExtractor
});
```

The first base element with an `href` wins.

### `metaExtractor`

Selects `<meta>` elements and returns `TMetaMetadata[]`. Each entry preserves the
supported attributes that are present:

```ts
const metadata = extractHeadMetadata(
  `<head>
    <meta name="description" content="An example page">
    <meta property="og:image" content="/first.png">
    <meta property="og:image" content="/second.png">
  </head>`,
  { meta: metaExtractor }
);

metadata.meta;
// [
//   { name: 'description', content: 'An example page' },
//   { property: 'og:image', content: '/first.png' },
//   { property: 'og:image', content: '/second.png' }
// ]
```

Supported fields are `charset`, `name`, `property`, `httpEquiv`, and `content`.
An element without any supported attribute is skipped.

### `linkExtractor`

Selects `<link>` elements that contain both `rel` and `href`, and returns
`TLinkMetadata[]`:

```ts
const metadata = extractHeadMetadata(
  `<head>
    <link rel="icon" type="image/png" sizes="32x32 48x48" href="/favicon.png">
  </head>`,
  { links: linkExtractor }
);

metadata.links;
// [{
//   rel: ['icon'],
//   href: '/favicon.png',
//   type: 'image/png',
//   sizes: ['32x32', '48x48']
// }]
```

`rel` and `sizes` are split on ASCII whitespace. Relation tokens are lowercase.
The extractor also preserves `media` and `hreflang` when present.

## Custom Extractors

Use `TSingleExtractor<GValue>` for the first matching value and
`TCollectionExtractor<GValue>` for every matching value. Return `null` to skip an
element.

```ts
import { extractHeadMetadata, type TSingleExtractor } from 'head-metadata';

const descriptionExtractor = {
  tag: 'meta',
  type: 'single',
  callback: (node) => {
    const name = node.attributes.find((attribute) => attribute.local === 'name')?.value;
    const content = node.attributes.find((attribute) => attribute.local === 'content')?.value;
    return name === 'description' ? (content ?? null) : null;
  }
} satisfies TSingleExtractor<string>;

const metadata = extractHeadMetadata(html, {
  description: descriptionExtractor
});

metadata.description; // string | undefined
```

Set `tag` to the lowercase HTML tag name. Config keys remain independent from tag
names, so several extractors can read the same element:

```ts
const metadata = extractHeadMetadata(html, {
  meta: metaExtractor,
  description: descriptionExtractor
});
```

## Scope

`head-metadata` parses HTML you already have. The calling application remains
responsible for:

- Fetching pages and following redirects
- Limiting response size and request duration
- Resolving relative URLs against the page URL and `<base href>`
- Selecting preferred Open Graph, Twitter, and fallback values
- Validating or downloading referenced resources

## FAQ

### Why use extractors instead of returning every head element?

Extractors keep parsing separate from application policy. They also keep the result
small and typed: callers choose the elements and output fields they need.

### Are repeated metadata values preserved?

Yes. Collection extractors append every non-null result in document order. This
allows callers to choose among repeated Open Graph images, icons, and alternate
links.

### Does it parse the entire document?

No. It processes only the first `<head>` selected by `xml-tokenizer`, then advances
the tokenizer to the end of its input. The HTML string is still supplied by the
caller; network streaming and response limits are outside this package.
