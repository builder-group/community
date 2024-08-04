import { describe, it } from 'vitest';

const xmlString = `
<root>
  <child attr="value">Content</child>
  <!-- Comment -->
  <![CDATA[Some <CDATA> content]]>
</root>
`;

describe('tokenizer tests', () => {
	it('should work', () => {
		// TODO
	});
});
