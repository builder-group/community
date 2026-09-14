# Migration Guide

## 0.0.x to 0.1.0

`head-metadata` now uses extractor config keys as output field names. Collection
extractors preserve every result in document order instead of writing values into
a record, and extractor callbacks can return typed values of any shape.

### Move Element Names Into Extractors

Previously, the config key selected the HTML element. The extractor's `key` or
`parent` selected the output field:

```ts
// old
const metadata = extractHeadMetadata(html, {
  title: titleExtractor,
  meta: metaExtractor,
  link: linkExtractor
});
```

Extractors now declare their element with `tag`. Config keys name the output fields:

```ts
// new
const metadata = extractHeadMetadata(html, {
  pageTitle: titleExtractor,
  meta: metaExtractor,
  links: linkExtractor
});
```

This allows multiple extractors to read the same element while producing different
fields.

### Replace Collection Records With Arrays

Collection callbacks previously returned `{ key, value }`. Later values replaced
earlier values with the same key:

```ts
// old
const imageExtractor = {
  type: 'collection',
  parent: 'images',
  callback: (node) => ({ key: 'og:image', value: '/image.png' })
};
```

Collection callbacks now return the item to append. The config key selects the
result array:

```ts
// new
import type { TCollectionExtractor } from 'head-metadata';

const imageExtractor = {
  tag: 'meta',
  type: 'collection',
  callback: () => ({ property: 'og:image', content: '/image.png' })
} satisfies TCollectionExtractor<{ property: string; content: string }>;

const metadata = extractHeadMetadata(html, { images: imageExtractor });
// metadata.images: Array<{ property: string; content: string }>
```

Collections are always present, even when no element produces a value. Repeated
metadata is retained in document order.

### Update Single Extractors

Move the selected element from the config key into `tag` and remove `key`:

```ts
// old
const descriptionExtractor = {
  type: 'single',
  key: 'description',
  callback: extractDescription
};

const metadata = extractHeadMetadata(html, { meta: descriptionExtractor });
```

```ts
// new
import type { TSingleExtractor } from 'head-metadata';

const descriptionExtractor = {
  tag: 'meta',
  type: 'single',
  callback: extractDescription
} satisfies TSingleExtractor<string>;

const metadata = extractHeadMetadata(html, { description: descriptionExtractor });
```

Single extractors keep the first non-null result. Their output field is optional
because no matching element may produce a value.

### Update Built-In Extractor Results

`metaExtractor` and `linkExtractor` now return structured arrays:

| Old result                       | New result                                                        |
| -------------------------------- | ----------------------------------------------------------------- |
| `metadata.meta.description`      | Search `metadata.meta` for `{ name: 'description' }`              |
| `metadata.meta['og:image']`      | Filter `metadata.meta` for `{ property: 'og:image' }`             |
| `metadata.link.icon`             | Filter `metadata.links` for entries whose `rel` includes `'icon'` |
| Repeated keys kept only the last | Repeated entries are all retained in document order               |

Use any config key you prefer. This guide uses `meta` and `links` to match the
built-in result shapes.

The new `baseExtractor` reads the first non-null `<base href>` value.

### Account for Decoded Character References

Extractor callbacks now receive decoded attribute values and ordinary text. For
example, `Cats &amp; Dogs` becomes `Cats & Dogs`. Script, style, and CDATA content
remain literal.

Tokenizer and extractor errors continue to propagate to the caller.
