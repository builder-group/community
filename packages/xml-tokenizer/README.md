<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/xml-tokenizer/.github/banner.svg" alt="xml-tokenizer banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/xml-tokenizer">
        <img src="https://img.shields.io/bundlephobia/minzip/xml-tokenizer.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/xml-tokenizer">
        <img src="https://img.shields.io/npm/dt/xml-tokenizer.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`xml-tokenizer` is a streaming XML, HTML, and SVG tokenizer for TypeScript. It emits typed tokens through a callback, supports early exit when you have the data you need, and includes small helpers for path selection and object conversion when a full DOM would be unnecessary.

- Stream `ElementStart`, `Attribute`, `Text`, `Cdata`, and other tokens without building a tree first
- Pick strict XML, HTML, or SVG parsing behavior with `xmlConfig`, `htmlConfig`, and `svgConfig`
- Stop parsing from inside the callback with `stream.goToEnd()`
- Select matching token ranges with object-based path selectors
- Convert markup into nested or simplified objects when a tree shape is more convenient

```ts
import { htmlConfig, tokenize, type TXmlToken } from 'xml-tokenizer';

let title: string | null = null;
let insideTitle = false;

tokenize(
  '<html><head><title>Hello</title></head></html>',
  (token: TXmlToken, stream) => {
    if (token.type === 'ElementStart' && token.local === 'title') {
      insideTitle = true;
    }

    if (insideTitle && token.type === 'Text') {
      title = token.text.trim();
      stream.goToEnd();
    }
  },
  htmlConfig
);

console.log(title); // Hello
```

## Install

```bash
npm install xml-tokenizer
```

## Usage

Use `tokenize` when you want to process markup as a stream:

```ts
import { tokenize, xmlConfig, type TXmlToken } from 'xml-tokenizer';

tokenize(
  '<book id="1"><title>Dune</title></book>',
  (token: TXmlToken) => {
    switch (token.type) {
      case 'ElementStart':
        console.log('element', token.local);
        break;
      case 'Attribute':
        console.log('attribute', token.local, token.value);
        break;
      case 'Text':
        console.log('text', token.text.trim());
        break;
    }
  },
  xmlConfig
);
```

Use `select` when you only care about matching paths:

```ts
import { select, xmlConfig } from 'xml-tokenizer';

const xml = `
  <bookstore>
    <book category="COOKING"><title>Everyday Italian</title></book>
  </bookstore>
`;

select(
  xml,
  [
    [
      { axis: 'child', local: 'bookstore' },
      { axis: 'child', local: 'book', attributes: [{ local: 'category', value: 'COOKING' }] }
    ]
  ],
  (token, stream) => {
    if (token.type === 'Text') {
      console.log(token.text.trim());
      stream.goToEnd();
    }
  },
  xmlConfig
);
```

Use the object helpers when you want a small tree representation:

```ts
import { xmlToObject, xmlToSimplifiedObject } from 'xml-tokenizer';

const tree = xmlToObject('<book id="1"><title>Dune</title></book>');
const simplified = xmlToSimplifiedObject('<book id="1"><title>Dune</title></book>');
```

## Configs

Choose the config that matches the input:

| Config       | Use for                              |
| ------------ | ------------------------------------ |
| `xmlConfig`  | Strict XML documents                 |
| `htmlConfig` | HTML with raw text and void elements |
| `svgConfig`  | SVG fragments and documents          |

All configs are `TXmlStreamOptions`, so you can pass custom options when you need different parser behavior:

```ts
tokenize(markup, onToken, {
  ...htmlConfig,
  contextSliceSize: 80
});
```

## Tokens

`tokenize` can emit these token types:

| Token                   | Example                  |
| ----------------------- | ------------------------ |
| `ProcessingInstruction` | `<?target content?>`     |
| `Comment`               | `<!-- text -->`          |
| `EntityDeclaration`     | `<!ENTITY name "value">` |
| `ElementStart`          | `<book`                  |
| `Attribute`             | `id="1"`                 |
| `ElementEnd`            | `>`, `</book>`, or `/>`  |
| `Text`                  | Text between elements    |
| `Cdata`                 | `<![CDATA[text]]>`       |

Structure-sensitive code should handle `ElementStart`, `ElementEnd`, and `Attribute` deliberately. Keep parser state outside the callback, and call `stream.goToEnd()` once the target data has been found.

## Selectors

Selectors use object paths instead of XPath strings:

```ts
const cookingBooks = [
  { axis: 'child', local: 'bookstore' },
  { axis: 'child', local: 'book', attributes: [{ local: 'category', value: 'COOKING' }] }
] as const;
```

Each segment can match by `local`, `prefix`, attributes, and text. Use `axis: 'child'` for direct children and `axis: 'self-or-descendant'` for descendants.

## Object Helpers

`xmlToObject` returns a nested node tree with `local`, `prefix`, `attributes`, and `content`.

`xmlToSimplifiedObject` returns a more compact object shape where element names are stored under underscored keys such as `_book`.

`tokensToXml`, `tokenToXml`, and `xmlToString` help rebuild markup from token or object data when you need a serialization step.

## Examples

- [Vanilla profiler](https://github.com/builder-group/community/tree/develop/examples/xml-tokenizer/vanilla/playground)

## FAQ

### Is this a DOM parser?

No. `xml-tokenizer` is built for streaming extraction and lightweight conversion. Use it when you want to inspect, select, or transform markup without committing to a full DOM model.

### Which config should I use for HTML?

Use `htmlConfig`. It enables HTML-oriented behavior such as raw text elements and implicit self-closing elements.

### Why does the tokenizer use callbacks instead of generators?

Callbacks avoid generator overhead in hot parsing loops and let the stream expose controls such as `goToEnd()`. This keeps the main tokenizer path direct while selectors and object helpers provide higher-level APIs when you need them.

### How does it compare to fast-xml-parser, txml, sax, and saxen?

`xml-tokenizer` focuses on typed streaming tokens plus small selector and object helpers. Use it when you want callback-based extraction with explicit parser state in TypeScript. Use a full XML object parser when you mainly need whole-document conversion.
