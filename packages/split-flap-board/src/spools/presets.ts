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

export const colorSpool: TSpool = [
	{ type: 'color', key: 'blank', value: '#111111' },
	{ type: 'color', key: 'red', value: '#ef4444' },
	{ type: 'color', key: 'orange', value: '#f97316' },
	{ type: 'color', key: 'yellow', value: '#eab308' },
	{ type: 'color', key: 'green', value: '#22c55e' },
	{ type: 'color', key: 'blue', value: '#3b82f6' },
	{ type: 'color', key: 'purple', value: '#8b5cf6' },
	{ type: 'color', key: 'pink', value: '#ec4899' }
];
