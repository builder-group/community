import { describe, expect, it } from 'vitest';

import { extractErrorData } from './extract-error-data';

describe('extractErrorData function', () => {
	it('should extract message and error from Error instances', () => {
		const error = new Error('Test error');
		const result = extractErrorData(error);
		expect(result).toEqual({ error, message: 'Test error' });
	});

	it('should extract message from string errors and set error to null', () => {
		const errorMessage = 'String error';
		const result = extractErrorData(errorMessage);
		expect(result).toEqual({ error: null, message: errorMessage });
	});

	it('should return "Unknown error" for non-Error and non-string errors', () => {
		expect(extractErrorData({ key: 'value' })).toEqual({ error: null, message: 'Unknown error' });
		expect(extractErrorData(undefined)).toEqual({ error: null, message: 'Unknown error' });
		expect(extractErrorData(null)).toEqual({ error: null, message: 'Unknown error' });
	});
});
