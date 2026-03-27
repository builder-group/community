import type { TSpool } from '../types';

export const charSpool: TSpool = [
	{ type: 'char', value: ' ' },
	...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => ({ type: 'char' as const, value: c })),
	...'0123456789'.split('').map((c) => ({ type: 'char' as const, value: c })),
	{ type: 'char', value: '.' },
	{ type: 'char', value: '-' },
	{ type: 'char', value: '/' },
	{ type: 'char', value: ':' }
];

export const numericSpool: TSpool = [
	{ type: 'char', value: ' ' },
	...'0123456789'.split('').map((c) => ({ type: 'char' as const, value: c }))
];
