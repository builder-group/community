# XML Tokenizer Rules

Use `xml-tokenizer` as a streaming parser, not as a DOM replacement.

## Enforce

- Import only the tokenizer helpers and config you need
- Choose config by content type:
  - `htmlConfig` for HTML
  - `xmlConfig` for strict XML
  - `svgConfig` for SVG
- Type callback tokens explicitly with `TXmlToken`
- Keep parser state outside the callback
- Use `stream.goToEnd()` when only the first relevant match is needed
- Handle `ElementStart`, `ElementEnd`, and `Attribute` deliberately when structure matters
- Wrap parsing at the call boundary when failure should become a domain error
- Prefer streaming extraction over collecting unnecessary token state

## Avoid

- Do not parse XML with `htmlConfig`
- Do not keep processing once the target data is found
- Do not bury complex state transitions inside ad-hoc local mutations
- Do not return nullable parse results without an explicit error path when data is required

## Example

```ts
function findAttributeValue(html: string): string | null {
	let result: string | null = null;

	tokenize(
		html,
		(token: TXmlToken, stream) => {
			if (token.type === 'Attribute' && token.local === 'data-id') {
				result = token.value;
				stream.goToEnd();
			}
		},
		htmlConfig
	);

	return result;
}
```
