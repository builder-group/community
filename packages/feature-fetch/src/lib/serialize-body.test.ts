import { describe, expect, it } from 'vitest';
import { serializeBody } from './serialize-body';

describe('serializeBody function', () => {
	describe('JSON bodies', () => {
		it('should serialize JSON content types case-insensitively', () => {
			const body = { key: 'value' };

			const result = serializeBody(body, 'Application/JSON; charset=utf-8');

			expect(result).toBe(JSON.stringify(body));
		});

		it('should serialize JSON subtype content types', () => {
			const body = { message: 'Not found' };

			const result = serializeBody(body, 'application/problem+json');

			expect(result).toBe(JSON.stringify(body));
		});

		it('should leave native body init values unchanged', () => {
			const body = JSON.stringify({ key: 'value' });

			const result = serializeBody(body, 'application/json');

			expect(result).toBe(body);
		});
	});

	describe('form URL encoded bodies', () => {
		it('should serialize records', () => {
			const result = serializeBody(
				{
					search: 'weather map',
					empty: null,
					limit: 10
				},
				'Application/X-WWW-Form-Urlencoded; charset=utf-8'
			);

			expect(result).toBe('search=weather+map&limit=10');
		});

		it('should leave native body init values unchanged', () => {
			const body = new Blob(['content']);

			const result = serializeBody(body, 'application/x-www-form-urlencoded');

			expect(result).toBe(body);
		});
	});

	describe('native bodies', () => {
		it('should leave FormData bodies unchanged', () => {
			const formData = new FormData();
			formData.append('key', 'value');

			const result = serializeBody(formData, 'application/json');

			expect(result).toBe(formData);
		});

		it('should leave non-JSON bodies unchanged', () => {
			const body = 'plain text';

			const result = serializeBody(body, 'text/plain');

			expect(result).toBe(body);
		});
	});
});
