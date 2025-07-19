import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from './html-to-md';

describe('htmlToMarkdown', () => {
	it('should convert basic headings', () => {
		const html = '<h1>Title</h1><h2>Subtitle</h2>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('# Title\n\n## Subtitle');
	});

	it('should convert paragraphs with inline formatting', () => {
		const html = '<p>Text with <strong>bold</strong> and <em>italic</em>.</p>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('Text with **bold** and *italic*.');
	});

	it('should convert links', () => {
		const html = '<a href="https://example.com">Link text</a>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('[Link text](https://example.com)');
	});

	it('should convert lists', () => {
		const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('- Item 1\n- Item 2\n');
	});

	it('should convert blockquotes', () => {
		const html = '<blockquote>Quote text</blockquote>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('> Quote text');
	});

	it('should convert code elements', () => {
		const html = '<code>inline</code><pre>block</pre>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('`inline`\n```\nblock\n```');
	});

	it('should handle mixed content with proper spacing', () => {
		const html = '<h1>Title</h1><p>Paragraph</p><ul><li>List</li></ul>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('# Title\n\nParagraph\n\n- List\n');
	});

	it('should normalize whitespace', () => {
		const html = '<p>  Multiple   spaces  </p>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('Multiple spaces');
	});

	it('should handle empty elements', () => {
		const html = '<p></p><h1></h1>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('');
	});

	it('should skip default nodes like script and style', () => {
		const html =
			'<h1>Title</h1><script>alert("test")</script><p>Content</p><style>.test { color: red; }</style>';
		const result = htmlToMarkdown(html);
		expect(result.string).toBe('# Title\n\nContent');
	});

	it('should allow custom skip nodes', () => {
		const html = '<h1>Title</h1><div>Content</div><p>More</p>';
		const result = htmlToMarkdown(html, { skipNodes: ['div'] });
		expect(result.string).toBe('# Title\n\nMore');
	});
});
