import { describe, expect, it } from 'vitest';

import { parse } from './index';
import { TToken, TXmlEvents } from './types';

describe('CDATA', () => {
	assertTokens('cdata_01', '<p><![CDATA[content]]></p>', [
		{
			type: 'ElementStart',
			prefix: '',
			local: 'p',
			start: 0
		},
		{
			type: 'ElementEnd',
			end: {
				type: 'Open'
			},
			range: [2, 3]
		},
		{
			type: 'Cdata',
			text: 'content',
			range: [3, 22]
		},
		{
			type: 'ElementEnd',
			end: {
				type: 'Close',
				prefix: '',
				name: 'p'
			},
			range: [22, 26]
		}
	]);

	assertTokens('cdata_02', '<p><![CDATA[&amping]]></p>', [
		{
			type: 'ElementStart',
			prefix: '',
			local: 'p',
			start: 0
		},
		{
			type: 'ElementEnd',
			end: {
				type: 'Open'
			},
			range: [2, 3]
		},
		{
			type: 'Cdata',
			text: '&amping',
			range: [3, 22]
		},
		{
			type: 'ElementEnd',
			end: {
				type: 'Close',
				prefix: '',
				name: 'p'
			},
			range: [22, 26]
		}
	]);
});

class EventsCollector implements TXmlEvents {
	private _tokens: TToken[] = [];

	public get tokens(): TToken[] {
		return this._tokens;
	}

	public token(token: TToken): void {
		this._tokens.push(token);
	}
}

function collectTokens(text: string): TToken[] {
	const collector = new EventsCollector();
	parse(text, true, collector);
	return collector.tokens;
}

function assertTokens(name: string, text: string, tokens: TToken[]) {
	it(name, () => {
		expect(collectTokens(text)).toStrictEqual(tokens);
	});
}
