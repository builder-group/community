import { describe, expect, it } from 'vitest';
import { alignStrings } from './align-strings';

describe('alignStrings function', () => {
	it('should align two simple strings side by side', () => {
		const str1 = 'A\nB';
		const str2 = 'C\nD';
		expect(alignStrings([str1, str2])).toBe('A  C\nB  D');
	});

	it('should handle strings of different lengths', () => {
		const str1 = 'A\nB\nC';
		const str2 = 'D\nE';

		expect(alignStrings([str1, str2])).toBe('A  D\nB  E\nC   ');
		expect(alignStrings([str2, str1])).toBe('D  A\nE  B\n   C');
	});

	it('should handle custom separator', () => {
		const str1 = 'A\nB';
		const str2 = 'C\nD';
		expect(alignStrings([str1, str2], { separator: ' | ' })).toBe('A | C\nB | D');
	});

	it('should handle empty strings', () => {
		const str1 = '';
		const str2 = 'A\nB';
		expect(alignStrings([str1, str2])).toBe('   A\n   B');
	});

	it('should handle single line strings', () => {
		const str1 = 'ABC';
		const str2 = 'DEF';
		expect(alignStrings([str1, str2])).toBe('ABC  DEF');
	});
});
