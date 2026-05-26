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

`head-metadata` extracts structured metadata from the `<head>` of an HTML document. It streams through the first head element with `xml-tokenizer`, ships extractors for `title`, `meta`, and `link`, and lets you add focused extractors for project-specific tags.

- Read page title, meta tags, Open Graph tags, charset, and canonical links into typed output
- Stop after the first `<head>` so full-page HTML does not need a DOM parse
- Combine built-in extractors with custom `single` and `collection` extractors
- Keep the extraction shape explicit: output keys come from the extractor config

```ts
import { extractHeadMetadata, linkExtractor, metaExtractor, titleExtractor } from 'head-metadata';

const html = `
  <head>
    <title>Example</title>
    <meta name="description" content="An example page" />
    <meta property="og:title" content="Example OG title" />
    <link rel="canonical" href="https://example.com" />
  </head>
`;

const metadata = extractHeadMetadata(html, {
  title: titleExtractor,
  meta: metaExtractor,
  link: linkExtractor
});

console.log(metadata.title);
console.log(metadata.meta.description);
console.log(metadata.meta['og:title']);
console.log(metadata.link.canonical);
```

## Install

```bash
npm install head-metadata
```

## Usage

Pass HTML and the extractors you want to run:

```ts
import { extractHeadMetadata, linkExtractor, metaExtractor, titleExtractor } from 'head-metadata';

const html = `
  <html>
    <head>
      <title>Example</title>
      <meta name="description" content="An example page" />
      <meta property="og:title" content="Example OG title" />
      <link rel="canonical" href="https://example.com" />
    </head>
    <body>Hello</body>
  </html>
`;

const metadata = extractHeadMetadata(html, {
  title: titleExtractor,
  meta: metaExtractor,
  link: linkExtractor
});

metadata.title; // Example
metadata.meta.description; // An example page
metadata.meta['og:title']; // Example OG title
metadata.link.canonical; // https://example.com
```

The output shape follows the extractor config. Collection extractors return records, and single extractors return one value.

## Built-in Extractors

### `titleExtractor`

Reads text content from `<title>` and returns it as `metadata.title`.

```ts
const metadata = extractHeadMetadata(html, {
  title: titleExtractor
});
```

### `metaExtractor`

Reads `<meta>` tags into `metadata.meta`.

```html
<meta charset="utf-8" />
<meta name="description" content="An example page" />
<meta property="og:title" content="Example OG title" />
```

The extractor uses `charset`, `name`, or `property` as the record key.

### `linkExtractor`

Reads `<link>` tags into `metadata.link`.

```html
<link rel="canonical" href="https://example.com" />
```

The extractor uses `rel` as the record key and `href` as the value.

## Custom Extractors

Use a `single` extractor for one output value:

```ts
import type { TSingleExtractor } from 'head-metadata';

const viewportExtractor = {
  type: 'single',
  key: 'viewport',
  callback: (node) => {
    const name = node.attributes.find((attr) => attr.local === 'name');
    const content = node.attributes.find((attr) => attr.local === 'content');

    return name?.value === 'viewport' && content != null ? content.value : null;
  }
} satisfies TSingleExtractor;
```

```ts
const metadata = extractHeadMetadata(html, {
  meta: viewportExtractor
});

metadata.viewport;
```

Use a `collection` extractor when many tags should contribute to one record:

```ts
import type { TCollectionExtractor } from 'head-metadata';

const iconExtractor = {
  type: 'collection',
  parent: 'link',
  callback: (node) => {
    const rel = node.attributes.find((attr) => attr.local === 'rel');
    const href = node.attributes.find((attr) => attr.local === 'href');

    if (rel?.value.includes('icon') === true && href != null) {
      return { key: rel.value, value: href.value };
    }

    return null;
  }
} satisfies TCollectionExtractor;
```

Install custom extractors under the tag name they should receive:

```ts
const metadata = extractHeadMetadata(html, {
  link: iconExtractor
});
```

## API

### `extractHeadMetadata(html, extractors)`

Streams through the first `<head>` element and returns metadata collected by the provided extractors.

```ts
const metadata = extractHeadMetadata(html, {
  title: titleExtractor,
  meta: metaExtractor
});
```

Extractor callbacks receive a `TXmlNode` with this shape:

| Field        | Description                                      |
| ------------ | ------------------------------------------------ |
| `local`      | Local element name                               |
| `prefix`     | Namespace prefix when present                    |
| `attributes` | Parsed attributes with local name, prefix, value |
| `content`    | Child nodes and text content                     |

## FAQ

### Is this a full metadata crawler?

No. `head-metadata` extracts metadata from HTML you already have. Fetching pages, following redirects, resolving relative URLs, and crawling links stay in your application code.

### Why does it use extractors instead of returning every head tag?

Extractors keep the output shape explicit and typed. You choose which tags matter, how keys are derived, and which tags should be ignored.

### Can I extract Open Graph and Twitter metadata?

Yes. `metaExtractor` stores both `name` and `property` attributes as keys, so tags such as `og:title` and `twitter:card` are included in `metadata.meta`.
