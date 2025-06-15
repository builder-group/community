import { describe, expect, it } from 'vitest';
import { serializeBody } from './index';

describe('serializeBody function', () => {
	it('should return FormData instance as is', () => {
		// Prepare
		const formData = new FormData();
		formData.append('key', 'value');

		// Act
		const result = serializeBody(formData);

		// Assert
		expect(result).toBe(formData);
	});

	it('should serialize object to JSON string when content type is application/json', () => {
		// Prepare
		const body = { key: 'value' };
		const contentType = 'application/json';

		// Act
		const result = serializeBody(body, contentType);

		// Assert
		expect(result).toBe(JSON.stringify(body));
	});

	it('should serialize object to JSON string when content type is application/json with charset', () => {
		// Prepare
		const body = { key: 'value' };
		const contentType = 'application/json; charset=utf-8';

		// Act
		const result = serializeBody(body, contentType);

		// Assert
		expect(result).toBe(JSON.stringify(body));
	});

	it('should return body as is when no content type is provided', () => {
		// Prepare
		const body = 'plain text body';

		// Act
		const result = serializeBody(body);

		// Assert
		expect(result).toBe(body);
	});

	it('should return body as is for non-JSON content types', () => {
		// Prepare
		const body = 'plain text body';
		const contentType = 'text/plain';

		// Act
		const result = serializeBody(body, contentType);

		// Assert
		expect(result).toBe(body);
	});
});
