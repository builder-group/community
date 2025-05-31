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
        <img src="https://img.shields.io/npm/dt/featuer-state.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`head-metadata` is a typesafe and straightforward utility for extracting structured metadata (like `<meta>`, `<title>`, and `<link>`) from the `<head>` of an HTML document. 

## 📖 Usage

### Extract Metadata from `<head>`

```ts
import { extractHeadMetadata, metaExtractor, titleExtractor, linkExtractor } from 'head-metadata';

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
