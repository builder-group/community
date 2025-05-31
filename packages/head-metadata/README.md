<h1 align="center">
  <img src="https://raw.githubusercontent.com/your-org/head-metadata/main/.github/banner.svg" alt="head-metadata banner">
</h1>

<p align="left">
  <a href="https://github.com/your-org/head-metadata/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/your-org/head-metadata?label=license&style=flat&colorA=293140&colorB=00C896" alt="GitHub License"/>
  </a>
  <a href="https://www.npmjs.com/package/head-metadata">
    <img src="https://img.shields.io/bundlephobia/minzip/head-metadata?label=minzipped%20size&style=flat&colorA=293140&colorB=00C896" alt="NPM bundle minzipped size"/>
  </a>
  <a href="https://www.npmjs.com/package/head-metadata">
    <img src="https://img.shields.io/npm/dt/head-metadata.svg?label=downloads&style=flat&colorA=293140&colorB=00C896" alt="NPM total downloads"/>
  </a>
</p>

> Status: Experimental

`head-metadata` is a utility for extracting structured metadata (like `<meta>`, `<title>`, and `<link>`) from the `<head>` of an HTML document. 

## 📖 Usage

### Extract Metadata from `<head>`

```ts
import { extractHeadMetadata } from 'head-metadata';
import { metaExtractor, titleExtractor, linkExtractor } from 'head-metadata/extractors';

const html = `
  <html>
    <head>
      <title>Example</title>
      <meta name="description" content="An example page" />
      <link rel="canonical" href="https://example.com" />
    </head>
  </html>
`;

const metadata = extractHeadMetadata(html, {
  meta: metaExtractor,
  title: titleExtractor,
  link: linkExtractor
});

console.log(metadata);
/*
{
  title: 'Example',
  meta: {
    description: 'An example page'
  },
  link: {
    canonical: 'https://example.com'
  }
}
*/
```

### Create Custom Extractors

You can write your own extractors to handle any `<head>` child element:

```ts
export const customLinkExtractor = {
	type: 'collection' as const,
	parent: 'link' as const,
	callback: (node) => {
		const rel = node.attributes.find((a) => a.local === 'rel');
		const href = node.attributes.find((a) => a.local === 'href');
		if (rel != null && href != null) {
			return { key: rel.value, value: href.value };
		}

		return null;
	}
} satisfies TCollectionExtractor;
```
